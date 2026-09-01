import type { LexicalEvent, WordState } from "./types.ts";

export function aggregateLexicalEvent(current: WordState, event: LexicalEvent): WordState {
  if (event.type === "exposure") {
    return {
      ...current,
      seenCount: current.seenCount + 1,
      familiarity: conservativeExposureFamiliarity(current.familiarity),
      firstSeenAt: current.firstSeenAt ?? event.timestamp,
      lastSeenAt: event.timestamp,
    };
  }

  if (event.type === "lookup") {
    return {
      ...current,
      lookupCount: current.lookupCount + 1,
      familiarity: event.dictionarySucceeded && event.evidenceApplied
        ? successfulLookupFamiliarity(current.familiarity)
        : current.familiarity,
      lastLookupAt: event.timestamp,
    };
  }

  return current;
}

function successfulLookupFamiliarity(current: number) {
  return Math.max(0.05, Number((current - 0.08).toFixed(3)));
}

function conservativeExposureFamiliarity(current: number) {
  return Math.min(0.95, Number((current + 0.002).toFixed(3)));
}

export function familiarityAfterLookup(current: number) {
  return successfulLookupFamiliarity(current);
}

export function familiarityAfterExposure(current: number) {
  return conservativeExposureFamiliarity(current);
}
