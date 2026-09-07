import type { Article, ArticleAttribution, CandidateArticle, CandidateStatus, ContentPool, ContentPreferences, ContentProvenance, ContentTransformation, ContentType, DictionaryResult, DifficultyFeedback, InterestProfile, LexicalEvent, RankingComponents, RankingWeights, ReadingComfortProfile, ReadingEntryContext, ReadingEvent, ReadingEventType, ReadingOutcomeMetrics, RecommendationCandidateSnapshot, RecommendationEvent, RecommendationOutcome, VocabularyProfile, WordState } from "./types.ts";
import { normalizeWord, tokenizePreservingText } from "./text.ts";
import { aggregateLexicalEvent } from "./familiarity.ts";
import { frequencyProvider } from "./frequency.ts";
import { applyInterestFeedback, emptyInterestProfile, extractCandidateKeywords, normalizeInterestProfile } from "./interest-profile.ts";
import { emptyContentPreferences, normalizeContentPreferences } from "./content-preferences.ts";
import { normalizeLookupFriction } from "./lookup-friction.ts";
import { applyReadingOutcomeToComfort, initialReadingComfortProfile, normalizeReadingComfortProfile } from "./reading-comfort.ts";

const DB_NAME = "just-read";
const DB_VERSION = 10;
const ARTICLES = "articles";
const WORDS = "words";
const DICTIONARY = "dictionary";
const EXPOSURES = "exposures";
const EVENTS = "events";
const VOCABULARY_PROFILE = "vocabularyProfile";
const CANDIDATES = "candidates";
const RECOMMENDATION_EVENTS = "recommendationEvents";
const INTEREST_PROFILE = "interestProfile";
const CONTENT_PREFERENCES = "contentPreferences";
const LEXICAL_EVENTS = "lexicalEvents";
const READING_COMFORT_PROFILE = "readingComfortProfile";
const LOOKUP_EVIDENCE_WINDOW_MS = 30_000;

type WordExposure = {
  id: string;
  articleId: string;
  normalizedWord: string;
  seenAt: string;
};

