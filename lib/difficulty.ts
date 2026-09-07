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
    sentenceLengthP90: number;
    maxSentenceLength: number;
    longSentenceRatio: number;
    veryLongSentenceRatio: number;
    clauseConnectorDensity: number;
    punctuationComplexity: number;
    syntacticComplexity: number;
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
        sentenceLengthP90: 0,
        maxSentenceLength: 0,
        longSentenceRatio: 0,
        veryLongSentenceRatio: 0,
        clauseConnectorDensity: 0,
        punctuationComplexity: 0,
        syntacticComplexity: 0,
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
  const sentenceLengthP90 = percentile(sentenceLengths, 0.9) || wordCount;
  const maxSentenceLength = sentenceLengths.length ? Math.max(...sentenceLengths) : wordCount;
  const longSentenceRatio = sentenceLengths.length
    ? sentenceLengths.filter((length) => length > 25).length / sentenceLengths.length
    : 0;
  const veryLongSentenceRatio = sentenceLengths.length
    ? sentenceLengths.filter((length) => length > 38).length / sentenceLengths.length
    : 0;
  const clauseConnectors = words.filter((word) => CLAUSE_CONNECTORS.has(word)).length;
  const clauseConnectorDensity = clauseConnectors / wordCount;
  const punctuationMarks = content.match(/[,;:()[\]—–]/g)?.length ?? 0;
  const punctuationPerSentence = punctuationMarks / Math.max(1, sentenceLengths.length);
  const sentenceComplexity = clamp01((averageSentenceLength - 12) / 20);
  const p90Complexity = clamp01((sentenceLengthP90 - 18) / 28);
  const maxSentenceComplexity = clamp01((maxSentenceLength - 28) / 42);
  const connectorComplexity = clamp01((clauseConnectorDensity - 0.025) / 0.09);
  const punctuationComplexity = clamp01((punctuationPerSentence - 0.7) / 3.3);
  const syntacticComplexity = round(
    sentenceComplexity * 0.3
      + p90Complexity * 0.24
      + maxSentenceComplexity * 0.14
      + veryLongSentenceRatio * 0.12
      + connectorComplexity * 0.1
      + punctuationComplexity * 0.1,
  );
  const lengthComplexity = clamp01((wordCount - 250) / 1250);

  const score = round(
    unknownWordRatio * 0.34
      + veryLowFamiliarityRatio * 0.16
      + rareWordRatio * 0.13
      + syntacticComplexity * 0.32
      + lengthComplexity * 0.05,
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
      sentenceLengthP90,
      maxSentenceLength,
      longSentenceRatio: round(longSentenceRatio),
      veryLongSentenceRatio: round(veryLongSentenceRatio),
      clauseConnectorDensity: round(clauseConnectorDensity),
      punctuationComplexity: round(punctuationComplexity),
      syntacticComplexity,
    },
  };
}

function sentenceWordCounts(content: string) {
  const segments = content.match(/[^.!?]+(?:[.!?]+|$)/g) ?? [];
  return segments
    .map((sentence) => tokenizePreservingText(sentence).filter((token) => token.type === "word").length)
    .filter(Boolean);
}

function percentile(values: readonly number[], percentileValue: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * percentileValue) - 1));
  return sorted[index];
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function round(value: number) {
  return Number(clamp01(value).toFixed(3));
}

const CLAUSE_CONNECTORS = new Set([
  "although", "because", "before", "despite", "even", "however", "if", "once", "since", "than",
  "that", "though", "unless", "until", "when", "whenever", "whereas", "whether", "which", "while",
  "who", "whom", "whose",
]);
