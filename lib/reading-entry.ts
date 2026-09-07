import type { Article, CandidateArticle } from "./types.ts";

export function selectSavedReadingArticle(articles: readonly Article[]): Article | undefined {
  return articles.find((article) => article.status === "reading")
    ?? articles.find((article) => article.status === "unread");
}

export function unreadCandidates(candidates: readonly CandidateArticle[], articles: readonly Article[]) {
  const completedArticleIds = new Set(
    articles
      .filter((article) => article.status === "finished" || article.status === "skipped")
      .map((article) => article.id),
  );
  return candidates.filter((candidate) => !candidate.articleId || !completedArticleIds.has(candidate.articleId));
}
