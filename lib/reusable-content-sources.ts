import type { CandidateArticle, ContentPool, ContentProvenance } from "./types.ts";
import { SIMPLE_WIKI_SNAPSHOTS_A, type SimpleWikiSnapshot } from "./simple-wiki-snapshots-a.ts";
import { SIMPLE_WIKI_SNAPSHOTS_B } from "./simple-wiki-snapshots-b.ts";

const SIMPLE_WIKIPEDIA_API = "https://simple.wikipedia.org/w/api.php";
const SIMPLE_WIKIPEDIA_SITE = "https://simple.wikipedia.org/";
const WIKINEWS_API = "https://en.wikinews.org/w/api.php";
const WIKINEWS_SITE = "https://en.wikinews.org/";
const WIKINEWS_CC_BY_4_START = "2024-12-16T00:00:00.000Z";
const WIKIMEDIA_USER_AGENT = "JustRead/0.2 (adaptive English reader; content attribution enabled)";

export type ReusableSourceResult = {
  candidates: CandidateArticle[];
  failedSourceCount: number;
};

type TopicTitles = {
  topic: string;
  titles: readonly string[];
};

type WikimediaPage = {
  pageid?: number;
  title?: string;
  extract?: string;
  fullurl?: string;
  missing?: boolean;
  revisions?: Array<{ timestamp?: string; user?: string }>;
};

type WikimediaResponse = {
  query?: { pages?: WikimediaPage[] };
};

const SIMPLE_SUCCESS_TITLES: readonly TopicTitles[] = [
  {
    topic: "Science & Nature",
    titles: [
      "Water", "Rain", "Snow", "Wind", "Sun", "Moon", "Earth", "Ocean", "River", "Lake",
      "Mountain", "Forest", "Tree", "Flower", "Bird", "Bee", "Ant", "Butterfly", "Fire", "Ice",
      "Light", "Sound", "Color", "Star", "Planet", "Fossil", "Dinosaur", "Gravity",
    ],
  },
  {
    topic: "Life & Ideas",
    titles: [
      "Sleep", "Dream", "Walking", "Friendship", "Humour", "Coffee", "Tea", "Bread", "Rice",
      "Chocolate", "Music", "Dance", "Painting", "Photography", "Book", "Writing", "Library",
      "Museum", "Park", "Garden", "City", "Village", "Map", "Calendar", "Clock", "Money",
    ],
  },
  {
    topic: "Technology & Culture",
    titles: [
      "Bicycle", "Train", "Telephone", "Radio", "Television", "Internet", "Movie", "Theatre",
      "Poetry", "Myth", "Computer", "Robot", "Spaceflight", "Paper", "Compass", "Democracy",
      "Medicine", "Vaccine", "Brain", "Heart", "Blood", "Energy",
    ],
  },
] as const;

const SIMPLE_BRIDGE_TITLES: readonly TopicTitles[] = [
  {
    topic: "History",
    titles: [
      "Ancient Egypt", "Ancient Greece", "Roman Empire", "Silk Road", "Renaissance",
      "Industrial Revolution", "Printing press", "History of writing", "History of the Internet",
      "Apollo 11", "Age of Discovery", "Scientific revolution", "French Revolution",
      "Great Depression", "United Nations", "Human rights", "Archaeology", "Stone Age",
    ],
  },
  {
    topic: "Science & Technology",
    titles: [
      "Solar System", "Climate change", "Evolution", "Natural selection", "DNA", "Electricity",
      "Renewable energy", "Artificial intelligence", "World Wide Web", "Photography", "Vaccination",
      "Biodiversity", "Ecosystem", "Black hole", "International Space Station", "Plate tectonics",
      "Quantum mechanics", "Microorganism", "Human brain", "Computer science",
    ],
  },
  {
    topic: "People & Culture",
    titles: [
      "Leonardo da Vinci", "Marie Curie", "Charles Darwin", "Ada Lovelace", "Alan Turing",
      "Albert Einstein", "Nelson Mandela", "Mahatma Gandhi", "Martin Luther King Jr.", "Jane Austen",
      "William Shakespeare", "Vincent van Gogh", "Pablo Picasso", "Jazz", "Classical music",
      "Philosophy", "Psychology", "Economics", "Architecture", "Cultural heritage",
    ],
  },
] as const;

export const REUSABLE_CONTENT_TARGETS = {
  simpleSuccess: SIMPLE_WIKI_SNAPSHOTS_A.length,
  simpleBridge: SIMPLE_WIKI_SNAPSHOTS_B.length,
  wikinewsBridge: 20,
} as const;

