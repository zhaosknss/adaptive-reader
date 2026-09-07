import assert from "node:assert/strict";
import test from "node:test";
import { summarizeLookupFriction } from "../lib/lookup-friction.ts";

test("clustered lookups create more friction than the same total spread across contexts", () => {
  const clustered = summarizeLookupFriction(4, 100, [
    { contextHash: "one", exposedUniqueWordCount: 12, lookedUpUniqueWordCount: 4 },
    { contextHash: "two", exposedUniqueWordCount: 20, lookedUpUniqueWordCount: 0 },
  ]);
  const spread = summarizeLookupFriction(4, 100, [
    { contextHash: "one", exposedUniqueWordCount: 25, lookedUpUniqueWordCount: 1 },
    { contextHash: "two", exposedUniqueWordCount: 25, lookedUpUniqueWordCount: 1 },
    { contextHash: "three", exposedUniqueWordCount: 25, lookedUpUniqueWordCount: 1 },
    { contextHash: "four", exposedUniqueWordCount: 25, lookedUpUniqueWordCount: 1 },
  ]);

  assert.equal(clustered.lookupsPer100ExposedWords, spread.lookupsPer100ExposedWords);
  assert.equal(clustered.maxLookupsInContext, 4);
  assert.equal(spread.maxLookupsInContext, 1);
  assert.ok(clustered.score > spread.score);
});
