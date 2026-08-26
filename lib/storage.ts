import type { Article, DictionaryResult, DifficultyFeedback, ReadingEvent, ReadingEventType, VocabularyProfile, WordState } from "./types";
import { uniqueWords } from "./text";
import { familiarityAfterExposure, familiarityAfterLookup } from "./familiarity";
import { frequencyProvider } from "./frequency";

const DB_NAME = "just-read";
const DB_VERSION = 5;
const ARTICLES = "articles";
const WORDS = "words";
const DICTIONARY = "dictionary";
const EXPOSURES = "exposures";
const EVENTS = "events";
const VOCABULARY_PROFILE = "vocabularyProfile";

type WordExposure = {
  id: string;
  articleId: string;
  normalizedWord: string;
  seenAt: string;
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      const transaction = request.transaction;
      const migrationTime = new Date().toISOString();

      if (!db.objectStoreNames.contains(ARTICLES)) {
        const store = db.createObjectStore(ARTICLES, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt");
      } else if (transaction) {
        migrateStore(transaction.objectStore(ARTICLES), (value) => normalizeArticle(value as Partial<Article>));
      }

      if (!db.objectStoreNames.contains(WORDS)) {
        db.createObjectStore(WORDS, { keyPath: "word" });
      } else if (transaction) {
        migrateStore(transaction.objectStore(WORDS), (value) => reseedLegacyWordState(value as Partial<WordState>, migrationTime));
      }

      if (!db.objectStoreNames.contains(DICTIONARY)) {
        db.createObjectStore(DICTIONARY, { keyPath: "word" });
      }

      if (!db.objectStoreNames.contains(EXPOSURES)) {
        const store = db.createObjectStore(EXPOSURES, { keyPath: "id" });
        store.createIndex("articleId", "articleId");
      }

      if (!db.objectStoreNames.contains(EVENTS)) {
        const store = db.createObjectStore(EVENTS, { keyPath: "id" });
        store.createIndex("articleId", "articleId");
        store.createIndex("timestamp", "timestamp");
      }

      if (!db.objectStoreNames.contains(VOCABULARY_PROFILE)) {
        db.createObjectStore(VOCABULARY_PROFILE, { keyPath: "id" });
      }
    };
  });
}

