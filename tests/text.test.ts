import assert from "node:assert/strict";
import test from "node:test";
import { familiarityAfterExposure, familiarityAfterLookup } from "../lib/familiarity.ts";
import { estimateDifficulty } from "../lib/difficulty.ts";
import { frequencyProvider } from "../lib/frequency.ts";
import { normalizeWord, tokenizePreservingText, uniqueWords } from "../lib/text.ts";

test("tokenization preserves every character and punctuation", () => {
  const input = `Hello, world! Don't break punctuation — ever.`;
  const tokens = tokenizePreservingText(input);
  assert.equal(tokens.map((token) => token.value).join(""), input);
  assert.deepEqual(tokens.filter((token) => token.type === "word").map((token) => token.normalized), [
    "hello", "world", "don't", "break", "punctuation", "ever",
  ]);
});

test("word normalization handles curly apostrophes and case", () => {
  assert.equal(normalizeWord("’Tis"), "'tis");
  assert.deepEqual(uniqueWords("Read read READING."), ["read", "reading"]);
});

test("tokenization preserves contractions, hyphens, entities, quotes, and paragraph breaks", () => {
  const input = `“Wasn’t it the user's state-of-the-art AT&T device?” — No.\n\nDon't change &amp; or punctuation.`;
  const tokens = tokenizePreservingText(input);
  assert.equal(tokens.map((token) => token.value).join(""), input);
  assert.deepEqual(tokens.filter((token) => token.type === "word").map((token) => token.normalized), [
    "wasn't", "it", "the", "user's", "state", "of", "the", "art", "at", "t", "device", "no",
    "don't", "change", "amp", "or", "punctuation",
  ]);
});

test("lookup lowers familiarity but never below the floor", () => {
  assert.equal(familiarityAfterLookup(0.6), 0.48);
  assert.equal(familiarityAfterLookup(0.1), 0.05);
  assert.equal(familiarityAfterLookup(0.05), 0.05);
});

test("a new exposure raises familiarity slowly but keeps a ceiling", () => {
  assert.equal(familiarityAfterExposure(0.6), 0.62);
  assert.equal(familiarityAfterExposure(0.94), 0.95);
  assert.equal(familiarityAfterExposure(0.95), 0.95);
});

test("local frequency bands give common words a higher prior", () => {
  assert.equal(frequencyProvider.lookup("the").band, "very_common");
  assert.ok(frequencyProvider.initialFamiliarity("the") > frequencyProvider.initialFamiliarity("sesquipedalian"));
});

test("difficulty is personal, bounded, and explainable", () => {
  const content = "The small cat sat on the warm chair. The cat was quiet and happy.";
  const easy = estimateDifficulty(content);
  const hard = estimateDifficulty("Sesquipedalian terminology obfuscates epistemological discontinuities. Nevertheless, interdisciplinarity proliferates unpredictably.");
  assert.equal(easy.metrics.wordCount, 14);
  assert.ok(easy.score >= 0 && easy.score <= 1);
  assert.ok(hard.score > easy.score);
  assert.ok(hard.metrics.rareWordRatio > easy.metrics.rareWordRatio);

  const knownRareWords = ["sesquipedalian", "terminology", "obfuscates", "epistemological", "discontinuities", "nevertheless", "interdisciplinarity", "proliferates", "unpredictably"].map((word) => ({
    word,
    normalizedWord: word,
    familiarity: 0.92,
    seenCount: 5,
    lookupCount: 0,
    firstSeenAt: null,
    lastSeenAt: null,
    lastLookupAt: null,
  }));
  const personalized = estimateDifficulty("Sesquipedalian terminology obfuscates epistemological discontinuities. Nevertheless, interdisciplinarity proliferates unpredictably.", knownRareWords);
  assert.ok(personalized.score < hard.score);
});
