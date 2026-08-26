import type { ContentSourceDefinition } from "./types.ts";

export const STARTER_SOURCES: readonly ContentSourceDefinition[] = [
  {
    id: "mit-news",
    name: "MIT News",
    topic: "Science & Technology",
    feedUrl: "https://news.mit.edu/rss/feed",
    siteUrl: "https://news.mit.edu/",
  },
  {
    id: "ars-technica",
    name: "Ars Technica",
    topic: "Technology",
    feedUrl: "https://feeds.arstechnica.com/arstechnica/index",
    siteUrl: "https://arstechnica.com/",
  },
  {
    id: "smithsonian-latest",
    name: "Smithsonian Magazine",
    topic: "Culture & Knowledge",
    feedUrl: "https://www.smithsonianmag.com/rss/latest_articles/",
    siteUrl: "https://www.smithsonianmag.com/",
  },
  {
    id: "smithsonian-history",
    name: "Smithsonian History",
    topic: "History",
    feedUrl: "https://www.smithsonianmag.com/rss/history/",
    siteUrl: "https://www.smithsonianmag.com/history/",
  },
  {
    id: "smithsonian-science",
    name: "Smithsonian Science",
    topic: "Science",
    feedUrl: "https://www.smithsonianmag.com/rss/science-nature/",
    siteUrl: "https://www.smithsonianmag.com/science-nature/",
  },
] as const;
