export type ArticleStatus = "unread" | "reading" | "finished" | "skipped";
export type DifficultyFeedback = "too_easy" | "suitable" | "too_hard";
export type ReadingEventType = "opened" | "word_lookup" | "finished" | "skipped" | "difficulty_feedback";
export type ReadingEntryPoint = "feed" | "next_article" | "resume" | "history" | "direct";

export type RankingComponents = {
  interestScore: number;
  readabilityScore: number;
  freshnessScore: number;
  explorationScore: number;
  diversityScore: number;
};

export type RankingWeights = {
  interest: number;
  readability: number;
  freshness: number;
  exploration: number;
  baseScore: number;
  diversity: number;
};

export type VocabularyProfile = {
  id: "current";
  estimatedBand: number;
  frequencyThreshold: number;
  confidence: number;
  assessedAt: string;
  assessmentVersion: number;
};

export type CandidateStatus = "available" | "dismissed" | "imported";

export type ContentPreferenceKey =
  | "science_technology"
  | "history"
  | "culture_knowledge"
  | "fables"
  | "fairy_tales"
  | "short_stories"
  | "greek_mythology"
  | "poetry"
  | "literary_prose";

export type ContentPreferences = {
  id: "current";
  mode: "open" | "guided";
  primary: ContentPreferenceKey | null;
  secondary: ContentPreferenceKey[];
  updatedAt: string | null;
};

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
  articleId: string | null;
  contentId?: string | null;
  readingLevel?: number | null;
};

export type ArticleAttribution = {
  candidateId: string;
  sourceId: string;
  sourceName: string;
  topic: string;
  author: string | null;
  publishedAt: string | null;
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
  attribution: ArticleAttribution | null;
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

export type LexicalEventType = "exposure" | "lookup" | "recognition";

export type LexicalEvent = {
  id: string;
  type: LexicalEventType;
  articleId: string;
  wordForm: string;
  normalizedWord: string;
  contextHash: string | null;
  timestamp: string;
  dictionarySucceeded: boolean | null;
  evidenceApplied: boolean;
  phrase?: string | null;
  lemmaCandidate?: string | null;
};

export type ReadingEvent = {
  id: string;
  articleId: string;
  type: ReadingEventType;
  timestamp: string;
  candidateId: string | null;
  recommendationEventId: string | null;
  entryPoint: ReadingEntryPoint | null;
  metadata: Record<string, string | number | boolean | null>;
};

export type RecommendationEvent = {
  id: string;
  type: "selected";
  candidateId: string;
  articleId: string;
  entryPoint: Extract<ReadingEntryPoint, "feed" | "next_article">;
  timestamp: string;
  modelVersion: number;
  rank: number;
  score: number;
  components: RankingComponents;
  sourceId: string;
  topic: string;
  keywords: string[];
  selectedArticleId: string;
  candidateSlate: RecommendationCandidateSnapshot[];
  rankingVersion: number;
  rankingWeights: RankingWeights;
  vocabularyBand: number;
  targetDifficulty: number;
  explorationType: "interest_novelty" | "legacy";
  outcome: RecommendationOutcome | null;
};

export type RecommendationCandidateSnapshot = {
  candidateId: string;
  articleId: string | null;
  rank: number;
  totalScore: number;
  difficultyScore: number;
  interestScore: number;
  explorationScore: number;
};

export type RecommendationOutcome = {
  activeReadingSeconds: number;
  maxReadingProgress: number;
  lookupCount: number;
  exposedUniqueWordCount: number;
  difficultyFeedback: DifficultyFeedback | null;
  finished: boolean;
  recordedAt: string;
};

export type ReadingEntryContext = {
  entryPoint: ReadingEntryPoint;
  recommendationEventId?: string | null;
  candidateId?: string | null;
};

export type InterestFeatureState = {
  score: number;
  evidenceCount: number;
  updatedAt: string;
};

export type InterestProfile = {
  id: "current";
  source: Record<string, InterestFeatureState>;
  topic: Record<string, InterestFeatureState>;
  keyword: Record<string, InterestFeatureState>;
  evidenceCount: number;
  processedRecommendationEventIds: string[];
  updatedAt: string | null;
  modelVersion: number;
};

export type ReadingOutcomeMetrics = {
  readingTimeSeconds: number;
  activeReadingSeconds?: number;
  maxReadingProgress?: number;
  lookupCount: number;
  exposedUniqueWordCount?: number;
  recommendationEventId?: string | null;
  candidateId?: string | null;
  entryPoint?: ReadingEntryPoint | null;
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
  source: "cache" | "local" | "remote" | "fallback";
};
