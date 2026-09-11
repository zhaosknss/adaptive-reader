import assert from "node:assert/strict";
import test from "node:test";
import { selectCandidateByFullText } from "../lib/article-selection.ts";
import { builtinReadingCandidates } from "../lib/builtin-readings.ts";
import { filterCandidatesForReadingStage } from "../lib/content-pools.ts";
import { rankColdStartCandidates } from "../lib/feed-ranking.ts";
import { initialReadingComfortProfile } from "../lib/reading-comfort.ts";
import { fetchReusableContentCandidates } from "../lib/reusable-content-sources.ts";
import type { Article, CandidateArticle, VocabularyProfile } from "../lib/types.ts";

test("CASE A: a simple RSS summary cannot send a 1500-word complex article to a band 0 reader", async () => {
  const profile: VocabularyProfile = {
    id: "current",
    estimatedBand: 0,
    frequencyThreshold: 0.9,
    confidence: 1,
    assessedAt: "2026-09-02T00:00:00.000Z",
    assessmentVersion: 1,
  };
  const comfort = initialReadingComfortProfile(profile);
  const misleading = candidate("misleading-long", "2026-09-02T09:00:00.000Z");
  const genuinelySimple = candidate("genuinely-simple", "2026-09-01T09:00:00.000Z");
  const ranked = rankColdStartCandidates(
    [misleading, genuinelySimple],
    profile,
    new Date("2026-09-02T10:00:00.000Z"),
    null,
    null,
    comfort,
  );

  assert.equal(ranked[0].candidate.id, misleading.id);
  const selected = await selectCandidateByFullText(ranked, profile, [], comfort, {
    async inspect(item) {
      return {
        title: item.title,
        content: item.id === misleading.id ? complexLongArticle() : simpleArticle(),
        sourceUrl: item.url,
        existingArticle: null,
      };
    },
    async materialize(item, draft) {
      return article(item.id, draft.content);
    },
    async saveDifficulty() {},
  });

  assert.equal(selected.rankedCandidate.candidate.id, genuinelySimple.id);
  assert.equal(selected.difficulty.metrics.wordCount, 120);
  assert.ok(selected.difficulty.metrics.sentenceLengthP90 <= 6);
  assert.ok(selected.comfortAssessment.hardMaximumWords <= 180);
});

test("a bounded local fallback keeps next-article working when the metadata top five are unsuitable", async () => {
  const profile: VocabularyProfile = {
    id: "current",
    estimatedBand: 0,
    frequencyThreshold: 0.9,
    confidence: 1,
    assessedAt: "2026-09-02T00:00:00.000Z",
    assessmentVersion: 1,
  };
  const comfort = initialReadingComfortProfile(profile);
  const candidates = Array.from({ length: 6 }, (_, index) => candidate(`rank-${index + 1}`, `2026-09-0${2 - Math.min(index, 1)}T09:00:00.000Z`));
  const ranked = rankColdStartCandidates(candidates, profile, new Date("2026-09-02T10:00:00.000Z"), null, null, comfort);
  ranked[5] = {
    ...ranked[5],
    candidate: { ...ranked[5].candidate, contentId: "who-has-seen-the-wind" },
  };

  const inspected: string[] = [];
  const selected = await selectCandidateByFullText(ranked, profile, [], comfort, {
    async inspect(item) {
      inspected.push(item.id);
      return {
        title: item.title,
        content: item.contentId ? simpleArticle() : complexLongArticle(),
        sourceUrl: item.url,
        existingArticle: null,
      };
    },
    async materialize(item, draft) {
      return article(item.id, draft.content);
    },
    async saveDifficulty() {},
  });

  assert.equal(inspected.length, 6);
  assert.equal(selected.rankedCandidate.candidate.contentId, "who-has-seen-the-wind");
  assert.equal(selected.originalRank, 6);
});

