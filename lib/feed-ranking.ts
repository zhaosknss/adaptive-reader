import { estimateDifficulty, type DifficultyLabel } from "./difficulty.ts";
import { frequencyProvider } from "./frequency.ts";
import { readingMinutes } from "./text.ts";
import type { CandidateArticle, VocabularyProfile } from "./types.ts";

export type RankedCandidate = {
  candidate: CandidateArticle;
  score: number;
  readabilityScore: number;
  freshnessScore: number;
  difficultyLabel: DifficultyLabel;
  estimatedMinutes: number;
};

export function rankColdStartCandidates(
  candidates: readonly CandidateArticle[],
  profile?: VocabularyProfile | null,
  now = new Date(),
): RankedCandidate[] {
  const available = candidates
    .filter((candidate) => candidate.status === "available" && candidate.url)
    .map((candidate) => scoreCandidate(candidate, profile, now));
  const ranked: RankedCandidate[] = [];
  const sourceCounts = new Map<string, number>();
  const topicCounts = new Map<string, number>();

  while (available.length) {
    let bestIndex = 0;
    let bestAdjustedScore = Number.NEGATIVE_INFINITY;
    for (const [index, item] of available.entries()) {
      const adjustedScore = item.score
        - (sourceCounts.get(item.candidate.sourceId) ?? 0) * 0.14
        - (topicCounts.get(item.candidate.topic) ?? 0) * 0.07;
      if (adjustedScore > bestAdjustedScore) {
        bestAdjustedScore = adjustedScore;
        bestIndex = index;
      }
    }
    const [selected] = available.splice(bestIndex, 1);
    ranked.push(selected);
    sourceCounts.set(selected.candidate.sourceId, (sourceCounts.get(selected.candidate.sourceId) ?? 0) + 1);
    topicCounts.set(selected.candidate.topic, (topicCounts.get(selected.candidate.topic) ?? 0) + 1);
  }

  return ranked;
}

function scoreCandidate(candidate: CandidateArticle, profile: VocabularyProfile | null | undefined, now: Date) {
  const sample = `${candidate.title}. ${candidate.summary}`;
  const difficulty = estimateDifficulty(sample, [], frequencyProvider, profile);
  const readabilityScore = clamp01(1 - Math.abs(difficulty.score - 0.3) / 0.5);
  const ageDays = candidate.publishedAt
    ? Math.max(0, (now.getTime() - new Date(candidate.publishedAt).getTime()) / 86_400_000)
    : 14;
  const freshnessScore = clamp01(1 - ageDays / 45);
  const score = readabilityScore * 0.72 + freshnessScore * 0.28;

  return {
    candidate,
    score: round(score),
    readabilityScore: round(readabilityScore),
    freshnessScore: round(freshnessScore),
    difficultyLabel: difficulty.label,
    estimatedMinutes: Math.max(3, Math.min(12, readingMinutes(sample) * 3)),
  } satisfies RankedCandidate;
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function round(value: number) {
  return Number(clamp01(value).toFixed(3));
}
