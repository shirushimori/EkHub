import type {
  ScrapedItem,
  ScrapedDetail,
  DownloadPack,
  DownloadLink,
  EpisodeDownload,
  DownloadFile,
  ContentType,
} from "../types/scraper";

const BASE_URL = import.meta.env.VITE_HD4U_BASE_URL || "https://new3.hdhub4u.cl";
const CORS_PROXY = import.meta.env.VITE_CORS_PROXY || "";
const IS_STATIC = import.meta.env.MODE === "pages";

function getFetchUrl(rawPath: string): string {
  if (rawPath.startsWith("http")) return rawPath;
  const proxy = CORS_PROXY || (IS_STATIC && "https://corsproxy.io/?url=");
  if (proxy) return `${proxy}${BASE_URL}${rawPath}`;
  return `/api/hd4u${rawPath}`;
}

async function fetchHtml(path: string): Promise<string> {
  const url = getFetchUrl(path);
  if (import.meta.env.DEV) console.log(`%c[hdhub4u] %cfetch: ${url}`, "color:#4F8CFF;font-weight:bold", "color:#888");
  const res = await fetch(url);
  if (!res.ok) {
    if (import.meta.env.DEV) console.error(`%c[hdhub4u] %c${res.status} ${res.statusText}: ${url}`, "color:#ff4444;font-weight:bold", "color:#888");
    throw new Error(`HDHub4u ${res.status}: ${res.statusText}`);
  }
  return res.text();
}

function parseHtml(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

// ── Title / Year / Type Extraction ──────────────────────

const TITLE_YEAR_RE = /^(.+?)\s*\((\d{4})\)/i;
const TITLE_SEASON_RE = /^(.+?)\s*\(Season\s+\d+\)/i;
const SERIES_RE = /S\d+|Season|Series|Episodes|WEB-DL.*\bEP-|Full Series/i;

function extractTitleAndType(rawTitle: string): { cleanTitle: string; year: string; type: ContentType } {
  const yearMatch = rawTitle.match(TITLE_YEAR_RE);
  const seasonMatch = rawTitle.match(TITLE_SEASON_RE);

  let cleanTitle: string;
  let year: string;

  if (yearMatch) {
    cleanTitle = yearMatch[1].trim();
    year = yearMatch[2];
  } else if (seasonMatch) {
    cleanTitle = seasonMatch[1].trim();
    year = "";
  } else {
    cleanTitle = rawTitle;
    year = "";
  }

  const type: ContentType = SERIES_RE.test(rawTitle) ? "series" : "movie";
  return { cleanTitle, year, type };
}

function extractSlug(href: string): string {
  return href.replace(/^https?:\/\/[^/]+/, "").replace(/^\/|\/$/g, "");
}

// ── Download Parser (flat packs + episode structure) ─────

const DOWNLOAD_HOST_RE = /hubdrive\.|hubcdn\.|hubstream\.|gadgetsweb\./i;
const EPISODE_RE = /EPiSODE\s+(\d+)/i;

interface ParseResult {
  downloads: DownloadPack[];
  episodes: EpisodeDownload[];
}

function parseDownloads(body: Element): ParseResult {
  const episodeContainer = body.querySelector(".Z1hOCe");
  const downloads = parseFlatDownloads(body, episodeContainer);
  const episodes = episodeContainer ? parseEpisodes(episodeContainer) : [];
  return { downloads, episodes };
}

function parseFlatDownloads(body: Element, excludeContainer: Element | null): DownloadPack[] {
  const packs: DownloadPack[] = [];
  const candidates = body.querySelectorAll("h3 a, h4 a");

  for (const a of Array.from(candidates)) {
    if (excludeContainer?.contains(a)) continue;

    const href = a.getAttribute("href") || "";
    const text = a.textContent?.trim()?.replace(/\s+/g, " ") || "";
    if (!href || !text || !/http/i.test(href)) continue;
    if (/4khdhub\.one/i.test(href)) continue;

    const qualityMatch = text.match(/(4K|2160p|1080p|720p|480p)/i);
    const sizeMatch = text.match(/\[([^\]]+)]/);
    const codecMatch = text.match(/(HEVC|x264|x265|H\.?265|H\.?264|AVC|AV1)/i);

    packs.push({
      season: "",
      format: "",
      title: text,
      fileSize: sizeMatch ? sizeMatch[1] : "",
      quality: qualityMatch ? qualityMatch[1] : "",
      language: "",
      codec: codecMatch ? codecMatch[1] : "",
      source: "WEB-DL",
      links: [{ label: text, url: href }],
    });
  }

  return packs;
}

