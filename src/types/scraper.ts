// Scraper Types (shared by 4KHDHub + HDHub4u providers)

export type ContentType = "movie" | "series";
export type ScraperSource = "4khdhub" | "hdhub4u";

export interface ScrapedItem {
  slug: string;
  title: string;
  year: string;
  seasonInfo: string;
  poster: string;
  url: string;
  qualityBadges: string[];
  formats: string[];
  type: ContentType;
}

export interface ScrapedDetail {
  slug: string;
  title: string;
  year: string;
  seasonInfo: string;
  poster: string;
  url: string;
  qualityBadges: string[];
  formats: string[];
  genres: string[];
  type: ContentType;
  tagline: string;
  description: string;
  imdbRating: string;
  stars: string;
  lastAir: string;
  printQuality: string;
  audioLanguages: string;
  seasons: string;
  trailerUrl: string;
  downloads: DownloadPack[];
  episodes: EpisodeDownload[];
  screenshots: string[];
  watchLinks: DownloadLink[];
  embeddedPlayerUrl: string;
  director: string;
  storyline: string;
  review: string;
}

export interface DownloadPack {
  season: string;
  format: string;
  title: string;
  fileSize: string;
  quality: string;
  language: string;
  codec: string;
  source: string;
  links: DownloadLink[];
}

export interface DownloadLink {
  label: string;
  url: string;
}

export interface EpisodeDownload {
  season: string;
  format: string;
  episode: string;
  title: string;
  downloads: DownloadFile[];
}

export interface DownloadFile {
  title: string;
  format: string;
  quality: string;
  language: string;
  codec: string;
  fileSize: string;
  links: DownloadLink[];
}

export interface CategoryConfig {
  slug: string;
  label: string;
  type: ContentType;
  path: string;
  source: ScraperSource;
}

// ── 4KHDHub Categories ─────────────────────────────────────

export const CATEGORIES_4KHDHUB: CategoryConfig[] = [
  { slug: "movies", label: "Latest Movies", type: "movie", path: "/category/movies/", source: "4khdhub" },
  { slug: "hindi-movies", label: "Hindi Movies", type: "movie", path: "/category/hindi-movies/", source: "4khdhub" },
  { slug: "english-movies", label: "English Movies", type: "movie", path: "/category/english-movies/", source: "4khdhub" },
  { slug: "series", label: "Latest Episodes", type: "series", path: "/category/series/", source: "4khdhub" },
  { slug: "korean-series", label: "Korean Series", type: "series", path: "/category/korean-series/", source: "4khdhub" },
  { slug: "drama-series", label: "Drama Series", type: "series", path: "/category/drama-series/", source: "4khdhub" },
  { slug: "hindi-series", label: "Hindi Series", type: "series", path: "/category/hindi-series/", source: "4khdhub" },
  { slug: "english-series", label: "English Series", type: "series", path: "/category/english-series/", source: "4khdhub" },
  { slug: "anime", label: "Anime", type: "series", path: "/category/anime/", source: "4khdhub" },
  { slug: "netflix", label: "Netflix", type: "movie", path: "/category/netflix/", source: "4khdhub" },
  { slug: "amazon_prime_video", label: "Amazon Prime Video", type: "movie", path: "/category/amazon_prime_video/", source: "4khdhub" },
  { slug: "jiohotstar", label: "JioHotstar", type: "movie", path: "/category/jiohotstar/", source: "4khdhub" },
  { slug: "disney", label: "Disney+", type: "movie", path: "/category/disney/", source: "4khdhub" },
  { slug: "apple_tv", label: "Apple TV+", type: "movie", path: "/category/apple_tv/", source: "4khdhub" },
  { slug: "hbo_max", label: "HBO Max", type: "movie", path: "/category/hbo_max/", source: "4khdhub" },
  { slug: "hulu", label: "Hulu", type: "movie", path: "/category/hulu/", source: "4khdhub" },
  { slug: "2160p-HDR", label: "4K HDR", type: "movie", path: "/category/2160p-HDR/", source: "4khdhub" },
  { slug: "imdb", label: "Top IMDB", type: "movie", path: "/category/imdb/", source: "4khdhub" },
];

// ── HDHub4u Categories ────────────────────────────────────

export const CATEGORIES_HDHUB4U: CategoryConfig[] = [
  { slug: "hd4u-bollywood", label: "Bollywood", type: "movie", path: "/category/bollywood-movies/", source: "hdhub4u" },
  { slug: "hd4u-hollywood", label: "Hollywood", type: "movie", path: "/category/hollywood-movies/", source: "hdhub4u" },
  { slug: "hd4u-hindi-dubbed", label: "Hindi Dubbed", type: "movie", path: "/category/hindi-dubbed/", source: "hdhub4u" },
  { slug: "hd4u-south-hindi", label: "South Hindi", type: "movie", path: "/category/south-hindi-movies/", source: "hdhub4u" },
  { slug: "hd4u-web-series", label: "Web Series", type: "series", path: "/category/category/web-series/", source: "hdhub4u" },
  { slug: "hd4u-action", label: "Action", type: "movie", path: "/category/action-movies/", source: "hdhub4u" },
  { slug: "hd4u-drama", label: "Drama", type: "movie", path: "/category/drama/", source: "hdhub4u" },
  { slug: "hd4u-comedy", label: "Comedy", type: "movie", path: "/category/comedy/", source: "hdhub4u" },
  { slug: "hd4u-horror", label: "Horror", type: "movie", path: "/category/horror/", source: "hdhub4u" },
  { slug: "hd4u-thriller", label: "Thriller", type: "movie", path: "/category/thriller/", source: "hdhub4u" },
  { slug: "hd4u-romance", label: "Romance", type: "movie", path: "/category/romance/", source: "hdhub4u" },
  { slug: "hd4u-scifi", label: "Sci-Fi", type: "movie", path: "/category/science-fiction/", source: "hdhub4u" },
  { slug: "hd4u-animation", label: "Animation", type: "movie", path: "/category/animated-movies/", source: "hdhub4u" },
  { slug: "hd4u-netflix", label: "Netflix", type: "movie", path: "/category/netflix/", source: "hdhub4u" },
];

// ── Combined ───────────────────────────────────────────────

export const CATEGORIES: CategoryConfig[] = [...CATEGORIES_4KHDHUB, ...CATEGORIES_HDHUB4U];