function exposureId(articleId: string, normalizedWord: string) {
  return `${articleId}::${normalizedWord}`;
}

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
        migrateStore(transaction.objectStore(WORDS), (value) => normalizeWordState(value as Partial<WordState>, migrationTime));
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

      if (!db.objectStoreNames.contains(CANDIDATES)) {
        const store = db.createObjectStore(CANDIDATES, { keyPath: "id" });
        store.createIndex("status", "status");
        store.createIndex("discoveredAt", "discoveredAt");
      }

      if (!db.objectStoreNames.contains(RECOMMENDATION_EVENTS)) {
        const store = db.createObjectStore(RECOMMENDATION_EVENTS, { keyPath: "id" });
        store.createIndex("articleId", "articleId");
        store.createIndex("candidateId", "candidateId");
        store.createIndex("timestamp", "timestamp");
      }

      if (!db.objectStoreNames.contains(INTEREST_PROFILE)) {
        db.createObjectStore(INTEREST_PROFILE, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(CONTENT_PREFERENCES)) {
        db.createObjectStore(CONTENT_PREFERENCES, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(LEXICAL_EVENTS)) {
        const store = db.createObjectStore(LEXICAL_EVENTS, { keyPath: "id" });
        store.createIndex("articleId", "articleId");
        store.createIndex("normalizedWord", "normalizedWord");
        store.createIndex("timestamp", "timestamp");
      }

      if (!db.objectStoreNames.contains(READING_COMFORT_PROFILE)) {
        db.createObjectStore(READING_COMFORT_PROFILE, { keyPath: "id" });
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
  const normalizedUrl = canonicalizeSourceUrl(sourceUrl);
  if (!normalizedUrl) return undefined;
  const articles = await listArticles();
  return articles.find((article) => canonicalizeSourceUrl(article.sourceUrl) === normalizedUrl);
}

export async function findArticleByCandidateId(candidateId: string): Promise<Article | undefined> {
  const savedCandidate = (await listCandidateArticles()).find((candidate) => candidate.id === candidateId);
  if (savedCandidate?.articleId) {
    const linkedArticle = await getArticle(savedCandidate.articleId);
    if (linkedArticle) return linkedArticle;
  }
  const articles = await listArticles();
  return articles.find((article) => article.attribution?.candidateId === candidateId);
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

export async function getReadingComfortProfile(): Promise<ReadingComfortProfile> {
  const db = await openDatabase();
  const transaction = db.transaction([READING_COMFORT_PROFILE, VOCABULARY_PROFILE], "readonly");
  const [value, vocabularyValue] = await Promise.all([
    requestResult(transaction.objectStore(READING_COMFORT_PROFILE).get("current")) as Promise<Partial<ReadingComfortProfile> | undefined>,
    requestResult(transaction.objectStore(VOCABULARY_PROFILE).get("current")) as Promise<Partial<VocabularyProfile> | undefined>,
  ]);
  await transactionDone(transaction);
  db.close();
  const vocabularyProfile = vocabularyValue ? normalizeVocabularyProfile(vocabularyValue) : undefined;
  return value
    ? normalizeReadingComfortProfile(value, vocabularyProfile)
    : initialReadingComfortProfile(vocabularyProfile);
}

export async function getInterestProfile(): Promise<InterestProfile> {
  const db = await openDatabase();
  const transaction = db.transaction(INTEREST_PROFILE, "readonly");
  const value = await requestResult(transaction.objectStore(INTEREST_PROFILE).get("current")) as Partial<InterestProfile> | undefined;
  await transactionDone(transaction);
  db.close();
  return normalizeInterestProfile(value);
}

export async function getContentPreferences(): Promise<ContentPreferences> {
  const db = await openDatabase();
  const transaction = db.transaction(CONTENT_PREFERENCES, "readonly");
  const value = await requestResult(transaction.objectStore(CONTENT_PREFERENCES).get("current")) as Partial<ContentPreferences> | undefined;
  await transactionDone(transaction);
  db.close();
  return value ? normalizeContentPreferences(value) : emptyContentPreferences();
}

export async function saveContentPreferences(preferences: ContentPreferences): Promise<ContentPreferences> {
  const normalized = normalizeContentPreferences({ ...preferences, updatedAt: new Date().toISOString() });
  const db = await openDatabase();
  const transaction = db.transaction(CONTENT_PREFERENCES, "readwrite");
  transaction.objectStore(CONTENT_PREFERENCES).put(normalized);
  await transactionDone(transaction);
  db.close();
  return normalized;
}

export async function listRecommendationEvents(): Promise<RecommendationEvent[]> {
  const db = await openDatabase();
  const transaction = db.transaction(RECOMMENDATION_EVENTS, "readonly");
  const values = await requestResult(transaction.objectStore(RECOMMENDATION_EVENTS).getAll()) as Partial<RecommendationEvent>[];
  await transactionDone(transaction);
  db.close();
  return values.map(normalizeRecommendationEvent).sort((left, right) => right.timestamp.localeCompare(left.timestamp));
}

export async function getLatestRecommendationEventForArticle(articleId: string): Promise<RecommendationEvent | undefined> {
  const db = await openDatabase();
  const transaction = db.transaction(RECOMMENDATION_EVENTS, "readonly");
  const values = await requestResult(
    transaction.objectStore(RECOMMENDATION_EVENTS).index("articleId").getAll(articleId),
  ) as Partial<RecommendationEvent>[];
  await transactionDone(transaction);
  db.close();
  return values
    .map(normalizeRecommendationEvent)
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp))[0];
}

export async function listReadingEvents(articleId?: string): Promise<ReadingEvent[]> {
  const db = await openDatabase();
  const transaction = db.transaction(EVENTS, "readonly");
  const store = transaction.objectStore(EVENTS);
  const values = articleId
    ? await requestResult(store.index("articleId").getAll(articleId)) as Partial<ReadingEvent>[]
    : await requestResult(store.getAll()) as Partial<ReadingEvent>[];
  await transactionDone(transaction);
  db.close();
  return values.map(normalizeReadingEvent).sort((left, right) => left.timestamp.localeCompare(right.timestamp));
}

export async function listLexicalEvents(articleId?: string): Promise<LexicalEvent[]> {
  const db = await openDatabase();
  const transaction = db.transaction(LEXICAL_EVENTS, "readonly");
  const store = transaction.objectStore(LEXICAL_EVENTS);
  const values = articleId
    ? await requestResult(store.index("articleId").getAll(articleId)) as Partial<LexicalEvent>[]
    : await requestResult(store.getAll()) as Partial<LexicalEvent>[];
  await transactionDone(transaction);
  db.close();
  return values.map(normalizeLexicalEvent).sort((left, right) => left.timestamp.localeCompare(right.timestamp));
}

export async function recordRecommendationSelection(input: {
  candidate: CandidateArticle;
  articleId: string;
  entryPoint: RecommendationEvent["entryPoint"];
  rank: number;
  score: number;
  modelVersion: number;
  components: RankingComponents;
  candidateSlate?: RecommendationCandidateSnapshot[];
  rankingWeights?: RankingWeights;
  vocabularyBand?: number;
  targetDifficulty?: number;
  comfortableWords?: number;
  difficultyTolerance?: number;
  successPhase?: boolean;
}): Promise<RecommendationEvent> {
  const candidateSlate = normalizeCandidateSlate(input.candidateSlate);
  const event: RecommendationEvent = {
    id: crypto.randomUUID(),
    type: "selected",
    candidateId: input.candidate.id,
    articleId: input.articleId,
    entryPoint: input.entryPoint,
    timestamp: new Date().toISOString(),
    modelVersion: input.modelVersion,
    rank: Math.max(1, Math.round(input.rank)),
    score: clamp01(input.score),
    components: normalizeRankingComponents(input.components),
    sourceId: input.candidate.sourceId,
    topic: input.candidate.topic,
    keywords: extractCandidateKeywords(input.candidate),
    selectedArticleId: input.articleId,
    candidateSlate: candidateSlate.length
      ? candidateSlate
      : [{
          candidateId: input.candidate.id,
          articleId: input.articleId,
          rank: Math.max(1, Math.round(input.rank)),
          totalScore: clamp01(input.score),
          difficultyScore: 0,
          interestScore: clamp01(input.components.interestScore),
          explorationScore: clamp01(input.components.explorationScore),
        }],
    rankingVersion: input.modelVersion,
    rankingWeights: normalizeRankingWeights(input.rankingWeights),
    vocabularyBand: normalizeVocabularyBand(input.vocabularyBand),
    targetDifficulty: clamp01(input.targetDifficulty ?? 0.24),
    comfortableWords: Math.max(60, Math.round(input.comfortableWords ?? 320)),
    difficultyTolerance: clamp(input.difficultyTolerance ?? 0.2, 0.08, 0.35),
    successPhase: input.successPhase === true,
    explorationType: "interest_novelty",
    outcome: null,
  };
  const db = await openDatabase();
  const transaction = db.transaction(RECOMMENDATION_EVENTS, "readwrite");
  transaction.objectStore(RECOMMENDATION_EVENTS).add(event);
  await transactionDone(transaction);
  db.close();
  return event;
}

export async function listCandidateArticles(): Promise<CandidateArticle[]> {
  const db = await openDatabase();
  const transaction = db.transaction(CANDIDATES, "readonly");
  const values = await requestResult(transaction.objectStore(CANDIDATES).getAll()) as Partial<CandidateArticle>[];
  await transactionDone(transaction);
  db.close();
  return values.map(normalizeCandidate).sort((left, right) =>
    (right.publishedAt ?? right.discoveredAt).localeCompare(left.publishedAt ?? left.discoveredAt));
}

export async function upsertCandidateArticles(candidates: readonly CandidateArticle[]): Promise<void> {
  if (!candidates.length) return;
  const db = await openDatabase();
  const transaction = db.transaction(CANDIDATES, "readwrite");
  const store = transaction.objectStore(CANDIDATES);
  const existing = await requestResult(store.getAll()) as Partial<CandidateArticle>[];
  const existingById = new Map(existing.map((candidate) => {
    const normalized = normalizeCandidate(candidate);
    return [normalized.id, normalized] as const;
  }));
  for (const candidate of candidates) {
    const previous = existingById.get(candidate.id);
    store.put(normalizeCandidate({
      ...candidate,
      status: previous?.status ?? candidate.status,
      articleId: previous?.articleId ?? candidate.articleId,
    }));
  }
  await transactionDone(transaction);
  db.close();
}

export async function setCandidateStatus(id: string, status: CandidateStatus): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction(CANDIDATES, "readwrite");
  const store = transaction.objectStore(CANDIDATES);
  const value = await requestResult(store.get(id)) as Partial<CandidateArticle> | undefined;
  if (value) store.put({ ...normalizeCandidate(value), status });
  await transactionDone(transaction);
  db.close();
}

