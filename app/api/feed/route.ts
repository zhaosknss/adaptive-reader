import { STARTER_SOURCES } from "@/lib/content-sources";
import { parseFeed } from "@/lib/feed";
import type { CandidateArticle, ContentSourceDefinition } from "@/lib/types";

const MAX_FEED_BYTES = 1_500_000;
const ITEMS_PER_SOURCE = 8;

export async function GET() {
  const discoveredAt = new Date().toISOString();
  const results = await Promise.allSettled(
    STARTER_SOURCES.map((source) => fetchSource(source, discoveredAt)),
  );
  const candidates = deduplicate(
    results.flatMap((result) => result.status === "fulfilled" ? result.value : []),
  ).sort((left, right) => (right.publishedAt ?? right.discoveredAt).localeCompare(left.publishedAt ?? left.discoveredAt));
  const failedSourceCount = results.filter((result) => result.status === "rejected").length;

  return Response.json(
    { candidates, failedSourceCount, sourceCount: STARTER_SOURCES.length },
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
}

async function fetchSource(source: ContentSourceDefinition, discoveredAt: string) {
  const response = await fetch(source.feedUrl, {
    headers: {
      Accept: "application/atom+xml, application/rss+xml, application/xml, text/xml;q=0.9",
      "User-Agent": "JustRead/0.1 (+local personal reading app)",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`${source.id} returned ${response.status}`);
  const length = Number(response.headers.get("content-length") ?? 0);
  if (length > MAX_FEED_BYTES) throw new Error(`${source.id} feed is too large`);
  const xml = await response.text();
  if (new TextEncoder().encode(xml).byteLength > MAX_FEED_BYTES) throw new Error(`${source.id} feed is too large`);
  return parseFeed(xml, source, discoveredAt).slice(0, ITEMS_PER_SOURCE);
}

function deduplicate(candidates: readonly CandidateArticle[]) {
  const urls = new Set<string>();
  return candidates.filter((candidate) => {
    if (urls.has(candidate.url)) return false;
    urls.add(candidate.url);
    return true;
  });
}