function migrateStore(store: IDBObjectStore, normalize: (value: unknown) => unknown) {
  const request = store.openCursor();
  request.onsuccess = () => {
    const cursor = request.result;
    if (!cursor) return;
    cursor.update(normalize(cursor.value));
    cursor.continue();
  };
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
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

export async function listArticles(): Promise<Article[]> {
  const db = await openDatabase();
  const transaction = db.transaction(ARTICLES, "readonly");
  const values = await requestResult(transaction.objectStore(ARTICLES).getAll()) as Partial<Article>[];
  await transactionDone(transaction);
  db.close();
  return values.map(normalizeArticle).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getArticle(id: string): Promise<Article | undefined> {
  const db = await openDatabase();
  const transaction = db.transaction(ARTICLES, "readonly");
  const value = await requestResult(transaction.objectStore(ARTICLES).get(id)) as Partial<Article> | undefined;
  await transactionDone(transaction);
  db.close();
  return value ? normalizeArticle(value) : undefined;
}

export async function findArticleBySourceUrl(sourceUrl: string): Promise<Article | undefined> {
  const normalizedUrl = new URL(sourceUrl).href;
  const articles = await listArticles();
  return articles.find((article) => article.sourceUrl === normalizedUrl);
}

export async function getWordStates(): Promise<WordState[]> {
  const db = await openDatabase();
  const transaction = db.transaction(WORDS, "readonly");
  const values = await requestResult(transaction.objectStore(WORDS).getAll()) as Partial<WordState>[];
  await transactionDone(transaction);
  db.close();
  const now = new Date().toISOString();
  return values.map((value) => normalizeWordState(value, now));
}

export async function getVocabularyProfile(): Promise<VocabularyProfile | undefined> {
  const db = await openDatabase();
  const transaction = db.transaction(VOCABULARY_PROFILE, "readonly");
  const value = await requestResult(transaction.objectStore(VOCABULARY_PROFILE).get("current")) as Partial<VocabularyProfile> | undefined;
  await transactionDone(transaction);
  db.close();
  return value ? normalizeVocabularyProfile(value) : undefined;
}

export async function saveVocabularyProfile(profile: VocabularyProfile): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction(VOCABULARY_PROFILE, "readwrite");
  transaction.objectStore(VOCABULARY_PROFILE).put(normalizeVocabularyProfile(profile));
  await transactionDone(transaction);
  db.close();
}

export async function createArticle(title: string, content: string, sourceUrl?: string): Promise<Article> {
  const article: Article = {
    id: crypto.randomUUID(),
    title: title.trim(),
    content: content.trim(),
    sourceUrl: sourceUrl?.trim() || null,
    createdAt: new Date().toISOString(),
    startedAt: null,
    finishedAt: null,
    status: "unread",
    estimatedDifficulty: null,
    userDifficultyFeedback: null,
  };
  const db = await openDatabase();
  const transaction = db.transaction(ARTICLES, "readwrite");
  transaction.objectStore(ARTICLES).add(article);
  await transactionDone(transaction);
  db.close();
  return article;
}

export async function beginReading(article: Article): Promise<Article> {
  const db = await openDatabase();
  const transaction = db.transaction([ARTICLES, WORDS, EXPOSURES, EVENTS, VOCABULARY_PROFILE], "readwrite");
  const articleStore = transaction.objectStore(ARTICLES);
  const wordStore = transaction.objectStore(WORDS);
  const exposureStore = transaction.objectStore(EXPOSURES);

  const articleRequest = requestResult(articleStore.get(article.id)) as Promise<Partial<Article> | undefined>;
  const wordsRequest = requestResult(wordStore.getAll()) as Promise<Partial<WordState>[]>;
  const exposureKeysRequest = requestResult(exposureStore.getAllKeys());
  const profileRequest = requestResult(transaction.objectStore(VOCABULARY_PROFILE).get("current")) as Promise<Partial<VocabularyProfile> | undefined>;
  const [savedArticle, savedWords, exposureKeys, savedProfile] = await Promise.all([
    articleRequest,
    wordsRequest,
    exposureKeysRequest,
    profileRequest,
  ]);

  const now = new Date().toISOString();
  const current = normalizeArticle(savedArticle ?? article);
  const nextArticle: Article = {
    ...current,
    status: current.status === "unread" || current.status === "skipped" ? "reading" : current.status,
    startedAt: current.startedAt ?? now,
  };
  articleStore.put(nextArticle);
  transaction.objectStore(EVENTS).add(createReadingEvent(current.id, "opened"));

  const existingExposures = new Set(exposureKeys.map(String));
  const wordStates = new Map(
    savedWords.map((value) => {
      const state = normalizeWordState(value, now);
      return [state.normalizedWord, state] as const;
    }),
  );

  for (const normalizedWord of uniqueWords(current.content)) {
    const exposureId = `${current.id}::${normalizedWord}`;
    if (existingExposures.has(exposureId)) continue;

    const previous = wordStates.get(normalizedWord);
    const nextWordState = previous
      ? {
          ...previous,
          seenCount: previous.seenCount + 1,
          familiarity: familiarityAfterExposure(previous.familiarity),
          firstSeenAt: previous.firstSeenAt ?? now,
          lastSeenAt: now,
        }
      : initialWordState(normalizedWord, 1, now, savedProfile ? normalizeVocabularyProfile(savedProfile) : undefined);

    wordStore.put(nextWordState);
    wordStates.set(normalizedWord, nextWordState);
    exposureStore.add({ id: exposureId, articleId: current.id, normalizedWord, seenAt: now } satisfies WordExposure);
  }

  await transactionDone(transaction);
  db.close();
  return nextArticle;
}

export async function recordLookup(articleId: string, word: string): Promise<WordState> {
  const normalizedWord = word.toLocaleLowerCase("en-US").replace(/’/g, "'");
  const db = await openDatabase();
  const transaction = db.transaction([WORDS, EVENTS, VOCABULARY_PROFILE], "readwrite");
  const store = transaction.objectStore(WORDS);
  const now = new Date().toISOString();
  const [value, savedProfile] = await Promise.all([
    requestResult(store.get(normalizedWord)) as Promise<Partial<WordState> | undefined>,
    requestResult(transaction.objectStore(VOCABULARY_PROFILE).get("current")) as Promise<Partial<VocabularyProfile> | undefined>,
  ]);
  const base = value
    ? normalizeWordState(value, now)
    : initialWordState(normalizedWord, 0, null, savedProfile ? normalizeVocabularyProfile(savedProfile) : undefined);
  const next: WordState = {
    ...base,
    lookupCount: base.lookupCount + 1,
    familiarity: familiarityAfterLookup(base.familiarity),
    lastLookupAt: now,
  };
  store.put(next);
  transaction.objectStore(EVENTS).add(createReadingEvent(articleId, "word_lookup", { word: normalizedWord }));
  await transactionDone(transaction);
  db.close();
  return next;
}

export async function finishArticle(id: string, readingTimeSeconds?: number): Promise<Article | undefined> {
  return updateArticleStatus(id, "finished", readingTimeSeconds);
}

export async function skipArticle(id: string, readingTimeSeconds?: number): Promise<Article | undefined> {
  return updateArticleStatus(id, "skipped", readingTimeSeconds);
}

export async function saveDifficultyFeedback(id: string, feedback: DifficultyFeedback): Promise<Article | undefined> {
  const db = await openDatabase();
  const transaction = db.transaction([ARTICLES, EVENTS], "readwrite");
  const store = transaction.objectStore(ARTICLES);
  const value = await requestResult(store.get(id)) as Partial<Article> | undefined;
  if (!value) {
    transaction.abort();
    db.close();
    return undefined;
  }
  const updated: Article = { ...normalizeArticle(value), userDifficultyFeedback: feedback };
  store.put(updated);
  transaction.objectStore(EVENTS).add(createReadingEvent(id, "difficulty_feedback", { feedback }));
  await transactionDone(transaction);
  db.close();
  return updated;
}

export async function saveArticleDifficulty(id: string, estimatedDifficulty: number): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction(ARTICLES, "readwrite");
  const store = transaction.objectStore(ARTICLES);
  const value = await requestResult(store.get(id)) as Partial<Article> | undefined;
  if (value) store.put({ ...normalizeArticle(value), estimatedDifficulty });
  await transactionDone(transaction);
  db.close();
}

