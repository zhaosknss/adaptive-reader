import type { VocabularyProfile, WordState } from "./types.ts";
import { frequencyProvider, type FrequencyProvider } from "./frequency.ts";
import { tokenizePreservingText } from "./text.ts";

export type DifficultyLabel = "easy" | "suitable" | "hard";

export type DifficultyEstimate = {
  score: number;
  label: DifficultyLabel;
  metrics: {
    wordCount: number;
    unknownWordRatio: number;
    veryLowFamiliarityRatio: number;
    rareWordRatio: number;
    averageSentenceLength: number;
    longSentenceRatio: number;
  };
};

export function estimateDifficulty(
  content: string,
  wordStates: Iterable<WordState> = [],
  provider: FrequencyProvider = frequencyProvider,
  profile?: VocabularyProfile | null,
): DifficultyEstimate {
  const words = tokenizePreservingText(content)
    .filter((token) => token.type === "word")
    .map((token) => token.normalized!);
  const states = new Map(Array.from(wordStates, (state) => [state.normalizedWord, state]));
  const sentenceLengths = sentenceWordCounts(content);
  const wordCount = words.length;

  if (wordCount === 0) {
    return {
      score: 0,
      label: "easy",
      metrics: {
        wordCount: 0,
        unknownWordRatio: 0,
        veryLowFamiliarityRatio: 0,
        rareWordRatio: 0,
        averageSentenceLength: 0,
        longSentenceRatio: 0,
      },
    };
  }

  let unknownWords = 0;
  let veryLowFamiliarityWords = 0;
  let rareWords = 0;
  for (const word of words) {
    const familiarity = states.get(word)?.familiarity ?? provider.initialFamiliarity(word, profile);
    if (familiarity < 0.5) unknownWords += 1;
    if (familiarity < 0.28) veryLowFamiliarityWords += 1;
    if (provider.lookup(word).band === "rare") rareWords += 1;
  }

  const unknownWordRatio = unknownWords / wordCount;
  const veryLowFamiliarityRatio = veryLowFamiliarityWords / wordCount;
  const rareWordRatio = rareWords / wordCount;
  const averageSentenceLength = sentenceLengths.length
    ? sentenceLengths.reduce((total, length) => total + length, 0) / sentenceLengths.length
    : wordCount;
  const longSentenceRatio = sentenceLengths.length
    ? sentenceLengths.filter((length) => length > 25).length / sentenceLengths.length
    : 0;
  const sentenceComplexity = clamp01((averageSentenceLength - 12) / 20);
  const lengthComplexity = clamp01((wordCount - 250) / 1250);

  const score = round(
    unknownWordRatio * 0.42
      + veryLowFamiliarityRatio * 0.18
      + rareWordRatio * 0.16
      + sentenceComplexity * 0.14
      + longSentenceRatio * 0.06
      + lengthComplexity * 0.04,
  );

  return {
    score,
    label: score < 0.24 ? "easy" : score < 0.52 ? "suitable" : "hard",
    metrics: {
      wordCount,
      unknownWordRatio: round(unknownWordRatio),
      veryLowFamiliarityRatio: round(veryLowFamiliarityRatio),
      rareWordRatio: round(rareWordRatio),
      averageSentenceLength: Number(averageSentenceLength.toFixed(1)),
      longSentenceRatio: round(longSentenceRatio),
    },
  };
}

function sentenceWordCounts(content: string) {
  const segments = content.match(/[^.!?]+(?:[.!?]+|$)/g) ?? [];
  return segments
    .map((sentence) => tokenizePreservingText(sentence).filter((token) => token.type === "word").length)
    .filter(Boolean);
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function round(value: number) {
  return Number(clamp01(value).toFixed(3));
}
