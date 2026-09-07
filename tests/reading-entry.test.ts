import assert from "node:assert/strict";
import test from "node:test";
import { selectSavedReadingArticle, unreadCandidates } from "../lib/reading-entry.ts";
import type { Article, ArticleStatus, CandidateArticle } from "../lib/types.ts";

test("reading entry continues an in-progress article before an unread one", () => {
  const unread = article("unread", "unread");
  const reading = article("reading", "reading");

  assert.equal(selectSavedReadingArticle([unread, reading])?.id, reading.id);
});

test("reading entry opens an unread saved article when nothing is in progress", () => {
  const unread = article("unread", "unread");

  assert.equal(selectSavedReadingArticle([article("finished", "finished"), unread])?.id, unread.id);
});

test("reading entry ignores finished and skipped history", () => {
  assert.equal(selectSavedReadingArticle([
    article("finished", "finished"),
    article("skipped", "skipped"),
  ]), undefined);
});

test("finished and skipped candidate articles are not recommended again", () => {
  const candidates = [candidate("fresh", null), candidate("done", "finished"), candidate("passed", "skipped")];
  const articles = [article("finished", "finished"), article("skipped", "skipped")];

  assert.deepEqual(unreadCandidates(candidates, articles).map((item) => item.id), ["fresh"]);
});

function article(id: string, status: ArticleStatus): Article {
  return {
    id,
    title: id,
    content: "A complete English article used to test the direct reading entry.",
    sourceUrl: null,
    createdAt: "2026-08-29T00:00:00.000Z",
    startedAt: status === "reading" || status === "finished" ? "2026-08-29T00:00:00.000Z" : null,
    finishedAt: status === "finished" ? "2026-08-29T00:10:00.000Z" : null,
    status,
    estimatedDifficulty: null,
    userDifficultyFeedback: null,
    attribution: null,
  };
}

function candidate(id: string, articleId: string | null): CandidateArticle {
  return {
    id,
    sourceId: "source",
    sourceName: "Source",
    topic: "Stories",
    title: id,
    url: `https://example.com/${id}`,
    summary: "A short story.",
    author: null,
    publishedAt: null,
    discoveredAt: "2026-09-02T00:00:00.000Z",
    status: "available",
    articleId,
    pool: "open_web",
    successBandMin: null,
    successBandMax: null,
    provenance: null,
  };
}
