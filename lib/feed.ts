import { DOMParser, parseHTML } from "linkedom";
import type { CandidateArticle, ContentSourceDefinition } from "./types.ts";

export function parseFeed(
  xml: string,
  source: ContentSourceDefinition,
  discoveredAt = new Date().toISOString(),
): CandidateArticle[] {
  const normalizedXml = xml.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, (_match, value: string) => escapeXmlText(value));
  const document = new DOMParser().parseFromString(normalizedXml, "text/xml");
  if (!document) return [];
  const rssItems = Array.from(document.querySelectorAll("item")) as unknown as Element[];
  const entries = rssItems.length
    ? rssItems
    : Array.from(document.querySelectorAll("entry")) as unknown as Element[];

  return entries.flatMap((entry) => {
    const title = cleanText(findText(entry, ["title"]));
    const rawLink = rssItems.length ? findText(entry, ["link"]) : atomLink(entry);
    const url = normalizePublicUrl(rawLink, source.siteUrl);
    if (!title || !url) return [];

    const rawSummary = findText(entry, ["description", "summary", "content"]);
    const summary = cleanText(stripMarkup(rawSummary)).slice(0, 520);
    const author = cleanText(findText(entry, ["author name", "creator", "author"])) || null;
    const publishedAt = normalizeDate(findText(entry, ["pubDate", "published", "updated", "date"]));

    return [{
      id: `candidate-${stableHash(`${source.id}:${url}`)}`,
      sourceId: source.id,
      sourceName: source.name,
      topic: source.topic,
      title,
      url,
      summary,
      author,
      publishedAt,
      discoveredAt,
      status: "available" as const,
      articleId: null,
    }];
  });
}

function findText(root: Element, selectors: readonly string[]) {
  for (const selector of selectors) {
    try {
      const node = root.querySelector(selector) as unknown as Element | null;
      const value = node?.textContent?.trim() || node?.innerHTML?.trim();
      if (value) return unwrapCdata(value);
    } catch {
      continue;
    }
  }
  return "";
}

function unwrapCdata(value: string) {
  return value.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "");
}

function escapeXmlText(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function atomLink(entry: Element) {
  const links = Array.from(entry.querySelectorAll("link"));
  const preferred = links.find((link) => !link.getAttribute("rel") || link.getAttribute("rel") === "alternate") ?? links[0];
  return preferred?.getAttribute("href")?.trim() || preferred?.textContent?.trim() || "";
}

function stripMarkup(value: string) {
  if (!value.includes("<")) return value;
  return parseHTML(`<html><body>${value}</body></html>`).document.body.textContent ?? value;
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeDate(value: string) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString();
}

function normalizePublicUrl(value: string, baseUrl: string) {
  try {
    const url = new URL(value, baseUrl);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
