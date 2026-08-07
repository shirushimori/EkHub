import type {
  ScrapedItem,
  ScrapedDetail,
  DownloadPack,
  DownloadLink,
  EpisodeDownload,
  DownloadFile,
  ContentType,
} from "../types/scraper";

const BASE_URL = import.meta.env.VITE_SCRAPER_BASE_URL || "https://4khdhub.one";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function getFetchUrl(rawPath: string): string {
  if (rawPath.startsWith("http")) return rawPath;
  if (API_BASE) return `${API_BASE}/api/scraper${rawPath}`;
  return `/api/scraper${rawPath}`;
}

async function fetchHtml(path: string): Promise<string> {
  const url = getFetchUrl(path);
  if (import.meta.env.DEV) console.log(`%c[4khdhub] %cfetch: ${url}`, "color:#4F8CFF;font-weight:bold", "color:#888");
  const res = await fetch(url);
  if (!res.ok) {
    if (import.meta.env.DEV) console.error(`%c[4khdhub] %c${res.status} ${res.statusText}: ${url}`, "color:#ff4444;font-weight:bold", "color:#888");
    throw new Error(`Scraper ${res.status}: ${res.statusText}`);
  }
  return res.text();
}

function parseHtml(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

// ── List Page Parser ──────────────────────────────────────

export function parseListPage(html: string): { items: ScrapedItem[]; totalPages: number } {
  const doc = parseHtml(html);
  const cards = doc.querySelectorAll("a.movie-card");
  const items: ScrapedItem[] = [];

  for (const card of Array.from(cards)) {
    try {
      const href = card.getAttribute("href") || "";
      const slug = href.replace(/^\/|\/$/g, "");
      const title = card.querySelector(".movie-card-title")?.textContent?.trim() || "";
      const metaText = card.querySelector(".movie-card-meta")?.textContent?.trim() || "";
      const img = card.querySelector("img");
      const poster = img?.getAttribute("src") || "";

      const yearMatch = metaText.match(/^(\d{4})/);
      const year = yearMatch ? yearMatch[1] : "";
      const seasonMatch = metaText.match(/S\d+/i);
      const seasonInfo = seasonMatch ? seasonMatch[0] : "";

      const badges = Array.from(card.querySelectorAll(".quality-badge")).map(
        (b) => b.textContent?.trim() || ""
      ).filter(Boolean);

      const formats = Array.from(card.querySelectorAll(".movie-card-format")).map(
        (f) => f.textContent?.trim() || ""
      ).filter(Boolean);

      const type: ContentType = formats.includes("Series") ? "series" : "movie";

      if (title) {
        items.push({
          slug,
          title,
          year,
          seasonInfo,
          poster,
          url: `${BASE_URL}${href}`,
          qualityBadges: badges,
          formats,
          type,
        });
      }
    } catch {
      // skip malformed cards
    }
  }

  const paginationLinks = doc.querySelectorAll(".pagination-item");
  let totalPages = 1;
  for (const link of Array.from(paginationLinks)) {
    const text = link.textContent?.trim() || "";
    const num = parseInt(text, 10);
    if (!isNaN(num) && num > totalPages) totalPages = num;
  }

  return { items, totalPages };
}

// ── Genre Detection ───────────────────────────────────────

const GENRE_PATTERNS = /^(action|adventure|animation|comedy|crime|documentary|drama|family|fantasy|history|horror|music|musical|mystery|romance|science fiction|sci-fi|thriller|tv movie|war|western|action & adventure|sci-fi & fantasy)$/i;

function isGenre(text: string): boolean {
  return GENRE_PATTERNS.test(text.trim());
}

// ── Detail Page Parser ────────────────────────────────────

export function parseDetailPage(html: string, slug: string): ScrapedDetail {
  const doc = parseHtml(html);

  const title = doc.querySelector(".page-title")?.textContent?.trim() || "";
  const tagline = doc.querySelector(".movie-tagline")?.textContent?.trim() || "";

  const posterImg = doc.querySelector(".poster-image img");
  const poster = posterImg?.getAttribute("src") || "";

  const imdbScore = doc.querySelector(".imdb-score")?.textContent?.trim() || "";

  const description = doc.querySelector("p.mt-4")?.textContent?.trim() || "";

  let stars = "";
  let director = "";
  let lastAir = "";
  let printQuality = "";
  let audioLanguages = "";
  let seasons = "";
  const metaItems = doc.querySelectorAll(".metadata-item");
  for (const item of Array.from(metaItems)) {
    const text = item.textContent?.trim() || "";
    const label = item.querySelector(".metadata-label")?.textContent?.trim() || "";
    if (label) {
      const value = item.querySelector(".metadata-value")?.textContent?.trim() || "";
      if (label.includes("Stars")) stars = value;
      else if (label.includes("Director")) director = value;
      else if (label.includes("Last Air")) lastAir = value;
      else if (label.includes("Print")) printQuality = value;
      else if (label.includes("Audio")) audioLanguages = value;
      else if (label.includes("Season")) seasons = value;
    } else {
      // Fallback: metadata-item has label as text node before value
      const colonIdx = text.indexOf(":");
      if (colonIdx > 0) {
        const lbl = text.substring(0, colonIdx).trim();
        const val = text.substring(colonIdx + 1).trim();
        if (/Director/i.test(lbl)) director = val;
        else if (/Stars/i.test(lbl)) stars = val;
        else if (/Release|Last Air/i.test(lbl)) lastAir = val;
        else if (/Print/i.test(lbl)) printQuality = val;
        else if (/Audio/i.test(lbl)) audioLanguages = val;
        else if (/Season/i.test(lbl)) seasons = val;
      }
    }
  }

  const trailerBtn = doc.querySelector("[data-trailer-url]");
  const trailerUrl = trailerBtn?.getAttribute("data-trailer-url") || "";

  // Parse badge-outline elements → separate genres from formats
  const badgeOutlines = Array.from(doc.querySelectorAll(".badge-outline")).map(
    (el) => el.textContent?.trim() || ""
  ).filter(Boolean);

  const genres = badgeOutlines.filter(isGenre);
  const formats = badgeOutlines.filter((f) => !isGenre(f));

  // Parse year and season from title or text content near title
  const titleText = title;

  // Extract embedded player (youtube/dailymotion/4khdhub in-page player)
  const embeddedPlayerUrl = (() => {
    const iframe = doc.querySelector(
      "iframe#videoPlayer, iframe.video-player, iframe[src*='youtube'], iframe[src*='dailymotion'], iframe[src*='embed'], iframe[src*='videasy'], iframe[src*='autoembed']"
    );
    return iframe?.getAttribute("src") || "";
  })();

  // Parse the videoSources JS object (e.g. { '4K': '...videasy.net/movie/', 'Autoembed': '...autoembed.cc/embed/movie/' })
  // combined with defaultVideoId into alternate watch-player links.
  const videoSourceLinks: { label: string; url: string }[] = (() => {
    const scriptText = Array.from(doc.querySelectorAll("script"))
      .map((s) => s.textContent || "")
      .join("\n");
    const sourcesMatch = scriptText.match(/videoSources\s*=\s*(\{[^}]+\})/);
    const idMatch = scriptText.match(/defaultVideoId\s*=\s*['"]([^'"]+)['"]/);
    if (!sourcesMatch) return [];
    const id = idMatch ? idMatch[1] : "";
    const links: { label: string; url: string }[] = [];
    for (const entry of sourcesMatch[1].matchAll(/['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/g)) {
      const label = entry[1];
      const base = entry[2];
      if (!/^https?:\/\//i.test(base)) continue;
      links.push({ label, url: id ? `${base.replace(/\/+$/, "")}/${id}` : base });
    }
    return links;
  })();

  // Extract watch links from the page
  const watchLinks: { label: string; url: string }[] = [...videoSourceLinks];
  for (const el of Array.from(doc.querySelectorAll("a[href*='watch'], a[href*='player'], a[href*='stream']"))) {
    const href = el.getAttribute("href") || "";
    const label = el.textContent?.trim() || "";
    if (href && label) {
      const base = href.split("?")[0].split("#")[0];
      if (!watchLinks.some((l) => l.url.split("?")[0].split("#")[0] === base)) {
        watchLinks.push({ label, url: href });
      }
    }
  }
  const yearMatch = titleText.match(/\((\d{4})\)/);
  const year = yearMatch ? yearMatch[1] : "";
  const seasonMatch = doc.querySelector(".text-muted-foreground")?.textContent?.match(/S\d+/i);
  const seasonInfo = seasonMatch ? seasonMatch[0] : "";

  // Determine type
  const allBadgeTexts = formats.map((b) => b.toUpperCase());
  const hasSeriesTab = !!doc.querySelector(".series-tab");
  const type: ContentType = hasSeriesTab || allBadgeTexts.some((b) => b === "SERIES") ? "series" : "movie";

  // ── Parse downloads (complete packs) ────────────────────
  const downloads: DownloadPack[] = [];

  // Try season-grouped structure first (series), fall back to flat (movies)
  const seasonGroups = doc.querySelectorAll(".series-season-group");
  if (seasonGroups.length > 0) {
    for (const sg of Array.from(seasonGroups)) {
      const seasonBtn = sg.querySelector(".series-season-toggle");
      const seasonLabel = seasonBtn?.querySelector("strong")?.textContent?.trim() || "";
      const seasonNum = seasonLabel.match(/S(\d+)/i);
      const season = seasonNum ? `S${seasonNum[1].padStart(2, "0")}` : seasonLabel;

      const downloadGroups = sg.querySelectorAll(".download-group");
      for (const dg of Array.from(downloadGroups)) {
        const groupTitle = dg.querySelector(".download-group-title");
        const formatLabel = groupTitle?.querySelector(".format-label")?.textContent?.trim() || "";
        const formatSource = groupTitle?.querySelector(".format-source")?.textContent?.trim() || "";
        const format = [formatLabel, formatSource].filter(Boolean).join(" ");

        const downloadItems = dg.querySelectorAll(".download-item");
        for (const item of Array.from(downloadItems)) {
          try {
            const headerEl = item.querySelector(".download-header");
            if (!headerEl) continue;

            const titleLine = headerEl.querySelector(".download-title-line");
            let dlTitle = titleLine?.querySelector(".download-title-text")?.textContent?.trim() || "";
            if (!dlTitle) {
              for (const node of Array.from(headerEl.childNodes)) {
                if (node.nodeType === Node.TEXT_NODE) {
                  const t = node.textContent?.trim();
                  if (t) { dlTitle = t; break; }
                }
              }
            }

            const badges = Array.from(headerEl.querySelectorAll(".badge, code .badge")).map(
              (b) => b.textContent?.trim() || ""
            ).filter(Boolean);

            let fileSize = "";
            let language = "";
            let quality = "";
            let source = "";
            for (const b of badges) {
              if (/GB|MB/i.test(b)) fileSize = b;
              else if (/English|Hindi|Tamil|Telugu|Japanese|Korean|French|Spanish|Multi/i.test(b)) language = b;
              else if (/WEB-DL|BluRay|REMUX|WEBRip/i.test(b)) source = b;
              else if (/2160p|1080p|720p|DoVi|HDR|SDR/i.test(b)) quality = b;
            }

            const links: DownloadLink[] = [];
            const linkEls = item.querySelectorAll("a.btn");
            for (const link of Array.from(linkEls)) {
              const href = link.getAttribute("href") || "";
              const label = link.textContent?.trim()?.replace(/\s+/g, " ") || "";
              if (href && label) links.push({ label, url: href });
            }

            if (dlTitle || links.length > 0) {
              downloads.push({ season, format, title: dlTitle, fileSize, quality, language, codec: "", source, links });
            }
          } catch { /* skip */ }
        }
      }
    }
  }

  // Fallback: flat structure (movies)
  if (downloads.length === 0) {
    const downloadItems = doc.querySelectorAll(".download-item");
    for (const item of Array.from(downloadItems)) {
      try {
        const headerEl = item.querySelector(".download-header");
        if (!headerEl) continue;

        // New structure: .download-title-line > .download-title-text
        const titleLine = headerEl.querySelector(".download-title-line");
        let dlTitle = titleLine?.querySelector(".download-title-text")?.textContent?.trim() || "";

        // Old structure: .episode-number for season, .flex-1 text nodes for title
        let season = "";
        const seasonEl = headerEl.querySelector(".episode-number");
        if (seasonEl) season = seasonEl.textContent?.trim() || "";

        if (!dlTitle) {
          const flexEl = headerEl.querySelector(".flex-1");
          if (flexEl) {
            for (const node of Array.from(flexEl.childNodes)) {
              if (node.nodeType === Node.TEXT_NODE) {
                const t = node.textContent?.trim();
                if (t) { dlTitle = t; break; }
              }
            }
          }
        }

        const badges = Array.from(headerEl.querySelectorAll(".badge, code .badge")).map(
          (b) => b.textContent?.trim() || ""
        ).filter(Boolean);

        let fileSize = "";
        let language = "";
        let quality = "";
        let source = "";
        for (const b of badges) {
          if (/GB|MB/i.test(b)) fileSize = b;
          else if (/English|Hindi|Tamil|Telugu|Japanese|Korean|French|Spanish|Multi/i.test(b)) language = b;
          else if (/WEB-DL|BluRay|REMUX|WEBRip/i.test(b)) source = b;
          else if (/2160p|1080p|720p|DoVi|HDR|SDR/i.test(b)) quality = b;
        }

        const links: DownloadLink[] = [];
        const linkEls = item.querySelectorAll("a.btn");
        for (const link of Array.from(linkEls)) {
          const href = link.getAttribute("href") || "";
          const label = link.textContent?.trim()?.replace(/\s+/g, " ") || "";
          if (href && label) links.push({ label, url: href });
        }

        if (dlTitle || links.length > 0) {
          downloads.push({ season, format: "", title: dlTitle, fileSize, quality, language, codec: "", source, links });
        }
      } catch { /* skip */ }
    }
  }

  // ── Parse episodes ──────────────────────────────────────
  const episodes: EpisodeDownload[] = [];

  // Try season-grouped episode structure first
  const episodeSeasonGroups = doc.querySelectorAll(".episode-season-groups .series-season-group");
  if (episodeSeasonGroups.length > 0) {
    for (const sg of Array.from(episodeSeasonGroups)) {
      const seasonBtn = sg.querySelector(".series-season-toggle");
      const seasonLabel = seasonBtn?.querySelector("strong")?.textContent?.trim() || "";
      const seasonNum = seasonLabel.match(/S(\d+)/i);
      let season = seasonNum ? `S${seasonNum[1].padStart(2, "0")}` : seasonLabel;

      const downloadGroups = sg.querySelectorAll(".download-group");
      for (const dg of Array.from(downloadGroups)) {
        const groupTitle = dg.querySelector(".download-group-title");
        const formatLabel = groupTitle?.querySelector(".format-label")?.textContent?.trim() || "";
        const formatSource = groupTitle?.querySelector(".format-source")?.textContent?.trim() || "";
        const format = [formatLabel, formatSource].filter(Boolean).join(" ");

        const episodeItems = dg.querySelectorAll(".season-item.episode-item, .episode-item");
        for (const item of Array.from(episodeItems)) {
          try {
            const headerEl = item.querySelector(".episode-header");
            const epTitle = headerEl?.querySelector(".download-title-text")?.textContent?.trim() || "";

            const epMetaBadges = Array.from(headerEl?.querySelectorAll(".episode-meta .badge, .badge") || []).map(
              (b) => b.textContent?.trim() || ""
            ).filter(Boolean);

            let episode = "";
            for (const b of epMetaBadges) {
              if (/English|Hindi|Tamil|Telugu|Japanese|Korean|Multi/i.test(b)) { /* skip language */ }
              else if (/S\d+/i.test(b) && !season) { season = b; }
            }
            // If no season from season group, try header badges
            if (!season) {
              for (const b of epMetaBadges) {
                const sm = b.match(/S(\d+)/i);
                if (sm) { season = `S${sm[1].padStart(2, "0")}`; break; }
              }
            }

            const episodeDownloads: DownloadFile[] = [];
            const fileItems = item.querySelectorAll(".episode-download-item, .download-item");
            for (const file of Array.from(fileItems)) {
              try {
                const fileTitle = file.querySelector(".episode-file-title, .download-title-text")?.textContent?.trim() || "";
                const fileBadges = Array.from(file.querySelectorAll(".badge")).map(
                  (b) => b.textContent?.trim() || ""
                ).filter(Boolean);

                let fQuality = "";
                let fLanguage = "";
                let fCodec = "";
                let fFileSize = "";
                for (const b of fileBadges) {
                  if (/GB|MB/i.test(b)) fFileSize = b;
                  else if (/English|Hindi|Tamil|Telugu|Japanese|Korean|French|Spanish|Multi/i.test(b)) fLanguage = b;
                  else if (/H\.?265|H\.?264|x264|x265|HEVC|AV1|AVC/i.test(b)) fCodec = b;
                  else if (/2160p|1080p|720p|480p|DoVi|HDR|SDR/i.test(b)) fQuality = b;
                  else if (/E\d+/i.test(b)) episode = b;
                }

                const fileLinks: DownloadLink[] = [];
                const linkEls = file.querySelectorAll("a.btn");
                for (const link of Array.from(linkEls)) {
                  const href = link.getAttribute("href") || "";
                  const label = link.textContent?.trim()?.replace(/\s+/g, " ") || "";
                  if (href && label) fileLinks.push({ label, url: href });
                }

                if (fileTitle || fileLinks.length > 0) {
                  episodeDownloads.push({
                    title: fileTitle,
                    format,
                    quality: fQuality,
                    language: fLanguage,
                    codec: fCodec,
                    fileSize: fFileSize,
                    links: fileLinks,
                  });
                }
              } catch { /* skip file */ }
            }

            if (epTitle || episodeDownloads.length > 0) {
              episodes.push({ season, format, episode, title: epTitle, downloads: episodeDownloads });
            }
          } catch { /* skip episode */ }
        }
      }
    }
  }

  // Fallback: flat episode structure
  if (episodes.length === 0) {
    const episodeItems = doc.querySelectorAll(".episode-item");
    for (const item of Array.from(episodeItems)) {
      try {
        const epNum = item.querySelector(".episode-number")?.textContent?.trim() || "";
        const epTitle = item.querySelector(".episode-title")?.textContent?.trim() || "";

        const seasonMatch = epNum.match(/S(\d+)/i);
        const epMatch = epNum.match(/E(\d+)/i);
        const season = seasonMatch ? `S${seasonMatch[1].padStart(2, "0")}` : "";
        const episode = epMatch ? `E${epMatch[1].padStart(2, "0")}` : "";

        const episodeDownloads: DownloadFile[] = [];
        const fileItems = item.querySelectorAll(".episode-download-item, .download-item");
        for (const file of Array.from(fileItems)) {
          const fileTitle = file.querySelector(".episode-file-title, .file-title")?.textContent?.trim() || "";
          const fileBadges = Array.from(file.querySelectorAll(".badge")).map(
            (b) => b.textContent?.trim() || ""
          ).filter(Boolean);

          let fQuality = "";
          let fLanguage = "";
          let fCodec = "";
          let fFileSize = "";
          for (const b of fileBadges) {
            if (/GB|MB/i.test(b)) fFileSize = b;
            else if (/English|Hindi|Tamil|Telugu|Japanese|Korean|French|Spanish|Multi/i.test(b)) fLanguage = b;
            else if (/H\.?265|H\.?264|x264|x265|HEVC|AV1|AVC/i.test(b)) fCodec = b;
            else if (/2160p|1080p|720p|480p|DoVi|HDR|SDR/i.test(b)) fQuality = b;
          }

          const fileLinks: DownloadLink[] = [];
          const linkEls = file.querySelectorAll("a.btn");
          for (const link of Array.from(linkEls)) {
            const href = link.getAttribute("href") || "";
            const label = link.textContent?.trim()?.replace(/\s+/g, " ") || "";
            if (href && label) fileLinks.push({ label, url: href });
          }

          if (fileTitle || fileLinks.length > 0) {
            episodeDownloads.push({
              title: fileTitle,
              format: "",
              quality: fQuality,
              language: fLanguage,
              codec: fCodec,
              fileSize: fFileSize,
              links: fileLinks,
            });
          }
        }

        if (epTitle || episodeDownloads.length > 0) {
          episodes.push({ season, format: "", episode, title: epTitle, downloads: episodeDownloads });
        }
      } catch { /* skip */ }
    }
  }

  return {
    slug,
    title,
    year,
    seasonInfo,
    poster,
    url: `${BASE_URL}/${slug}/`,
    qualityBadges: formats.filter((b) => /^(4K|FHD|HDR|DV|BD|REMUX|IMAX)$/i.test(b)),
    formats,
    genres,
    type,
    tagline,
    description,
    imdbRating: imdbScore,
    stars,
    lastAir,
    printQuality,
    audioLanguages,
    seasons,
    trailerUrl,
    downloads,
    episodes,
    screenshots: Array.from(doc.querySelectorAll("a img[src*='catimages'], a img[src*='vlcsnap'], a img[src*='screenshot'], a img[src*='imgur'], a img[src*='postimg']")).map(
      (img) => img.getAttribute("src") || ""
    ).filter(Boolean),
    watchLinks,
    embeddedPlayerUrl,
    director,
    storyline: description,
    review: "",
  };
}

// ── Public API ────────────────────────────────────────────

export async function fetchCategory(categoryPath: string, page = 1): Promise<{ items: ScrapedItem[]; totalPages: number }> {
  const url = page > 1 ? `${categoryPath}?pagex=${page}` : categoryPath;
  const html = await fetchHtml(url);
  return parseListPage(html);
}

export async function fetchDetail(slug: string): Promise<ScrapedDetail> {
  const html = await fetchHtml(`/${slug}/`);
  return parseDetailPage(html, slug);
}

export async function search4khdhub(query: string): Promise<ScrapedItem[]> {
  const html = await fetchHtml(`/?s=${encodeURIComponent(query)}`);
  const { items } = parseListPage(html);
  return items;
}

export async function fetchHome(): Promise<{ items: ScrapedItem[]; totalPages: number }> {
  const html = await fetchHtml("/");
  return parseListPage(html);
}

export const scraper4khdhub = {
  fetchCategory,
  fetchDetail,
  search: search4khdhub,
  fetchHome,
  parseListPage,
  parseDetailPage,
};
