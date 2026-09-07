import assert from "node:assert/strict";
import test from "node:test";
import "fake-indexeddb/auto";
import {
  beginReading,
  createArticle,
  finishArticle,
  getInterestProfile,
  getLatestRecommendationEventForArticle,
  getReadingComfortProfile,
  listReadingEvents,
  listRecommendationEvents,
  recordRecommendationSelection,
} from "../lib/storage.ts";
import type { CandidateArticle } from "../lib/types.ts";

test.beforeEach(async () => {
  await deleteDatabase("just-read");
});

test("a selected candidate keeps ranking and reading-entry attribution", async () => {
  const article = await createArticle("Selected article", readableContent());
  const item = candidate("candidate-1");
  const recommendation = await recordRecommendationSelection({
    candidate: item,
    articleId: article.id,
    entryPoint: "feed",
    rank: 2,
    score: 0.731,
    modelVersion: 2,
    components: components(),
    candidateSlate: [
      {
        candidateId: item.id,
        articleId: article.id,
        rank: 1,
        totalScore: 0.8,
        difficultyScore: 0.28,
        interestScore: 0.5,
        explorationScore: 1,
      },
      {
        candidateId: "candidate-2",
        articleId: null,
        rank: 2,
        totalScore: 0.731,
        difficultyScore: 0.34,
        interestScore: 0.52,
        explorationScore: 0.8,
      },
    ],
    rankingWeights: weights(),
    vocabularyBand: 2,
    targetDifficulty: 0.24,
    comfortableWords: 320,
    difficultyTolerance: 0.2,
    successPhase: true,
  });

  await beginReading(article, { entryPoint: "feed", recommendationEventId: recommendation.id });
  await finishArticle(article.id, {
    readingTimeSeconds: 75,
    activeReadingSeconds: 62,
    maxReadingProgress: 0.93,
    lookupCount: 2,
    exposedUniqueWordCount: 104,
    lookupFriction: {
      lookupsPer100ExposedWords: 0,
      maxLookupsInContext: 0,
      maxLookupDensityByContext: 0,
      highFrictionContextCount: 0,
      consecutiveHighFrictionContexts: 0,
      score: 0,
    },
    entryPoint: "feed",
    recommendationEventId: recommendation.id,
  });

  const savedRecommendation = (await listRecommendationEvents())[0];
  assert.equal(savedRecommendation.candidateId, item.id);
  assert.equal(savedRecommendation.rank, 2);
  assert.deepEqual(savedRecommendation.components, components());
  assert.equal(savedRecommendation.selectedArticleId, article.id);
  assert.equal(savedRecommendation.candidateSlate.length, 2);
  assert.equal(savedRecommendation.candidateSlate[1].difficultyScore, 0.34);
  assert.equal(savedRecommendation.rankingVersion, 2);
  assert.deepEqual(savedRecommendation.rankingWeights, weights());
  assert.equal(savedRecommendation.vocabularyBand, 2);
  assert.equal(savedRecommendation.targetDifficulty, 0.24);
  assert.deepEqual(savedRecommendation.outcome, {
    activeReadingSeconds: 62,
    maxReadingProgress: 0.93,
    lookupCount: 2,
    exposedUniqueWordCount: 104,
    lookupFriction: {
      lookupsPer100ExposedWords: 0,
      maxLookupsInContext: 0,
      maxLookupDensityByContext: 0,
      highFrictionContextCount: 0,
      consecutiveHighFrictionContexts: 0,
      score: 0,
    },
    difficultyFeedback: null,
    finished: true,
    recordedAt: savedRecommendation.outcome?.recordedAt,
  });

  const events = await listReadingEvents(article.id);
  assert.deepEqual(events.map((event) => event.type), ["opened", "finished"]);
  assert.ok(events.every((event) => event.candidateId === item.id));
  assert.ok(events.every((event) => event.recommendationEventId === recommendation.id));
  assert.ok(events.every((event) => event.entryPoint === "feed"));
  assert.equal(events[1].metadata.lookupCount, 2);

  const profile = await getInterestProfile();
  assert.equal(profile.evidenceCount, 1);
  assert.ok(profile.source["example-source"].score > 0);
  assert.ok(profile.topic.science.score > 0);
  assert.equal((await getReadingComfortProfile()).evidenceCount, 1);
});