export async function linkCandidateToArticle(candidate: CandidateArticle, articleId: string): Promise<Article> {
  const db = await openDatabase();
  const transaction = db.transaction([ARTICLES, CANDIDATES], "readwrite");
  const articleStore = transaction.objectStore(ARTICLES);
  const candidateStore = transaction.objectStore(CANDIDATES);
  const [savedArticle, savedCandidate] = await Promise.all([
    requestResult(articleStore.get(articleId)) as Promise<Partial<Article> | undefined>,
    requestResult(candidateStore.get(candidate.id)) as Promise<Partial<CandidateArticle> | undefined>,
  ]);
  if (!savedArticle) {
    transaction.abort();
    db.close();
    throw new Error("Cannot link a candidate to a missing article");
  }

  const article = normalizeArticle(savedArticle);
  const linkedCandidate = normalizeCandidate({
    ...(savedCandidate ? normalizeCandidate(savedCandidate) : candidate),
    status: "imported",
    articleId,
  });
  const linkedArticle: Article = {
    ...article,
    attribution: article.attribution ?? attributionFromCandidate(linkedCandidate),
  };
  articleStore.put(linkedArticle);
  candidateStore.put(linkedCandidate);

  await transactionDone(transaction);
  db.close();
  return linkedArticle;
}

export async function createArticle(title: string, content: string, sourceUrl?: string): Promise<Article> {
  const article: Article = {
    id: crypto.randomUUID(),
    title: title.trim(),
    content: content.trim(),
    sourceUrl: canonicalizeSourceUrl(sourceUrl),
    createdAt: new Date().toISOString(),
    startedAt: null,
    finishedAt: null,
    status: "unread",
    estimatedDifficulty: null,
    userDifficultyFeedback: null,
    attribution: null,
  };
  const db = await openDatabase();
  const transaction = db.transaction(ARTICLES, "readwrite");
  transaction.objectStore(ARTICLES).add(article);
  await transactionDone(transaction);
  db.close();
  return article;
}

