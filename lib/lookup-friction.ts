import type { LookupFrictionMetrics } from "./types.ts";

export type LookupContextSnapshot = {
  contextHash: string;
  exposedUniqueWordCount: number;
  lookedUpUniqueWordCount: number;
};

export function emptyLookupFriction(): LookupFrictionMetrics {
  return {
    lookupsPer100ExposedWords: 0,
    maxLookupsInContext: 0,
    maxLookupDensityByContext: 0,
    highFrictionContextCount: 0,
    consecutiveHighFrictionContexts: 0,
    score: 0,
  };
}

export function summarizeLookupFriction(
  totalLookupCount: number,
  exposedUniqueWordCount: number,
  contexts: readonly LookupContextSnapshot[],
): LookupFrictionMetrics {
  const lookupsPer100ExposedWords = exposedUniqueWordCount > 0
    ? totalLookupCount / exposedUniqueWordCount * 100
    : totalLookupCount > 0 ? 100 : 0;
  let maxLookupsInContext = 0;
  let maxLookupDensityByContext = 0;
  let highFrictionContextCount = 0;
  let consecutiveHighFrictionContexts = 0;
  let currentConsecutive = 0;

  for (const context of contexts) {
    const lookups = Math.max(0, context.lookedUpUniqueWordCount);
    const exposed = Math.max(1, context.exposedUniqueWordCount);
    const density = lookups / exposed * 100;
    const highFriction = lookups >= 3 || (lookups >= 2 && density >= 18);
    maxLookupsInContext = Math.max(maxLookupsInContext, lookups);
    maxLookupDensityByContext = Math.max(maxLookupDensityByContext, density);
    if (highFriction) {
      highFrictionContextCount += 1;
      currentConsecutive += 1;
      consecutiveHighFrictionContexts = Math.max(consecutiveHighFrictionContexts, currentConsecutive);
    } else {
      currentConsecutive = 0;
    }
  }

  const score = clamp01(
    clamp01(lookupsPer100ExposedWords / 20) * 0.4
      + clamp01(maxLookupsInContext / 4) * 0.28
      + clamp01(maxLookupDensityByContext / 40) * 0.18
      + clamp01(highFrictionContextCount / 3) * 0.08
      + clamp01(consecutiveHighFrictionContexts / 2) * 0.06,
  );

  return {
    lookupsPer100ExposedWords: round(lookupsPer100ExposedWords),
    maxLookupsInContext,
    maxLookupDensityByContext: round(maxLookupDensityByContext),
    highFrictionContextCount,
    consecutiveHighFrictionContexts,
    score: round(score),
  };
}

export function normalizeLookupFriction(value?: Partial<LookupFrictionMetrics> | null): LookupFrictionMetrics {
  return {
    lookupsPer100ExposedWords: nonNegative(value?.lookupsPer100ExposedWords),
    maxLookupsInContext: nonNegativeInteger(value?.maxLookupsInContext),
    maxLookupDensityByContext: nonNegative(value?.maxLookupDensityByContext),
    highFrictionContextCount: nonNegativeInteger(value?.highFrictionContextCount),
    consecutiveHighFrictionContexts: nonNegativeInteger(value?.consecutiveHighFrictionContexts),
    score: round(clamp01(value?.score ?? 0)),
  };
}

function nonNegative(value?: number) {
  return round(Math.max(0, Number.isFinite(value) ? value ?? 0 : 0));
}

function nonNegativeInteger(value?: number) {
  return Math.max(0, Math.round(Number.isFinite(value) ? value ?? 0 : 0));
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function round(value: number) {
  return Number(value.toFixed(3));
}
