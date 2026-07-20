// Unified content types - normalizes all sources into one shape

import type { TmdbMovieResult, TmdbMovieDetail } from "./movie";
import type { TvmazeShow, TvmazeSeason, TvmazeEpisode } from "./tv";
import type { DownloadPack, EpisodeDownload } from "./scraper";

export type ContentType = "movie" | "series";

export interface ContentItem {
  id: string;
  title: string;
  year: string;
  type: ContentType;
  poster: string;
  backdrop: string;
  rating: number | null;
  genres: string[];
  description: string;
  runtime?: number | null;
  sourceId: number;
  source: "tmdb" | "tvmaze" | "scraper";
  slug?: string;
  qualityBadges?: string[];
  seasonInfo?: string;
  formats?: string[];
  tagline?: string;
  episodeDownloads?: EpisodeDownload[];
}

export interface MovieDetail extends ContentItem {
  runtime: number | null;
  tagline: string;
  status: string;
  imdbId: string | null;
  cast: Array<{ name: string; character: string; profile: string }>;
  crew: Array<{ name: string; job: string; profile: string }>;
  productionCompanies: Array<{ name: string; logo: string }>;
  videos: Array<{ key: string; name: string; site: string; type: string }>;
  images: { backdrops: string[]; posters: string[]; logos: string[] };
  recommendations: ContentItem[];
  similar: ContentItem[];
  downloads?: DownloadPack[];
  screenshots?: string[];
  watchLinks?: Array<{ label: string; url: string }>;
  embeddedPlayerUrl?: string;
  director?: string;
  storyline?: string;
  review?: string;
}

export interface TvDetail extends ContentItem {
  runtime: number | null;
  status: string;
  network: string;
  schedule: string;
  cast: Array<{ name: string; character: string; profile: string }>;
  seasons: Array<{ id: number; number: number; episodes: number; name: string }>;
  episodes: TvmazeEpisode[];
}

// ── Builders ──────────────────────────────────────────────────

const IMG = "https://image.tmdb.org/t/p";

export function tmdbPoster(path: string | null, size = "w500"): string {
  return path ? `${IMG}/${size}${path}` : "";
}

export function tmdbBackdrop(path: string | null, size = "w1280"): string {
  return path ? `${IMG}/${size}${path}` : "";
}

export function tvmazeImage(img: { medium: string; original: string } | null): string {
  return img?.original || img?.medium || "";
}

export function tmdbMovieToContentItem(m: TmdbMovieResult): ContentItem {
  return {
    id: `tmdb:${m.id}`,
    title: m.title,
    year: m.release_date?.slice(0, 4) || "",
    type: "movie",
    poster: tmdbPoster(m.poster_path),
    backdrop: tmdbBackdrop(m.backdrop_path),
    rating: m.vote_average || null,
    genres: [],
    description: m.overview || "",
    runtime: null,
    sourceId: m.id,
    source: "tmdb",
  };
}

export function tmdbDetailToMovieDetail(m: TmdbMovieDetail): MovieDetail {
  return {
    id: `tmdb:${m.id}`,
    title: m.title,
    year: m.release_date?.slice(0, 4) || "",
    type: "movie",
    poster: tmdbPoster(m.poster_path),
    backdrop: tmdbBackdrop(m.backdrop_path),
    rating: m.vote_average || null,
    genres: m.genres?.map((g) => g.name) || [],
    description: m.overview || "",
    sourceId: m.id,
    source: "tmdb",
    runtime: m.runtime,
    tagline: m.tagline,
    status: m.status,
    imdbId: m.imdb_id,
    cast: [],
    crew: [],
    productionCompanies: m.production_companies?.map((c) => ({
      name: c.name,
      logo: tmdbPoster(c.logo_path, "w200"),
    })) || [],
    videos: [],
    images: { backdrops: [], posters: [], logos: [] },
    recommendations: [],
    similar: [],
  };
}

export function tvmazeToShow(s: TvmazeShow): ContentItem {
  return {
    id: `tv:${s.id}`,
    title: s.name,
    year: s.premiered?.slice(0, 4) || "",
    type: "series",
    poster: tvmazeImage(s.image),
    backdrop: "",
    rating: s.rating?.average ?? null,
    genres: s.genres || [],
    description: (s.summary || "").replace(/<[^>]*>/g, "").trim(),
    runtime: s.averageRuntime || s.runtime,
    sourceId: s.id,
    source: "tvmaze",
  };
}

export function tvmazeToTvDetail(s: TvmazeShow, seasons?: TvmazeSeason[], episodes?: TvmazeEpisode[]): TvDetail {
  return {
    ...tvmazeToShow(s),
    runtime: s.averageRuntime || s.runtime,
    status: s.status,
    network: s.network?.name || s.webChannel?.name || "",
    schedule: `${s.schedule?.days?.join(", ") || ""} ${s.schedule?.time || ""}`.trim(),
    cast: [],
    seasons: seasons?.map((sn) => ({
      id: sn.id,
      number: sn.number,
      episodes: sn.episodeOrder || 0,
      name: sn.name,
    })) || [],
    episodes: episodes || [],
  };
}

export function posterUrl(item: ContentItem | MovieDetail | TvDetail): string {
  return item.poster || `https://placehold.co/300x450/151515/4F8CFF?text=${encodeURIComponent(item.title)}`;
}

export function backdropUrl(item: ContentItem | MovieDetail | TvDetail): string {
  return item.backdrop || item.poster || `https://placehold.co/800x450/151515/2a2a2a?text=${encodeURIComponent(item.title)}`;
}

export function typeLabel(type: ContentType): string {
  return type === "movie" ? "Movie" : "Series";
}