export async function beginReading(article: Article, context?: ReadingEntryContext): Promise<Article> {
  const db = await openDatabase();
  const transaction = db.transaction([ARTICLES, EVENTS, RECOMMENDATION_EVENTS], "readwrite");
  const articleStore = transaction.objectStore(ARTICLES);
  const savedArticle = await requestResult(articleStore.get(article.id)) as Partial<Article> | undefined;
  const recommendation = context?.recommendationEventId
    ? await requestResult(transaction.objectStore(RECOMMENDATION_EVENTS).get(context.recommendationEventId)) as Partial<RecommendationEvent> | undefined
    : undefined;

  const now = new Date().toISOString();
  const current = normalizeArticle(savedArticle ?? article);
  const nextArticle: Article = {
    ...current,
    status: current.status === "unread" || current.status === "skipped" ? "reading" : current.status,
    startedAt: current.startedAt ?? now,
  };
  articleStore.put(nextArticle);
  const normalizedRecommendation = recommendation ? normalizeRecommendationEvent(recommendation) : undefined;
  const validRecommendation = normalizedRecommendation?.articleId === current.id ? normalizedRecommendation : undefined;
  transaction.objectStore(EVENTS).add(createReadingEvent(current.id, "opened", {}, {
    entryPoint: context?.entryPoint ?? "direct",
    recommendationEventId: validRecommendation?.id ?? null,
    candidateId: validRecommendation?.candidateId ?? context?.candidateId ?? current.attribution?.candidateId ?? null,
  }));

  await transactionDone(transaction);
  db.close();
  return nextArticle;
}

export async function recordExposures(
  articleId: string,
  words: readonly string[],
  contextHash: string | null = null,
): Promise<WordState[]> {
  const wordForms = new Map<string, string>();
  for (const word of words) {
    const normalizedWord = normalizeWord(word.trim());
    if (normalizedWord && !wordForms.has(normalizedWord)) wordForms.set(normalizedWord, word);
  }
  const normalizedWords = [...wordForms.keys()];
  if (!normalizedWords.length) return [];

  const db = await openDatabase();
  const transaction = db.transaction([WORDS, EXPOSURES, LEXICAL_EVENTS, VOCABULARY_PROFILE], "readwrite");
  const wordStore = transaction.objectStore(WORDS);
  const exposureStore = transaction.objectStore(EXPOSURES);
  const lexicalStore = transaction.objectStore(LEXICAL_EVENTS);
  const profilePromise = requestResult(transaction.objectStore(VOCABULARY_PROFILE).get("current")) as Promise<Partial<VocabularyProfile> | undefined>;
  const exposurePromises = normalizedWords.map((word) => requestResult(exposureStore.get(exposureId(articleId, word))) as Promise<WordExposure | undefined>);
  const wordPromises = normalizedWords.map((word) => requestResult(wordStore.get(word)) as Promise<Partial<WordState> | undefined>);
  const [savedProfile, savedExposures, savedWords] = await Promise.all([
    profilePromise,
    Promise.all(exposurePromises),
    Promise.all(wordPromises),
  ]);

  const now = new Date().toISOString();
  const profile = savedProfile ? normalizeVocabularyProfile(savedProfile) : undefined;
  const updated: WordState[] = [];

  for (const [index, normalizedWord] of normalizedWords.entries()) {
    if (savedExposures[index]) continue;

    const event = createLexicalEvent({
      type: "exposure",
      articleId,
      wordForm: wordForms.get(normalizedWord) ?? normalizedWord,
      normalizedWord,
      contextHash,
      dictionarySucceeded: null,
      evidenceApplied: true,
      timestamp: now,
    });
    lexicalStore.add(event);
    const base = savedWords[index]
      ? normalizeWordState(savedWords[index]!, now)
      : initialWordState(normalizedWord, 0, null, profile);
    const nextWordState = aggregateLexicalEvent(base, event);

    wordStore.put(nextWordState);
    exposureStore.add({
      id: exposureId(articleId, normalizedWord),
      articleId,
      normalizedWord,
      seenAt: now,
    } satisfies WordExposure);
    updated.push(nextWordState);
  }

  await transactionDone(transaction);
  db.close();
  return updated;
}

