import { scraper4khdhub } from "../providers/4khdhub";
import { scraperHdHub4u } from "../providers/hdhub4u";
import { CATEGORIES, type ScrapedItem, type ScrapedDetail, type CategoryConfig, type ScraperSource } from "../types/scraper";
import type { ContentItem, MovieDetail, TvDetail } from "../types/content";

// ── Debug Logger ──────────────────────────────────────────

const DEBUG = import.meta.env.DEV;

function logScraper(label: string, ...args: unknown[]) {
  if (DEBUG) console.log(`%c[scraper] %c${label}`, "color:#4F8CFF;font-weight:bold", "color:inherit", ...args);
}

function logScraperError(label: string, ...args: unknown[]) {
  if (DEBUG) console.error(`%c[scraper] %c${label}`, "color:#ff4444;font-weight:bold", "color:inherit", ...args);
}

// ── Provider Registry ──────────────────────────────────────

export type ScraperProvider = {
  fetchHome: (page?: number) => Promise<{ items: ScrapedItem[]; totalPages: number }>;
  fetchCategory: (path: string, page?: number) => Promise<{ items: ScrapedItem[]; totalPages: number }>;
  fetchDetail: (slug: string) => Promise<ScrapedDetail>;
  search: (query: string) => Promise<ScrapedItem[]>;
};

const PROVIDERS: Record<ScraperSource, ScraperProvider> = {
  "4khdhub": scraper4khdhub,
  "hdhub4u": scraperHdHub4u,
};

// ── Bridge: ScrapedItem → ContentItem ──────────────────────

export function scrapedToContentItem(item: ScrapedItem, source: ScraperSource = "4khdhub"): ContentItem {
  return {
    id: `${source}:${item.slug}`,
    title: item.title,
    year: item.year,
    type: item.type,
    poster: item.poster,
    backdrop: "",
    rating: null,
    genres: item.formats.filter((f) =>
      /^(Action|Comedy|Drama|Horror|Sci-Fi|Thriller|Romance|Animation|Documentary|Fantasy|Adventure|Crime|Mystery|War|Music|Family|Science Fiction)$/i.test(f)
    ),
    description: "",
    runtime: null,
    sourceId: 0,
    source: "scraper",
    slug: item.slug,
    qualityBadges: item.qualityBadges,
    seasonInfo: item.seasonInfo,
    formats: item.formats,
  };
}

export function scrapedToMovieDetail(d: ScrapedDetail, source: ScraperSource = "4khdhub"): MovieDetail {
  return {
    id: `${source}:${d.slug}`,
    title: d.title,
    year: d.year,
    type: d.type,
    poster: d.poster,
    backdrop: "",
    rating: d.imdbRating ? parseFloat(d.imdbRating) : null,
    genres: d.genres.length > 0 ? d.genres : d.formats.filter((f) =>
      /^(Action|Comedy|Drama|Horror|Sci-Fi|Thriller|Romance|Animation|Documentary|Fantasy|Adventure|Crime|Mystery|War|Music|Family|Science Fiction)$/i.test(f)
    ),
    description: d.description,
    runtime: null,
    sourceId: 0,
    source: "scraper",
    slug: d.slug,
    qualityBadges: d.qualityBadges,
    seasonInfo: d.seasonInfo,
    formats: d.formats,
    tagline: d.tagline,
    status: "",
    imdbId: null,
    cast: d.stars ? d.stars.split(",").map((s) => ({ name: s.trim(), character: "", profile: "" })) : [],
    crew: [],
    productionCompanies: [],
    videos: d.trailerUrl ? [{ key: d.trailerUrl, name: "Trailer", site: "YouTube", type: "Trailer" }] : [],
    images: { backdrops: [], posters: d.poster ? [d.poster] : [], logos: [] },
    recommendations: [],
    similar: [],
    downloads: d.downloads,
    episodeDownloads: d.episodes,
  };
}

export function scrapedToTvDetail(d: ScrapedDetail, source: ScraperSource = "4khdhub"): TvDetail {
  return {
    id: `${source}:${d.slug}`,
    title: d.title,
    year: d.year,
    type: "series",
    poster: d.poster,
    backdrop: "",
    rating: d.imdbRating ? parseFloat(d.imdbRating) : null,
    genres: d.genres.length > 0 ? d.genres : d.formats.filter((f) =>
      /^(Action|Comedy|Drama|Horror|Sci-Fi|Thriller|Romance|Animation|Documentary|Fantasy|Adventure|Crime|Mystery|War|Music|Family|Science Fiction)$/i.test(f)
    ),
    description: d.description,
    runtime: null,
    sourceId: 0,
    source: "scraper",
    slug: d.slug,
    qualityBadges: d.qualityBadges,
    seasonInfo: d.seasonInfo,
    formats: d.formats,
    tagline: d.tagline,
    status: "",
    network: "",
    schedule: "",
    cast: d.stars ? d.stars.split(",").map((s) => ({ name: s.trim(), character: "", profile: "" })) : [],
    seasons: d.seasons
      ? d.seasons.split(",").map((s, i) => ({ id: i, number: i + 1, episodes: 0, name: s.trim() }))
      : [],
    episodes: [],
    episodeDownloads: d.episodes,
  };
}

