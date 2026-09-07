import { readingMinutes, tokenizePreservingText } from "./text.ts";
import type { Article, CandidateArticle, InterestFeatureState, InterestProfile, LookupFrictionMetrics, RecommendationEvent } from "./types.ts";

export const INTEREST_MODEL_VERSION = 1;

export type InterestFeedback = {
  outcome: "finished" | "skipped";
  article: Article;
  recommendation: RecommendationEvent;
  readingTimeSeconds: number;
  activeReadingSeconds?: number;
  maxReadingProgress?: number;
  lookupCount: number;
  lookupFriction?: LookupFrictionMetrics;
  timestamp?: string;
};

export function emptyInterestProfile(): InterestProfile {
  return {
    id: "current",
    source: {},
    topic: {},
    keyword: {},
    evidenceCount: 0,
    processedRecommendationEventIds: [],
    updatedAt: null,
    modelVersion: INTEREST_MODEL_VERSION,
  };
}

export function normalizeInterestProfile(value?: Partial<InterestProfile> | null): InterestProfile {
  return {
    id: "current",
    source: normalizeFeatureMap(value?.source),
    topic: normalizeFeatureMap(value?.topic),
    keyword: normalizeFeatureMap(value?.keyword),
    evidenceCount: nonNegativeInteger(value?.evidenceCount),
    processedRecommendationEventIds: [...new Set(value?.processedRecommendationEventIds ?? [])].slice(-200),
    updatedAt: value?.updatedAt ?? null,
    modelVersion: Math.max(1, Math.round(value?.modelVersion ?? INTEREST_MODEL_VERSION)),
  };
}

export function applyInterestFeedback(
  current: InterestProfile | null | undefined,
  feedback: InterestFeedback,
): InterestProfile {
  const profile = normalizeInterestProfile(current);
  if (profile.processedRecommendationEventIds.includes(feedback.recommendation.id)) return profile;
  const timestamp = feedback.timestamp ?? new Date().toISOString();
  const signal = interestSignal(feedback);

  return {
    ...profile,
    source: updateFeature(profile.source, feedback.recommendation.sourceId, signal, 0.26, timestamp),
    topic: updateFeature(profile.topic, feedback.recommendation.topic, signal, 0.2, timestamp),
    keyword: feedback.recommendation.keywords.reduce(
      (features, keyword) => updateFeature(features, keyword, signal, 0.08, timestamp),
      profile.keyword,
    ),
    evidenceCount: profile.evidenceCount + 1,
    processedRecommendationEventIds: [...profile.processedRecommendationEventIds, feedback.recommendation.id].slice(-200),
    updatedAt: timestamp,
    modelVersion: INTEREST_MODEL_VERSION,
  };
}

export function interestScoreForCandidate(candidate: CandidateArticle, profile?: InterestProfile | null): number {
  const normalized = normalizeInterestProfile(profile);
  if (normalized.evidenceCount === 0) return 0.5;

  const source = featurePreference(normalized.source[featureKey(candidate.sourceId)]);
  const topic = featurePreference(normalized.topic[featureKey(candidate.topic)]);
  const keywords = extractCandidateKeywords(candidate);
  const keyword = keywords.length
    ? keywords.reduce((total, item) => total + featurePreference(normalized.keyword[item]), 0) / keywords.length
    : 0.5;
  return round01(source * 0.5 + topic * 0.3 + keyword * 0.2);
}

export function explorationScoreForCandidate(candidate: CandidateArticle, profile?: InterestProfile | null): number {
  const normalized = normalizeInterestProfile(profile);
  const sourceEvidence = normalized.source[featureKey(candidate.sourceId)]?.evidenceCount ?? 0;
  const topicEvidence = normalized.topic[featureKey(candidate.topic)]?.evidenceCount ?? 0;
  return round01(1 - Math.min(1, sourceEvidence * 0.14 + topicEvidence * 0.08));
}

