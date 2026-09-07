import assert from "node:assert/strict";
import test from "node:test";
import { eligibleContentPools, filterCandidatesForReadingStage } from "../lib/content-pools.ts";
import type { CandidateArticle, ReadingComfortProfile, VocabularyProfile } from "../lib/types.ts";

const profiles = Array.from({ length: 6 }, (_, estimatedBand) => ({
  id: "current" as const,
  estimatedBand,
  frequencyThreshold: 0.68,
  confidence: 1,
  assessedAt: "2026-09-03T00:00:00.000Z",
  assessmentVersion: 1,
} satisfies VocabularyProfile));

function comfort(vocabularyBand: number, successPhase: boolean): ReadingComfortProfile {
  return {
    id: "current",
    vocabularyBand,
    targetDifficulty: 0.18,
    comfortableWords: 180,
    difficultyTolerance: 0.18,
    successPhase,
    successfulReadStreak: successPhase ? 0 : 3,
    hardReadStreak: 0,
    evidenceCount: successPhase ? 0 : 3,
    updatedAt: null,
    modelVersion: 1,
  };
}

test("success phase limits bands 0 and 1 to success content", () => {
  assert.deepEqual(eligibleContentPools(profiles[0], comfort(0, true)), ["success"]);
  assert.deepEqual(eligibleContentPools(profiles[1], comfort(1, true)), ["success"]);
});

test("after leaving success phase, bands 0 and 1 admit bridge content", () => {
  assert.deepEqual(eligibleContentPools(profiles[0], comfort(0, false)), ["success", "bridge"]);
  assert.deepEqual(eligibleContentPools(profiles[1], comfort(1, false)), ["success", "bridge"]);
});

test("band 2 uses success plus bridge first, then opens the web pool", () => {
  assert.deepEqual(eligibleContentPools(profiles[2], comfort(2, true)), ["success", "bridge"]);
  assert.deepEqual(eligibleContentPools(profiles[2], comfort(2, false)), ["success", "bridge", "open_web"]);
});

test("bands 3 and above can use all pools in either phase", () => {
  for (const estimatedBand of [3, 4, 5]) {
    assert.deepEqual(eligibleContentPools(profiles[estimatedBand], comfort(estimatedBand, true)), ["success", "bridge", "open_web"]);
    assert.deepEqual(eligibleContentPools(profiles[estimatedBand], comfort(estimatedBand, false)), ["success", "bridge", "open_web"]);
  }
});

test("candidate filtering respects bounded bands and leaves full difficulty to the later pipeline", () => {
  const candidates = [
    candidate("success-in-range", "success", 0, 1, 5),
    candidate("success-out-of-range", "success", 2, 4, 0),
    candidate("bridge-in-range", "bridge", 1, 3, 99),
    candidate("open-web", "open_web", null, null, 1),
  ];

  const filtered = filterCandidatesForReadingStage(candidates, profiles[1], comfort(1, false));
  assert.deepEqual(filtered.map(({ id }) => id), ["success-in-range", "bridge-in-range"]);
});

test("legacy open_web candidates do not block higher bands", () => {
  const legacyCandidate = candidate("legacy-open-web", "open_web", null, null, 99);

  assert.deepEqual(
    filterCandidatesForReadingStage([legacyCandidate], profiles[4], comfort(4, true)),
    [legacyCandidate],
  );
});

function candidate(
  id: string,
  pool: CandidateArticle["pool"],
  successBandMin: number | null,
  successBandMax: number | null,
  readingLevel: number | null,
): CandidateArticle {
  return {
    id,
    sourceId: "test-source",
    sourceName: "Test source",
    topic: "Test",
    title: id,
    url: `https://example.com/${id}`,
    summary: "A candidate used for content-pool tests.",
    author: null,
    publishedAt: null,
    discoveredAt: "2026-09-03T00:00:00.000Z",
    status: "available",
    articleId: null,
    contentId: null,
    contentSnapshot: null,
    pool,
    successBandMin,
    successBandMax,
    readingLevel,
    provenance: null,
  };
}
