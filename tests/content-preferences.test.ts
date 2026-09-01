import assert from "node:assert/strict";
import test from "node:test";
import "fake-indexeddb/auto";
import {
  combineInterestWithPreferences,
  contentPreferenceScore,
  emptyContentPreferences,
  normalizeContentPreferences,
  preferenceKeyForTopic,
} from "../lib/content-preferences.ts";
import { getContentPreferences, saveContentPreferences } from "../lib/storage.ts";
import type { CandidateArticle, ContentPreferences, InterestProfile } from "../lib/types.ts";

test.beforeEach(async () => {
  await deleteDatabase("just-read");
});

test("content preferences default to open exploration and persist locally", async () => {
  assert.deepEqual(await getContentPreferences(), emptyContentPreferences());

  const saved = await saveContentPreferences({
    id: "current",
    mode: "guided",
    primary: "poetry",
    secondary: ["fables", "greek_mythology"],
    updatedAt: null,
  });

  assert.equal(saved.mode, "guided");
  assert.equal(saved.primary, "poetry");
  assert.deepEqual((await getContentPreferences()).secondary, ["fables", "greek_mythology"]);
  assert.ok(saved.updatedAt);
});

test("normalization removes invalid and duplicate secondary choices", () => {
  const normalized = normalizeContentPreferences({
    mode: "guided",
    primary: "poetry",
    secondary: ["poetry", "fables", "fables", "not-real" as "fables"],
  });

  assert.deepEqual(normalized.secondary, ["fables"]);
});

test("topic families share an explicit preference and never become a hard filter", () => {
  const preferences = guidedPreferences();
  assert.equal(preferenceKeyForTopic("Technology"), "science_technology");
  assert.equal(preferenceKeyForTopic("Science"), "science_technology");
  assert.equal(contentPreferenceScore(candidate("Poetry"), preferences), 0.86);
  assert.equal(contentPreferenceScore(candidate("Fables"), preferences), 0.68);
  assert.ok(contentPreferenceScore(candidate("History"), preferences) > 0);
});

test("explicit preference is strongest at cold start and learned behavior can overtake it", () => {
  const preferences = guidedPreferences();
  const coldPoetry = combineInterestWithPreferences(0.5, 0.86, null, preferences);
  const coldTechnology = combineInterestWithPreferences(0.5, 0.44, null, preferences);
  assert.ok(coldPoetry > coldTechnology);

  const learnedProfile: InterestProfile = {
    id: "current",
    source: {},
    topic: {},
    keyword: {},
    evidenceCount: 20,
    processedRecommendationEventIds: [],
    updatedAt: "2026-08-31T00:00:00.000Z",
    modelVersion: 1,
  };
  const learnedTechnology = combineInterestWithPreferences(0.9, 0.44, learnedProfile, preferences);
  const learnedPoetry = combineInterestWithPreferences(0.5, 0.86, learnedProfile, preferences);
  assert.ok(learnedTechnology > learnedPoetry);
});

function guidedPreferences(): ContentPreferences {
  return {
    id: "current",
    mode: "guided",
    primary: "poetry",
    secondary: ["fables"],
    updatedAt: "2026-08-31T00:00:00.000Z",
  };
}

function candidate(topic: string): CandidateArticle {
  return {
    id: `candidate-${topic}`,
    sourceId: "source",
    sourceName: "Source",
    topic,
    title: "A short readable text",
    url: `https://example.com/${topic}`,
    summary: "A short readable text for testing preferences.",
    author: null,
    publishedAt: null,
    discoveredAt: "2026-08-31T00:00:00.000Z",
    status: "available",
    articleId: null,
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