// ── Multi-Source Detail Result ─────────────────────────────

export interface SourceDetail {
  source: ScraperSource;
  label: string;
  detail: MovieDetail | TvDetail;
}

export interface MultiDetailResult {
  primary: MovieDetail | TvDetail;
  sources: SourceDetail[];
}

// ── Service API ───────────────────────────────────────────

function getSourceForCategory(cat: CategoryConfig): ScraperSource {
  return cat.source;
}

const SOURCE_LABELS: Record<ScraperSource, string> = {
  "4khdhub": "4KHDHub",
  "hdhub4u": "HDHub4u",
};

export async function getHome(page?: number): Promise<ContentItem[]> {
  logScraper(`getHome(page=${page ?? 1})`, "fetching from 4khdhub + hdhub4u...");
  const [r1, r2] = await Promise.allSettled([
    PROVIDERS["4khdhub"].fetchHome(page),
    PROVIDERS["hdhub4u"].fetchHome(page),
  ]);

  const items: ContentItem[] = [];
  if (r1.status === "fulfilled") {
    logScraper("getHome 4khdhub", `${r1.value.items.length} items, ${r1.value.totalPages} pages`);
    items.push(...r1.value.items.map((i) => scrapedToContentItem(i, "4khdhub")));
  } else {
    logScraperError("getHome 4khdhub failed:", r1.reason);
  }
  if (r2.status === "fulfilled") {
    logScraper("getHome hdhub4u", `${r2.value.items.length} items, ${r2.value.totalPages} pages`);
    items.push(...r2.value.items.map((i) => scrapedToContentItem(i, "hdhub4u")));
  } else {
    logScraperError("getHome hdhub4u failed:", r2.reason);
  }
  logScraper("getHome total", `${items.length} items`);
  return items;
}

export async function getCategory(slug: string, page = 1): Promise<{ items: ContentItem[]; totalPages: number }> {
  const cat = CATEGORIES.find((c) => c.slug === slug);
  if (!cat) throw new Error(`Unknown category: ${slug}`);

  const source = getSourceForCategory(cat);
  const provider = PROVIDERS[source];
  const { items, totalPages } = await provider.fetchCategory(cat.path, page);
  return {
    items: items.map((i) => scrapedToContentItem(i, source)),
    totalPages,
  };
}

export async function getDetail(slug: string): Promise<MovieDetail | TvDetail> {
  const prefix = slug.includes(":") ? slug.split(":")[0] : undefined;
  const cleanSlug = prefix ? slug.split(":").slice(1).join(":") : slug;

  if (prefix && prefix in PROVIDERS) {
    logScraper(`getDetail("${slug}")`, `prefix="${prefix}", cleanSlug="${cleanSlug}"`);
    const detail = await PROVIDERS[prefix as ScraperSource].fetchDetail(cleanSlug);
    return detail.type === "series"
      ? scrapedToTvDetail(detail, prefix as ScraperSource)
      : scrapedToMovieDetail(detail, prefix as ScraperSource);
  }

  logScraper(`getDetail("${slug}")`, `no prefix, trying both...`);
  const [r1, r2] = await Promise.allSettled([
    PROVIDERS["4khdhub"].fetchDetail(cleanSlug),
    PROVIDERS["hdhub4u"].fetchDetail(cleanSlug),
  ]);

  const detail = r1.status === "fulfilled" ? r1.value : r2.status === "fulfilled" ? r2.value : null;
  if (!detail) {
    logScraperError(`getDetail("${cleanSlug}")`, "not found on either source");
    throw new Error(`Not found: ${cleanSlug}`);
  }

  const source = r1.status === "fulfilled" ? "4khdhub" : "hdhub4u";
  logScraper(`getDetail("${cleanSlug}")`, `found on ${source}`);
  return detail.type === "series"
    ? scrapedToTvDetail(detail, source)
    : scrapedToMovieDetail(detail, source);
}

export async function getDetailFromSource(slug: string, source: ScraperSource): Promise<MovieDetail | TvDetail> {
  const cleanSlug = slug.includes(":") ? slug.split(":").slice(1).join(":") : slug;
  logScraper(`getDetailFromSource("${cleanSlug}", ${source})`);
  try {
    const detail = await PROVIDERS[source].fetchDetail(cleanSlug);
    return detail.type === "series"
      ? scrapedToTvDetail(detail, source)
      : scrapedToMovieDetail(detail, source);
  } catch (e) {
    logScraperError(`getDetailFromSource("${cleanSlug}", ${source}) failed:`, e);
    throw e;
  }
}

