import type {
  ScrapedItem,
  ScrapedDetail,
  ContentType,
} from "../types/scraper";

const JIKAN_BASE = "https://api.jikan.moe/v4";
const HIANIME_BASE = "https://hianime.lol";

// ── Rate limiting (Jikan allows 3 req/s) ───────────────────

let lastRequest = 0;
const MIN_INTERVAL = 400;

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const wait = Math.max(0, MIN_INTERVAL - (now - lastRequest));
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequest = Date.now();

  let res = await fetch(url);
  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, 1500));
    res = await fetch(url);
  }
  if (res.status === 504 || res.status === 503) {
    await new Promise((r) => setTimeout(r, 2000));
    res = await fetch(url);
  }
  return res;
}

async function jikanGet<T>(path: string): Promise<T> {
  const url = `${JIKAN_BASE}${path}`;
  if (import.meta.env.DEV) console.log(`%c[jikan] %cfetch: ${url}`, "color:#FF6B9D;font-weight:bold", "color:#888");
  const res = await rateLimitedFetch(url);
  if (!res.ok) {
    if (import.meta.env.DEV) console.error(`%c[jikan] %c${res.status}: ${url}`, "color:#ff4444;font-weight:bold", "color:#888");
    throw new Error(`Jikan ${res.status}: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data;
}

// ── Jikan API Types ────────────────────────────────────────

interface JikanAnime {
  mal_id: number;
  url: string;
  images: {
    jpg: { image_url: string; small_image_url: string; large_image_url: string };
    webp: { image_url: string; small_image_url: string; large_image_url: string };
  };
  title: string;
  title_english: string | null;
  title_japanese: string;
  type: string;
  source: string;
  episodes: number | null;
  status: string;
  airing: boolean;
  aired: { from: string; to: string | null; string: string };
  duration: string;
  rating: string;
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  popularity: number | null;
  members: number;
  favorites: number;
  synopsis: string;
  background: string | null;
  season: string | null;
  year: number | null;
  broadcast: { day: string; time: string; timezone: string; string: string };
  producers: Array<{ mal_id: number; type: string; name: string; url: string }>;
  licensors: Array<{ mal_id: number; type: string; name: string; url: string }>;
  studios: Array<{ mal_id: number; type: string; name: string; url: string }>;
  genres: Array<{ mal_id: number; type: string; name: string; url: string }>;
  themes: Array<{ mal_id: number; type: string; name: string; url: string }>;
  demographics: Array<{ mal_id: number; type: string; name: string; url: string }>;
  relations: Array<{ relation: string; entry: Array<{ mal_id: number; type: string; name: string; url: string }> }>;
  explicit_genres: Array<{ mal_id: number; type: string; name: string; url: string }>;
}

interface JikanSearchResult {
  pagination: { last_visible_page: number; has_next_page: boolean };
  data: JikanAnime[];
}



// ── Mapping Helpers ─────────────────────────────────────────

function jikanAnimeToScrapedItem(a: JikanAnime): ScrapedItem {
  const poster = a.images?.jpg?.large_image_url || a.images?.jpg?.image_url || "";
  const title = a.title_english || a.title;
  const year = a.year?.toString() || a.aired?.from?.slice(0, 4) || "";
  const genres = [...a.genres, ...a.themes].map((g) => g.name);
  const type: ContentType = a.type?.toLowerCase() === "movie" ? "movie" : "series";

  return {
    slug: `jikan:${a.mal_id}`,
    title,
    year,
    seasonInfo: a.season ? `${a.season} ${a.year || ""}`.trim() : "",
    poster,
    url: a.url,
    qualityBadges: a.rating ? [a.rating] : [],
    formats: genres,
    type,
  };
}

function jikanAnimeToScrapedDetail(a: JikanAnime): ScrapedDetail {
  const poster = a.images?.jpg?.large_image_url || a.images?.jpg?.image_url || "";
  const title = a.title_english || a.title;
  const year = a.year?.toString() || a.aired?.from?.slice(0, 4) || "";
  const genres = [...a.genres, ...a.themes].map((g) => g.name);
  const type: ContentType = a.type?.toLowerCase() === "movie" ? "movie" : "series";

  const stars = [...a.studios, ...a.producers].map((s) => s.name).join(", ");
  const description = (a.synopsis || "").replace(/\[Written by MAL Rewrite\]/, "").trim();

  return {
    slug: `jikan:${a.mal_id}`,
    title,
    year,
    seasonInfo: a.season ? `${a.season} ${a.year || ""}`.trim() : "",
    poster,
    url: a.url,
    qualityBadges: a.rating ? [a.rating] : [],
    formats: genres,
    genres,
    type,
    tagline: a.title_japanese || "",
    description,
    imdbRating: a.score ? a.score.toFixed(1) : "",
    stars,
    lastAir: a.aired?.to?.slice(0, 10) || "",
    printQuality: a.type || "",
    audioLanguages: "",
    seasons: a.episodes ? `${a.episodes} episodes` : "",
    trailerUrl: "",
    downloads: [],
    episodes: [],
    screenshots: [],
    watchLinks: [{ label: "Watch on HiAnime", url: `${HIANIME_BASE}/search?keyword=${encodeURIComponent(title)}` }],
    embeddedPlayerUrl: "",
    director: a.studios?.map((s) => s.name).join(", ") || "",
    storyline: description,
    review: a.background || "",
  };
}

// ── Public API ─────────────────────────────────────────────

export async function fetchHome(): Promise<{ items: ScrapedItem[]; totalPages: number }> {
  try {
    const data = await jikanGet<JikanSearchResult>("/top/anime?limit=25");
    return { items: data.data.map(jikanAnimeToScrapedItem), totalPages: 1 };
  } catch {
    return { items: [], totalPages: 1 };
  }
}

export async function fetchCategory(path: string, page = 1): Promise<{ items: ScrapedItem[]; totalPages: number }> {
  try {
    const data = await jikanGet<JikanSearchResult>(`${path}?page=${page}&limit=25&sfw=true`);
    return {
      items: data.data.map(jikanAnimeToScrapedItem),
      totalPages: data.pagination?.last_visible_page || 1,
    };
  } catch {
    return { items: [], totalPages: 1 };
  }
}

export async function fetchDetail(slug: string): Promise<ScrapedDetail> {
  const id = slug.replace("jikan:", "");
  const data = await jikanGet<JikanAnime>(`/anime/${id}/full`);
  return jikanAnimeToScrapedDetail(data);
}

export async function search(query: string): Promise<ScrapedItem[]> {
  try {
    const data = await jikanGet<JikanSearchResult>(`/anime?q=${encodeURIComponent(query)}&limit=20&sfw=true`);
    return data.data.map(jikanAnimeToScrapedItem);
  } catch {
    return [];
  }
}

export async function fetchTopAnime(page = 1): Promise<{ items: ScrapedItem[]; totalPages: number }> {
  const data = await jikanGet<JikanSearchResult>(`/top/anime?page=${page}&limit=25&filter=bypopularity`);
  return {
    items: data.data.map(jikanAnimeToScrapedItem),
    totalPages: data.pagination?.last_visible_page || 1,
  };
}

export async function fetchSeasonNow(page = 1): Promise<{ items: ScrapedItem[]; totalPages: number }> {
  const data = await jikanGet<JikanSearchResult>(`/seasons/now?page=${page}&limit=25`);
  return {
    items: data.data.map(jikanAnimeToScrapedItem),
    totalPages: data.pagination?.last_visible_page || 1,
  };
}

export async function fetchByGenre(genreId: number, page = 1): Promise<{ items: ScrapedItem[]; totalPages: number }> {
  const data = await jikanGet<JikanSearchResult>(`/anime?genres=${genreId}&page=${page}&limit=25&order_by=score&sort=desc&sfw=true`);
  return {
    items: data.data.map(jikanAnimeToScrapedItem),
    totalPages: data.pagination?.last_visible_page || 1,
  };
}

export const scraperJikan = {
  fetchHome,
  fetchCategory,
  fetchDetail,
  search,
  fetchTopAnime,
  fetchSeasonNow,
  fetchByGenre,
};
