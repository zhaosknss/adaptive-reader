const WORD_PATTERN = /[A-Za-z]+(?:['’][A-Za-z]+)*/g;

export type TextToken = { type: "word" | "text"; value: string; normalized?: string };

export function normalizeWord(value: string) {
  return value.toLocaleLowerCase("en-US").replace(/’/g, "'");
}

export function tokenizePreservingText(text: string): TextToken[] {
  const tokens: TextToken[] = [];
  let cursor = 0;
  for (const match of text.matchAll(WORD_PATTERN)) {
    const index = match.index ?? 0;
    if (index > cursor) tokens.push({ type: "text", value: text.slice(cursor, index) });
    tokens.push({ type: "word", value: match[0], normalized: normalizeWord(match[0]) });
    cursor = index + match[0].length;
  }
  if (cursor < text.length) tokens.push({ type: "text", value: text.slice(cursor) });
  return tokens;
}

export function uniqueWords(text: string) {
  return [...new Set(tokenizePreservingText(text).filter((token) => token.type === "word").map((token) => token.normalized!))];
}

export function readingMinutes(text: string) {
  const words = tokenizePreservingText(text).filter((token) => token.type === "word").length;
  return Math.max(1, Math.ceil(words / 180));
}

export function previewText(text: string, length = 150) {
  const compact = text.replace(/\s+/g, " ").trim();
  return compact.length > length ? `${compact.slice(0, length).trimEnd()}…` : compact;
}
