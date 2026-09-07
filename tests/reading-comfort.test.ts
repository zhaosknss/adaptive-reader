import assert from "node:assert/strict";
import test from "node:test";
import { applyReadingOutcomeToComfort, initialReadingComfortProfile } from "../lib/reading-comfort.ts";
import type { LookupFrictionMetrics, RecommendationOutcome, VocabularyProfile } from "../lib/types.ts";

const bandZeroProfile: VocabularyProfile = {
  id: "current",
  estimatedBand: 0,
  frequencyThreshold: 0.9,
  confidence: 1,
  assessedAt: "2026-09-02T00:00:00.000Z",
  assessmentVersion: 1,
};

test("CASE B: too-hard low-progress high-friction reading makes the next target more conservative", () => {
  const initial = initialReadingComfortProfile(bandZeroProfile);
  const next = applyReadingOutcomeToComfort(initial, bandZeroProfile, {
    outcome: outcome({
      finished: false,
      maxReadingProgress: 0.28,
      difficultyFeedback: "too_hard",
      lookupFriction: friction(0.82),
    }),
    articleDifficulty: 0.54,
    articleWordCount: 260,
  });

  assert.ok(next.targetDifficulty < initial.targetDifficulty);
  assert.ok(next.comfortableWords <= initial.comfortableWords);
  assert.ok(next.difficultyTolerance < initial.difficultyTolerance);
  assert.equal(next.successPhase, true);
  assert.equal(next.hardReadStreak, 1);
});

test("CASE C: successful low-friction reads widen comfort gradually, while suitable alone does not move the target", () => {
  const initial = initialReadingComfortProfile(bandZeroProfile);
  const first = applyReadingOutcomeToComfort(initial, bandZeroProfile, {
    outcome: outcome({ difficultyFeedback: "too_easy" }),
    articleDifficulty: 0.08,
    articleWordCount: 80,
  });
  const second = applyReadingOutcomeToComfort(first, bandZeroProfile, {
    outcome: outcome({ difficultyFeedback: "suitable" }),
    articleDifficulty: 0.12,
    articleWordCount: 90,
  });
  const third = applyReadingOutcomeToComfort(second, bandZeroProfile, {
    outcome: outcome({ difficultyFeedback: "too_easy" }),
    articleDifficulty: 0.1,
    articleWordCount: 98,
  });

  assert.ok(first.targetDifficulty > initial.targetDifficulty);
  assert.ok(first.targetDifficulty - initial.targetDifficulty <= 0.013);
  assert.ok(first.comfortableWords > initial.comfortableWords);
  assert.equal(second.targetDifficulty, first.targetDifficulty);
  assert.equal(second.comfortableWords, first.comfortableWords);
  assert.ok(third.targetDifficulty > second.targetDifficulty);
  assert.equal(third.successPhase, false);
  assert.equal(third.successfulReadStreak, 3);
});

function outcome(overrides: Partial<RecommendationOutcome> = {}): RecommendationOutcome {
  return {
    activeReadingSeconds: 75,
    maxReadingProgress: 0.95,
    lookupCount: 1,
    exposedUniqueWordCount: 100,
    lookupFriction: friction(0.12),
    difficultyFeedback: "suitable",
    finished: true,
    recordedAt: "2026-09-02T00:05:00.000Z",
    ...overrides,
  };
}

function friction(score: number): LookupFrictionMetrics {
  return {
    lookupsPer100ExposedWords: score * 20,
    maxLookupsInContext: score >= 0.5 ? 4 : 1,
    maxLookupDensityByContext: score * 40,
    highFrictionContextCount: score >= 0.5 ? 2 : 0,
    consecutiveHighFrictionContexts: score >= 0.5 ? 2 : 0,
    score,
  };
}
