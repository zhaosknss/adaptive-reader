import assert from "node:assert/strict";
import test from "node:test";
import "fake-indexeddb/auto";
import { beginReading, createArticle, getWordStates, listLexicalEvents, recordExposures, recordLookup } from "../lib/storage.ts";
import { observeParagraphExposures } from "../lib/visible-exposure.ts";

test.beforeEach(async () => {
  await deleteDatabase("just-read");
});

test("opening an article does not expose every word", async () => {
  const article = await createArticle("No eager exposure", "First paragraph words.\n\nUnseen ending vocabulary.");

  await beginReading(article);

  assert.deepEqual(await getWordStates(), []);
});

test("a visible paragraph records only its words", async () => {
  const article = await createArticle("Visible paragraph", "Visible words here.\n\nHidden vocabulary remains unseen.");
  await beginReading(article);

  await recordExposures(article.id, ["Visible", "words", "here"]);

  const states = await getWordStates();
  assert.deepEqual(states.map((state) => state.normalizedWord).sort(), ["here", "visible", "words"]);
  assert.ok(states.every((state) => state.seenCount === 1));
  const lexicalEvents = await listLexicalEvents(article.id);
  assert.deepEqual(lexicalEvents.map((event) => event.type), ["exposure", "exposure", "exposure"]);
});

test("the same article and word is exposed only once", async () => {
  const article = await createArticle("Deduplicated", "Repeat repeat repeat.");

  await recordExposures(article.id, ["Repeat", "repeat", "REPEAT"]);
  await recordExposures(article.id, ["repeat"]);

  const states = await getWordStates();
  assert.equal(states.length, 1);
  assert.equal(states[0].normalizedWord, "repeat");
  assert.equal(states[0].seenCount, 1);
});

test("reopening an article does not repeat an existing exposure", async () => {
  const article = await createArticle("Reopen", "Already seen once.");

  await beginReading(article);
  await recordExposures(article.id, ["already", "seen", "once"]);
  await beginReading(article);
  await recordExposures(article.id, ["already", "seen", "once"]);

  const states = await getWordStates();
  assert.equal(states.length, 3);
  assert.ok(states.every((state) => state.seenCount === 1));
});

test("concurrent exposure calls still count the same article and word once", async () => {
  const article = await createArticle("Concurrent", "The same word appears here.");

  await Promise.all([
    recordExposures(article.id, ["same"]),
    recordExposures(article.id, ["SAME"]),
  ]);

  const states = await getWordStates();
  assert.equal(states.length, 1);
  assert.equal(states[0].normalizedWord, "same");
  assert.equal(states[0].seenCount, 1);
});

test("paragraph tracking waits for intersection and records each element once", async () => {
  const first = { textContent: "Visible words" } as Element;
  const second = { textContent: "Later paragraph" } as Element;
  const calls: Array<{ articleId: string; words: readonly string[] }> = [];
  let callback: IntersectionObserverCallback | undefined;
  const observed = new Set<Element>();
  let observerOptions: IntersectionObserverInit | undefined;

  const stop = observeParagraphExposures("article-1", [first, second], {
    createObserver(nextCallback, options) {
      callback = nextCallback;
      observerOptions = options;
      return {
        observe(element) { observed.add(element); },
        unobserve(element) { observed.delete(element); },
        disconnect() { observed.clear(); },
      };
    },
    async record(articleId, words) {
      calls.push({ articleId, words });
      return [];
    },
    visibilityDelayMs: 10,
    documentRef: null,
  });

  assert.equal(observed.size, 2);
  assert.equal(observerOptions?.threshold, 0.2);
  callback?.([intersection(first, false)] as IntersectionObserverEntry[], {} as IntersectionObserver);
  await flushTimers(15);
  assert.equal(calls.length, 0);

  callback?.([intersection(first, true, 0.05)] as IntersectionObserverEntry[], {} as IntersectionObserver);
  await flushTimers(15);
  assert.equal(calls.length, 0);

  callback?.([intersection(first, true, 0.5)] as IntersectionObserverEntry[], {} as IntersectionObserver);
  await flushTimers(15);
  assert.deepEqual(calls, [{ articleId: "article-1", words: ["visible", "words"] }]);

  callback?.([intersection(first, true, 0.5)] as IntersectionObserverEntry[], {} as IntersectionObserver);
  await flushTimers(15);
  assert.equal(calls.length, 1);
  assert.equal(observed.has(first), false);
  assert.equal(observed.has(second), true);

  stop();
  assert.equal(observed.size, 0);
});

