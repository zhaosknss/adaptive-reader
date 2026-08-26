import { createArticle, findArticleBySourceUrl, setCandidateStatus } from "./storage";
import type { Article, CandidateArticle, ExtractedArticle } from "./types";

export async function prepareCandidateArticle(candidate: CandidateArticle): Promise<Article> {
  const existing = await findArticleBySourceUrl(candidate.url);
  if (existing) {
    await setCandidateStatus(candidate.id, "imported");
    return existing;
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
  await setCandidateStatus(candidate.id, "imported");
  return article;
}
