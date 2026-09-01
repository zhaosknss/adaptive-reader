import assert from "node:assert/strict";
import test from "node:test";
import { compactDefinition } from "../lib/definition-display.ts";

test("compactDefinition keeps one part of speech and one core Chinese meaning", () => {
  assert.deepEqual(compactDefinition("vi. 变成, 变得；vt. 适合"), {
    partOfSpeech: "vi.",
    meaning: "变成",
  });
  assert.deepEqual(compactDefinition("n. 软体动物"), {
    partOfSpeech: "n.",
    meaning: "软体动物",
  });
});

test("compactDefinition also handles a plain remote translation", () => {
  assert.deepEqual(compactDefinition("然而"), {
    partOfSpeech: undefined,
    meaning: "然而",
  });
});

test("compactDefinition normalizes ECDICT adjective abbreviations", () => {
  assert.deepEqual(compactDefinition("a. 象扇的, 折迭的"), {
    partOfSpeech: "adj.",
    meaning: "像扇的",
  });
});