test("a paragraph hidden before the dwell time is not exposed", async () => {
  const paragraph = { textContent: "Not visible long enough" } as Element;
  const calls: string[][] = [];
  let callback: IntersectionObserverCallback | undefined;

  observeParagraphExposures("article-hidden", [paragraph], {
    createObserver(nextCallback) {
      callback = nextCallback;
      return { observe() {}, unobserve() {}, disconnect() {} };
    },
    async record(_articleId, words) {
      calls.push([...words]);
      return [];
    },
    visibilityDelayMs: 20,
    documentRef: null,
  });

  callback?.([intersection(paragraph, true, 0.5)] as IntersectionObserverEntry[], {} as IntersectionObserver);
  await flushTimers(5);
  callback?.([intersection(paragraph, false, 0)] as IntersectionObserverEntry[], {} as IntersectionObserver);
  await flushTimers(25);
  assert.equal(calls.length, 0);
});

test("a background page waits until it is visible before exposing a paragraph", async () => {
  const paragraph = { textContent: "Visible after returning" } as Element;
  const visibility = fakeVisibilityDocument("hidden");
  const calls: string[][] = [];
  let callback: IntersectionObserverCallback | undefined;

  observeParagraphExposures("article-background", [paragraph], {
    createObserver(nextCallback) {
      callback = nextCallback;
      return { observe() {}, unobserve() {}, disconnect() {} };
    },
    async record(_articleId, words) {
      calls.push([...words]);
      return [];
    },
    visibilityDelayMs: 5,
    documentRef: visibility.document,
  });

  callback?.([intersection(paragraph, true, 0.5)] as IntersectionObserverEntry[], {} as IntersectionObserver);
  await flushTimers(10);
  assert.equal(calls.length, 0);
  visibility.show();
  await flushTimers(10);
  assert.equal(calls.length, 1);
});

test("failed and repeated lookups remain events but only one successful lookup changes familiarity", async () => {
  const article = await createArticle("Lookup evidence", "A contextual word appears here.");
  const failed = await recordLookup(article.id, "contextual", {
    contextHash: "ctx-one",
    dictionarySucceeded: false,
  });
  const firstSuccess = await recordLookup(article.id, "contextual", {
    contextHash: "ctx-one",
    dictionarySucceeded: true,
  });
  const repeatedSuccess = await recordLookup(article.id, "contextual", {
    contextHash: "ctx-one",
    dictionarySucceeded: true,
  });

  assert.equal(firstSuccess.familiarity < failed.familiarity, true);
  assert.equal(repeatedSuccess.familiarity, firstSuccess.familiarity);
  assert.equal(repeatedSuccess.lookupCount, 3);
  const events = await listLexicalEvents(article.id);
  assert.equal(events.filter((event) => event.dictionarySucceeded === false).length, 1);
  assert.equal(events.filter((event) => event.dictionarySucceeded === true).length, 2);
  assert.equal(events.filter((event) => event.evidenceApplied).length, 1);
});

function intersection(target: Element, isIntersecting: boolean, intersectionRatio = isIntersecting ? 1 : 0) {
  return { target, isIntersecting, intersectionRatio } as IntersectionObserverEntry;
}

function flushTimers(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function fakeVisibilityDocument(initial: "visible" | "hidden") {
  let visibilityState = initial;
  const listeners = new Set<EventListenerOrEventListenerObject>();
  const document = {
    get visibilityState() { return visibilityState; },
    addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
      if (type === "visibilitychange") listeners.add(listener);
    },
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject) {
      if (type === "visibilitychange") listeners.delete(listener);
    },
  } as Pick<Document, "visibilityState" | "addEventListener" | "removeEventListener">;
  return {
    document,
    show() {
      visibilityState = "visible";
      for (const listener of listeners) {
        if (typeof listener === "function") listener(new Event("visibilitychange"));
        else listener.handleEvent(new Event("visibilitychange"));
      }
    },
  };
}

function deleteDatabase(name: string) {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error(`Database ${name} is blocked`));
  });
}
