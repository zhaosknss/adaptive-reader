import type { DifficultyEstimate } from "./difficulty.ts";
import type { ReadingComfortProfile, RecommendationOutcome, VocabularyProfile } from "./types.ts";

export const READING_COMFORT_MODEL_VERSION = 1;
export const TARGET_DIFFICULTY_BY_BAND = [0.12, 0.18, 0.24, 0.3, 0.36, 0.42] as const;
export const COMFORTABLE_WORDS_BY_BAND = [90, 180, 320, 520, 800, 1200] as const;

export type ArticleComfortAssessment = {
  acceptable: boolean;
  fitScore: number;
  hardMaximumWords: number;
  maximumDifficulty: number;
  reasons: Array<"length" | "difficulty" | "syntax" | "lookup_load">;
};

export function initialReadingComfortProfile(profile?: VocabularyProfile | null): ReadingComfortProfile {
  const vocabularyBand = profileBand(profile);
  return {
    id: "current",
    vocabularyBand,
    targetDifficulty: TARGET_DIFFICULTY_BY_BAND[vocabularyBand],
    comfortableWords: COMFORTABLE_WORDS_BY_BAND[vocabularyBand],
    difficultyTolerance: [0.18, 0.18, 0.2, 0.22, 0.24, 0.26][vocabularyBand],
    successPhase: true,
    successfulReadStreak: 0,
    hardReadStreak: 0,
    evidenceCount: 0,
    updatedAt: null,
    modelVersion: READING_COMFORT_MODEL_VERSION,
  };
}

export function normalizeReadingComfortProfile(
  value: Partial<ReadingComfortProfile> | null | undefined,
  profile?: VocabularyProfile | null,
): ReadingComfortProfile {
  const initial = initialReadingComfortProfile(profile);
  if (!value || value.vocabularyBand !== initial.vocabularyBand) return initial;
  return {
    id: "current",
    vocabularyBand: initial.vocabularyBand,
    targetDifficulty: clamp(value.targetDifficulty ?? initial.targetDifficulty, 0.05, 0.75),
    comfortableWords: Math.max(60, Math.round(value.comfortableWords ?? initial.comfortableWords)),
    difficultyTolerance: clamp(value.difficultyTolerance ?? initial.difficultyTolerance, 0.08, 0.35),
    successPhase: value.successPhase !== false,
    successfulReadStreak: nonNegativeInteger(value.successfulReadStreak),
    hardReadStreak: nonNegativeInteger(value.hardReadStreak),
    evidenceCount: nonNegativeInteger(value.evidenceCount),
    updatedAt: value.updatedAt ?? null,
    modelVersion: Math.max(1, Math.round(value.modelVersion ?? READING_COMFORT_MODEL_VERSION)),
  };
}

export function assessArticleComfort(
  difficulty: DifficultyEstimate,
  profile: VocabularyProfile | null | undefined,
  comfortValue?: ReadingComfortProfile | null,
): ArticleComfortAssessment {
  const comfort = normalizeReadingComfortProfile(comfortValue, profile);
  const band = comfort.vocabularyBand;
  const hardMaximumWords = Math.round(comfort.comfortableWords * (comfort.successPhase ? 2 : 2.5));
  const maximumDifficulty = clamp01(comfort.targetDifficulty + comfort.difficultyTolerance);
  const maximumSyntax = clamp01(0.4 + band * 0.075 + (comfort.successPhase ? 0 : 0.08));
  const maximumSentenceLength = 26 + band * 8 + (comfort.successPhase ? 0 : 8);
  const veryLowWordBudget = Math.max(5, Math.round(difficulty.metrics.wordCount * (0.16 + band * 0.025)));
  const estimatedVeryLowWords = Math.round(difficulty.metrics.veryLowFamiliarityRatio * difficulty.metrics.wordCount);
  const reasons: ArticleComfortAssessment["reasons"] = [];

  if (difficulty.metrics.wordCount > hardMaximumWords) reasons.push("length");
  if (difficulty.score > maximumDifficulty) reasons.push("difficulty");
  if (difficulty.metrics.syntacticComplexity > maximumSyntax || difficulty.metrics.sentenceLengthP90 > maximumSentenceLength) {
    reasons.push("syntax");
  }
  if (comfort.successPhase && estimatedVeryLowWords > veryLowWordBudget) reasons.push("lookup_load");

  const lengthFit = clamp01(1 - Math.max(0, difficulty.metrics.wordCount - comfort.comfortableWords) / Math.max(1, hardMaximumWords - comfort.comfortableWords));
  const difficultyDistance = comfort.successPhase
    ? Math.max(0, difficulty.score - comfort.targetDifficulty)
    : Math.abs(difficulty.score - comfort.targetDifficulty);
  const difficultyFit = clamp01(1 - difficultyDistance / Math.max(0.1, comfort.difficultyTolerance));
  const syntaxFit = clamp01(1 - difficulty.metrics.syntacticComplexity / Math.max(0.1, maximumSyntax));

  return {
    acceptable: reasons.length === 0,
    fitScore: round(lengthFit * 0.38 + difficultyFit * 0.42 + syntaxFit * 0.2),
    hardMaximumWords,
    maximumDifficulty: round(maximumDifficulty),
    reasons,
  };
}

