import assert from "node:assert/strict";
import test from "node:test";
import { RANKING_MODEL_VERSION, rankColdStartCandidates } from "../lib/feed-ranking.ts";
import { applyInterestFeedback, emptyInterestProfile, extractCandidateKeywords, interestSignal } from "../lib/interest-profile.ts";
import type { Article, CandidateArticle, RecommendationEvent } from "../lib/types.ts";

test("a completed engaged read raises matching interests and ranking", () => {
  const science = candidate("science", "source-a", "Science");
  const culture = candidate("culture", "source-b", "Culture");
  const recommendation = recommendationFor(science);
  const profile = applyInterestFeedback(emptyInterestProfile(), {
    outcome: "finished",
    article: article({ userDifficultyFeedback: "suitable", estimatedDifficulty: 0.31 }),
    recommendation,
    readingTimeSeconds: 80,
    lookupCount: 1,
    timestamp: "2026-08-30T10:00:00.000Z",
  });

  assert.ok(profile.source["source-a"].score > 0);
  assert.ok(profile.topic.science.score > 0);
  const ranked = rankColdStartCandidates(
    [culture, science],
    null,
    new Date("2026-08-30T12:00:00.000Z"),
    profile,
  );
  assert.equal(ranked[0].candidate.id, science.id);
  assert.ok(ranked[0].interestScore > ranked[1].interestScore);
  assert.equal(ranked[0].modelVersion, RANKING_MODEL_VERSION);
  assert.deepEqual(Object.keys(ranked[0].components).sort(), [
    "diversityScore",
    "explorationScore",
    "freshnessScore",
    "interestScore",
    "readabilityScore",
  ]);
});

test("difficulty friction dampens a skip instead of treating it as pure dislike", () => {
  const recommendation = recommendationFor(candidate("hard", "source-a", "Science"));
  const suitableSkip = interestSignal({
    outcome: "skipped",
    article: article({ userDifficultyFeedback: "suitable", estimatedDifficulty: 0.3 }),
    recommendation,
    readingTimeSeconds: 5,
    lookupCount: 0,
  });
  const hardSkip = interestSignal({
    outcome: "skipped",
    article: article({ userDifficultyFeedback: "too_hard", estimatedDifficulty: 0.72 }),
    recommendation,
    readingTimeSeconds: 5,
    lookupCount: 0,
  });

  assert.ok(suitableSkip < 0);
  assert.ok(hardSkip < 0);
  assert.ok(Math.abs(hardSkip) < Math.abs(suitableSkip));
});

test("the same recommendation changes the interest profile only once", () => {
  const recommendation = recommendationFor(candidate("once", "source-a", "Science"));
  const feedback = {
    outcome: "finished" as const,
    article: article({}),
    recommendation,
    readingTimeSeconds: 60,
    lookupCount: 0,
  };
  const first = applyInterestFeedback(emptyInterestProfile(), feedback);
  const second = applyInterestFeedback(first, feedback);

  assert.equal(second.evidenceCount, 1);
  assert.equal(second.source["source-a"].evidenceCount, 1);
});

test("candidate keyword extraction is small, stable, and ignores common words", () => {
  const keywords = extractCandidateKeywords({
    title: "Space Science and the Future of Space Travel",
    summary: "This story explains how science changes travel and future missions.",
  });

  assert.ok(keywords.length <= 8);
  assert.ok(keywords.includes("science"));
  assert.ok(keywords.includes("space"));
  assert.ok(!keywords.includes("this"));
});

function article(overrides: Partial<Article>): Article {
  return {
    id: "article-1",
    title: "A story about space science",
    content: Array.from({ length: 180 }, (_, index) => `word${index}`).join(" "),
    sourceUrl: "https://example.com/article",
    createdAt: "2026-08-30T09:00:00.000Z",
    startedAt: "2026-08-30T09:01:00.000Z",
    finishedAt: null,
    status: "reading",
    estimatedDifficulty: null,
    userDifficultyFeedback: null,
    attribution: null,
    ...overrides,
  };
}

function candidate(id: string, sourceId: string, topic: string): CandidateArticle {
  return {
    id,
    sourceId,
    sourceName: sourceId,
    topic,
    title: "A clear story about space science",
    url: `https://example.com/${id}`,
    summary: "Researchers explain a useful discovery for curious readers.",
    author: null,
    publishedAt: "2026-08-30T08:00:00.000Z",
    discoveredAt: "2026-08-30T09:00:00.000Z",
    status: "available",
    articleId: null,
  };
}

function recommendationFor(item: CandidateArticle): RecommendationEvent {
  return {
    id: `recommendation-${item.id}`,
    type: "selected",
    candidateId: item.id,
    articleId: "article-1",
    entryPoint: "feed",
    timestamp: "2026-08-30T09:00:00.000Z",
    modelVersion: 2,
    rank: 1,
    score: 0.7,
    components: {
      interestScore: 0.5,
      readabilityScore: 0.7,
      freshnessScore: 0.9,
      explorationScore: 1,
      diversityScore: 1,
    },
    sourceId: item.sourceId,
    topic: item.topic,
    keywords: extractCandidateKeywords(item),
    selectedArticleId: "article-1",
    candidateSlate: [{
      candidateId: item.id,
      articleId: "article-1",
      rank: 1,
      totalScore: 0.7,
      difficultyScore: 0.3,
      interestScore: 0.5,
      explorationScore: 1,
    }],
    rankingVersion: 2,
    rankingWeights: {
      interest: 0.32,
      readability: 0.42,
      freshness: 0.18,
      exploration: 0.08,
      baseScore: 0.9,
      diversity: 0.1,
    },
    vocabularyBand: 2,
    targetDifficulty: 0.24,
    explorationType: "interest_novelty",
    outcome: null,
  };
}
