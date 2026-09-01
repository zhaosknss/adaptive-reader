import type { DictionaryResult } from "./types.ts";
import { cacheDefinition, getCachedDefinition } from "./storage.ts";
import { normalizeWord } from "./text.ts";

export interface DictionaryProvider {
  lookup(word: string): Promise<DictionaryResult>;
}

const FALLBACK: Record<string, string> = {
  the: "这；那；这个", be: "是；成为", have: "有；拥有", make: "制作；使得",
  read: "阅读", article: "文章", world: "世界", people: "人们", different: "不同的",
  however: "然而", because: "因为", language: "语言", understand: "理解", familiar: "熟悉的",
};

type LocalDictionaryEntry = [translation: string, phonetic?: string];
type LocalDictionaryShard = Record<string, LocalDictionaryEntry>;
type DictionaryFetch = typeof fetch;

export class LocalDictionaryProvider implements DictionaryProvider {
  private shards = new Map<string, Promise<LocalDictionaryShard>>();
  private extendedShards = new Map<string, Promise<LocalDictionaryShard>>();
  private fetcher: DictionaryFetch;

  constructor(fetcher: DictionaryFetch = globalThis.fetch) {
    this.fetcher = fetcher.bind(globalThis);
  }

  async lookup(word: string): Promise<DictionaryResult> {
    const normalized = normalizeWord(word);
    const candidates = localDictionaryCandidates(normalized);
    for (const candidate of candidates) {
      const shard = await this.loadShard(candidate[0]);
      const entry = shard[candidate];
      if (entry) return localResult(normalized, entry);
    }

    for (const candidate of candidates) {
      if (candidate.length > 1) {
        const extendedShard = await this.loadExtendedShard(candidate.replace(/[^a-z]/g, "").slice(0, 2));
        const extendedEntry = extendedShard[candidate];
        if (extendedEntry) return localResult(normalized, extendedEntry);
      }
    }
    throw new Error("local definition unavailable");
  }

  private loadShard(letter: string) {
    const existing = this.shards.get(letter);
    if (existing) return existing;

    const request = this.fetcher(`/dictionary/${letter}.json`, { signal: AbortSignal.timeout(4500) })
      .then(async (response) => {
        if (!response.ok) throw new Error("local dictionary unavailable");
        return response.json() as Promise<LocalDictionaryShard>;
      })
      .catch((error) => {
        this.shards.delete(letter);
        throw error;
      });
    this.shards.set(letter, request);
    return request;
  }

  private loadExtendedShard(prefix: string) {
    const existing = this.extendedShards.get(prefix);
    if (existing) return existing;

    const request = this.fetcher(`/dictionary/extended/${prefix}.json`, { signal: AbortSignal.timeout(4500) })
      .then(async (response) => {
        if (!response.ok) throw new Error("extended local dictionary unavailable");
        return response.json() as Promise<LocalDictionaryShard>;
      })
      .catch((error) => {
        this.extendedShards.delete(prefix);
        throw error;
      });
    this.extendedShards.set(prefix, request);
    return request;
  }
}

function localResult(word: string, entry: LocalDictionaryEntry): DictionaryResult {
  return {
    word,
    translation: entry[0],
    phonetic: entry[1],
    source: "local",
  };
}

class FreeDictionaryProvider implements DictionaryProvider {
  private local: LocalDictionaryProvider;

  constructor(local = new LocalDictionaryProvider()) {
    this.local = local;
  }

  async lookup(word: string): Promise<DictionaryResult> {
    const cachedRequest = getCachedDefinition(word).catch(() => undefined);

    try {
      const local = await this.local.lookup(word);
      void cacheDefinition(local).catch(() => {
        // The definition is already available; a cache write must not delay reading.
      });
      return local;
    } catch {
      // The remote providers below are only a supplement for words outside the local dictionary.
    }

    const cached = await cachedRequest;
    if (cached && isUsefulTranslation(cached.translation)) return cached;

    const [translation, dictionary] = await Promise.allSettled([
      this.translate(word),
      this.define(word),
    ]);

    const result: DictionaryResult = {
      word,
      translation: translation.status === "fulfilled" ? translation.value : (FALLBACK[word] ?? "暂无中文释义"),
      definition: dictionary.status === "fulfilled" ? dictionary.value.definition : undefined,
      phonetic: dictionary.status === "fulfilled" ? dictionary.value.phonetic : undefined,
      source: translation.status === "fulfilled" || dictionary.status === "fulfilled" ? "remote" : "fallback",
    };
    if (isUsefulTranslation(result.translation)) await cacheDefinition(result);
    return result;
  }

  private async translate(word: string) {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|zh-CN`;
    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error("translation unavailable");
    const data = await response.json() as { responseData?: { translatedText?: string } };
    const value = data.responseData?.translatedText?.trim();
    if (!isUsefulTranslation(value) || value.toLowerCase() === word.toLowerCase()) throw new Error("empty translation");
    return value;
  }

  private async define(word: string) {
    const response = await fetchWithTimeout(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (!response.ok) throw new Error("definition unavailable");
    const data = await response.json() as Array<{ phonetic?: string; meanings?: Array<{ definitions?: Array<{ definition?: string }> }> }>;
    const entry = data[0];
    const definition = entry?.meanings?.flatMap((meaning) => meaning.definitions ?? []).find((item) => item.definition)?.definition;
    return { phonetic: entry?.phonetic, definition };
  }
}

function fetchWithTimeout(url: string, timeoutMs = 4500) {
  return fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
}

export const dictionaryProvider: DictionaryProvider = new FreeDictionaryProvider();

export function localDictionaryCandidates(word: string) {
  const candidates = new Set([normalizeWord(word)]);
  const add = (candidate: string) => {
    if (candidate.length > 1) candidates.add(candidate);
  };

  if (word.endsWith("ies") && word.length > 4) add(`${word.slice(0, -3)}y`);
  if (word.endsWith("ves") && word.length > 4) {
    add(`${word.slice(0, -3)}f`);
    add(`${word.slice(0, -3)}fe`);
  }
  if (word.endsWith("es") && word.length > 3) {
    add(word.slice(0, -2));
    add(word.slice(0, -1));
  } else if (word.endsWith("s") && word.length > 3) {
    add(word.slice(0, -1));
  }
  if (word.endsWith("ied") && word.length > 4) add(`${word.slice(0, -3)}y`);
  if (word.endsWith("ed") && word.length > 3) {
    add(word.slice(0, -2));
    add(word.slice(0, -1));
    add(removeDoubledEnding(word.slice(0, -2)));
  }
  if (word.endsWith("ing") && word.length > 5) {
    const stem = word.slice(0, -3);
    add(stem);
    add(`${stem}e`);
    add(removeDoubledEnding(stem));
  }
  return [...candidates];
}

function removeDoubledEnding(value: string) {
  return value.length > 2 && value.at(-1) === value.at(-2) ? value.slice(0, -1) : value;
}

function isUsefulTranslation(value?: string): value is string {
  return Boolean(
    value
    && value !== "暂无中文释义"
    && !value.toUpperCase().startsWith("MYMEMORY WARNING"),
  );
}
