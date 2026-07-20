import { tvmaze } from "../providers/tvmaze";
import type { ContentItem, TvDetail } from "../types/content";
import { tvmazeToShow, tvmazeToTvDetail } from "../types/content";
import type { TvmazeShow } from "../types/tv";

function dedup(items: ContentItem[]): ContentItem[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    if (seen.has(i.id)) return false;
    seen.add(i.id);
    return true;
  });
}

// ── Public API ─────────────────────────────────────────────

export async function searchShows(query: string): Promise<ContentItem[]> {
  const results = await tvmaze.searchShows(query);
  return dedup(results.map((r) => tvmazeToShow(r.show)));
}

export async function fetchShowDetail(id: number): Promise<TvDetail> {
  const [showResult, seasonsResult, episodesResult, castResult] = await Promise.allSettled([
    tvmaze.getShowById(id),
    tvmaze.getShowSeasons(id),
    tvmaze.getShowEpisodes(id),
    tvmaze.getShowCast(id),
  ]);

  const show =
    showResult.status === "fulfilled" ? showResult.value : (await tvmaze.getShowById(id));

  const seasons = seasonsResult.status === "fulfilled" ? seasonsResult.value : undefined;
  const episodes = episodesResult.status === "fulfilled" ? episodesResult.value : undefined;
  const cast = castResult.status === "fulfilled" ? castResult.value : [];

  const detail = tvmazeToTvDetail(show, seasons, episodes);
  detail.cast = cast.slice(0, 20).map((c) => ({
    name: c.person.name,
    character: c.character.name,
    profile: c.person.image?.original || c.person.image?.medium || "",
  }));

  return detail;
}

export async function fetchShowSeasons(id: number) {
  return tvmaze.getShowSeasons(id);
}

export async function fetchShowEpisodes(id: number) {
  return tvmaze.getShowEpisodes(id);
}

export async function fetchSeasonEpisodes(seasonId: number) {
  return tvmaze.getSeasonEpisodes(seasonId);
}

export async function fetchTodaySchedule(): Promise<ContentItem[]> {
  const entries = await tvmaze.getSchedule();
  return dedup(
    entries.map((e) => {
      const item = tvmazeToShow(e.show as TvmazeShow);
      return item;
    })
  );
}

export const tvService = {
  searchShows,
  fetchShowDetail,
  fetchShowSeasons,
  fetchShowEpisodes,
  fetchSeasonEpisodes,
  fetchTodaySchedule,
};
