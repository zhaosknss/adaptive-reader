import assert from "node:assert/strict";
import test from "node:test";
import { estimateDifficulty } from "../lib/difficulty.ts";
import { assessArticleComfort, initialReadingComfortProfile } from "../lib/reading-comfort.ts";
import { fetchReusableContentCandidates, REUSABLE_CONTENT_TARGETS } from "../lib/reusable-content-sources.ts";
import type { VocabularyProfile } from "../lib/types.ts";

test("the configured reusable catalog is large enough to avoid an immediate band 0/1 dead end", () => {
  assert.ok(REUSABLE_CONTENT_TARGETS.simpleSuccess >= 30);
  assert.ok(REUSABLE_CONTENT_TARGETS.simpleSuccess + REUSABLE_CONTENT_TARGETS.simpleBridge >= 50);
});

test("Wikimedia candidates preserve license, original URL, transformation and pool provenance", async () => {
  const result = await fetchReusableContentCandidates("2026-09-03T08:00:00.000Z", fakeWikimediaFetch);

  assert.equal(result.failedSourceCount, 0);
  const success = result.candidates.find((candidate) => candidate.pool === "success");
  assert.ok(success);
  assert.equal(success.sourceId, "simple-wikipedia");
  assert.equal(success.provenance?.license, "CC BY-SA 4.0");
  assert.deepEqual(success.provenance?.transformations, ["excerpt", "cleaned"]);
  assert.match(success.provenance?.originalUrl ?? "", /^https:\/\/simple\.wikipedia\.org\/wiki\//);
  assert.ok(success.contentSnapshot?.includes("clear words"));

  const archivedNews = result.candidates.find((candidate) => candidate.sourceId === "wikinews");
  assert.ok(archivedNews);
  assert.equal(archivedNews.pool, "bridge");
  assert.equal(archivedNews.provenance?.license, "CC BY 4.0");
  assert.equal(archivedNews.provenance?.contentType, "news");
  assert.ok(archivedNews.provenance?.publishedAt?.startsWith("2026-04"));
  assert.equal(result.candidates.some((candidate) => candidate.title === "Old licensed story"), false);
});

async function fakeWikimediaFetch(input: string | URL | Request): Promise<Response> {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
  if (url.hostname === "simple.wikipedia.org") {
    const titles = (url.searchParams.get("titles") ?? "").split("|").filter(Boolean);
    const pages = titles.map((title) => ({
      pageid: stableNumber(`${title}:${url.searchParams.get("exsentences")}`),
      title,
      fullurl: `https://simple.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
      extract: `${title} is explained with clear words. People use this idea in daily life. It also has a wider history and meaning. This short text remains easy to follow for a reader.`,
    }));
    return Response.json({ query: { pages } });
  }

  const modernWords = Array.from({ length: 24 }, () => "People read a clear report about the event today.").join(" ");
  return Response.json({
    query: {
      pages: [
        {
          pageid: 901,
          title: "A current public-interest story",
          fullurl: "https://en.wikinews.org/wiki/A_current_public-interest_story",
          extract: modernWords,
          revisions: [{ timestamp: "2026-04-12T10:00:00.000Z", user: "Reporter" }],
        },
        {
          pageid: 902,
          title: "Old licensed story",
          fullurl: "https://en.wikinews.org/wiki/Old_licensed_story",
          extract: modernWords,
          revisions: [{ timestamp: "2024-12-15T10:00:00.000Z", user: "Reporter" }],
        },
      ],
    },
  });
}

test("checked-in Simple Wikipedia extracts remain available when the network is unavailable", async () => {
  const result = await fetchReusableContentCandidates(
    "2026-09-03T08:00:00.000Z",
    async () => { throw new Error("offline"); },
  );

  assert.equal(result.failedSourceCount, 3);
  assert.ok(result.candidates.filter((candidate) => candidate.pool === "success").length >= 30);
  assert.ok(result.candidates.filter((candidate) => candidate.pool !== "open_web").length >= 50);
  assert.ok(result.candidates.every((candidate) => candidate.contentSnapshot));
  assert.ok(result.candidates.every((candidate) => candidate.provenance?.license === "CC BY-SA 4.0"));
});

test("checked-in extracts provide thirty band 0 successes and fifty band 1 reachable reads after full-text checks", async () => {
  const result = await fetchReusableContentCandidates(
    "2026-09-03T08:00:00.000Z",
    async () => { throw new Error("offline"); },
  );
  const band0 = profile(0, 0.9);
  const band1 = profile(1, 0.75);
  const band0Comfort = initialReadingComfortProfile(band0);
  const band1Comfort = { ...initialReadingComfortProfile(band1), successPhase: false };
  const acceptable = (candidate: (typeof result.candidates)[number], user: VocabularyProfile, comfort: typeof band0Comfort) => {
    const difficulty = estimateDifficulty(candidate.contentSnapshot ?? "", [], undefined, user);
    return assessArticleComfort(difficulty, user, comfort).acceptable;
  };

  assert.ok(result.candidates.filter((candidate) => candidate.pool === "success" && acceptable(candidate, band0, band0Comfort)).length >= 30);
  assert.ok(result.candidates.filter((candidate) => candidate.pool !== "open_web" && acceptable(candidate, band1, band1Comfort)).length >= 50);
});

function profile(estimatedBand: number, frequencyThreshold: number): VocabularyProfile {
  return {
    id: "current",
    estimatedBand,
    frequencyThreshold,
    confidence: 1,
    assessedAt: "2026-09-03T00:00:00.000Z",
    assessmentVersion: 1,
  };
}

function stableNumber(value: string) {
  let total = 0;
  for (const character of value) total = (total * 31 + character.charCodeAt(0)) >>> 0;
  return total;
}