async function updateArticleStatus(id: string, status: "finished" | "skipped", readingTimeSeconds?: number) {
  const db = await openDatabase();
  const transaction = db.transaction([ARTICLES, EVENTS], "readwrite");
  const store = transaction.objectStore(ARTICLES);
  const value = await requestResult(store.get(id)) as Partial<Article> | undefined;
  if (!value) {
    transaction.abort();
    db.close();
    return undefined;
  }
  const article = normalizeArticle(value);
  const updated: Article = {
    ...article,
    status,
    finishedAt: status === "finished" ? new Date().toISOString() : null,
  };
  store.put(updated);
  transaction.objectStore(EVENTS).add(createReadingEvent(id, status, {
    readingTimeSeconds: readingTimeSeconds ?? null,
  }));
  await transactionDone(transaction);
  db.close();
  return updated;
}

export async function getCachedDefinition(word: string): Promise<DictionaryResult | undefined> {
  const db = await openDatabase();
  const transaction = db.transaction(DICTIONARY, "readonly");
  const result = await requestResult(transaction.objectStore(DICTIONARY).get(word)) as DictionaryResult | undefined;
  await transactionDone(transaction);
  db.close();
  return result ? { ...result, source: "cache" } : undefined;
}

export async function cacheDefinition(result: DictionaryResult) {
  const db = await openDatabase();
  const transaction = db.transaction(DICTIONARY, "readwrite");
  transaction.objectStore(DICTIONARY).put({ ...result, source: "remote" });
  await transactionDone(transaction);
  db.close();
}

