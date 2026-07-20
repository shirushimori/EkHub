import { cacheGet, cacheSet, CacheTTL } from "./cache";
import type {
  TvmazeShow,
  TvmazeSearchResult,
  TvmazeSeason,
  TvmazeEpisode,
  TvmazeCastMember,
  TvmazeCrewMember,
  TvmazeScheduleEntry,
} from "../types/tv";

const BASE_URL = import.meta.env.VITE_TVMAZE_BASE_URL || "https://api.tvmaze.com";

async function tvmazeFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);

  if (!res.ok) {
    if (res.status === 429) {
      const retryAfter = Number(res.headers.get("retry-after") || "2");
      await new Promise((r) => setTimeout(r, Number(retryAfter) * 1000));
      return tvmazeFetch(path);
    }
    throw new Error(`TVMaze ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

// ── Search ──────────────────────────────────────────────────

export async function searchShows(query: string): Promise<TvmazeSearchResult[]> {
  const key = `tvmaze:search:${query}`;
  const cached = cacheGet<TvmazeSearchResult[]>(key);
  if (cached) return cached;

  const data = await tvmazeFetch<TvmazeSearchResult[]>(`/search/shows?q=${encodeURIComponent(query)}`);
  cacheSet(key, data, CacheTTL.MEDIUM);
  return data;
}

// ── Show Details ────────────────────────────────────────────

export async function getShowById(id: number): Promise<TvmazeShow> {
  const key = `tvmaze:show:${id}`;
  const cached = cacheGet<TvmazeShow>(key);
  if (cached) return cached;

  const data = await tvmazeFetch<TvmazeShow>(`/shows/${id}?embed[]=nextepisode&embed[]=previousepisode`);
  cacheSet(key, data, CacheTTL.LONG);
  return data;
}

// ── Seasons & Episodes ─────────────────────────────────────

export async function getShowSeasons(id: number): Promise<TvmazeSeason[]> {
  const key = `tvmaze:seasons:${id}`;
  const cached = cacheGet<TvmazeSeason[]>(key);
  if (cached) return cached;

  const data = await tvmazeFetch<TvmazeSeason[]>(`/shows/${id}/seasons`);
  cacheSet(key, data, CacheTTL.LONG);
  return data;
}

export async function getShowEpisodes(id: number): Promise<TvmazeEpisode[]> {
  const key = `tvmaze:episodes:${id}`;
  const cached = cacheGet<TvmazeEpisode[]>(key);
  if (cached) return cached;

  const data = await tvmazeFetch<TvmazeEpisode[]>(`/shows/${id}/episodes`);
  cacheSet(key, data, CacheTTL.LONG);
  return data;
}

export async function getSeasonEpisodes(seasonId: number): Promise<TvmazeEpisode[]> {
  const key = `tvmaze:season:${seasonId}:episodes`;
  const cached = cacheGet<TvmazeEpisode[]>(key);
  if (cached) return cached;

  const data = await tvmazeFetch<TvmazeEpisode[]>(`/seasons/${seasonId}/episodes`);
  cacheSet(key, data, CacheTTL.LONG);
  return data;
}

// ── Cast & Crew ─────────────────────────────────────────────

export async function getShowCast(id: number): Promise<TvmazeCastMember[]> {
  const key = `tvmaze:cast:${id}`;
  const cached = cacheGet<TvmazeCastMember[]>(key);
  if (cached) return cached;

  const data = await tvmazeFetch<TvmazeCastMember[]>(`/shows/${id}/cast`);
  cacheSet(key, data, CacheTTL.LONG);
  return data;
}

export async function getShowCrew(id: number): Promise<TvmazeCrewMember[]> {
  const key = `tvmaze:crew:${id}`;
  const cached = cacheGet<TvmazeCrewMember[]>(key);
  if (cached) return cached;

  const data = await tvmazeFetch<TvmazeCrewMember[]>(`/shows/${id}/crew`);
  cacheSet(key, data, CacheTTL.LONG);
  return data;
}

// ── Schedule ────────────────────────────────────────────────

export async function getSchedule(date?: string, country = "US"): Promise<TvmazeScheduleEntry[]> {
  const d = date || new Date().toISOString().split("T")[0];
  const key = `tvmaze:schedule:${d}:${country}`;
  const cached = cacheGet<TvmazeScheduleEntry[]>(key);
  if (cached) return cached;

  const data = await tvmazeFetch<TvmazeScheduleEntry[]>(`/schedule?date=${d}&country=${country}`);
  cacheSet(key, data, CacheTTL.SHORT);
  return data;
}

// ── Export a namespace object ───────────────────────────────

export const tvmaze = {
  searchShows,
  getShowById,
  getShowSeasons,
  getShowEpisodes,
  getSeasonEpisodes,
  getShowCast,
  getShowCrew,
  getSchedule,
};
