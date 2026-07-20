import { describe, it, expect, beforeEach, vi } from "vitest";
import { cacheClear } from "../providers/cache";

// Mock the providers
vi.mock("../providers/tmdb", () => ({
  tmdb: {
    searchMovies: vi.fn(),
    getMovieDetail: vi.fn(),
    getTrendingMovies: vi.fn(),
    getPopularMovies: vi.fn(),
    getTopRatedMovies: vi.fn(),
    getUpcomingMovies: vi.fn(),
    getNowPlayingMovies: vi.fn(),
    getSimilarMovies: vi.fn(),
    getRecommendations: vi.fn(),
    getMovieCredits: vi.fn(),
    getMovieVideos: vi.fn(),
    getMovieImages: vi.fn(),
  },
}));

vi.mock("../providers/tvmaze", () => ({
  tvmaze: {
    searchShows: vi.fn(),
    getShowById: vi.fn(),
    getShowSeasons: vi.fn(),
    getShowEpisodes: vi.fn(),
    getSeasonEpisodes: vi.fn(),
    getShowCast: vi.fn(),
    getShowCrew: vi.fn(),
    getSchedule: vi.fn(),
  },
}));

import { tmdb } from "../providers/tmdb";
import { tvmaze } from "../providers/tvmaze";
import { movieService } from "../services/movieService";
import { tvService } from "../services/tvService";

const tmdbMock = vi.mocked(tmdb);
const tvmazeMock = vi.mocked(tvmaze);

