export type ArticleStatus = "unread" | "reading" | "finished" | "skipped";
export type DifficultyFeedback = "too_easy" | "suitable" | "too_hard";
export type ReadingEventType = "opened" | "word_lookup" | "finished" | "skipped" | "difficulty_feedback";

export type VocabularyProfile = {
  id: "current";
  estimatedBand: number;
  frequencyThreshold: number;
  confidence: number;
  assessedAt: string;
  assessmentVersion: number;
};

export type CandidateStatus = "available" | "dismissed" | "imported";

export type CandidateArticle = {
  id: string;
  sourceId: string;
  sourceName: string;
  topic: string;
  title: string;
  url: string;
  summary: string;
  author: string | null;
  publishedAt: string | null;
  discoveredAt: string;
  status: CandidateStatus;
};

export type ContentSourceDefinition = {
  id: string;
  name: string;
  topic: string;
  feedUrl: string;
  siteUrl: string;
};

export type Article = {
  id: string;
  title: string;
  content: string;
  sourceUrl: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  status: ArticleStatus;
  estimatedDifficulty: number | null;
  userDifficultyFeedback: DifficultyFeedback | null;
};

export type WordState = {
  word: string;
  normalizedWord: string;
  lookupCount: number;
  seenCount: number;
  familiarity: number;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  lastLookupAt: string | null;
};

export type ReadingEvent = {
  id: string;
  articleId: string;
  type: ReadingEventType;
  timestamp: string;
  metadata: Record<string, string | number | boolean | null>;
};

export type ExtractedArticle = {
  title: string;
  content: string;
  site: string;
  sourceUrl: string;
};

export type DictionaryResult = {
  word: string;
  translation: string;
  definition?: string;
  phonetic?: string;
  source: "cache" | "remote" | "fallback";
};