export async function getDetailMulti(slug: string): Promise<MultiDetailResult> {
  const prefix = slug.includes(":") ? slug.split(":")[0] : undefined;
  const cleanSlug = prefix ? slug.split(":").slice(1).join(":") : slug;

  const primarySource = (prefix && prefix in PROVIDERS) ? prefix as ScraperSource : "4khdhub";
  const altSource = primarySource === "4khdhub" ? "hdhub4u" : "4khdhub";

  logScraper(`getDetailMulti("${slug}")`, `primary=${primarySource}, alt=${altSource}, cleanSlug="${cleanSlug}"`);

  const sources: SourceDetail[] = [];

  // 1. Fetch detail from the primary source using its own slug
  let primaryDetail: ScrapedDetail | null = null;
  try {
    logScraper(`getDetailMulti`, `fetching ${primarySource} detail for "${cleanSlug}"...`);
    primaryDetail = await PROVIDERS[primarySource].fetchDetail(cleanSlug);
    const detail = primaryDetail.type === "series"
      ? scrapedToTvDetail(primaryDetail, primarySource)
      : scrapedToMovieDetail(primaryDetail, primarySource);
    sources.push({ source: primarySource, label: SOURCE_LABELS[primarySource], detail });
    logScraper(`getDetailMulti`, `${primarySource} detail OK: "${primaryDetail.title}"`);
  } catch (e) {
    logScraperError(`getDetailMulti ${primarySource} detail failed for "${cleanSlug}":`, e);
  }

  // 2. Search the alternate source by title to find a matching slug
  if (primaryDetail?.title) {
    try {
      logScraper(`getDetailMulti`, `searching ${altSource} for "${primaryDetail.title}"...`);
      const searchResults = await PROVIDERS[altSource].search(primaryDetail.title);
      logScraper(`getDetailMulti`, `${altSource} search returned ${searchResults.length} results`);
      const match = searchResults.find((r) =>
        r.title.toLowerCase().trim() === primaryDetail!.title.toLowerCase().trim()
      );
      if (match) {
        logScraper(`getDetailMulti`, `${altSource} match found: slug="${match.slug}"`);
        const altDetailRaw = await PROVIDERS[altSource].fetchDetail(match.slug);
        const detail = altDetailRaw.type === "series"
          ? scrapedToTvDetail(altDetailRaw, altSource)
          : scrapedToMovieDetail(altDetailRaw, altSource);
        sources.push({ source: altSource, label: SOURCE_LABELS[altSource], detail });
        logScraper(`getDetailMulti`, `${altSource} detail OK: "${altDetailRaw.title}"`);
      } else {
        logScraper(`getDetailMulti`, `${altSource} no exact title match found`);
      }
    } catch (e) {
      logScraperError(`getDetailMulti ${altSource} search/detail failed for "${primaryDetail.title}":`, e);
    }
  }

  logScraper(`getDetailMulti`, `result: ${sources.length} source(s) available [${sources.map((s) => s.source).join(", ")}]`);

  if (sources.length === 0) throw new Error(`Not found: ${cleanSlug}`);

  return { primary: sources[0].detail, sources };
}

export async function search(query: string): Promise<ContentItem[]> {
  logScraper(`search("${query}")`, "searching 4khdhub + hdhub4u...");
  const [r1, r2] = await Promise.allSettled([
    PROVIDERS["4khdhub"].search(query),
    PROVIDERS["hdhub4u"].search(query),
  ]);

  const items: ContentItem[] = [];
  if (r1.status === "fulfilled") {
    logScraper("search 4khdhub", `${r1.value.length} results`);
    items.push(...r1.value.map((i) => scrapedToContentItem(i, "4khdhub")));
  } else {
    logScraperError("search 4khdhub failed:", r1.reason);
  }
  if (r2.status === "fulfilled") {
    logScraper("search hdhub4u", `${r2.value.length} results`);
    items.push(...r2.value.map((i) => scrapedToContentItem(i, "hdhub4u")));
  } else {
    logScraperError("search hdhub4u failed:", r2.reason);
  }
  logScraper("search total", `${items.length} results`);
  return items;
}

export async function getCategoryConfig(slug: string): Promise<CategoryConfig | undefined> {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function getAllCategories(): CategoryConfig[] {
  return CATEGORIES;
}

export const scraperService = {
  getHome,
  getCategory,
  getDetail,
  getDetailFromSource,
  getDetailMulti,
  search,
  getCategoryConfig,
  getAllCategories,
};
