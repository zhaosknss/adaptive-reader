import type { CandidateArticle, ContentPreferenceKey, ContentPreferences, InterestProfile } from "./types.ts";

export const CONTENT_PREFERENCE_OPTIONS: ReadonlyArray<{ key: ContentPreferenceKey; label: string }> = [
  { key: "science_technology", label: "科学与科技" },
  { key: "history", label: "历史" },
  { key: "culture_knowledge", label: "文化与知识" },
  { key: "fables", label: "寓言" },
  { key: "fairy_tales", label: "童话" },
  { key: "short_stories", label: "短篇故事" },
  { key: "greek_mythology", label: "希腊神话" },
  { key: "poetry", label: "诗歌" },
  { key: "literary_prose", label: "文学散文" },
] as const;

const VALID_KEYS = new Set<ContentPreferenceKey>(CONTENT_PREFERENCE_OPTIONS.map((option) => option.key));

export function emptyContentPreferences(): ContentPreferences {
  return { id: "current", mode: "open", primary: null, secondary: [], updatedAt: null };
}

export function normalizeContentPreferences(value?: Partial<ContentPreferences> | null): ContentPreferences {
  const primary = validKey(value?.primary) ? value.primary : null;
  const secondary = [...new Set(value?.secondary ?? [])]
    .filter((key): key is ContentPreferenceKey => validKey(key) && key !== primary);
  return {
    id: "current",
    mode: value?.mode === "guided" ? "guided" : "open",
    primary,
    secondary,
    updatedAt: value?.updatedAt ?? null,
  };
}

export function contentPreferenceScore(candidate: CandidateArticle, preferences?: ContentPreferences | null) {
  const normalized = normalizeContentPreferences(preferences);
  if (normalized.mode === "open") return 0.5;
  const key = preferenceKeyForTopic(candidate.topic);
  if (!key) return 0.46;
  if (key === normalized.primary) return 0.86;
  if (normalized.secondary.includes(key)) return 0.68;
  return 0.44;
}

export function combineInterestWithPreferences(
  learnedInterest: number,
  preferenceScore: number,
  interestProfile?: InterestProfile | null,
  preferences?: ContentPreferences | null,
) {
  const normalized = normalizeContentPreferences(preferences);
  if (normalized.mode === "open" || (!normalized.primary && normalized.secondary.length === 0)) return round01(learnedInterest);
  const evidenceCount = Math.max(0, interestProfile?.evidenceCount ?? 0);
  const preferenceWeight = Math.max(0.18, 0.62 - evidenceCount * 0.035);
  return round01(learnedInterest * (1 - preferenceWeight) + preferenceScore * preferenceWeight);
}

export function preferenceKeyForTopic(topic: string): ContentPreferenceKey | null {
  const normalized = topic.trim().toLocaleLowerCase("en-US");
  if (normalized === "science" || normalized === "technology" || normalized === "science & technology") {
    return "science_technology";
  }
  return TOPIC_KEYS[normalized] ?? null;
}

function validKey(value: unknown): value is ContentPreferenceKey {
  return typeof value === "string" && VALID_KEYS.has(value as ContentPreferenceKey);
}

function round01(value: number) {
  return Number(Math.min(1, Math.max(0, value)).toFixed(3));
}

const TOPIC_KEYS: Record<string, ContentPreferenceKey> = {
  history: "history",
  "culture & knowledge": "culture_knowledge",
  fables: "fables",
  "fairy tales": "fairy_tales",
  "short stories": "short_stories",
  "greek mythology": "greek_mythology",
  poetry: "poetry",
  "literary prose": "literary_prose",
};
