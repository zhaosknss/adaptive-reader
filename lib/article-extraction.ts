import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import type { ExtractedArticle } from "./types.ts";

const MINIMUM_WORDS = 80;

export function extractArticleFromHtml(html: string, sourceUrl: string): ExtractedArticle {
  const { document } = parseHTML(html);
  const parsed = new Readability(document as unknown as Document, { charThreshold: 300 }).parse();
  if (!parsed?.content) throw new Error("没有识别出可阅读的文章正文");

  const contentDocument = parseHTML(parsed.content).document;
  const blocks = Array.from(contentDocument.querySelectorAll("h2, h3, p, li"))
    .map((element) => {
      const text = cleanText(element.textContent ?? "");
      const isHeading = element.tagName === "H2" || element.tagName === "H3";
      return isHeading || text.split(/\s+/).filter(Boolean).length >= 3 ? text : "";
    })
    .filter(Boolean);
  const content = blocks.join("\n\n");
  if (content.split(/\s+/).filter(Boolean).length < MINIMUM_WORDS) {
    throw new Error("提取到的正文太短，可能不是文章页面");
  }

  const url = new URL(sourceUrl);
  return {
    title: cleanText(parsed.title ?? "") || url.hostname,
    content,
    site: cleanText(parsed.siteName ?? "") || url.hostname.replace(/^www\./, ""),
    sourceUrl: url.href,
  };
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}