describe("movieService", () => {
  beforeEach(() => {
    cacheClear();
    vi.clearAllMocks();
  });

  it("searchMovies returns ContentItems", async () => {
    tmdbMock.searchMovies.mockResolvedValueOnce({
      page: 1,
      results: [
        { id: 550, title: "Fight Club", original_title: "Fight Club", overview: "desc", release_date: "1999-10-15", poster_path: "/p.jpg", backdrop_path: "/b.jpg", genre_ids: [], vote_average: 8.4, vote_count: 28000, popularity: 60, adult: false, original_language: "en" },
      ],
      total_pages: 5,
      total_results: 100,
    });

    const res = await movieService.searchMovies("fight club");
    expect(res.items).toHaveLength(1);
    expect(res.items[0].title).toBe("Fight Club");
    expect(res.items[0].source).toBe("tmdb");
    expect(res.totalResults).toBe(100);
  });

  it("fetchMovieDetail returns enriched MovieDetail", async () => {
    tmdbMock.getMovieDetail.mockResolvedValueOnce({
      id: 550, title: "Fight Club", original_title: "Fight Club", overview: "desc",
      release_date: "1999-10-15", poster_path: "/p.jpg", backdrop_path: "/b.jpg",
      genres: [{ id: 18, name: "Drama" }], vote_average: 8.4, vote_count: 28000,
      runtime: 139, status: "Released", tagline: "Soap", budget: 63000000,
      revenue: 100000000, production_companies: [], belongs_to_collection: null,
      homepage: null, imdb_id: "tt0137523", original_language: "en",
      popularity: 60, adult: false, video: false,
    });
    tmdbMock.getMovieCredits.mockResolvedValueOnce({
      id: 550,
      cast: [{ id: 1, name: "Brad", character: "Tyler", profile_path: "/bp.jpg", order: 0, known_for_department: "Acting" }],
      crew: [{ id: 2, name: "Fincher", job: "Director", department: "Directing", profile_path: "/df.jpg", known_for_department: "Directing" }],
    });
    tmdbMock.getMovieVideos.mockResolvedValueOnce({ id: 550, results: [] });
    tmdbMock.getMovieImages.mockResolvedValueOnce({
      id: 550, backdrops: [], logos: [], posters: [],
    });
    tmdbMock.getSimilarMovies.mockResolvedValueOnce({
      page: 1, results: [], total_pages: 1, total_results: 0,
    });
    tmdbMock.getRecommendations.mockResolvedValueOnce({
      page: 1, results: [], total_pages: 1, total_results: 0,
    });

    const detail = await movieService.fetchMovieDetail(550);
    expect(detail.runtime).toBe(139);
    expect(detail.tagline).toBe("Soap");
    expect(detail.imdbId).toBe("tt0137523");
    expect(detail.cast).toHaveLength(1);
    expect(detail.crew).toHaveLength(1);
  });

  it("fetchTrendingMovies returns items", async () => {
    tmdbMock.getTrendingMovies.mockResolvedValueOnce({
      page: 1, results: [{ id: 1, title: "Trending", release_date: "2024-01-01", poster_path: null, backdrop_path: null, overview: "", genre_ids: [], vote_average: 7.0, vote_count: 10, popularity: 50, adult: false, original_title: "Trending", original_language: "en" }],
      total_pages: 1, total_results: 1,
    });

    const items = await movieService.fetchTrendingMovies();
    expect(items).toHaveLength(1);
  });

  it("fetchPopularMovies returns items", async () => {
    tmdbMock.getPopularMovies.mockResolvedValueOnce({
      page: 1, results: [], total_pages: 1, total_results: 0,
    });
    const items = await movieService.fetchPopularMovies();
    expect(items).toHaveLength(0);
  });

  it("fetchTopRatedMovies returns items", async () => {
    tmdbMock.getTopRatedMovies.mockResolvedValueOnce({
      page: 1, results: [], total_pages: 1, total_results: 0,
    });
    const items = await movieService.fetchTopRatedMovies();
    expect(items).toHaveLength(0);
  });

  it("fetchUpcomingMovies returns items", async () => {
    tmdbMock.getUpcomingMovies.mockResolvedValueOnce({
      page: 1, results: [], total_pages: 1, total_results: 0,
    });
    const items = await movieService.fetchUpcomingMovies();
    expect(items).toHaveLength(0);
  });

  it("fetchNowPlayingMovies returns items", async () => {
    tmdbMock.getNowPlayingMovies.mockResolvedValueOnce({
      page: 1, results: [], total_pages: 1, total_results: 0,
    });
    const items = await movieService.fetchNowPlayingMovies();
    expect(items).toHaveLength(0);
  });

  it("fetchSimilarMovies returns items", async () => {
    tmdbMock.getSimilarMovies.mockResolvedValueOnce({
      page: 1, results: [], total_pages: 1, total_results: 0,
    });
    const items = await movieService.fetchSimilarMovies(550);
    expect(items).toHaveLength(0);
  });

  it("fetchRecommendations returns items", async () => {
    tmdbMock.getRecommendations.mockResolvedValueOnce({
      page: 1, results: [], total_pages: 1, total_results: 0,
    });
    const items = await movieService.fetchRecommendations(550);
    expect(items).toHaveLength(0);
  });

  it("filters out adult movies", async () => {
    tmdbMock.searchMovies.mockResolvedValueOnce({
      page: 1,
      results: [
        { id: 1, title: "Adult", adult: true, release_date: "2024-01-01", poster_path: null, backdrop_path: null, overview: "", genre_ids: [], vote_average: 0, vote_count: 0, popularity: 0, original_title: "Adult", original_language: "en" },
        { id: 2, title: "Normal", adult: false, release_date: "2024-01-01", poster_path: null, backdrop_path: null, overview: "", genre_ids: [], vote_average: 0, vote_count: 0, popularity: 0, original_title: "Normal", original_language: "en" },
      ],
      total_pages: 1,
      total_results: 2,
    });

    const res = await movieService.searchMovies("test");
    expect(res.items).toHaveLength(1);
    expect(res.items[0].title).toBe("Normal");
  });

  it("handles provider failure gracefully", async () => {
    tmdbMock.searchMovies.mockRejectedValueOnce(new Error("API down"));
    await expect(movieService.searchMovies("test")).rejects.toThrow("API down");
  });
});

