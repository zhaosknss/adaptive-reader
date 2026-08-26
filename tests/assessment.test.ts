import assert from "node:assert/strict";
import test from "node:test";
import { ASSESSMENT_BANDS } from "../lib/assessment-items.ts";
import {
  assessmentWords,
  MAX_ASSESSMENT_ROUNDS,
  MIN_ASSESSMENT_ROUNDS,
  startAssessment,
  submitAssessmentRound,
  vocabularyProfileFromAssessment,
  type AssessmentAnswer,
} from "../lib/assessment.ts";
import { frequencyProvider } from "../lib/frequency.ts";

const known = Array<AssessmentAnswer>(5).fill("known");
const unsure = Array<AssessmentAnswer>(5).fill("unsure");
const unknown = Array<AssessmentAnswer>(5).fill("unknown");

test("assessment bands are ordered and contain enough unique words", () => {
  assert.equal(ASSESSMENT_BANDS.length, 6);
  for (const [index, band] of ASSESSMENT_BANDS.entries()) {
    assert.equal(band.id, index);
    assert.ok(band.words.length >= 20);
    assert.equal(new Set(band.words).size, band.words.length);
    if (index > 0) assert.ok(band.frequencyThreshold < ASSESSMENT_BANDS[index - 1].frequencyThreshold);
  }

  const state = startAssessment();
  assert.equal(assessmentWords(state).length, 5);
  assert.equal(new Set(assessmentWords(state)).size, 5);
});

test("clear answers move the staircase without leaving its bounds", () => {
  assert.equal(submitAssessmentRound(startAssessment(), known).currentBand, 3);
  assert.equal(submitAssessmentRound(startAssessment(), unknown).currentBand, 1);

  let high = startAssessment();
  let low = startAssessment();
  for (let index = 0; index < 8; index += 1) {
    high = submitAssessmentRound(high, known);
    low = submitAssessmentRound(low, unknown);
  }
  assert.equal(high.currentBand, 5);
  assert.equal(low.currentBand, 0);
});

test("assessment finishes after four stable rounds or five oscillating rounds", () => {
  let stable = startAssessment();
  while (!stable.completed) stable = submitAssessmentRound(stable, unsure);
  assert.equal(stable.rounds.length, MIN_ASSESSMENT_ROUNDS);

  let oscillating = startAssessment();
  const answers = [known, unknown, known, unknown, known];
  for (const roundAnswers of answers) {
    oscillating = submitAssessmentRound(oscillating, roundAnswers);
  }
  assert.equal(oscillating.completed, true);
  assert.equal(oscillating.rounds.length, MAX_ASSESSMENT_ROUNDS);
});

test("profile confidence is bounded and clear answers beat uncertainty", () => {
  let certain = startAssessment();
  let uncertain = startAssessment();
  while (!certain.completed) certain = submitAssessmentRound(certain, known);
  while (!uncertain.completed) uncertain = submitAssessmentRound(uncertain, unsure);

  const certainProfile = vocabularyProfileFromAssessment(certain, "2026-08-26T00:00:00.000Z");
  const uncertainProfile = vocabularyProfileFromAssessment(uncertain, "2026-08-26T00:00:00.000Z");
  assert.ok(certainProfile.confidence > uncertainProfile.confidence);
  assert.ok(uncertainProfile.confidence >= 0 && uncertainProfile.confidence <= 1);
  assert.equal(certainProfile.frequencyThreshold, ASSESSMENT_BANDS[certainProfile.estimatedBand].frequencyThreshold);
});

test("vocabulary prior changes only the initial familiarity estimate", () => {
  const lowerProfile = {
    id: "current" as const,
    estimatedBand: 0,
    frequencyThreshold: 0.9,
    confidence: 0.9,
    assessedAt: "2026-08-26T00:00:00.000Z",
    assessmentVersion: 1,
  };
  const higherProfile = { ...lowerProfile, estimatedBand: 5, frequencyThreshold: 0.3 };

  assert.ok(
    frequencyProvider.initialFamiliarity("interdisciplinarity", higherProfile)
      > frequencyProvider.initialFamiliarity("interdisciplinarity", lowerProfile),
  );
  assert.equal(frequencyProvider.lookup("interdisciplinarity").band, "rare");
});
