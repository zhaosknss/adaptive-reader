import assert from "node:assert/strict";
import test from "node:test";
import "fake-indexeddb/auto";
import { prepareCandidateArticle } from "../lib/candidate-import.ts";
import { builtinReadingCandidates, getBuiltinReading } from "../lib/builtin-readings.ts";
import { createArticle, listArticles, listCandidateArticles, upsertCandidateArticles } from "../lib/storage.ts";
import type { CandidateArticle } from "../lib/types.ts";

const originalFetch = globalThis.fetch;

test.beforeEach(async () => {
  await deleteDatabase("just-read");
  globalThis.fetch = originalFetch;
});

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("a newly imported candidate links source attribution to its article", async () => {
  const item = candidate("candidate-new");
  await upsertCandidateArticles([item]);
  globalThis.fetch = extractionFetch(item.url);

  const article = await prepareCandidateArticle(item);

  assert.deepEqual(article.attribution, attribution(item));
  const savedCandidate = (await listCandidateArticles())[0];
  assert.equal(savedCandidate.status, "imported");
  assert.equal(savedCandidate.articleId, article.id);
});

test("a candidate enriches an article that was already imported by URL", async () => {
  const item = candidate("candidate-existing");
  const manualArticle = await createArticle("Already saved", "An existing article with enough text.", item.url);
  await upsertCandidateArticles([item]);
  globalThis.fetch = async () => { throw new Error("fetch should not run for an existing URL"); };

  const linkedArticle = await prepareCandidateArticle(item);

  assert.equal(linkedArticle.id, manualArticle.id);
  assert.deepEqual(linkedArticle.attribution, attribution(item));
  assert.equal((await listCandidateArticles())[0].articleId, manualArticle.id);
});

test("repeated candidate imports reuse one article and preserve the link", async () => {
  const item = candidate("candidate-repeat");
  await upsertCandidateArticles([item]);
  globalThis.fetch = extractionFetch("https://example.com/final-redirect-url");
  const first = await prepareCandidateArticle(item);

  globalThis.fetch = async () => { throw new Error("the second import should reuse the saved article"); };
  const second = await prepareCandidateArticle(item);

  assert.equal(second.id, first.id);
  assert.equal((await listArticles()).length, 1);
  const savedCandidate = (await listCandidateArticles())[0];
  assert.equal(savedCandidate.status, "imported");
  assert.equal(savedCandidate.articleId, first.id);
});

test("a persisted candidate articleId is resolved before attribution or fetch", async () => {
  const item = candidate("candidate-persisted-link");
  const manualArticle = await createArticle("Already linked", "A saved article can predate its attribution.", item.url);
  await upsertCandidateArticles([{ ...item, status: "imported", articleId: manualArticle.id }]);
  globalThis.fetch = async () => { throw new Error("a valid persisted link must not fetch"); };

  const linkedArticle = await prepareCandidateArticle(item);

  assert.equal(linkedArticle.id, manualArticle.id);
  assert.deepEqual(linkedArticle.attribution, attribution(item));
  assert.equal((await listArticles()).length, 1);
});

test("canonical URL variants reuse an existing article", async () => {
  const item = { ...candidate("candidate-canonical-url"), url: "https://example.com/Story" };
  const manualArticle = await createArticle(
    "Canonical URL",
    "Fragments and host casing should not create duplicate saved articles.",
    "https://EXAMPLE.com/Story#reading-position",
  );
  await upsertCandidateArticles([item]);
  globalThis.fetch = async () => { throw new Error("a canonical URL match must not fetch"); };

  const linkedArticle = await prepareCandidateArticle(item);

  assert.equal(linkedArticle.id, manualArticle.id);
  assert.equal((await listArticles()).length, 1);
});

test("two candidates can share one article without replacing its first attribution", async () => {
  const firstCandidate = candidate("candidate-primary-source");
  const secondCandidate = {
    ...candidate("candidate-secondary-source"),
    sourceId: "second-source",
    sourceName: "Second Source",
    topic: "Culture",
    url: firstCandidate.url,
  };
  await upsertCandidateArticles([firstCandidate, secondCandidate]);
  globalThis.fetch = extractionFetch(firstCandidate.url);
  const firstArticle = await prepareCandidateArticle(firstCandidate);

  globalThis.fetch = async () => { throw new Error("the shared URL must reuse the first article"); };
  const secondArticle = await prepareCandidateArticle(secondCandidate);

  assert.equal(secondArticle.id, firstArticle.id);
  assert.deepEqual(secondArticle.attribution, attribution(firstCandidate));
  const savedCandidates = await listCandidateArticles();
  assert.equal(savedCandidates.find((item) => item.id === firstCandidate.id)?.articleId, firstArticle.id);
  assert.equal(savedCandidates.find((item) => item.id === secondCandidate.id)?.articleId, firstArticle.id);
});

test("feed refreshes keep an existing candidate/article link", async () => {
  const item = candidate("candidate-refresh");
  await upsertCandidateArticles([item]);
  globalThis.fetch = extractionFetch(item.url);
  const article = await prepareCandidateArticle(item);

  await upsertCandidateArticles([{ ...item, summary: "A fresher summary.", status: "available", articleId: null }]);

  const refreshed = (await listCandidateArticles())[0];
  assert.equal(refreshed.summary, "A fresher summary.");
  assert.equal(refreshed.status, "imported");
  assert.equal(refreshed.articleId, article.id);
});

test("legacy-style manual articles remain valid without attribution", async () => {
  const article = await createArticle("Manual", "A manually pasted article remains fully readable.");

  assert.equal(article.attribution, null);
  assert.equal((await listArticles())[0].attribution, null);
});

test("built-in readings import their full text without a network request", async () => {
  const item = builtinReadingCandidates("2026-08-31T00:00:00.000Z")
    .find((candidate) => candidate.contentId === "the-lion-and-the-mouse");
  assert.ok(item);
  await upsertCandidateArticles([item]);
  globalThis.fetch = async () => { throw new Error("built-in content must not fetch"); };

  const article = await prepareCandidateArticle(item);
  const reading = getBuiltinReading(item.contentId);

  assert.equal(article.content, reading?.content);
  assert.equal(article.title, reading?.title);
  assert.equal(article.attribution?.topic, "Fables");
  assert.equal((await listCandidateArticles())[0].contentId, "the-lion-and-the-mouse");
});

function candidate(id: string): CandidateArticle {
  return {
    id,
    sourceId: "example-source",
    sourceName: "Example Source",
    topic: "Science",
    title: "A candidate article",
    url: `https://example.com/${id}`,
    summary: "A concise summary for the candidate article.",
    author: "Example Author",
    publishedAt: "2026-08-28T12:00:00.000Z",
    discoveredAt: "2026-08-29T00:00:00.000Z",
    status: "available",
    articleId: null,
  };
}

function attribution(item: CandidateArticle) {
  return {
    candidateId: item.id,
    sourceId: item.sourceId,
    sourceName: item.sourceName,
    topic: item.topic,
    author: item.author,
    publishedAt: item.publishedAt,
  };
}

function extractionFetch(sourceUrl: string): typeof fetch {
  return async () => new Response(JSON.stringify({
    title: "Extracted candidate article",
    content: "This extracted article contains enough clean English text for a realistic reader test.",
    site: "Example Source",
    sourceUrl,
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
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
