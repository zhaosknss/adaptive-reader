import assert from "node:assert/strict";
import test from "node:test";
import { parseFeed } from "../lib/feed.ts";
import { rankColdStartCandidates } from "../lib/feed-ranking.ts";
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
  };
}
