import { estimateDifficulty, type DifficultyLabel } from "./difficulty.ts";
import { getBuiltinReading } from "./builtin-readings.ts";
import { combineInterestWithPreferences, contentPreferenceScore } from "./content-preferences.ts";
import { frequencyProvider } from "./frequency.ts";
import { explorationScoreForCandidate, interestScoreForCandidate } from "./interest-profile.ts";
import { readingMinutes, tokenizePreservingText } from "./text.ts";
import type { CandidateArticle, ContentPreferences, InterestProfile, RankingComponents, RankingWeights, RecommendationCandidateSnapshot, VocabularyProfile } from "./types.ts";

export const RANKING_MODEL_VERSION = 4;
export const RANKING_WEIGHTS: RankingWeights = {
  interest: 0.32,
  readability: 0.42,
  freshness: 0.18,
  exploration: 0.08,
  baseScore: 0.9,
  diversity: 0.1,
};

const TARGET_DIFFICULTY_BY_BAND = [0.12, 0.18, 0.24, 0.3, 0.36, 0.42] as const;
const COMFORTABLE_WORDS_BY_BAND = [90, 180, 320, 520, 800, 1200] as const;

export type RankedCandidate = {
  candidate: CandidateArticle;
  score: number;
  modelVersion: number;
  components: RankingComponents;
  interestScore: number;
  readabilityScore: number;
  freshnessScore: number;
  explorationScore: number;
  diversityScore: number;
  difficultyLabel: DifficultyLabel;
  difficultyScore: number;
  vocabularyBand: number;
  targetDifficulty: number;
  estimatedMinutes: number;
};

export function rankColdStartCandidates(
  candidates: readonly CandidateArticle[],
  profile?: VocabularyProfile | null,
  now = new Date(),
  interestProfile?: InterestProfile | null,
  contentPreferences?: ContentPreferences | null,
): RankedCandidate[] {
  const available = candidates
    .filter((candidate) => candidate.status === "available" && candidate.url)
    .map((candidate) => scoreCandidate(candidate, profile, interestProfile, contentPreferences, now));
  const ranked: RankedCandidate[] = [];
  const sourceCounts = new Map<string, number>();
  const topicCounts = new Map<string, number>();

  while (available.length) {
    let bestIndex = 0;
    let bestAdjustedScore = Number.NEGATIVE_INFINITY;
    for (const [index, item] of available.entries()) {
      const diversityScore = diversityForCounts(
        sourceCounts.get(item.candidate.sourceId) ?? 0,
        topicCounts.get(item.candidate.topic) ?? 0,
      );
      const adjustedScore = item.score * RANKING_WEIGHTS.baseScore + diversityScore * RANKING_WEIGHTS.diversity;
      if (adjustedScore > bestAdjustedScore) {
        bestAdjustedScore = adjustedScore;
        bestIndex = index;
      }
    }
    const [selected] = available.splice(bestIndex, 1);
    const diversityScore = diversityForCounts(
      sourceCounts.get(selected.candidate.sourceId) ?? 0,
      topicCounts.get(selected.candidate.topic) ?? 0,
    );
    ranked.push({
      ...selected,
      score: round(selected.score * RANKING_WEIGHTS.baseScore + diversityScore * RANKING_WEIGHTS.diversity),
      diversityScore,
      components: { ...selected.components, diversityScore },
    });
    sourceCounts.set(selected.candidate.sourceId, (sourceCounts.get(selected.candidate.sourceId) ?? 0) + 1);
    topicCounts.set(selected.candidate.topic, (topicCounts.get(selected.candidate.topic) ?? 0) + 1);
  }

  return ranked;
}

function scoreCandidate(
  candidate: CandidateArticle,
  profile: VocabularyProfile | null | undefined,
  interestProfile: InterestProfile | null | undefined,
  contentPreferences: ContentPreferences | null | undefined,
  now: Date,
) {
  const builtin = getBuiltinReading(candidate.contentId);
  const sample = builtin?.content ?? `${candidate.title}. ${candidate.summary}`;
  const difficulty = estimateDifficulty(sample, [], frequencyProvider, profile);
  const learnedInterest = interestScoreForCandidate(candidate, interestProfile);
  const preferenceScore = contentPreferenceScore(candidate, contentPreferences);
  const interestScore = combineInterestWithPreferences(
    learnedInterest,
    preferenceScore,
    interestProfile,
    contentPreferences,
  );
  const band = profileBand(profile);
  const targetDifficulty = TARGET_DIFFICULTY_BY_BAND[band];
  const difficultyFit = clamp01(1 - Math.abs(difficulty.score - targetDifficulty) / 0.42);
  const levelFit = typeof candidate.readingLevel === "number"
    ? clamp01(1 - Math.abs(candidate.readingLevel - band) / 3)
    : difficultyFit;
  const wordCount = tokenizePreservingText(sample).filter((token) => token.type === "word").length;
  const comfortableWords = COMFORTABLE_WORDS_BY_BAND[band];
  const lengthFit = wordCount <= comfortableWords
    ? 1
    : clamp01(1 - (wordCount - comfortableWords) / (comfortableWords * 2));
  const readabilityScore = clamp01(difficultyFit * 0.55 + levelFit * 0.25 + lengthFit * 0.2);
  const ageDays = candidate.publishedAt
    ? Math.max(0, (now.getTime() - new Date(candidate.publishedAt).getTime()) / 86_400_000)
    : 14;
  const freshnessScore = clamp01(1 - ageDays / 45);
  const explorationScore = explorationScoreForCandidate(candidate, interestProfile);
  const diversityScore = 1;
  const score = interestScore * RANKING_WEIGHTS.interest
    + readabilityScore * RANKING_WEIGHTS.readability
    + freshnessScore * RANKING_WEIGHTS.freshness
    + explorationScore * RANKING_WEIGHTS.exploration;
  const components: RankingComponents = {
    interestScore: round(interestScore),
    readabilityScore: round(readabilityScore),
    freshnessScore: round(freshnessScore),
    explorationScore: round(explorationScore),
    diversityScore,
  };

  return {
    candidate,
    score: round(score),
    modelVersion: RANKING_MODEL_VERSION,
    components,
    ...components,
    difficultyLabel: difficulty.label,
    difficultyScore: round(difficulty.score),
    vocabularyBand: band,
    targetDifficulty,
    estimatedMinutes: Math.max(1, Math.min(12, readingMinutes(sample))),
  } satisfies RankedCandidate;
}

export function recommendationSlate(
  ranked: readonly RankedCandidate[],
  selectedCandidateId: string,
  selectedArticleId: string,
  limit = 15,
): RecommendationCandidateSnapshot[] {
  return ranked.slice(0, Math.max(1, limit)).map((item, index) => ({
    candidateId: item.candidate.id,
    articleId: item.candidate.id === selectedCandidateId ? selectedArticleId : item.candidate.articleId,
    rank: index + 1,
    totalScore: item.score,
    difficultyScore: item.difficultyScore,
    interestScore: item.interestScore,
    explorationScore: item.explorationScore,
  }));
}

function profileBand(profile: VocabularyProfile | null | undefined) {
  return Math.min(5, Math.max(0, Math.round(profile?.estimatedBand ?? 2)));
}

function diversityForCounts(sourceCount: number, topicCount: number) {
  return round(1 - sourceCount * 0.55 - topicCount * 0.25);
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function round(value: number) {
  return Number(clamp01(value).toFixed(3));
}