function parseEpisodes(container: Element): EpisodeDownload[] {
  const episodes: EpisodeDownload[] = [];
  const allH4s = Array.from(container.querySelectorAll("h4"));

  let currentEp: EpisodeDownload | null = null;

  for (const h4 of allH4s) {
    const strong = h4.querySelector("strong");
    const strongText = strong?.textContent?.trim() || "";

    const epMatch = strongText.match(EPISODE_RE);
    if (epMatch) {
      currentEp = {
        season: "",
        format: "",
        episode: `EPISODE ${epMatch[1]}`,
        title: `Episode ${epMatch[1]}`,
        downloads: [],
      };
      episodes.push(currentEp);
      continue;
    }

    if (!currentEp) continue;

    const links = Array.from(h4.querySelectorAll("a"));
    if (links.length === 0) continue;

    const h4Text = h4.textContent || "";
    const qualityMatch = h4Text.match(/(4K|2160p|1080p|720p|480p)\s*[–-]/i);
    const quality = qualityMatch ? qualityMatch[1] : "";

    const allLinkText = links.map((a) => a.textContent?.trim() || "").join(" ");
    const codecMatch = allLinkText.match(/(HEVC|x264|x265|H\.?265|H\.?264|AVC|AV1)/i);

    const downloadLinks: DownloadLink[] = links
      .map((a) => {
        const href = a.getAttribute("href") || "";
        const label = a.textContent?.trim()?.replace(/\s+/g, " ") || "";
        if (!href || !label || !/http/i.test(href)) return null;
        if (!DOWNLOAD_HOST_RE.test(href) && !/drive|instant|watch/i.test(label)) return null;
        return { label, url: href };
      })
      .filter((l): l is DownloadLink => l !== null);

    if (downloadLinks.length > 0) {
      currentEp.downloads.push({
        title: `${quality} ${codecMatch ? codecMatch[1] : ""}`.trim(),
        format: "",
        quality,
        language: "",
        codec: codecMatch ? codecMatch[1] : "",
        fileSize: "",
        links: downloadLinks,
      } satisfies DownloadFile);
    }
  }

  return episodes;
}

// ── Metadata Parser (strong-label pattern) ──────────────

function parseMetadata(body: Element) {
  const strongEls = body.querySelectorAll("strong");
  let imdbRating = "";
  let stars = "";
  let description = "";
  let genres = "";
  let language = "";
  let quality = "";

  for (const s of Array.from(strongEls)) {
    const label = s.textContent?.trim() || "";
    const parent = s.parentElement;
    const value = parent?.textContent?.replace(label, "").trim() || "";

    if (/iMDB/i.test(label)) {
      const ratingMatch = value.match(/([\d.]+)\/10/);
      imdbRating = ratingMatch ? ratingMatch[1] : value;
    } else if (/Stars/i.test(label)) stars = value;
    else if (/Genre/i.test(label)) genres = value;
    else if (/Language/i.test(label)) language = value;
    else if (/Quality/i.test(label)) quality = value;
  }

  const knoDesc = body.querySelector(".kno-rdesc");
  description = knoDesc?.textContent?.trim() || "";

  return { imdbRating, stars, description, genres, language, quality };
}

// ── List Page Parser ──────────────────────────────────────

