import { inspectCandidateArticle, materializeCandidateArticle, type CandidateArticleDraft } from "./candidate-import.ts";
import { estimateDifficulty, type DifficultyEstimate } from "./difficulty.ts";
import type { RankedCandidate } from "./feed-ranking.ts";
import { frequencyProvider } from "./frequency.ts";
import { assessArticleComfort, type ArticleComfortAssessment } from "./reading-comfort.ts";
import { saveArticleDifficulty } from "./storage.ts";
import type { Article, ReadingComfortProfile, VocabularyProfile, WordState } from "./types.ts";

export const FULL_TEXT_CANDIDATE_LIMIT = 5;
export const LOCAL_FALLBACK_LIMIT = 20;
export const SUCCESS_FIT_TOLERANCE = 0.06;

export type FullTextSelection = {
  article: Article;
  rankedCandidate: RankedCandidate;
  originalRank: number;
  difficulty: DifficultyEstimate;
  comfortAssessment: ArticleComfortAssessment;
};

type SelectionDependencies = {
  inspect?: (candidate: RankedCandidate["candidate"]) => Promise<CandidateArticleDraft>;
  materialize?: (candidate: RankedCandidate["candidate"], draft: CandidateArticleDraft) => Promise<Article>;
  saveDifficulty?: (articleId: string, score: number) => Promise<void>;
  limit?: number;
};

export async function selectCandidateByFullText(
  ranked: readonly RankedCandidate[],
  profile: VocabularyProfile | null | undefined,
  wordStates: readonly WordState[],
  readingComfort: ReadingComfortProfile | null | undefined,
  dependencies: SelectionDependencies = {},
): Promise<FullTextSelection> {
  const inspect = dependencies.inspect ?? inspectCandidateArticle;
  const materialize = dependencies.materialize ?? materializeCandidateArticle;
  const saveDifficulty = dependencies.saveDifficulty ?? saveArticleDifficulty;
  const limit = Math.max(1, dependencies.limit ?? FULL_TEXT_CANDIDATE_LIMIT);
  const acceptable: Array<{
    draft: CandidateArticleDraft;
    item: RankedCandidate;
    index: number;
    difficulty: DifficultyEstimate;
    comfortAssessment: ArticleComfortAssessment;
  }> = [];
  let lastError: unknown;
  const vocabularyBand = Math.min(5, Math.max(0, Math.round(profile?.estimatedBand ?? 2)));

  const primary = ranked.slice(0, limit).map((item, index) => ({ item, originalIndex: index }));
  const localFallback = ranked
    .slice(limit)
    .map((item, index) => ({ item, originalIndex: limit + index }))
    .filter(({ item }) => Boolean(item.candidate.contentId || item.candidate.contentSnapshot))
    .slice(0, LOCAL_FALLBACK_LIMIT);

  for (const { item, originalIndex } of [...primary, ...localFallback]) {
    if (readingComfort?.successPhase && (
      (typeof item.candidate.readingLevel === "number" && item.candidate.readingLevel > vocabularyBand + 1)
      || (typeof item.candidate.successBandMin === "number" && vocabularyBand < item.candidate.successBandMin)
      || (typeof item.candidate.successBandMax === "number" && vocabularyBand > item.candidate.successBandMax)
    )) {
      continue;
    }
    try {
      const draft = await inspect(item.candidate);
      const difficulty = estimateDifficulty(draft.content, wordStates, frequencyProvider, profile);
      const comfortAssessment = assessArticleComfort(difficulty, profile, readingComfort);
      if (comfortAssessment.acceptable) {
        acceptable.push({ draft, item, index: originalIndex, difficulty, comfortAssessment });
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (!acceptable.length) {
    if (lastError instanceof Error && ranked.length === 1) throw lastError;
    throw new Error("暂时没有适合当前难度的文章");
  }

  const selected = readingComfort?.successPhase
    ? selectSuccessCandidate(acceptable)
    : acceptable[0];
  const article = await materialize(selected.item.candidate, selected.draft);
  await saveDifficulty(article.id, selected.difficulty.score);

  return {
    article,
    rankedCandidate: selected.item,
    originalRank: selected.index + 1,
    difficulty: selected.difficulty,
    comfortAssessment: selected.comfortAssessment,
  };
}

function selectSuccessCandidate<T extends { index: number; comfortAssessment: ArticleComfortAssessment }>(acceptable: T[]) {
  const bestFit = Math.max(...acceptable.map((item) => item.comfortAssessment.fitScore));
  return acceptable
    .filter((item) => item.comfortAssessment.fitScore >= bestFit - SUCCESS_FIT_TOLERANCE)
    .sort((left, right) => left.index - right.index)[0];
}
