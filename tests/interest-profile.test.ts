import assert from "node:assert/strict";
import test from "node:test";
import { RANKING_MODEL_VERSION, rankColdStartCandidates } from "../lib/feed-ranking.ts";
import { applyInterestFeedback, emptyInterestProfile, extractCandidateKeywords, interestSignal } from "../lib/interest-profile.ts";
import { initialReadingComfortProfile } from "../lib/reading-comfort.ts";
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

test("difficulty-driven skips are neutral instead of being learned as dislike", () => {
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
  assert.equal(hardSkip, 0);
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

test("CASE D: a difficulty-driven Technology exit preserves interest and prefers an easier Technology candidate", () => {
  const technology = candidate("technology-read", "technology-source", "Technology");
  const recommendation = recommendationFor(technology);
  const interested = applyInterestFeedback(emptyInterestProfile(), {
    outcome: "finished",
    article: article({ userDifficultyFeedback: "suitable", estimatedDifficulty: 0.2 }),
    recommendation,
    readingTimeSeconds: 90,
    activeReadingSeconds: 85,
    maxReadingProgress: 0.98,
    lookupCount: 1,
    lookupFriction: lowFriction(),
  });
  const scoreBeforeHardExit = interested.topic.technology.score;
  const afterHardExit = applyInterestFeedback(interested, {
    outcome: "skipped",
    article: article({ userDifficultyFeedback: "too_hard", estimatedDifficulty: 0.68 }),
    recommendation: { ...recommendation, id: "technology-too-hard" },
    readingTimeSeconds: 20,
    activeReadingSeconds: 18,
    maxReadingProgress: 0.25,
    lookupCount: 8,
    lookupFriction: highFriction(),
  });

  assert.equal(afterHardExit.topic.technology.score, scoreBeforeHardExit);

  const easyTechnology = {
    ...candidate("technology-easy", "technology-source", "Technology"),
    summary: "A child makes a small tool. The tool helps at home.",
  };
  const hardTechnology = {
    ...candidate("technology-hard", "technology-source", "Technology"),
    summary: Array.from({ length: 12 }, () => "Although the architecture changes, which creates several dependencies, engineers continue because the system requires coordination.").join(" "),
  };
  const easyCulture = {
    ...candidate("culture-easy", "culture-source", "Culture"),
    summary: "A child sees a small bird. The bird sings.",
  };
  const lowProfile = {
    id: "current" as const,
    estimatedBand: 0,
    frequencyThreshold: 0.9,
    confidence: 1,
    assessedAt: "2026-09-02T10:00:00.000Z",
    assessmentVersion: 1,
  };
  const ranked = rankColdStartCandidates(
    [hardTechnology, easyCulture, easyTechnology],
    lowProfile,
    new Date("2026-09-02T12:00:00.000Z"),
    afterHardExit,
    null,
    initialReadingComfortProfile(lowProfile),
  );

  assert.equal(ranked[0].candidate.id, easyTechnology.id);
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
    pool: "open_web",
    successBandMin: null,
    successBandMax: null,
    provenance: null,
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
    comfortableWords: 320,
    difficultyTolerance: 0.2,
    successPhase: true,
    explorationType: "interest_novelty",
    outcome: null,
  };
}

function lowFriction() {
  return {
    lookupsPer100ExposedWords: 1,
    maxLookupsInContext: 1,
    maxLookupDensityByContext: 4,
    highFrictionContextCount: 0,
    consecutiveHighFrictionContexts: 0,
    score: 0.08,
  };
}

function highFriction() {
  return {
    lookupsPer100ExposedWords: 18,
    maxLookupsInContext: 5,
    maxLookupDensityByContext: 45,
    highFrictionContextCount: 3,
    consecutiveHighFrictionContexts: 2,
    score: 0.85,
  };
}