export function parseListPage(html: string): { items: ScrapedItem[]; totalPages: number } {
  const doc = parseHtml(html);
  const cards = doc.querySelectorAll("ul.recent-movies > li.thumb");
  const items: ScrapedItem[] = [];

  for (const card of Array.from(cards)) {
    try {
      const linkEl = card.querySelector("figcaption a");
      const href = linkEl?.getAttribute("href") || "";
      const rawTitle = linkEl?.querySelector("p")?.textContent?.trim() || "";
      const imgEl = card.querySelector("figure img");
      const poster = imgEl?.getAttribute("src") || "";

      const { cleanTitle, year, type } = extractTitleAndType(rawTitle);
      const slug = extractSlug(href);

      if (cleanTitle) {
        items.push({
          slug,
          title: cleanTitle,
          year,
          seasonInfo: "",
          poster,
          url: href,
          qualityBadges: [],
          formats: [],
          type,
        });
      }
    } catch {
      // skip malformed cards
    }
  }

  let totalPages = 1;
  const pageNums = doc.querySelectorAll("ul.pagination a.page-numbers");
  for (const a of Array.from(pageNums)) {
    if (/next/i.test(a.className)) continue;
    const num = parseInt(a.textContent?.trim()?.replace(/,/g, "") || "", 10);
    if (!isNaN(num) && num > totalPages) totalPages = num;
  }

  return { items, totalPages };
}

// ── Detail Page Parser ────────────────────────────────────

export function parseDetailPage(html: string, slug: string): ScrapedDetail {
  const doc = parseHtml(html);

  const titleEl = doc.querySelector("h1.page-title .material-text");
  const rawTitle = titleEl?.textContent?.trim() || "";
  const { cleanTitle: title, year, type } = extractTitleAndType(rawTitle);

  const seasonMatch = rawTitle.match(/\(Season\s+(\d+)\)/i);
  const seasonInfo = seasonMatch ? `Season ${seasonMatch[1]}` : "";

  const ogImg = doc.querySelector('meta[property="og:image"]');
  const poster = ogImg?.getAttribute("content") || "";

  const body = doc.querySelector("main.page-body");
  const { imdbRating, stars, description, genres, language, quality } = body
    ? parseMetadata(body)
    : { imdbRating: "", stars: "", description: "", genres: "", language: "", quality: "" };

  const { downloads, episodes } = body ? parseDownloads(body) : { downloads: [], episodes: [] };

  const formatList = quality
    ? quality.split(/[,|]/).map((s) => s.trim()).filter(Boolean)
    : [];
  const genreList = genres
    ? genres.split(/[|,]/).map((s) => s.trim()).filter(Boolean)
    : [];

  return {
    slug,
    title,
    year,
    seasonInfo,
    poster,
    url: `${BASE_URL}/${slug}/`,
    qualityBadges: [],
    formats: formatList,
    genres: genreList,
    type,
    tagline: "",
    description,
    imdbRating,
    stars,
    lastAir: "",
    printQuality: quality,
    audioLanguages: language,
    seasons: "",
    trailerUrl: "",
    downloads,
    episodes,
  };
}

// ── Public API ────────────────────────────────────────────

export async function fetchCategory(categoryPath: string, page = 1): Promise<{ items: ScrapedItem[]; totalPages: number }> {
  const url = page > 1 ? `${categoryPath}page/${page}/` : categoryPath;
  const html = await fetchHtml(url);
  return parseListPage(html);
}

export async function fetchDetail(slug: string): Promise<ScrapedDetail> {
  const html = await fetchHtml(`/${slug}/`);
  return parseDetailPage(html, slug);
}

export async function searchHdHub4u(query: string): Promise<ScrapedItem[]> {
  const html = await fetchHtml(`/search/${encodeURIComponent(query)}/`);
  const { items } = parseListPage(html);
  return items;
}

export async function fetchHome(): Promise<{ items: ScrapedItem[]; totalPages: number }> {
  const html = await fetchHtml("/");
  return parseListPage(html);
}

export const scraperHdHub4u = {
  fetchCategory,
  fetchDetail,
  search: searchHdHub4u,
  fetchHome,
  parseListPage,
  parseDetailPage,
};
