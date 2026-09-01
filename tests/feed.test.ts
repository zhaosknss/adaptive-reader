import assert from "node:assert/strict";
import test from "node:test";
import { parseFeed } from "../lib/feed.ts";
import { rankColdStartCandidates } from "../lib/feed-ranking.ts";
import { BUILTIN_READINGS, builtinReadingCandidates } from "../lib/builtin-readings.ts";
import type { CandidateArticle, ContentSourceDefinition } from "../lib/types.ts";

const source: ContentSourceDefinition = {
  id: "example",
  name: "Example",
  topic: "Science",
  feedUrl: "https://example.com/feed.xml",
  siteUrl: "https://example.com/",
};

test("RSS parsing keeps only lightweight candidate metadata", () => {
  const candidates = parseFeed(`<?xml version="1.0"?><rss><channel><item>
    <title>A useful discovery</title><link>https://example.com/story</link>
    <description><![CDATA[<p>A short <strong>English</strong> summary.</p>]]></description>
    <pubDate>Tue, 25 Aug 2026 10:00:00 GMT</pubDate>
  </item></channel></rss>`, source, "2026-08-26T00:00:00.000Z");

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].title, "A useful discovery");
  assert.equal(candidates[0].summary, "A short English summary.");
  assert.equal(candidates[0].status, "available");
  assert.equal(candidates[0].url, "https://example.com/story");
});

test("Atom parsing resolves alternate links and relative URLs", () => {
  const candidates = parseFeed(`<?xml version="1.0"?><feed><entry>
    <title>Thinking clearly</title><link rel="alternate" href="/thinking" />
    <summary>Ideas for careful readers.</summary><updated>2026-08-25T12:00:00Z</updated>
  </entry></feed>`, source, "2026-08-26T00:00:00.000Z");

  assert.equal(candidates[0].url, "https://example.com/thinking");
  assert.equal(candidates[0].publishedAt, "2026-08-25T12:00:00.000Z");
});

test("cold-start ranking filters dismissed items and adds source diversity", () => {
  const candidates: CandidateArticle[] = [
    candidate("a1", "source-a", "Science", "2026-08-26T00:00:00.000Z"),
    candidate("a2", "source-a", "Science", "2026-08-25T00:00:00.000Z"),
    candidate("b1", "source-b", "History", "2026-08-24T00:00:00.000Z"),
    { ...candidate("hidden", "source-c", "Culture", "2026-08-26T00:00:00.000Z"), status: "dismissed" },
  ];
  const ranked = rankColdStartCandidates(candidates, null, new Date("2026-08-26T12:00:00.000Z"));

  assert.equal(ranked.length, 3);
  assert.notEqual(ranked[0].candidate.sourceId, ranked[1].candidate.sourceId);
  assert.ok(ranked.every((item) => item.score >= 0 && item.score <= 1));
});

test("built-in library covers literary forms and multiple reading levels", () => {
  const topics = new Set(BUILTIN_READINGS.map((reading) => reading.topic));
  assert.deepEqual(
    [...topics].sort(),
    ["Fairy Tales", "Fables", "Greek Mythology", "Literary Prose", "Poetry", "Short Stories"].sort(),
  );
  assert.ok(BUILTIN_READINGS.filter((reading) => reading.readingLevel <= 1).length >= 5);
  assert.ok(BUILTIN_READINGS.some((reading) => reading.readingLevel >= 4));
});

test("lower vocabulary bands prefer genuinely shorter and easier built-in readings", () => {
  const candidates = builtinReadingCandidates("2026-08-31T00:00:00.000Z")
    .filter((item) => item.contentId === "rain-stevenson" || item.contentId === "on-going-a-journey-opening");
  const lowProfile = {
    id: "current" as const,
    estimatedBand: 0,
    frequencyThreshold: 0.4,
    confidence: 0.8,
    assessedAt: "2026-08-31T00:00:00.000Z",
    assessmentVersion: 1,
  };
  const highProfile = { ...lowProfile, estimatedBand: 4, frequencyThreshold: 0.82 };

  const lowRanked = rankColdStartCandidates(candidates, lowProfile, new Date("2026-08-31T12:00:00.000Z"));
  const highRanked = rankColdStartCandidates(candidates, highProfile, new Date("2026-08-31T12:00:00.000Z"));

  assert.equal(lowRanked[0].candidate.contentId, "rain-stevenson");
  assert.equal(highRanked[0].candidate.contentId, "on-going-a-journey-opening");
});

test("explicit content preference changes cold-start order without filtering other topics", () => {
  const candidates = [
    candidate("history", "source-history", "History", "2026-08-26T00:00:00.000Z"),
    candidate("poetry", "source-poetry", "Poetry", "2026-08-26T00:00:00.000Z"),
  ];
  const preferences = {
    id: "current" as const,
    mode: "guided" as const,
    primary: "poetry" as const,
    secondary: [],
    updatedAt: "2026-08-31T00:00:00.000Z",
  };

  const ranked = rankColdStartCandidates(candidates, null, new Date("2026-08-26T12:00:00.000Z"), null, preferences);

  assert.equal(ranked[0].candidate.topic, "Poetry");
  assert.equal(ranked.length, 2);
});

function candidate(id: string, sourceId: string, topic: string, publishedAt: string): CandidateArticle {
  return {
    id,
    sourceId,
    sourceName: sourceId,
    topic,
    title: "A clear story about people and ideas",
    url: `https://example.com/${id}`,
    summary: "This article explains an interesting idea in a direct and readable way.",
    author: null,
    publishedAt,
    discoveredAt: "2026-08-26T12:00:00.000Z",
    status: "available",
    articleId: null,
  };
}