function normalizeArticle(value: Partial<Article>): Article {
  const status = value.status === "reading" || value.status === "finished" || value.status === "skipped"
    ? value.status
    : "unread";
  return {
    id: value.id ?? crypto.randomUUID(),
    title: value.title?.trim() || "Untitled article",
    content: value.content ?? "",
    sourceUrl: value.sourceUrl?.trim() || null,
    createdAt: value.createdAt ?? new Date().toISOString(),
    startedAt: value.startedAt ?? (status === "reading" || status === "finished" ? value.createdAt ?? null : null),
    finishedAt: status === "finished" ? value.finishedAt ?? null : null,
    status,
    estimatedDifficulty: typeof value.estimatedDifficulty === "number" ? value.estimatedDifficulty : null,
    userDifficultyFeedback: value.userDifficultyFeedback ?? null,
  };
}

function normalizeWordState(value: Partial<WordState>, fallbackTime: string): WordState {
  const normalizedWord = (value.normalizedWord ?? value.word ?? "").toLocaleLowerCase("en-US").replace(/’/g, "'");
  const seenCount = Number.isFinite(value.seenCount) ? Math.max(0, value.seenCount ?? 0) : 0;
  const fallbackSeenAt = seenCount > 0 ? value.lastLookupAt ?? fallbackTime : null;
  return {
    word: normalizedWord,
    normalizedWord,
    lookupCount: Number.isFinite(value.lookupCount) ? Math.max(0, value.lookupCount ?? 0) : 0,
    seenCount,
    familiarity: typeof value.familiarity === "number" ? Math.min(1, Math.max(0, value.familiarity)) : 0.6,
    firstSeenAt: value.firstSeenAt ?? fallbackSeenAt,
    lastSeenAt: value.lastSeenAt ?? fallbackSeenAt,
    lastLookupAt: value.lastLookupAt ?? null,
  };
}

function reseedLegacyWordState(value: Partial<WordState>, fallbackTime: string): WordState {
  const state = normalizeWordState(value, fallbackTime);
  if (state.lookupCount === 0 && state.familiarity === 0.6) {
    const exposureGain = Math.max(0, state.seenCount - 1) * 0.02;
    return {
      ...state,
      familiarity: Math.min(0.95, Number((frequencyProvider.initialFamiliarity(state.normalizedWord) + exposureGain).toFixed(2))),
    };
  }
  return state;
}

function initialWordState(
  word: string,
  seenCount: number,
  seenAt: string | null,
  profile?: VocabularyProfile,
): WordState {
  return {
    word,
    normalizedWord: word,
    lookupCount: 0,
    seenCount,
    familiarity: frequencyProvider.initialFamiliarity(word, profile),
    firstSeenAt: seenAt,
    lastSeenAt: seenAt,
    lastLookupAt: null,
  };
}

function normalizeVocabularyProfile(value: Partial<VocabularyProfile>): VocabularyProfile {
  return {
    id: "current",
    estimatedBand: Math.min(5, Math.max(0, Math.round(value.estimatedBand ?? 2))),
    frequencyThreshold: Math.min(0.9, Math.max(0.3, value.frequencyThreshold ?? 0.68)),
    confidence: Math.min(1, Math.max(0, value.confidence ?? 0)),
    assessedAt: value.assessedAt ?? new Date().toISOString(),
    assessmentVersion: Math.max(1, Math.round(value.assessmentVersion ?? 1)),
  };
}

function createReadingEvent(
  articleId: string,
  type: ReadingEventType,
  metadata: ReadingEvent["metadata"] = {},
): ReadingEvent {
  return {
    id: crypto.randomUUID(),
    articleId,
    type,
    timestamp: new Date().toISOString(),
    metadata,
  };
}
