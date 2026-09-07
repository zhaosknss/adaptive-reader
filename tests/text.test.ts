import assert from "node:assert/strict";
import test from "node:test";
import { familiarityAfterExposure, familiarityAfterLookup } from "../lib/familiarity.ts";
import { estimateDifficulty } from "../lib/difficulty.ts";
import { frequencyProvider } from "../lib/frequency.ts";
import { normalizeWord, readingParagraphs, tokenizePreservingText, uniqueWords } from "../lib/text.ts";

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

test("reader removes only a first paragraph that repeats the article title", () => {
  const title = "The Quiet Art of Reading";
  assert.deepEqual(
    readingParagraphs(title, "The Quiet Art of Reading\n\nThis is the real opening paragraph."),
    ["This is the real opening paragraph."],
  );
  assert.deepEqual(
    readingParagraphs(title, "The Quiet Art of Reading!\n\nThis is the real opening paragraph."),
    ["This is the real opening paragraph."],
  );
  assert.deepEqual(
    readingParagraphs(title, "A different opening paragraph.\n\nThe article continues."),
    ["A different opening paragraph.", "The article continues."],
  );
});

test("lookup lowers familiarity but never below the floor", () => {
  assert.equal(familiarityAfterLookup(0.6), 0.52);
  assert.equal(familiarityAfterLookup(0.1), 0.05);
  assert.equal(familiarityAfterLookup(0.05), 0.05);
});

test("a new exposure raises familiarity slowly but keeps a ceiling", () => {
  assert.equal(familiarityAfterExposure(0.6), 0.602);
  assert.equal(familiarityAfterExposure(0.94), 0.942);
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

test("difficulty notices long and clause-heavy sentences beyond mean length", () => {
  const familiar = commonWordStates();
  const simple = estimateDifficulty(
    "The child saw the bird. The bird sat by the tree. The child went home.",
    familiar,
  );
  const complex = estimateDifficulty(
    "Although the child saw the bird, which had hidden beside the tree because the storm was growing, the child waited while the branches moved, and then returned home when the rain finally began.",
    familiar,
  );

  assert.ok(complex.metrics.sentenceLengthP90 > simple.metrics.sentenceLengthP90);
  assert.ok(complex.metrics.clauseConnectorDensity > simple.metrics.clauseConnectorDensity);
  assert.ok(complex.metrics.syntacticComplexity > simple.metrics.syntacticComplexity);
  assert.ok(complex.score > simple.score);
});

function commonWordStates() {
  return [
    "although", "the", "child", "saw", "bird", "which", "had", "hidden", "beside", "tree",
    "because", "storm", "was", "growing", "waited", "while", "branches", "moved", "and", "then",
    "returned", "home", "when", "rain", "finally", "began", "sat", "by", "went",
  ].map((word) => ({
    word,
    normalizedWord: word,
    familiarity: 0.95,
    seenCount: 5,
    lookupCount: 0,
    firstSeenAt: null,
    lastSeenAt: null,
    lastLookupAt: null,
  }));
}
