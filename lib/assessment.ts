import { ASSESSMENT_BANDS } from "./assessment-items.ts";
import type { VocabularyProfile } from "./types.ts";

export type AssessmentAnswer = "known" | "unsure" | "unknown";

export type AssessmentRound = {
  band: number;
  answers: readonly AssessmentAnswer[];
  score: number;
  direction: -1 | 0 | 1;
};

export type AssessmentState = {
  currentBand: number;
  roundIndex: number;
  rounds: readonly AssessmentRound[];
  completed: boolean;
};

export const ASSESSMENT_VERSION = 1;
export const WORDS_PER_ROUND = 5;
export const MIN_ASSESSMENT_ROUNDS = 4;
export const MAX_ASSESSMENT_ROUNDS = 5;

export function startAssessment(): AssessmentState {
  return { currentBand: 2, roundIndex: 0, rounds: [], completed: false };
}

export function assessmentWords(state: AssessmentState): readonly string[] {
  const band = ASSESSMENT_BANDS[clampBand(state.currentBand)];
  const visitCount = state.rounds.filter((round) => round.band === band.id).length;
  const offset = (visitCount * WORDS_PER_ROUND) % band.words.length;
  return Array.from({ length: WORDS_PER_ROUND }, (_, index) => band.words[(offset + index) % band.words.length]);
}

export function submitAssessmentRound(
  state: AssessmentState,
  answers: readonly AssessmentAnswer[],
): AssessmentState {
  if (state.completed) return state;
  if (answers.length !== WORDS_PER_ROUND) {
    throw new Error(`Expected ${WORDS_PER_ROUND} assessment answers`);
  }

  const score = round(answers.reduce((total, answer) => total + answerScore(answer), 0) / answers.length);
  const direction: -1 | 0 | 1 = score >= 0.8 ? 1 : score <= 0.2 ? -1 : 0;
  const roundResult: AssessmentRound = {
    band: state.currentBand,
    answers: [...answers],
    score,
    direction,
  };
  const rounds = [...state.rounds, roundResult];

  const currentBand = clampBand(state.currentBand + direction);
  const previousRound = rounds.at(-2);
  const stable = previousRound !== undefined
    && clampBand(previousRound.band + previousRound.direction) === currentBand;
  const atBoundary = currentBand === 0 || currentBand === ASSESSMENT_BANDS.length - 1;

  return {
    currentBand,
    roundIndex: state.roundIndex + 1,
    rounds,
    completed: rounds.length >= MAX_ASSESSMENT_ROUNDS
      || (rounds.length >= MIN_ASSESSMENT_ROUNDS && (stable || atBoundary)),
  };
}

export function vocabularyProfileFromAssessment(
  state: AssessmentState,
  assessedAt = new Date().toISOString(),
): VocabularyProfile {
  if (!state.completed || state.rounds.length === 0) {
    throw new Error("Assessment is not complete");
  }

  const estimatedBand = clampBand(state.currentBand);
  const certainty = state.rounds.reduce(
    (total, round) => total + Math.abs(round.score - 0.5) * 2,
    0,
  ) / state.rounds.length;
  const previousRound = state.rounds.at(-2);
  const lastRound = state.rounds.at(-1)!;
  const stable = previousRound !== undefined
    && clampBand(previousRound.band + previousRound.direction) === clampBand(lastRound.band + lastRound.direction);
  const evidence = Math.min(1, state.rounds.length / MIN_ASSESSMENT_ROUNDS);
  const confidence = clamp01(0.25 + evidence * 0.25 + certainty * 0.35 + (stable ? 0.15 : 0));

  return {
    id: "current",
    estimatedBand,
    frequencyThreshold: ASSESSMENT_BANDS[estimatedBand].frequencyThreshold,
    confidence: round(confidence),
    assessedAt,
    assessmentVersion: ASSESSMENT_VERSION,
  };
}

function answerScore(answer: AssessmentAnswer) {
  return answer === "known" ? 1 : answer === "unsure" ? 0.5 : 0;
}

function clampBand(value: number) {
  return Math.min(ASSESSMENT_BANDS.length - 1, Math.max(0, Math.round(value)));
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function round(value: number) {
  return Number(value.toFixed(3));
}
