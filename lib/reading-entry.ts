import type { Article } from "./types.ts";

export function selectSavedReadingArticle(articles: readonly Article[]): Article | undefined {
  return articles.find((article) => article.status === "reading")
    ?? articles.find((article) => article.status === "unread");
}
