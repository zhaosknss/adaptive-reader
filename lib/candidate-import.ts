import { createArticle, findArticleByCandidateId, findArticleBySourceUrl, linkCandidateToArticle } from "./storage.ts";
import { getBuiltinReading } from "./builtin-readings.ts";
import type { Article, CandidateArticle, ExtractedArticle } from "./types.ts";

export type CandidateArticleDraft = {
  title: string;
  content: string;
  sourceUrl: string;
  existingArticle: Article | null;
};

export async function inspectCandidateArticle(candidate: CandidateArticle): Promise<CandidateArticleDraft> {
  const linked = await findArticleByCandidateId(candidate.id);
  if (linked) return draftFromArticle(linked);

  const existing = await findArticleBySourceUrl(candidate.url);
  if (existing) return draftFromArticle(existing);

  const builtin = getBuiltinReading(candidate.contentId);
  if (builtin) {
    return {
      title: builtin.title,
      content: builtin.content,
      sourceUrl: builtin.sourceUrl,
      existingArticle: null,
    };
  }

  if (candidate.contentSnapshot?.trim()) {
    return {
      title: candidate.title,
      content: candidate.contentSnapshot.trim(),
      sourceUrl: candidate.provenance?.originalUrl ?? candidate.url,
      existingArticle: null,
    };
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
  if (duplicate) return draftFromArticle(duplicate);
  return {
    title: result.title,
    content: result.content,
    sourceUrl: result.sourceUrl,
    existingArticle: null,
  };
}

export async function materializeCandidateArticle(
  candidate: CandidateArticle,
  draft: CandidateArticleDraft,
): Promise<Article> {
  const article = draft.existingArticle
    ?? await createArticle(draft.title, draft.content, draft.sourceUrl);
  return linkCandidateToArticle(candidate, article.id);
}

export async function prepareCandidateArticle(candidate: CandidateArticle): Promise<Article> {
  return materializeCandidateArticle(candidate, await inspectCandidateArticle(candidate));
}

function draftFromArticle(article: Article): CandidateArticleDraft {
  return {
    title: article.title,
    content: article.content,
    sourceUrl: article.sourceUrl ?? "",
    existingArticle: article,
  };
}
