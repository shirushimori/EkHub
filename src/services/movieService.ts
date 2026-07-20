import { tmdb } from "../providers/tmdb";
import type { ContentItem, MovieDetail } from "../types/content";
import {
  tmdbMovieToContentItem,
  tmdbDetailToMovieDetail,
  tmdbPoster,
  tmdbBackdrop,
} from "../types/content";
import type { TmdbMovieResult } from "../types/movie";

function resultsToItems(results: TmdbMovieResult[]): ContentItem[] {
  return results.filter((m) => !m.adult).map(tmdbMovieToContentItem);
}

async function enrichDetail(id: number): Promise<MovieDetail> {
  const [detail, credits, videos, images, similar, recommendations] = await Promise.allSettled([
    tmdb.getMovieDetail(id),
    tmdb.getMovieCredits(id),
    tmdb.getMovieVideos(id),
    tmdb.getMovieImages(id),
    tmdb.getSimilarMovies(id),
    tmdb.getRecommendations(id),
  ]);

  const movie =
    detail.status === "fulfilled" ? detail.value : (await tmdb.getMovieDetail(id));
  const base = tmdbDetailToMovieDetail(movie);

  if (credits.status === "fulfilled") {
    base.cast = credits.value.cast.slice(0, 20).map((c) => ({
      name: c.name,
      character: c.character,
      profile: tmdbPoster(c.profile_path),
    }));
    base.crew = credits.value.crew.slice(0, 20).map((c) => ({
      name: c.name,
      job: c.job,
      profile: tmdbPoster(c.profile_path),
    }));
  }

  if (videos.status === "fulfilled") {
    base.videos = videos.value.results.map((v) => ({
      key: v.key,
      name: v.name,
      site: v.site,
      type: v.type,
    }));
  }

  if (images.status === "fulfilled") {
    base.images = {
      backdrops: images.value.backdrops.map((i) => tmdbBackdrop(i.file_path)),
      posters: images.value.posters.map((i) => tmdbPoster(i.file_path)),
      logos: images.value.logos.map((i) => tmdbPoster(i.file_path)),
    };
  }

  if (similar.status === "fulfilled") {
    base.similar = resultsToItems(similar.value.results);
  }

  if (recommendations.status === "fulfilled") {
    base.recommendations = resultsToItems(recommendations.value.results);
  }

  return base;
}

// ── Public API ─────────────────────────────────────────────

export async function searchMovies(query: string, page = 1): Promise<{ items: ContentItem[]; totalPages: number; totalResults: number }> {
  const res = await tmdb.searchMovies(query, page);
  return {
    items: resultsToItems(res.results),
    totalPages: res.total_pages,
    totalResults: res.total_results,
  };
}

export async function fetchMovieDetail(id: number): Promise<MovieDetail> {
  return enrichDetail(id);
}

export async function fetchTrendingMovies(page = 1): Promise<ContentItem[]> {
  const res = await tmdb.getTrendingMovies("week", page);
  return resultsToItems(res.results);
}

export async function fetchPopularMovies(page = 1): Promise<ContentItem[]> {
  const res = await tmdb.getPopularMovies(page);
  return resultsToItems(res.results);
}

export async function fetchTopRatedMovies(page = 1): Promise<ContentItem[]> {
  const res = await tmdb.getTopRatedMovies(page);
  return resultsToItems(res.results);
}

export async function fetchUpcomingMovies(page = 1): Promise<ContentItem[]> {
  const res = await tmdb.getUpcomingMovies(page);
  return resultsToItems(res.results);
}

export async function fetchNowPlayingMovies(page = 1): Promise<ContentItem[]> {
  const res = await tmdb.getNowPlayingMovies(page);
  return resultsToItems(res.results);
}

export async function fetchSimilarMovies(id: number, page = 1): Promise<ContentItem[]> {
  const res = await tmdb.getSimilarMovies(id, page);
  return resultsToItems(res.results);
}

export async function fetchRecommendations(id: number, page = 1): Promise<ContentItem[]> {
  const res = await tmdb.getRecommendations(id, page);
  return resultsToItems(res.results);
}

export const movieService = {
  searchMovies,
  fetchMovieDetail,
  fetchTrendingMovies,
  fetchPopularMovies,
  fetchTopRatedMovies,
  fetchUpcomingMovies,
  fetchNowPlayingMovies,
  fetchSimilarMovies,
  fetchRecommendations,
};
