import type { CandidateArticle, ContentPool, ReadingComfortProfile, VocabularyProfile } from "./types.ts";

const ALL_CONTENT_POOLS: readonly ContentPool[] = ["success", "bridge", "open_web"];

type VocabularyBandProfile = Pick<VocabularyProfile, "estimatedBand">;
type ReadingStageComfort = Pick<ReadingComfortProfile, "successPhase" | "vocabularyBand">;

/**
 * Return the content pools that may be considered at the current reading
 * stage. This is only a stage/pool gate; full-text difficulty remains a
 * separate final decision.
 */
export function eligibleContentPools(
  profile?: VocabularyBandProfile | null,
  comfort?: ReadingStageComfort | null,
): ContentPool[] {
  const band = vocabularyBand(profile, comfort);
  const successPhase = comfort?.successPhase !== false;

  if (band >= 3) return [...ALL_CONTENT_POOLS];
  if (band <= 1) return successPhase ? ["success"] : ["success", "bridge"];
  return successPhase ? ["success", "bridge"] : [...ALL_CONTENT_POOLS];
}

/**
 * Keep candidates eligible for the current stage, preserving candidate order
 * and leaving full difficulty assessment to the article-selection pipeline.
 */
export function filterCandidatesForReadingStage(
  candidates: readonly CandidateArticle[],
  profile?: VocabularyBandProfile | null,
  comfort?: ReadingStageComfort | null,
): CandidateArticle[] {
  const band = vocabularyBand(profile, comfort);
  const pools = new Set(eligibleContentPools(profile, comfort));

  return candidates.filter((candidate) => pools.has(candidate.pool) && isWithinSuccessBand(candidate, band));
}

function vocabularyBand(
  profile?: VocabularyBandProfile | null,
  comfort?: ReadingStageComfort | null,
) {
  const value = profile?.estimatedBand ?? comfort?.vocabularyBand ?? 2;
  return Math.min(5, Math.max(0, Math.round(value)));
}

function isWithinSuccessBand(candidate: CandidateArticle, band: number) {
  const minimum = finiteBound(candidate.successBandMin);
  const maximum = finiteBound(candidate.successBandMax);
  return (minimum === null || band >= minimum) && (maximum === null || band <= maximum);
}

function finiteBound(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
