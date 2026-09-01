import assert from "node:assert/strict";
import test from "node:test";
import "fake-indexeddb/auto";
import { getWordStates, listLexicalEvents } from "../lib/storage.ts";

test.beforeEach(async () => {
  await deleteDatabase("just-read");
});

test("version 8 word data survives the lexical-event store upgrade", async () => {
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
});

function openLegacyDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("just-read", 8);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("words", { keyPath: "word" });
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
