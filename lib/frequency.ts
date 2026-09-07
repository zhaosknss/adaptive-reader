import level10Words from "wordlist-english/english-words-10.json" with { type: "json" };
import level20Words from "wordlist-english/english-words-20.json" with { type: "json" };
import { normalizeWord } from "./text.ts";
import type { VocabularyProfile } from "./types.ts";

export type FrequencyBand = "very_common" | "common" | "rare";

export type FrequencyResult = {
  band: FrequencyBand;
  score: number;
};

export interface FrequencyProvider {
  lookup(word: string): FrequencyResult;
  initialFamiliarity(word: string, profile?: VocabularyProfile | null): number;
}

const level10 = new Set(level10Words);
const level20 = new Set(level20Words);

export class ScowlFrequencyProvider implements FrequencyProvider {
  lookup(word: string): FrequencyResult {
    const normalized = normalizeWord(word);
    if (level10.has(normalized)) return { band: "very_common", score: 0.9 };
    if (level20.has(normalized)) return { band: "common", score: 0.68 };
    return { band: "rare", score: 0.3 };
  }

  initialFamiliarity(word: string, profile?: VocabularyProfile | null) {
    const { band } = this.lookup(word);
    const base = band === "very_common" ? 0.82 : band === "common" ? 0.62 : 0.34;
    if (!profile) return base;

    const profileBand = Math.min(5, Math.max(0, Math.round(profile.estimatedBand)));
    const thresholdAbility = clamp01((0.9 - profile.frequencyThreshold) / 0.6);
    const bandAbility = profileBand / 5;
    const ability = bandAbility * 0.7 + thresholdAbility * 0.3;
    const confidence = clamp01(profile.confidence);
    const assessedPrior = band === "very_common"
      ? 0.52 + ability * 0.38
      : band === "common"
        ? 0.34 + ability * 0.46
        : 0.14 + ability * 0.46;
    const uncertainPrior = band === "very_common" ? 0.48 : band === "common" ? 0.36 : 0.18;
    const prior = assessedPrior * confidence + uncertainPrior * (1 - confidence);

    // Once an assessment exists, uncertainty must not silently restore the
    // optimistic population default. This matters most for band 0/1 users.
    return Number(clamp(prior, 0.08, Math.max(uncertainPrior, base)).toFixed(2));
  }
}

function clamp01(value: number) {
  return clamp(value, 0, 1);
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export const frequencyProvider: FrequencyProvider = new ScowlFrequencyProvider();