describe("tvService", () => {
  beforeEach(() => {
    cacheClear();
    vi.clearAllMocks();
  });

  it("searchShows returns ContentItems", async () => {
    tvmazeMock.searchShows.mockResolvedValueOnce([
      {
        score: 0.95,
        show: {
          id: 169, name: "Breaking Bad", premiered: "2008-01-20", ended: "2013-09-29",
          status: "Ended", rating: { average: 9.2 },
          image: { medium: "https://example.com/m.jpg", original: "https://example.com/o.jpg" },
          summary: "<p>Chemistry teacher.</p>", genres: ["Drama"], runtime: 60,
          averageRuntime: 49, language: "English", webChannel: null,
          network: { id: 20, name: "AMC", country: { name: "US" } },
          schedule: { time: "22:00", days: ["Sunday"] }, updated: 1700000000,
        },
      },
    ]);

    const items = await tvService.searchShows("Breaking Bad");
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("Breaking Bad");
    expect(items[0].source).toBe("tvmaze");
  });

  it("fetchShowDetail returns TvDetail", async () => {
    tvmazeMock.getShowById.mockResolvedValueOnce({
      id: 169, name: "Breaking Bad", premiered: "2008-01-20", ended: "2013-09-29",
      status: "Ended", rating: { average: 9.2 }, image: null,
      summary: "<p>Chemistry teacher.</p>", genres: ["Drama"], runtime: 60,
      averageRuntime: 49, language: "English", webChannel: null,
      network: { id: 20, name: "AMC", country: { name: "US" } },
      schedule: { time: "22:00", days: ["Sunday"] }, updated: 1700000000,
    });
    tvmazeMock.getShowSeasons.mockResolvedValueOnce([
      { id: 1, url: "", name: "Season 1", number: 1, episodeOrder: 7, premiereDate: "2008-01-20", endDate: "2008-03-09", network: null, image: null, summary: "" },
    ]);
    tvmazeMock.getShowEpisodes.mockResolvedValueOnce([
      { id: 1, url: "", name: "Pilot", season: 1, number: 1, type: "regular", airdate: "2008-01-20", airtime: "22:00", airstamp: null, runtime: 58, rating: { average: 8.2 }, image: null, summary: "" },
    ]);
    tvmazeMock.getShowCast.mockResolvedValueOnce([
      {
        person: { id: 1, name: "Bryan Cranston", image: null, country: null, birthday: null, deathday: null, gender: null },
        character: { id: 10, name: "Walter White", image: null },
        self: false, voice: false,
      },
    ]);

    const detail = await tvService.fetchShowDetail(169);
    expect(detail.title).toBe("Breaking Bad");
    expect(detail.status).toBe("Ended");
    expect(detail.network).toBe("AMC");
    expect(detail.seasons).toHaveLength(1);
    expect(detail.episodes).toHaveLength(1);
    expect(detail.cast).toHaveLength(1);
  });

  it("fetchShowSeasons returns seasons", async () => {
    tvmazeMock.getShowSeasons.mockResolvedValueOnce([
      { id: 1, url: "", name: "Season 1", number: 1, episodeOrder: 7, premiereDate: "2008-01-20", endDate: null, network: null, image: null, summary: "" },
    ]);

    const seasons = await tvService.fetchShowSeasons(169);
    expect(seasons).toHaveLength(1);
  });

  it("fetchShowEpisodes returns episodes", async () => {
    tvmazeMock.getShowEpisodes.mockResolvedValueOnce([
      { id: 1, url: "", name: "Pilot", season: 1, number: 1, type: "regular", airdate: "2008-01-20", airtime: "22:00", airstamp: null, runtime: 58, rating: { average: 8.2 }, image: null, summary: "" },
    ]);

    const episodes = await tvService.fetchShowEpisodes(169);
    expect(episodes).toHaveLength(1);
  });

  it("fetchSeasonEpisodes returns episodes for a season", async () => {
    tvmazeMock.getSeasonEpisodes.mockResolvedValueOnce([
      { id: 10, url: "", name: "Ep 1", season: 1, number: 1, type: "regular", airdate: null, airtime: null, airstamp: null, runtime: null, rating: { average: null }, image: null, summary: null },
    ]);

    const episodes = await tvService.fetchSeasonEpisodes(1);
    expect(episodes).toHaveLength(1);
  });

  it("deduplicates search results", async () => {
    tvmazeMock.searchShows.mockResolvedValueOnce([
      { score: 0.9, show: { id: 169, name: "Breaking Bad", premiered: "2008", ended: null, status: "Running", rating: { average: 9.2 }, image: null, summary: "", genres: [], runtime: null, averageRuntime: null, language: "", webChannel: null, network: null, schedule: { time: "", days: [] }, updated: 0 } },
      { score: 0.8, show: { id: 169, name: "Breaking Bad", premiered: "2008", ended: null, status: "Running", rating: { average: 9.2 }, image: null, summary: "", genres: [], runtime: null, averageRuntime: null, language: "", webChannel: null, network: null, schedule: { time: "", days: [] }, updated: 0 } },
    ]);

    const items = await tvService.searchShows("breaking bad");
    expect(items).toHaveLength(1);
  });

  it("handles provider failure gracefully", async () => {
    tvmazeMock.searchShows.mockRejectedValueOnce(new Error("API down"));
    await expect(tvService.searchShows("test")).rejects.toThrow("API down");
  });
});