test("success phase does not admit a much higher declared reading level even when its raw score looks easy", async () => {
  const profile: VocabularyProfile = {
    id: "current",
    estimatedBand: 0,
    frequencyThreshold: 0.9,
    confidence: 1,
    assessedAt: "2026-09-02T00:00:00.000Z",
    assessmentVersion: 1,
  };
  const comfort = initialReadingComfortProfile(profile);
  const highLevel = { ...candidate("archaic-essay", "2026-09-02T09:00:00.000Z"), readingLevel: 4 };
  const beginner = { ...candidate("beginner-story", "2026-09-01T09:00:00.000Z"), readingLevel: 0 };
  const ranked = rankColdStartCandidates([highLevel, beginner], profile, new Date("2026-09-02T10:00:00.000Z"), null, null, comfort);

  const selected = await selectCandidateByFullText(ranked, profile, [], comfort, {
    async inspect(item) {
      return { title: item.title, content: simpleArticle(), sourceUrl: item.url, existingArticle: null };
    },
    async materialize(item, draft) {
      return article(item.id, draft.content);
    },
    async saveDifficulty() {},
  });

  assert.equal(selected.rankedCandidate.candidate.id, beginner.id);
});

test("success phase preserves ranking when acceptable articles have nearly equal comfort", async () => {
  const profile: VocabularyProfile = {
    id: "current",
    estimatedBand: 0,
    frequencyThreshold: 0.9,
    confidence: 1,
    assessedAt: "2026-09-02T00:00:00.000Z",
    assessmentVersion: 1,
  };
  const comfort = initialReadingComfortProfile(profile);
  const preferredStory = { ...candidate("preferred-story", "2026-09-02T09:00:00.000Z"), readingLevel: 0 };
  const slightlyEasierArticle = { ...candidate("slightly-easier", "2026-09-01T09:00:00.000Z"), readingLevel: 0 };
  const ranked = rankColdStartCandidates(
    [preferredStory, slightlyEasierArticle],
    profile,
    new Date("2026-09-02T10:00:00.000Z"),
    null,
    null,
    comfort,
  );

  const selected = await selectCandidateByFullText(ranked, profile, [], comfort, {
    async inspect(item) {
      const repeats = item.id === preferredStory.id ? 18 : 16;
      return {
        title: item.title,
        content: Array.from({ length: repeats }, () => "The child sees the small bird.").join(" "),
        sourceUrl: item.url,
        existingArticle: null,
      };
    },
    async materialize(item, draft) {
      return article(item.id, draft.content);
    },
    async saveDifficulty() {},
  });

  assert.equal(ranked[0].candidate.id, preferredStory.id);
  assert.equal(selected.rankedCandidate.candidate.id, preferredStory.id);
});

test("a fresh band 0 reader can select ten different success items without exhausting the pool", async () => {
  const profile: VocabularyProfile = {
    id: "current",
    estimatedBand: 0,
    frequencyThreshold: 0.9,
    confidence: 1,
    assessedAt: "2026-09-03T00:00:00.000Z",
    assessmentVersion: 1,
  };
  const comfort = initialReadingComfortProfile(profile);
  let remaining = Array.from({ length: 12 }, (_, index) => ({
    ...candidate(`success-${index + 1}`, `2026-09-${String(index + 1).padStart(2, "0")}T09:00:00.000Z`),
    pool: "success" as const,
    successBandMin: 0,
    successBandMax: 1,
    contentSnapshot: simpleArticle(),
    readingLevel: 0,
  }));
  const selectedIds = new Set<string>();

  for (let turn = 0; turn < 10; turn += 1) {
    const ranked = rankColdStartCandidates(remaining, profile, new Date("2026-09-20T00:00:00.000Z"), null, null, comfort);
    const selected = await selectCandidateByFullText(ranked, profile, [], comfort, {
      async inspect(item) {
        return { title: item.title, content: item.contentSnapshot ?? "", sourceUrl: item.url, existingArticle: null };
      },
      async materialize(item, draft) {
        return article(item.id, draft.content);
      },
      async saveDifficulty() {},
    });
    selectedIds.add(selected.rankedCandidate.candidate.id);
    remaining = remaining.filter((item) => item.id !== selected.rankedCandidate.candidate.id);
  }

  assert.equal(selectedIds.size, 10);
  assert.equal(remaining.length, 2);
});

