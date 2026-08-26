import type { DictionaryResult } from "./types";
import { cacheDefinition, getCachedDefinition } from "./storage";

export interface DictionaryProvider {
  lookup(word: string): Promise<DictionaryResult>;
}

const FALLBACK: Record<string, string> = {
  the: "这；那；这个", be: "是；成为", have: "有；拥有", make: "制作；使得",
  read: "阅读", article: "文章", world: "世界", people: "人们", different: "不同的",
  however: "然而", because: "因为", language: "语言", understand: "理解", familiar: "熟悉的",
};

class FreeDictionaryProvider implements DictionaryProvider {
  async lookup(word: string): Promise<DictionaryResult> {
    const cached = await getCachedDefinition(word);
    if (cached) return cached;

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
    if (result.source === "remote") await cacheDefinition(result);
    return result;
  }

  private async translate(word: string) {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|zh-CN`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("translation unavailable");
    const data = await response.json() as { responseData?: { translatedText?: string } };
    const value = data.responseData?.translatedText?.trim();
    if (!value || value.toLowerCase() === word.toLowerCase()) throw new Error("empty translation");
    return value;
  }

  private async define(word: string) {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (!response.ok) throw new Error("definition unavailable");
    const data = await response.json() as Array<{ phonetic?: string; meanings?: Array<{ definitions?: Array<{ definition?: string }> }> }>;
    const entry = data[0];
    const definition = entry?.meanings?.flatMap((meaning) => meaning.definitions ?? []).find((item) => item.definition)?.definition;
    return { phonetic: entry?.phonetic, definition };
  }
}

export const dictionaryProvider: DictionaryProvider = new FreeDictionaryProvider();