test("repeated completion cannot apply the same recommendation twice", async () => {
  const article = await createArticle("Idempotent feedback", readableContent());
  const recommendation = await recordRecommendationSelection({
    candidate: candidate("candidate-once"),
    articleId: article.id,
    entryPoint: "next_article",
    rank: 1,
    score: 0.8,
    modelVersion: 2,
    components: components(),
  });
  const metrics = {
    readingTimeSeconds: 80,
    lookupCount: 0,
    entryPoint: "next_article" as const,
    recommendationEventId: recommendation.id,
  };

  await finishArticle(article.id, metrics);
  await finishArticle(article.id, metrics);

  assert.equal((await getInterestProfile()).evidenceCount, 1);
});

test("resuming an in-progress article keeps its original recommendation context", async () => {
  const article = await createArticle("Resume with context", readableContent());
  const recommendation = await recordRecommendationSelection({
    candidate: candidate("candidate-resume"),
    articleId: article.id,
    entryPoint: "feed",
    rank: 1,
    score: 0.8,
    modelVersion: 2,
    components: components(),
  });
  await beginReading(article, { entryPoint: "feed", recommendationEventId: recommendation.id });

  const latest = await getLatestRecommendationEventForArticle(article.id);
  assert.equal(latest?.id, recommendation.id);
  await beginReading(article, { entryPoint: "resume", recommendationEventId: latest?.id });
  await finishArticle(article.id, {
    readingTimeSeconds: 70,
    lookupCount: 1,
    entryPoint: "resume",
    recommendationEventId: latest?.id,
  });

  assert.equal((await getInterestProfile()).evidenceCount, 1);
  const events = await listReadingEvents(article.id);
  assert.equal(events.at(-1)?.entryPoint, "resume");
  assert.equal(events.at(-1)?.recommendationEventId, recommendation.id);
});

test("history and manual reads do not borrow an old recommendation", async () => {
  const recommendedArticle = await createArticle("Recommended", readableContent());
  await recordRecommendationSelection({
    candidate: candidate("old-candidate"),
    articleId: recommendedArticle.id,
    entryPoint: "feed",
    rank: 1,
    score: 0.8,
    modelVersion: 2,
    components: components(),
  });
  const manualArticle = await createArticle("Manual history read", readableContent());

  await beginReading(manualArticle, { entryPoint: "history" });
  await finishArticle(manualArticle.id, { readingTimeSeconds: 60, lookupCount: 0, entryPoint: "history" });

  assert.equal((await getInterestProfile()).evidenceCount, 0);
  const events = await listReadingEvents(manualArticle.id);
  assert.ok(events.every((event) => event.recommendationEventId === null));
  assert.ok(events.every((event) => event.entryPoint === "history"));
});

function candidate(id: string): CandidateArticle {
  return {
    id,
    sourceId: "example-source",
    sourceName: "Example Source",
    topic: "Science",
    title: "A science story about the ocean",
    url: `https://example.com/${id}`,
    summary: "Researchers explain a surprising ocean discovery.",
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

function components() {
  return {
    interestScore: 0.5,
    readabilityScore: 0.7,
    freshnessScore: 0.9,
    explorationScore: 1,
    diversityScore: 1,
  };
}

function weights() {
  return {
    interest: 0.32,
    readability: 0.42,
    freshness: 0.18,
    exploration: 0.08,
    baseScore: 0.9,
    diversity: 0.1,
  };
}

function readableContent() {
  return Array.from({ length: 180 }, (_, index) => `word${index}`).join(" ");
}

function deleteDatabase(name: string) {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error(`Database ${name} is blocked`));
  });
}