export async function recordLookup(
  articleId: string,
  word: string,
  options: { contextHash?: string | null; dictionarySucceeded?: boolean; timestamp?: string } = {},
): Promise<WordState> {
  const normalizedWord = normalizeWord(word);
  const db = await openDatabase();
  const transaction = db.transaction([WORDS, EVENTS, LEXICAL_EVENTS, VOCABULARY_PROFILE], "readwrite");
  const store = transaction.objectStore(WORDS);
  const lexicalStore = transaction.objectStore(LEXICAL_EVENTS);
  const now = options.timestamp ?? new Date().toISOString();
  const [value, savedProfile, priorEvents] = await Promise.all([
    requestResult(store.get(normalizedWord)) as Promise<Partial<WordState> | undefined>,
    requestResult(transaction.objectStore(VOCABULARY_PROFILE).get("current")) as Promise<Partial<VocabularyProfile> | undefined>,
    requestResult(lexicalStore.index("normalizedWord").getAll(normalizedWord)) as Promise<Partial<LexicalEvent>[]>,
  ]);
  const base = value
    ? normalizeWordState(value, now)
    : initialWordState(normalizedWord, 0, null, savedProfile ? normalizeVocabularyProfile(savedProfile) : undefined);
  const contextHash = options.contextHash ?? null;
  const dictionarySucceeded = options.dictionarySucceeded === true;
  const duplicateEvidence = dictionarySucceeded && priorEvents.some((value) => {
    const event = normalizeLexicalEvent(value);
    return event.type === "lookup"
      && event.articleId === articleId
      && event.contextHash === contextHash
      && event.dictionarySucceeded === true
      && event.evidenceApplied
      && Math.abs(Date.parse(now) - Date.parse(event.timestamp)) < LOOKUP_EVIDENCE_WINDOW_MS;
  });
  const lexicalEvent = createLexicalEvent({
    type: "lookup",
    articleId,
    wordForm: word,
    normalizedWord,
    contextHash,
    dictionarySucceeded,
    evidenceApplied: dictionarySucceeded && !duplicateEvidence,
    timestamp: now,
  });
  lexicalStore.add(lexicalEvent);
  const next = aggregateLexicalEvent(base, lexicalEvent);
  store.put(next);
  transaction.objectStore(EVENTS).add(createReadingEvent(articleId, "word_lookup", {
    word: normalizedWord,
    contextHash,
    dictionarySucceeded,
    evidenceApplied: lexicalEvent.evidenceApplied,
  }));
  await transactionDone(transaction);
  db.close();
  return next;
}

export async function finishArticle(
  id: string,
  metrics?: number | ReadingOutcomeMetrics,
): Promise<Article | undefined> {
  return updateArticleStatus(id, "finished", normalizeOutcomeMetrics(metrics));
}

