import assert from "node:assert/strict";
import test from "node:test";
import "fake-indexeddb/auto";
import { getReadingComfortProfile, getWordStates, listCandidateArticles, listLexicalEvents } from "../lib/storage.ts";

test.beforeEach(async () => {
  await deleteDatabase("just-read");
});

test("version 9 word data survives the reading-comfort store upgrade", async () => {
  const legacy = await openLegacyDatabase();
  const transaction = legacy.transaction("words", "readwrite");
  transaction.objectStore("words").put({
    word: "existing",
    normalizedWord: "existing",
    lookupCount: 3,
    seenCount: 4,
    familiarity: 0.61,
    firstSeenAt: "2026-08-20T00:00:00.000Z",
    lastSeenAt: "2026-08-21T00:00:00.000Z",
    lastLookupAt: "2026-08-22T00:00:00.000Z",
  });
  await transactionDone(transaction);
  legacy.close();

  const states = await getWordStates();
  assert.equal(states.length, 1);
  assert.equal(states[0].normalizedWord, "existing");
  assert.equal(states[0].lookupCount, 3);
  assert.equal(states[0].seenCount, 4);
  assert.equal(states[0].familiarity, 0.61);
  assert.deepEqual(await listLexicalEvents(), []);
  const comfort = await getReadingComfortProfile();
  assert.equal(comfort.vocabularyBand, 2);
  assert.equal(comfort.successPhase, true);
  assert.equal(comfort.evidenceCount, 0);
});

test("legacy candidates without pool or provenance remain usable as open-web links", async () => {
  const legacy = await openLegacyDatabase();
  const transaction = legacy.transaction("candidates", "readwrite");
  transaction.objectStore("candidates").put({
    id: "legacy-candidate",
    sourceId: "legacy-rss",
    sourceName: "Legacy RSS",
    topic: "Science",
    title: "An older saved candidate",
    url: "https://example.com/legacy",
    summary: "Saved before content pools existed.",
    author: null,
    publishedAt: null,
    discoveredAt: "2026-08-20T00:00:00.000Z",
    status: "available",
    articleId: null,
  });
  await transactionDone(transaction);
  legacy.close();

  const [candidate] = await listCandidateArticles();
  assert.equal(candidate.pool, "open_web");
  assert.equal(candidate.successBandMin, null);
  assert.equal(candidate.successBandMax, null);
  assert.equal(candidate.provenance, null);
});

function openLegacyDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("just-read", 9);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("words", { keyPath: "word" });
      request.result.createObjectStore("lexicalEvents", { keyPath: "id" });
      request.result.createObjectStore("candidates", { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

function deleteDatabase(name: string) {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error(`Database ${name} is blocked`));
  });
}