export function applyReadingOutcomeToComfort(
  current: ReadingComfortProfile | null | undefined,
  profile: VocabularyProfile | null | undefined,
  input: {
    outcome: RecommendationOutcome;
    articleDifficulty: number;
    articleWordCount: number;
    timestamp?: string;
  },
): ReadingComfortProfile {
  const comfort = normalizeReadingComfortProfile(current, profile);
  const { outcome } = input;
  const currentMaximumDifficulty = comfort.targetDifficulty + comfort.difficultyTolerance;
  const currentMaximumWords = comfort.comfortableWords * (comfort.successPhase ? 2 : 2.5);
  const hardEvidence = outcome.difficultyFeedback === "too_hard"
    || (!outcome.finished && outcome.maxReadingProgress < 0.5 && outcome.lookupFriction.score >= 0.5)
    || (!outcome.finished && outcome.maxReadingProgress < 0.6
      && (input.articleDifficulty > currentMaximumDifficulty || input.articleWordCount > currentMaximumWords));
  const successfulRead = outcome.finished
    && outcome.maxReadingProgress >= 0.8
    && outcome.lookupFriction.score <= 0.3
    && outcome.difficultyFeedback !== "too_hard";
  const baseWords = COMFORTABLE_WORDS_BY_BAND[comfort.vocabularyBand];
  const baseTarget = TARGET_DIFFICULTY_BY_BAND[comfort.vocabularyBand];
  let targetDifficulty = comfort.targetDifficulty;
  let comfortableWords = comfort.comfortableWords;
  let difficultyTolerance = comfort.difficultyTolerance;
  const successfulReadStreak = successfulRead ? comfort.successfulReadStreak + 1 : 0;
  const hardReadStreak = hardEvidence ? comfort.hardReadStreak + 1 : 0;

  if (hardEvidence) {
    targetDifficulty = Math.max(0.05, targetDifficulty - 0.025);
    comfortableWords = Math.max(Math.max(60, Math.round(baseWords * 0.85)), Math.round(comfortableWords * 0.9));
    difficultyTolerance = Math.max(0.08, difficultyTolerance - 0.01);
  } else if (successfulRead && outcome.difficultyFeedback === "too_easy") {
    targetDifficulty = Math.min(baseTarget + 0.16, targetDifficulty + 0.012);
    comfortableWords = Math.min(Math.round(baseWords * 2.4), comfortableWords + Math.max(8, Math.round(baseWords * 0.06)));
    difficultyTolerance = Math.min(0.35, difficultyTolerance + 0.004);
  }

  const successPhase = hardEvidence
    ? true
    : comfort.successPhase && successfulReadStreak < 3;

  return {
    ...comfort,
    targetDifficulty: round(targetDifficulty),
    comfortableWords,
    difficultyTolerance: round(difficultyTolerance),
    successPhase,
    successfulReadStreak,
    hardReadStreak,
    evidenceCount: comfort.evidenceCount + 1,
    updatedAt: input.timestamp ?? new Date().toISOString(),
    modelVersion: READING_COMFORT_MODEL_VERSION,
  };
}

export function isDifficultyDrivenFailure(outcome: Pick<RecommendationOutcome, "difficultyFeedback" | "maxReadingProgress" | "lookupFriction">) {
  return outcome.difficultyFeedback === "too_hard"
    || (outcome.maxReadingProgress < 0.55 && outcome.lookupFriction.score >= 0.5);
}

function profileBand(profile?: VocabularyProfile | null) {
  return Math.min(5, Math.max(0, Math.round(profile?.estimatedBand ?? 2)));
}

function nonNegativeInteger(value?: number) {
  return Math.max(0, Math.round(Number.isFinite(value) ? value ?? 0 : 0));
}

function clamp01(value: number) {
  return clamp(value, 0, 1);
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function round(value: number) {
  return Number(value.toFixed(3));
}