export async function fetchReusableContentCandidates(
  discoveredAt = new Date().toISOString(),
  fetcher: typeof fetch = fetch,
): Promise<ReusableSourceResult> {
  // The checked-in extracts keep the core reading loop available when Wikimedia
  // is slow or blocked. Live API results are preferred and deduplicated by page.
  const snapshots = [
    ...snapshotCandidates(SIMPLE_WIKI_SNAPSHOTS_A, "success", 0, 1, discoveredAt),
    ...snapshotCandidates(SIMPLE_WIKI_SNAPSHOTS_B, "bridge", 1, 3, discoveredAt),
  ];
  const externalResults = Promise.allSettled([
    fetchSimpleWikipediaPool("success", SIMPLE_SUCCESS_TITLES, 3, 0, 1, discoveredAt, fetcher),
    fetchSimpleWikipediaPool("bridge", SIMPLE_BRIDGE_TITLES, 7, 0, 3, discoveredAt, fetcher),
    fetchWikinewsBridge(discoveredAt, fetcher),
  ]);
  const results = await Promise.race([
    externalResults,
    new Promise<PromiseSettledResult<CandidateArticle[]>[]>((resolve) => setTimeout(() => resolve([]), 1_000)),
  ]);

  return {
    candidates: deduplicate([
      ...results.flatMap((result) => result.status === "fulfilled" ? result.value : []),
      ...snapshots,
    ]),
    failedSourceCount: results.length
      ? results.filter((result) => result.status === "rejected").length
      : 3,
  };
}

function snapshotCandidates(
  snapshots: readonly SimpleWikiSnapshot[],
  pool: Extract<ContentPool, "success" | "bridge">,
  successBandMin: number,
  successBandMax: number,
  discoveredAt: string,
) {
  return snapshots.map((snapshot) => {
    const provenance: ContentProvenance = {
      sourceId: "simple-wikipedia",
      sourceName: "Simple English Wikipedia",
      sourceUrl: SIMPLE_WIKIPEDIA_SITE,
      originalUrl: snapshot.originalUrl,
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      attribution: "Simple English Wikipedia contributors",
      author: null,
      publishedAt: null,
      retrievedAt: "2026-09-03T00:00:00.000Z",
      contentType: "encyclopedia",
      transformations: ["excerpt", "cleaned"],
    };
    return candidateFromPage({}, {
      id: `simplewiki:snapshot:${stableHash(snapshot.originalUrl)}:${pool}`,
      title: snapshot.title,
      content: snapshot.content,
      originalUrl: snapshot.originalUrl,
      topic: snapshot.topic,
      pool,
      successBandMin,
      successBandMax,
      provenance,
      discoveredAt,
    });
  });
}

async function fetchSimpleWikipediaPool(
  pool: Extract<ContentPool, "success" | "bridge">,
  groups: readonly TopicTitles[],
  sentenceLimit: number,
  successBandMin: number,
  successBandMax: number,
  discoveredAt: string,
  fetcher: typeof fetch,
) {
  const topicByTitle = new Map(groups.flatMap((group) => group.titles.map((title) => [title.toLocaleLowerCase("en-US"), group.topic] as const)));
  const titles = groups.flatMap((group) => [...group.titles]);
  const pageBatches = await Promise.all(chunks(titles, 40).map(async (batch) => {
    const url = new URL(SIMPLE_WIKIPEDIA_API);
    url.search = new URLSearchParams({
      action: "query",
      prop: "extracts|info",
      inprop: "url",
      exintro: "1",
      explaintext: "1",
      exsentences: String(sentenceLimit),
      redirects: "1",
      titles: batch.join("|"),
      format: "json",
      formatversion: "2",
    }).toString();
    const payload = await fetchWikimediaJson(url, fetcher);
    return payload.query?.pages ?? [];
  }));
  const pages = pageBatches.flat();

  return pages.flatMap((page) => {
    const title = page.title?.trim();
    const content = cleanExtract(page.extract ?? "");
    const originalUrl = validHttpUrl(page.fullurl) ?? (title ? `${SIMPLE_WIKIPEDIA_SITE}wiki/${encodeURIComponent(title.replace(/ /g, "_"))}` : null);
    if (!title || !originalUrl || page.missing || wordCount(content) < 18) return [];
    const topic = topicByTitle.get(title.toLocaleLowerCase("en-US")) ?? "Knowledge";
    const provenance: ContentProvenance = {
      sourceId: "simple-wikipedia",
      sourceName: "Simple English Wikipedia",
      sourceUrl: SIMPLE_WIKIPEDIA_SITE,
      originalUrl,
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      attribution: "Simple English Wikipedia contributors",
      author: null,
      publishedAt: null,
      retrievedAt: discoveredAt,
      contentType: "encyclopedia",
      transformations: ["excerpt", "cleaned"],
    };
    return [candidateFromPage(page, {
      id: `simplewiki:${page.pageid ?? stableHash(originalUrl)}:${pool}`,
      title,
      content,
      originalUrl,
      topic,
      pool,
      successBandMin,
      successBandMax,
      provenance,
      discoveredAt,
    })];
  });
}

