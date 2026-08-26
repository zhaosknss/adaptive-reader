import level10Words from "wordlist-english/english-words-10.json" with { type: "json" };
import level20Words from "wordlist-english/english-words-20.json" with { type: "json" };
import { normalizeWord } from "./text.ts";

export type FrequencyBand = "very_common" | "common" | "rare";

export type FrequencyResult = {
  band: FrequencyBand;
  score: number;
};

export interface FrequencyProvider {
  lookup(word: string): FrequencyResult;
  initialFamiliarity(word: string): number;
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

  initialFamiliarity(word: string) {
    const { band } = this.lookup(word);
    if (band === "very_common") return 0.82;
    if (band === "common") return 0.62;
    return 0.34;
  }
}

export const frequencyProvider: FrequencyProvider = new ScowlFrequencyProvider();