export function extractCandidateKeywords(candidate: Pick<CandidateArticle, "title" | "summary">): string[] {
  const counts = new Map<string, number>();
  for (const token of tokenizePreservingText(`${candidate.title} ${candidate.summary}`)) {
    if (token.type !== "word") continue;
    const word = token.normalized!;
    if (word.length < 4 || STOP_WORDS.has(word)) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 8)
    .map(([word]) => word);
}

export function interestSignal(feedback: InterestFeedback): number {
  const expectedSeconds = Math.max(60, readingMinutes(feedback.article.content) * 60);
  const effectiveReadingSeconds = feedback.activeReadingSeconds ?? feedback.readingTimeSeconds;
  const timeRatio = clamp01(effectiveReadingSeconds / expectedSeconds);
  const wordCount = Math.max(1, tokenizePreservingText(feedback.article.content).filter((token) => token.type === "word").length);
  const lookupRate = feedback.lookupFriction
    ? feedback.lookupFriction.lookupsPer100ExposedWords / 100
    : feedback.lookupCount / wordCount;
  const difficultyFriction = feedback.article.userDifficultyFeedback === "too_hard"
    ? 0.7
    : clamp01(((feedback.article.estimatedDifficulty ?? 0.3) - 0.45) / 0.4);
  const lookupFriction = Math.max(
    clamp01((lookupRate - 0.04) / 0.12),
    feedback.lookupFriction?.score ?? 0,
  );
  const confidence = 1 - Math.max(difficultyFriction, lookupFriction) * 0.65;

  if (feedback.outcome === "finished") {
    return roundSigned((0.3 + timeRatio * 0.55) * confidence);
  }

  const difficultyDrivenExit = feedback.article.userDifficultyFeedback === "too_hard"
    || ((feedback.maxReadingProgress ?? 1) < 0.55 && lookupFriction >= 0.5);
  if (difficultyDrivenExit) return 0;

  const quickExit = effectiveReadingSeconds < Math.min(30, expectedSeconds * 0.12);
  const negative = quickExit ? -0.65 : -0.42;
  return roundSigned(negative * confidence);
}

function updateFeature(
  features: Record<string, InterestFeatureState>,
  rawKey: string,
  signal: number,
  learningRate: number,
  timestamp: string,
) {
  const key = featureKey(rawKey);
  if (!key) return features;
  if (signal === 0) return features;
  const previous = features[key] ?? { score: 0, evidenceCount: 0, updatedAt: timestamp };
  const next: InterestFeatureState = {
    score: roundSigned(previous.score * 0.88 + signal * learningRate),
    evidenceCount: previous.evidenceCount + 1,
    updatedAt: timestamp,
  };
  return { ...features, [key]: next };
}

function normalizeFeatureMap(value?: Record<string, InterestFeatureState>) {
  const normalized: Record<string, InterestFeatureState> = {};
  for (const [rawKey, state] of Object.entries(value ?? {})) {
    const key = featureKey(rawKey);
    if (!key) continue;
    normalized[key] = {
      score: roundSigned(state?.score ?? 0),
      evidenceCount: nonNegativeInteger(state?.evidenceCount),
      updatedAt: state?.updatedAt ?? new Date(0).toISOString(),
    };
  }
  return normalized;
}

function featurePreference(state?: InterestFeatureState) {
  return state ? clamp01(0.5 + state.score / 2) : 0.5;
}

function featureKey(value: string) {
  return value.trim().toLocaleLowerCase("en-US");
}

function nonNegativeInteger(value?: number) {
  return Number.isFinite(value) ? Math.max(0, Math.round(value ?? 0)) : 0;
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function round01(value: number) {
  return Number(clamp01(value).toFixed(3));
}

function roundSigned(value: number) {
  return Number(Math.min(1, Math.max(-1, value)).toFixed(3));
}

const STOP_WORDS = new Set([
  "about", "after", "again", "also", "among", "because", "before", "being", "between", "could", "from",
  "have", "into", "more", "most", "other", "over", "such", "than", "that", "their", "there", "these",
  "they", "this", "through", "under", "very", "what", "when", "where", "which", "while", "with", "would",
]);
