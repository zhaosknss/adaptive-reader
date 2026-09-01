import { createArticle, findArticleByCandidateId, findArticleBySourceUrl, linkCandidateToArticle } from "./storage.ts";
import { getBuiltinReading } from "./builtin-readings.ts";
import type { Article, CandidateArticle, ExtractedArticle } from "./types.ts";

export async function prepareCandidateArticle(candidate: CandidateArticle): Promise<Article> {
  const linked = await findArticleByCandidateId(candidate.id);
  if (linked) return linkCandidateToArticle(candidate, linked.id);

  const existing = await findArticleBySourceUrl(candidate.url);
  if (existing) {
    return linkCandidateToArticle(candidate, existing.id);
  }

  const builtin = getBuiltinReading(candidate.contentId);
  if (builtin) {
    const article = await createArticle(builtin.title, builtin.content, builtin.sourceUrl);
    return linkCandidateToArticle(candidate, article.id);
  }

  const response = await fetch("/api/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: candidate.url }),
  });
  const result = await response.json() as ExtractedArticle | { error: string };
  if (!response.ok || "error" in result) {
    throw new Error("error" in result ? result.error : "无法读取这篇文章");
  }
  const duplicate = await findArticleBySourceUrl(result.sourceUrl);
  const article = duplicate ?? await createArticle(result.title, result.content, result.sourceUrl);
  return linkCandidateToArticle(candidate, article.id);
}