async function fetchWikinewsBridge(discoveredAt: string, fetcher: typeof fetch) {
  const url = new URL(WIKINEWS_API);
  url.search = new URLSearchParams({
    action: "query",
    generator: "categorymembers",
    gcmtitle: "Category:Published",
    gcmnamespace: "0",
    gcmlimit: "20",
    gcmsort: "timestamp",
    gcmdir: "older",
    prop: "extracts|info|revisions",
    inprop: "url",
    explaintext: "1",
    exsectionformat: "plain",
    rvprop: "timestamp|user",
    rvdir: "newer",
    rvlimit: "1",
    format: "json",
    formatversion: "2",
  }).toString();
  const payload = await fetchWikimediaJson(url, fetcher);
  return (payload.query?.pages ?? []).flatMap((page) => {
    const title = page.title?.trim();
    const publishedAt = normalizeDate(page.revisions?.[0]?.timestamp);
    const originalUrl = validHttpUrl(page.fullurl);
    const content = excerptWords(cleanExtract(page.extract ?? ""), 380);
    if (!title || !originalUrl || !publishedAt || publishedAt < WIKINEWS_CC_BY_4_START || wordCount(content) < 90) return [];
    const provenance: ContentProvenance = {
      sourceId: "wikinews",
      sourceName: "Wikinews Archive",
      sourceUrl: WIKINEWS_SITE,
      originalUrl,
      license: "CC BY 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
      attribution: "Wikinews",
      author: page.revisions?.[0]?.user?.trim() || null,
      publishedAt,
      retrievedAt: discoveredAt,
      contentType: "news",
      transformations: ["excerpt", "cleaned"],
    };
    return [candidateFromPage(page, {
      id: `wikinews:${page.pageid ?? stableHash(originalUrl)}`,
      title,
      content,
      originalUrl,
      topic: "World & Society",
      pool: "bridge",
      successBandMin: 1,
      successBandMax: 3,
      provenance,
      discoveredAt,
    })];
  });
}

function candidateFromPage(
  page: WikimediaPage,
  input: {
    id: string;
    title: string;
    content: string;
    originalUrl: string;
    topic: string;
    pool: ContentPool;
    successBandMin: number;
    successBandMax: number;
    provenance: ContentProvenance;
    discoveredAt: string;
  },
): CandidateArticle {
  return {
    id: input.id,
    sourceId: input.provenance.sourceId,
    sourceName: input.provenance.sourceName,
    topic: input.topic,
    title: input.title,
    url: input.originalUrl,
    summary: input.content.slice(0, 520),
    author: input.provenance.author,
    publishedAt: input.provenance.publishedAt,
    discoveredAt: input.discoveredAt,
    status: "available",
    articleId: null,
    contentId: null,
    contentSnapshot: input.content,
    pool: input.pool,
    successBandMin: input.successBandMin,
    successBandMax: input.successBandMax,
    readingLevel: input.successBandMin,
    provenance: input.provenance,
  };
}

async function fetchWikimediaJson(url: URL, fetcher: typeof fetch): Promise<WikimediaResponse> {
  const response = await fetcher(url, {
    headers: {
      Accept: "application/json",
      "Api-User-Agent": WIKIMEDIA_USER_AGENT,
      "User-Agent": WIKIMEDIA_USER_AGENT,
    },
    signal: AbortSignal.timeout(3_500),
  });
  if (!response.ok) throw new Error(`Wikimedia API returned ${response.status}`);
  return await response.json() as WikimediaResponse;
}

function cleanExtract(value: string) {
  return value
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter((paragraph) => paragraph && !/^=+.*=+$/.test(paragraph))
    .join("\n\n")
    .trim();
}

function excerptWords(value: string, maximumWords: number) {
  const words = value.split(/\s+/);
  if (words.length <= maximumWords) return value;
  const excerpt = words.slice(0, maximumWords).join(" ");
  const sentenceEnd = Math.max(excerpt.lastIndexOf("."), excerpt.lastIndexOf("?"), excerpt.lastIndexOf("!"));
  return (sentenceEnd > excerpt.length * 0.65 ? excerpt.slice(0, sentenceEnd + 1) : excerpt).trim();
}

function wordCount(value: string) {
  return value.match(/[A-Za-z]+(?:['’][A-Za-z]+)*/g)?.length ?? 0;
}

function normalizeDate(value?: string) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString();
}

function validHttpUrl(value?: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function chunks<T>(values: readonly T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) result.push(values.slice(index, index + size));
  return result;
}

function deduplicate(candidates: readonly CandidateArticle[]) {
  const identities = new Set<string>();
  return candidates.filter((candidate) => {
    const identity = candidate.provenance?.originalUrl ?? candidate.url;
    if (identities.has(identity)) return false;
    identities.add(identity);
    return true;
  });
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
