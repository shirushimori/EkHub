import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { cacheClear } from "../providers/cache";

const mockFetch = vi.fn();
const originalFetch = globalThis.fetch;

beforeEach(() => {
  cacheClear();
  mockFetch.mockReset();
  globalThis.fetch = mockFetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

const { tmdb } = await import("../providers/tmdb");

describe("tmdb provider", () => {
  it("searchMovies returns results", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        page: 1,
        results: [{ id: 1, title: "Test Movie", release_date: "2024-01-01", poster_path: "/p.jpg", backdrop_path: "/b.jpg", overview: "desc", genre_ids: [], vote_average: 8.0, vote_count: 100, popularity: 50, adult: false, original_language: "en" }],
        total_pages: 5,
        total_results: 100,
      }),
    });

    const res = await tmdb.searchMovies("test");
    expect(res.results).toHaveLength(1);
    expect(res.results[0].title).toBe("Test Movie");
    expect(res.total_pages).toBe(5);
    expect(mockFetch.mock.calls[0][0]).toContain("/search/movie");
  });

  it("getMovieDetail returns movie detail", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 550, title: "Fight Club", original_title: "Fight Club", overview: "A classic",
        release_date: "1999-10-15", poster_path: "/p.jpg", backdrop_path: "/b.jpg",
        genres: [{ id: 18, name: "Drama" }], vote_average: 8.4, vote_count: 28000,
        runtime: 139, status: "Released", tagline: "Soap", budget: 63000000,
        revenue: 100000000, production_companies: [], belongs_to_collection: null,
        homepage: null, imdb_id: "tt0137523", original_language: "en",
        popularity: 60, adult: false, video: false,
      }),
    });

    const detail = await tmdb.getMovieDetail(550);
    expect(detail.id).toBe(550);
    expect(detail.title).toBe("Fight Club");
    expect(detail.runtime).toBe(139);
    expect(mockFetch.mock.calls[0][0]).toContain("/movie/550");
  });

  it("getTrendingMovies returns results", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        page: 1,
        results: [{ id: 1, title: "Trending", release_date: "2024-01-01", poster_path: null, backdrop_path: null, overview: "", genre_ids: [], vote_average: 7.0, vote_count: 10, popularity: 50, adult: false, original_title: "Trending", original_language: "en" }],
        total_pages: 1, total_results: 1,
      }),
    });

    const res = await tmdb.getTrendingMovies("week");
    expect(res.results).toHaveLength(1);
    expect(mockFetch.mock.calls[0][0]).toContain("/trending/movie/week");
  });

  it("getPopularMovies returns results", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ page: 1, results: [], total_pages: 1, total_results: 0 }),
    });
    await tmdb.getPopularMovies();
    expect(mockFetch.mock.calls[0][0]).toContain("/movie/popular");
  });

  it("getTopRatedMovies returns results", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ page: 1, results: [], total_pages: 1, total_results: 0 }),
    });
    await tmdb.getTopRatedMovies();
    expect(mockFetch.mock.calls[0][0]).toContain("/movie/top_rated");
  });

  it("getUpcomingMovies returns results", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ page: 1, results: [], total_pages: 1, total_results: 0 }),
    });
    await tmdb.getUpcomingMovies();
    expect(mockFetch.mock.calls[0][0]).toContain("/movie/upcoming");
  });

  it("getNowPlayingMovies returns results", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ page: 1, results: [], total_pages: 1, total_results: 0 }),
    });
    await tmdb.getNowPlayingMovies();
    expect(mockFetch.mock.calls[0][0]).toContain("/movie/now_playing");
  });

  it("getSimilarMovies returns results", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ page: 1, results: [], total_pages: 1, total_results: 0 }),
    });
    await tmdb.getSimilarMovies(550);
    expect(mockFetch.mock.calls[0][0]).toContain("/movie/550/similar");
  });

  it("getRecommendations returns results", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ page: 1, results: [], total_pages: 1, total_results: 0 }),
    });
    await tmdb.getRecommendations(550);
    expect(mockFetch.mock.calls[0][0]).toContain("/movie/550/recommendations");
  });

  it("getMovieCredits returns cast and crew", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 550,
        cast: [{ id: 1, name: "Brad Pitt", character: "Tyler", profile_path: "/bp.jpg", order: 0, known_for_department: "Acting" }],
        crew: [{ id: 2, name: "David Fincher", job: "Director", department: "Directing", profile_path: "/df.jpg", known_for_department: "Directing" }],
      }),
    });

    const credits = await tmdb.getMovieCredits(550);
    expect(credits.cast).toHaveLength(1);
    expect(credits.cast[0].name).toBe("Brad Pitt");
    expect(credits.crew).toHaveLength(1);
    expect(credits.crew[0].job).toBe("Director");
  });

  it("getMovieVideos returns videos", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 550,
        results: [{ id: "v1", key: "abc123", name: "Trailer", site: "YouTube", type: "Trailer", official: true, published_at: "2024-01-01" }],
      }),
    });

    const videos = await tmdb.getMovieVideos(550);
    expect(videos.results).toHaveLength(1);
    expect(videos.results[0].key).toBe("abc123");
  });

  it("getMovieImages returns images", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 550,
        backdrops: [{ aspect_ratio: 1.78, file_path: "/bd.jpg", height: 720, width: 1280, vote_average: 0, vote_count: 0 }],
        logos: [],
        posters: [{ aspect_ratio: 0.67, file_path: "/post.jpg", height: 900, width: 600, vote_average: 0, vote_count: 0 }],
      }),
    });

    const images = await tmdb.getMovieImages(550);
    expect(images.backdrops).toHaveLength(1);
    expect(images.posters).toHaveLength(1);
    expect(images.logos).toHaveLength(0);
  });

  it("getMovieGenres returns genre list", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ genres: [{ id: 28, name: "Action" }, { id: 35, name: "Comedy" }] }),
    });

    const genres = await tmdb.getMovieGenres();
    expect(genres.genres).toHaveLength(2);
    expect(genres.genres[0].name).toBe("Action");
  });

  it("caches search results", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ page: 1, results: [{ id: 1 }], total_pages: 1, total_results: 1 }),
    });

    await tmdb.searchMovies("cached");
    await tmdb.searchMovies("cached");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("caches movie details", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 550, title: "Fight Club", overview: "" }),
    });

    await tmdb.getMovieDetail(550);
    await tmdb.getMovieDetail(550);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("throws on non-OK response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    await expect(tmdb.getMovieDetail(999999)).rejects.toThrow("TMDB 404");
  });

  it("retries on rate limiting (429)", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        headers: new Map([["retry-after", "1"]]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ page: 1, results: [], total_pages: 1, total_results: 0 }),
      });

    vi.useFakeTimers();
    const promise = tmdb.searchMovies("rate limited");
    await vi.advanceTimersByTimeAsync(1100);
    const res = await promise;
    expect(res.results).toHaveLength(0);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("handles network errors", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network fail"));
    await expect(tmdb.searchMovies("fail")).rejects.toThrow("Network fail");
  });

  it("uses proxy endpoint instead of direct TMDb calls", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ page: 1, results: [], total_pages: 1, total_results: 0 }),
    });

    await tmdb.searchMovies("auth test");
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/api/tmdb/");
    expect(url).not.toContain("api.themoviedb.org");
  });
});
