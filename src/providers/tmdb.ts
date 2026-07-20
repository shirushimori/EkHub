import { cacheGet, cacheSet, CacheTTL } from "./cache";
import type {
  TmdbSearchResponse,
  TmdbMovieDetail,
  TmdbCredits,
  TmdbVideoResponse,
  TmdbImageResponse,
  TmdbGenreResponse,
  TmdbTimeWindow,
} from "../types/movie";

const BASE_URL = import.meta.env.VITE_TMDB_BASE_URL || "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY || "";

const HEADERS: Record<string, string> = API_KEY
  ? { Authorization: `Bearer ${API_KEY}` }
  : {};

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), { headers: HEADERS });

  if (!res.ok) {
    if (res.status === 429) {
      const retryAfter = Number(res.headers.get("retry-after") || "2");
      await new Promise((r) => setTimeout(r, Number(retryAfter) * 1000));
      return tmdbFetch(path, params);
    }
    throw new Error(`TMDB ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

// ── Search ──────────────────────────────────────────────────

export async function searchMovies(query: string, page = 1): Promise<TmdbSearchResponse> {
  const key = `tmdb:search:${query}:${page}`;
  const cached = cacheGet<TmdbSearchResponse>(key);
  if (cached) return cached;

  const data = await tmdbFetch<TmdbSearchResponse>("/search/movie", {
    query,
    page: String(page),
  });
  cacheSet(key, data, CacheTTL.MEDIUM);
  return data;
}

// ── Movie Details ────────────────────────────────────────────

export async function getMovieDetail(id: number): Promise<TmdbMovieDetail> {
  const key = `tmdb:movie:${id}`;
  const cached = cacheGet<TmdbMovieDetail>(key);
  if (cached) return cached;

  const data = await tmdbFetch<TmdbMovieDetail>(`/movie/${id}`);
  cacheSet(key, data, CacheTTL.LONG);
  return data;
}

// ── Lists ────────────────────────────────────────────────────

export async function getPopularMovies(page = 1): Promise<TmdbSearchResponse> {
  const key = `tmdb:popular:${page}`;
  const cached = cacheGet<TmdbSearchResponse>(key);
  if (cached) return cached;

  const data = await tmdbFetch<TmdbSearchResponse>("/movie/popular", { page: String(page) });
  cacheSet(key, data, CacheTTL.MEDIUM);
  return data;
}

export async function getTopRatedMovies(page = 1): Promise<TmdbSearchResponse> {
  const key = `tmdb:top_rated:${page}`;
  const cached = cacheGet<TmdbSearchResponse>(key);
  if (cached) return cached;

  const data = await tmdbFetch<TmdbSearchResponse>("/movie/top_rated", { page: String(page) });
  cacheSet(key, data, CacheTTL.MEDIUM);
  return data;
}

export async function getUpcomingMovies(page = 1): Promise<TmdbSearchResponse> {
  const key = `tmdb:upcoming:${page}`;
  const cached = cacheGet<TmdbSearchResponse>(key);
  if (cached) return cached;

  const data = await tmdbFetch<TmdbSearchResponse>("/movie/upcoming", { page: String(page) });
  cacheSet(key, data, CacheTTL.SHORT);
  return data;
}

export async function getNowPlayingMovies(page = 1): Promise<TmdbSearchResponse> {
  const key = `tmdb:now_playing:${page}`;
  const cached = cacheGet<TmdbSearchResponse>(key);
  if (cached) return cached;

  const data = await tmdbFetch<TmdbSearchResponse>("/movie/now_playing", { page: String(page) });
  cacheSet(key, data, CacheTTL.SHORT);
  return data;
}

export async function getTrendingMovies(window: TmdbTimeWindow = "week", page = 1): Promise<TmdbSearchResponse> {
  const key = `tmdb:trending:${window}:${page}`;
  const cached = cacheGet<TmdbSearchResponse>(key);
  if (cached) return cached;

  const data = await tmdbFetch<TmdbSearchResponse>(`/trending/movie/${window}`, { page: String(page) });
  cacheSet(key, data, CacheTTL.MEDIUM);
  return data;
}

// ── Related ──────────────────────────────────────────────────

export async function getSimilarMovies(id: number, page = 1): Promise<TmdbSearchResponse> {
  const key = `tmdb:similar:${id}:${page}`;
  const cached = cacheGet<TmdbSearchResponse>(key);
  if (cached) return cached;

  const data = await tmdbFetch<TmdbSearchResponse>(`/movie/${id}/similar`, { page: String(page) });
  cacheSet(key, data, CacheTTL.LONG);
  return data;
}

export async function getRecommendations(id: number, page = 1): Promise<TmdbSearchResponse> {
  const key = `tmdb:recommendations:${id}:${page}`;
  const cached = cacheGet<TmdbSearchResponse>(key);
  if (cached) return cached;

  const data = await tmdbFetch<TmdbSearchResponse>(`/movie/${id}/recommendations`, { page: String(page) });
  cacheSet(key, data, CacheTTL.LONG);
  return data;
}

// ── Credits ──────────────────────────────────────────────────

export async function getMovieCredits(id: number): Promise<TmdbCredits> {
  const key = `tmdb:credits:${id}`;
  const cached = cacheGet<TmdbCredits>(key);
  if (cached) return cached;

  const data = await tmdbFetch<TmdbCredits>(`/movie/${id}/credits`);
  cacheSet(key, data, CacheTTL.LONG);
  return data;
}

// ── Videos ──────────────────────────────────────────────────

export async function getMovieVideos(id: number): Promise<TmdbVideoResponse> {
  const key = `tmdb:videos:${id}`;
  const cached = cacheGet<TmdbVideoResponse>(key);
  if (cached) return cached;

  const data = await tmdbFetch<TmdbVideoResponse>(`/movie/${id}/videos`);
  cacheSet(key, data, CacheTTL.LONG);
  return data;
}

// ── Images ──────────────────────────────────────────────────

export async function getMovieImages(id: number): Promise<TmdbImageResponse> {
  const key = `tmdb:images:${id}`;
  const cached = cacheGet<TmdbImageResponse>(key);
  if (cached) return cached;

  const data = await tmdbFetch<TmdbImageResponse>(`/movie/${id}/images`);
  cacheSet(key, data, CacheTTL.DAY);
  return data;
}

// ── Genres ──────────────────────────────────────────────────

export async function getMovieGenres(): Promise<TmdbGenreResponse> {
  const key = "tmdb:genres:movie";
  const cached = cacheGet<TmdbGenreResponse>(key);
  if (cached) return cached;

  const data = await tmdbFetch<TmdbGenreResponse>("/genre/movie/list");
  cacheSet(key, data, CacheTTL.DAY);
  return data;
}

// ── Export a namespace object for backward compat ──────────

export const tmdb = {
  searchMovies,
  getMovieDetail,
  getPopularMovies,
  getTopRatedMovies,
  getUpcomingMovies,
  getNowPlayingMovies,
  getTrendingMovies,
  getSimilarMovies,
  getRecommendations,
  getMovieCredits,
  getMovieVideos,
  getMovieImages,
  getMovieGenres,
};