test("a fresh band 0 reader can complete ten real reusable reads without exhausting Success Pool", async () => {
  const profile: VocabularyProfile = {
    id: "current",
    estimatedBand: 0,
    frequencyThreshold: 0.9,
    confidence: 1,
    assessedAt: "2026-09-03T00:00:00.000Z",
    assessmentVersion: 1,
  };
  const comfort = initialReadingComfortProfile(profile);
  const reusable = await fetchReusableContentCandidates(
    "2026-09-03T00:00:00.000Z",
    async () => { throw new Error("offline"); },
  );
  let remaining = filterCandidatesForReadingStage(reusable.candidates, profile, comfort);
  const selectedTitles: string[] = [];

  for (let turn = 0; turn < 10; turn += 1) {
    const ranked = rankColdStartCandidates(remaining, profile, new Date("2026-09-03T00:00:00.000Z"), null, null, comfort);
    const selected = await selectCandidateByFullText(ranked, profile, [], comfort, {
      async inspect(item) {
        return { title: item.title, content: item.contentSnapshot ?? "", sourceUrl: item.url, existingArticle: null };
      },
      async materialize(item, draft) {
        return article(item.id, draft.content);
      },
      async saveDifficulty() {},
    });
    selectedTitles.push(selected.rankedCandidate.candidate.title);
    remaining = remaining.filter((item) => item.id !== selected.rankedCandidate.candidate.id);
  }

  assert.equal(new Set(selectedTitles).size, 10);
  assert.ok(remaining.length >= 20);
});

test("a fresh band 0 slate surfaces authentic literature without relaxing the comfort gate", async () => {
  const profile: VocabularyProfile = {
    id: "current",
    estimatedBand: 0,
    frequencyThreshold: 0.9,
    confidence: 1,
    assessedAt: "2026-09-12T00:00:00.000Z",
    assessmentVersion: 1,
  };
  const comfort = initialReadingComfortProfile(profile);
  const reusable = await fetchReusableContentCandidates(
    "2026-09-12T00:00:00.000Z",
    async () => { throw new Error("offline"); },
  );
  let remaining = filterCandidatesForReadingStage([
    ...builtinReadingCandidates("2026-09-12T00:00:00.000Z"),
    ...reusable.candidates,
  ], profile, comfort);
  const selectedContentIds: Array<string | null | undefined> = [];

  for (let turn = 0; turn < 3; turn += 1) {
    const ranked = rankColdStartCandidates(remaining, profile, new Date("2026-09-12T00:00:00.000Z"), null, null, comfort);
    const selected = await selectCandidateByFullText(ranked, profile, [], comfort, {
      async inspect(item) {
        return { title: item.title, content: item.contentSnapshot ?? "", sourceUrl: item.url, existingArticle: null };
      },
      async materialize(item, draft) {
        return article(item.id, draft.content);
      },
      async saveDifficulty() {},
    });
    selectedContentIds.push(selected.rankedCandidate.candidate.contentId);
    remaining = remaining.filter((item) => item.id !== selected.rankedCandidate.candidate.id);
  }

  assert.ok(selectedContentIds.some(Boolean));
});

function candidate(id: string, publishedAt: string): CandidateArticle {
  return {
    id,
    sourceId: "example-feed",
    sourceName: "Example Feed",
    topic: "Technology",
    title: "A small and clear idea",
    url: `https://example.com/${id}`,
    summary: Array.from({ length: 40 }, () => "simple").join(" "),
    author: null,
    publishedAt,
    discoveredAt: publishedAt,
    status: "available",
    articleId: null,
    pool: "open_web",
    successBandMin: null,
    successBandMax: null,
    provenance: null,
  };
}

function article(id: string, content: string): Article {
  return {
    id: `article-${id}`,
    title: id,
    content,
    sourceUrl: `https://example.com/${id}`,
    createdAt: "2026-09-02T00:00:00.000Z",
    startedAt: null,
    finishedAt: null,
    status: "unread",
    estimatedDifficulty: null,
    userDifficultyFeedback: null,
    attribution: null,
  };
}

function simpleArticle() {
  return Array.from({ length: 20 }, () => "The child sees the small bird.").join(" ");
}

function complexLongArticle() {
  const sentence = "Although the system appears simple, which many observers initially believed, it contains several layers, clauses, and interruptions; therefore the explanation continues while the reader tries to remember what came before.";
  return Array.from({ length: 50 }, () => sentence).join(" ");
}