export async function skipArticle(
  id: string,
  metrics?: number | ReadingOutcomeMetrics,
): Promise<Article | undefined> {
  return updateArticleStatus(id, "skipped", normalizeOutcomeMetrics(metrics));
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

async function updateArticleStatus(id: string, status: "finished" | "skipped", metrics: ReadingOutcomeMetrics) {
  const db = await openDatabase();
  const transaction = db.transaction([
    ARTICLES,
    EVENTS,
    RECOMMENDATION_EVENTS,
    INTEREST_PROFILE,
    READING_COMFORT_PROFILE,
    VOCABULARY_PROFILE,
  ], "readwrite");
  const store = transaction.objectStore(ARTICLES);
  const recommendationStore = transaction.objectStore(RECOMMENDATION_EVENTS);
  const [value, recommendationValue, profileValue, comfortValue, vocabularyValue] = await Promise.all([
    requestResult(store.get(id)) as Promise<Partial<Article> | undefined>,
    metrics.recommendationEventId
      ? requestResult(recommendationStore.get(metrics.recommendationEventId)) as Promise<Partial<RecommendationEvent> | undefined>
      : Promise.resolve(undefined),
    requestResult(transaction.objectStore(INTEREST_PROFILE).get("current")) as Promise<Partial<InterestProfile> | undefined>,
    requestResult(transaction.objectStore(READING_COMFORT_PROFILE).get("current")) as Promise<Partial<ReadingComfortProfile> | undefined>,
    requestResult(transaction.objectStore(VOCABULARY_PROFILE).get("current")) as Promise<Partial<VocabularyProfile> | undefined>,
  ]);
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
  const recommendation = recommendationValue ? normalizeRecommendationEvent(recommendationValue) : undefined;
  const validRecommendation = recommendation?.articleId === id ? recommendation : undefined;
  transaction.objectStore(EVENTS).add(createReadingEvent(id, status, {
    readingTimeSeconds: metrics.readingTimeSeconds,
    activeReadingSeconds: metrics.activeReadingSeconds ?? metrics.readingTimeSeconds,
    maxReadingProgress: metrics.maxReadingProgress ?? 0,
    lookupCount: metrics.lookupCount,
    exposedUniqueWordCount: metrics.exposedUniqueWordCount ?? 0,
    lookupsPer100ExposedWords: metrics.lookupFriction?.lookupsPer100ExposedWords ?? 0,
    maxLookupsInContext: metrics.lookupFriction?.maxLookupsInContext ?? 0,
    maxLookupDensityByContext: metrics.lookupFriction?.maxLookupDensityByContext ?? 0,
    highFrictionContextCount: metrics.lookupFriction?.highFrictionContextCount ?? 0,
    consecutiveHighFrictionContexts: metrics.lookupFriction?.consecutiveHighFrictionContexts ?? 0,
    lookupFrictionScore: metrics.lookupFriction?.score ?? 0,
    difficultyFeedback: updated.userDifficultyFeedback,
    finished: status === "finished",
  }, {
    entryPoint: metrics.entryPoint ?? validRecommendation?.entryPoint ?? null,
    recommendationEventId: validRecommendation?.id ?? null,
    candidateId: validRecommendation?.candidateId ?? metrics.candidateId ?? article.attribution?.candidateId ?? null,
  }));
  if (validRecommendation) {
    const outcome: RecommendationOutcome = {
      activeReadingSeconds: metrics.activeReadingSeconds ?? metrics.readingTimeSeconds,
      maxReadingProgress: metrics.maxReadingProgress ?? (status === "finished" ? 1 : 0),
      lookupCount: metrics.lookupCount,
      exposedUniqueWordCount: metrics.exposedUniqueWordCount ?? 0,
      lookupFriction: normalizeLookupFriction(metrics.lookupFriction),
      difficultyFeedback: updated.userDifficultyFeedback,
      finished: status === "finished",
      recordedAt: new Date().toISOString(),
    };
    recommendationStore.put({ ...validRecommendation, outcome });
    transaction.objectStore(INTEREST_PROFILE).put(applyInterestFeedback(
      profileValue ? normalizeInterestProfile(profileValue) : emptyInterestProfile(),
      {
        outcome: status,
        article: updated,
        recommendation: validRecommendation,
        readingTimeSeconds: metrics.readingTimeSeconds,
        activeReadingSeconds: metrics.activeReadingSeconds,
        maxReadingProgress: metrics.maxReadingProgress,
        lookupCount: metrics.lookupCount,
        lookupFriction: outcome.lookupFriction,
      },
    ));
    const vocabularyProfile = vocabularyValue ? normalizeVocabularyProfile(vocabularyValue) : undefined;
    transaction.objectStore(READING_COMFORT_PROFILE).put(applyReadingOutcomeToComfort(
      comfortValue ? normalizeReadingComfortProfile(comfortValue, vocabularyProfile) : initialReadingComfortProfile(vocabularyProfile),
      vocabularyProfile,
      {
        outcome,
        articleDifficulty: updated.estimatedDifficulty ?? validRecommendation.targetDifficulty,
        articleWordCount: countArticleWords(updated.content),
      },
    ));
  }
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
    sourceUrl: canonicalizeSourceUrl(value.sourceUrl),
    createdAt: value.createdAt ?? new Date().toISOString(),
    startedAt: value.startedAt ?? (status === "reading" || status === "finished" ? value.createdAt ?? null : null),
    finishedAt: status === "finished" ? value.finishedAt ?? null : null,
    status,
    estimatedDifficulty: typeof value.estimatedDifficulty === "number" ? value.estimatedDifficulty : null,
    userDifficultyFeedback: value.userDifficultyFeedback ?? null,
    attribution: normalizeAttribution(value.attribution),
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

function normalizeCandidate(value: Partial<CandidateArticle>): CandidateArticle {
  const status = value.status === "dismissed" || value.status === "imported" ? value.status : "available";
  return {
    id: value.id ?? crypto.randomUUID(),
    sourceId: value.sourceId ?? "unknown",
    sourceName: value.sourceName?.trim() || "Unknown source",
    topic: value.topic?.trim() || "General",
    title: value.title?.trim() || "Untitled article",
    url: canonicalizeSourceUrl(value.url) ?? "",
    summary: value.summary?.trim() ?? "",
    author: value.author?.trim() || null,
    publishedAt: value.publishedAt ?? null,
    discoveredAt: value.discoveredAt ?? new Date().toISOString(),
    status,
    articleId: value.articleId ?? null,
    contentId: value.contentId?.trim() || null,
    contentSnapshot: value.contentSnapshot?.trim() || null,
    pool: normalizeContentPool(value.pool, value.sourceId, value.readingLevel),
    successBandMin: normalizeOptionalBand(value.successBandMin),
    successBandMax: normalizeOptionalBand(value.successBandMax),
    readingLevel: typeof value.readingLevel === "number"
      ? Math.min(5, Math.max(0, Math.round(value.readingLevel)))
      : null,
    provenance: normalizeProvenance(value.provenance),
  };
}

function attributionFromCandidate(candidate: CandidateArticle): ArticleAttribution {
  return {
    candidateId: candidate.id,
    sourceId: candidate.sourceId,
    sourceName: candidate.sourceName,
    topic: candidate.topic,
    author: candidate.author,
    publishedAt: candidate.publishedAt,
    provenance: candidate.provenance,
  };
}

function normalizeAttribution(value: Partial<ArticleAttribution> | null | undefined): ArticleAttribution | null {
  if (!value?.candidateId || !value.sourceId) return null;
  return {
    candidateId: value.candidateId,
    sourceId: value.sourceId,
    sourceName: value.sourceName?.trim() || "Unknown source",
    topic: value.topic?.trim() || "General",
    author: value.author?.trim() || null,
    publishedAt: value.publishedAt ?? null,
    provenance: normalizeProvenance(value.provenance),
  };
}

function normalizeContentPool(value: ContentPool | undefined, sourceId?: string, readingLevel?: number | null): ContentPool {
  if (value === "success" || value === "bridge" || value === "open_web") return value;
  if (sourceId?.startsWith("library:")) {
    if (typeof readingLevel === "number" && readingLevel <= 1) return "success";
    if (typeof readingLevel === "number" && readingLevel <= 3) return "bridge";
  }
  return "open_web";
}

function normalizeOptionalBand(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(5, Math.max(0, Math.round(value)))
    : null;
}

function normalizeProvenance(value: Partial<ContentProvenance> | null | undefined): ContentProvenance | null {
  if (!value?.sourceId || !value.originalUrl || !value.license || !value.attribution) return null;
  const originalUrl = canonicalizeSourceUrl(value.originalUrl);
  const sourceUrl = canonicalizeSourceUrl(value.sourceUrl);
  if (!originalUrl || !sourceUrl) return null;
  const validContentTypes: ContentType[] = ["article", "news", "encyclopedia", "poetry", "story", "essay", "other"];
  const validTransformations: ContentTransformation[] = ["excerpt", "cleaned", "modified"];
  return {
    sourceId: value.sourceId,
    sourceName: value.sourceName?.trim() || "Unknown source",
    sourceUrl,
    originalUrl,
    license: value.license.trim(),
    licenseUrl: canonicalizeSourceUrl(value.licenseUrl),
    attribution: value.attribution.trim(),
    author: value.author?.trim() || null,
    publishedAt: value.publishedAt ?? null,
    retrievedAt: value.retrievedAt ?? new Date().toISOString(),
    contentType: validContentTypes.includes(value.contentType as ContentType) ? value.contentType as ContentType : "other",
    transformations: [...new Set((value.transformations ?? []).filter((item): item is ContentTransformation => validTransformations.includes(item as ContentTransformation)))],
  };
}

function normalizeRecommendationEvent(value: Partial<RecommendationEvent>): RecommendationEvent {
  const entryPoint = value.entryPoint === "next_article" ? "next_article" : "feed";
  const components = normalizeRankingComponents(value.components);
  const articleId = value.articleId ?? value.selectedArticleId ?? "";
  const candidateId = value.candidateId ?? "unknown";
  const rank = Math.max(1, Math.round(value.rank ?? 1));
  const score = clamp01(value.score ?? 0);
  const candidateSlate = normalizeCandidateSlate(value.candidateSlate);
  return {
    id: value.id ?? crypto.randomUUID(),
    type: "selected",
    candidateId,
    articleId,
    entryPoint,
    timestamp: value.timestamp ?? new Date().toISOString(),
    modelVersion: Math.max(1, Math.round(value.modelVersion ?? 1)),
    rank,
    score,
    components,
    sourceId: value.sourceId ?? "unknown",
    topic: value.topic?.trim() || "General",
    keywords: [...new Set((value.keywords ?? []).map((word) => normalizeWord(word)).filter(Boolean))].slice(0, 8),
    selectedArticleId: value.selectedArticleId ?? articleId,
    candidateSlate: candidateSlate.length ? candidateSlate : [{
      candidateId,
      articleId,
      rank,
      totalScore: score,
      difficultyScore: 0,
      interestScore: components.interestScore,
      explorationScore: components.explorationScore,
    }],
    rankingVersion: Math.max(1, Math.round(value.rankingVersion ?? value.modelVersion ?? 1)),
    rankingWeights: normalizeRankingWeights(value.rankingWeights),
    vocabularyBand: normalizeVocabularyBand(value.vocabularyBand),
    targetDifficulty: clamp01(value.targetDifficulty ?? 0.24),
    comfortableWords: Math.max(60, Math.round(value.comfortableWords ?? 320)),
    difficultyTolerance: clamp(value.difficultyTolerance ?? 0.2, 0.08, 0.35),
    successPhase: value.successPhase === true,
    explorationType: value.explorationType === "interest_novelty" ? "interest_novelty" : "legacy",
    outcome: value.outcome ? normalizeRecommendationOutcome(value.outcome) : null,
  };
}

function normalizeCandidateSlate(values?: readonly Partial<RecommendationCandidateSnapshot>[]) {
  return (values ?? []).slice(0, 20).map((value, index): RecommendationCandidateSnapshot => ({
    candidateId: value.candidateId ?? "unknown",
    articleId: value.articleId ?? null,
    rank: Math.max(1, Math.round(value.rank ?? index + 1)),
    totalScore: clamp01(value.totalScore ?? 0),
    difficultyScore: clamp01(value.difficultyScore ?? 0),
    interestScore: clamp01(value.interestScore ?? 0.5),
    explorationScore: clamp01(value.explorationScore ?? 0.5),
  }));
}

function normalizeRankingWeights(value?: Partial<RankingWeights>): RankingWeights {
  return {
    interest: clamp01(value?.interest ?? 0.32),
    readability: clamp01(value?.readability ?? 0.42),
    freshness: clamp01(value?.freshness ?? 0.18),
    exploration: clamp01(value?.exploration ?? 0.08),
    baseScore: clamp01(value?.baseScore ?? 0.9),
    diversity: clamp01(value?.diversity ?? 0.1),
  };
}

function normalizeRecommendationOutcome(value: Partial<RecommendationOutcome>): RecommendationOutcome {
  return {
    activeReadingSeconds: Math.max(0, Math.round(value.activeReadingSeconds ?? 0)),
    maxReadingProgress: clamp01(value.maxReadingProgress ?? 0),
    lookupCount: Math.max(0, Math.round(value.lookupCount ?? 0)),
    exposedUniqueWordCount: Math.max(0, Math.round(value.exposedUniqueWordCount ?? 0)),
    lookupFriction: normalizeLookupFriction(value.lookupFriction),
    difficultyFeedback: value.difficultyFeedback === "too_easy" || value.difficultyFeedback === "suitable" || value.difficultyFeedback === "too_hard"
      ? value.difficultyFeedback
      : null,
    finished: value.finished === true,
    recordedAt: value.recordedAt ?? new Date(0).toISOString(),
  };
}

function normalizeVocabularyBand(value?: number) {
  return Math.min(5, Math.max(0, Math.round(value ?? 2)));
}

function normalizeRankingComponents(value?: Partial<RankingComponents>): RankingComponents {
  return {
    interestScore: clamp01(value?.interestScore ?? 0.5),
    readabilityScore: clamp01(value?.readabilityScore ?? 0.5),
    freshnessScore: clamp01(value?.freshnessScore ?? 0.5),
    explorationScore: clamp01(value?.explorationScore ?? 0.5),
    diversityScore: clamp01(value?.diversityScore ?? 1),
  };
}

function normalizeReadingEvent(value: Partial<ReadingEvent>): ReadingEvent {
  return {
    id: value.id ?? crypto.randomUUID(),
    articleId: value.articleId ?? "",
    type: value.type ?? "opened",
    timestamp: value.timestamp ?? new Date().toISOString(),
    candidateId: value.candidateId ?? null,
    recommendationEventId: value.recommendationEventId ?? null,
    entryPoint: normalizeEntryPoint(value.entryPoint),
    metadata: value.metadata ?? {},
  };
}

function normalizeLexicalEvent(value: Partial<LexicalEvent>): LexicalEvent {
  const normalizedWord = normalizeWord(value.normalizedWord ?? value.wordForm ?? "");
  return {
    id: value.id ?? crypto.randomUUID(),
    type: value.type === "lookup" || value.type === "recognition" ? value.type : "exposure",
    articleId: value.articleId ?? "",
    wordForm: value.wordForm ?? normalizedWord,
    normalizedWord,
    contextHash: value.contextHash?.trim() || null,
    timestamp: value.timestamp ?? new Date().toISOString(),
    dictionarySucceeded: typeof value.dictionarySucceeded === "boolean" ? value.dictionarySucceeded : null,
    evidenceApplied: value.evidenceApplied === true,
    phrase: value.phrase?.trim() || null,
    lemmaCandidate: value.lemmaCandidate?.trim() || null,
  };
}

function normalizeEntryPoint(value: ReadingEvent["entryPoint"] | undefined) {
  return value === "feed" || value === "next_article" || value === "resume" || value === "history" || value === "direct"
    ? value
    : null;
}

function normalizeOutcomeMetrics(value?: number | ReadingOutcomeMetrics): ReadingOutcomeMetrics {
  if (typeof value === "number") {
    const readingTimeSeconds = Math.max(0, Math.round(value));
    return { readingTimeSeconds, activeReadingSeconds: readingTimeSeconds, maxReadingProgress: 0, lookupCount: 0, exposedUniqueWordCount: 0 };
  }
  return {
    readingTimeSeconds: Math.max(0, Math.round(value?.readingTimeSeconds ?? 0)),
    activeReadingSeconds: Math.max(0, Math.round(value?.activeReadingSeconds ?? value?.readingTimeSeconds ?? 0)),
    maxReadingProgress: clamp01(value?.maxReadingProgress ?? 0),
    lookupCount: Math.max(0, Math.round(value?.lookupCount ?? 0)),
    exposedUniqueWordCount: Math.max(0, Math.round(value?.exposedUniqueWordCount ?? 0)),
    lookupFriction: normalizeLookupFriction(value?.lookupFriction),
    recommendationEventId: value?.recommendationEventId ?? null,
    candidateId: value?.candidateId ?? null,
    entryPoint: normalizeEntryPoint(value?.entryPoint),
  };
}

function canonicalizeSourceUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    url.hash = "";
    return url.href;
  } catch {
    return trimmed;
  }
}

function createReadingEvent(
  articleId: string,
  type: ReadingEventType,
  metadata: ReadingEvent["metadata"] = {},
  context: {
    entryPoint?: ReadingEvent["entryPoint"];
    recommendationEventId?: string | null;
    candidateId?: string | null;
  } = {},
): ReadingEvent {
  return {
    id: crypto.randomUUID(),
    articleId,
    type,
    timestamp: new Date().toISOString(),
    candidateId: context.candidateId ?? null,
    recommendationEventId: context.recommendationEventId ?? null,
    entryPoint: normalizeEntryPoint(context.entryPoint),
    metadata,
  };
}

function createLexicalEvent(value: Omit<LexicalEvent, "id">): LexicalEvent {
  return normalizeLexicalEvent({ ...value, id: crypto.randomUUID() });
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, Number.isFinite(value) ? value : minimum));
}

function countArticleWords(content: string) {
  return tokenizePreservingText(content).filter((token) => token.type === "word").length;
}
