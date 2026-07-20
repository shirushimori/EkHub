import { describe, it, expect } from "vitest";
import {
  tmdbPoster,
  tmdbBackdrop,
  tvmazeImage,
  tmdbMovieToContentItem,
  tmdbDetailToMovieDetail,
  tvmazeToShow,
  posterUrl,
  backdropUrl,
  typeLabel,
} from "../types/content";
import type { TmdbMovieResult, TmdbMovieDetail } from "../types/movie";
import type { TvmazeShow } from "../types/tv";

const mockMovieResult: TmdbMovieResult = {
  id: 550,
  title: "Fight Club",
  original_title: "Fight Club",
  overview: "An insomniac office worker...",
  release_date: "1999-10-15",
  poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
  backdrop_path: "/hZkgoQYus5dXo3H8T7Uef6DNknx.jpg",
  genre_ids: [18, 53],
  vote_average: 8.433,
  vote_count: 28000,
  popularity: 61.421,
  adult: false,
  original_language: "en",
};

const mockMovieDetail: TmdbMovieDetail = {
  ...mockMovieResult,
  genres: [{ id: 18, name: "Drama" }, { id: 53, name: "Thriller" }],
  runtime: 139,
  status: "Released",
  tagline: "Mischief. Mayhem. Soap.",
  budget: 63000000,
  revenue: 100853753,
  production_companies: [
    { id: 508, name: "Regency Enterprises", logo_path: "/7Puj9hGc8Fw09RWOHJQv6yF0zBz.png", origin_country: "US" },
  ],
  belongs_to_collection: null,
  homepage: "https://www.foxmovies.com/movies/fight-club",
  imdb_id: "tt0137523",
  video: false,
};

const mockTvmazeShow: TvmazeShow = {
  id: 169,
  name: "Breaking Bad",
  premiered: "2008-01-20",
  ended: "2013-09-29",
  status: "Ended",
  rating: { average: 9.2 },
  image: { medium: "https://example.com/medium.jpg", original: "https://example.com/original.jpg" },
  summary: "<p>A high school chemistry teacher turned meth cook.</p>",
  genres: ["Drama", "Crime", "Thriller"],
  runtime: 60,
  averageRuntime: 49,
  language: "English",
  webChannel: null,
  network: { id: 20, name: "AMC", country: { name: "United States" } },
  schedule: { time: "22:00", days: ["Sunday"] },
  updated: 1700000000,
};

describe("content type helpers", () => {
  describe("tmdbPoster", () => {
    it("builds poster URL from path", () => {
      expect(tmdbPoster("/abc.jpg")).toBe("https://image.tmdb.org/t/p/w500/abc.jpg");
    });

    it("returns empty string for null path", () => {
      expect(tmdbPoster(null)).toBe("");
    });

    it("supports custom size", () => {
      expect(tmdbPoster("/x.jpg", "w200")).toBe("https://image.tmdb.org/t/p/w200/x.jpg");
    });
  });

  describe("tmdbBackdrop", () => {
    it("builds backdrop URL", () => {
      expect(tmdbBackdrop("/bg.jpg")).toBe("https://image.tmdb.org/t/p/w1280/bg.jpg");
    });

    it("returns empty string for null path", () => {
      expect(tmdbBackdrop(null)).toBe("");
    });
  });

  describe("tvmazeImage", () => {
    it("prefers original", () => {
      expect(tvmazeImage({ medium: "m.jpg", original: "o.jpg" })).toBe("o.jpg");
    });

    it("falls back to medium", () => {
      expect(tvmazeImage({ medium: "m.jpg", original: "" })).toBe("m.jpg");
    });

    it("returns empty string for null", () => {
      expect(tvmazeImage(null)).toBe("");
    });
  });

  describe("tmdbMovieToContentItem", () => {
    it("converts movie result", () => {
      const item = tmdbMovieToContentItem(mockMovieResult);
      expect(item.id).toBe("tmdb:550");
      expect(item.title).toBe("Fight Club");
      expect(item.year).toBe("1999");
      expect(item.type).toBe("movie");
      expect(item.source).toBe("tmdb");
      expect(item.rating).toBe(8.433);
      expect(item.poster).toContain("/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg");
      expect(item.backdrop).toContain("/hZkgoQYus5dXo3H8T7Uef6DNknx.jpg");
      expect(item.description).toBe("An insomniac office worker...");
    });

    it("handles empty release date", () => {
      const item = tmdbMovieToContentItem({ ...mockMovieResult, release_date: "" });
      expect(item.year).toBe("");
    });
  });

  describe("tmdbDetailToMovieDetail", () => {
    it("converts movie detail", () => {
      const detail = tmdbDetailToMovieDetail(mockMovieDetail);
      expect(detail.id).toBe("tmdb:550");
      expect(detail.runtime).toBe(139);
      expect(detail.tagline).toBe("Mischief. Mayhem. Soap.");
      expect(detail.status).toBe("Released");
      expect(detail.imdbId).toBe("tt0137523");
      expect(detail.genres).toEqual(["Drama", "Thriller"]);
      expect(detail.productionCompanies).toHaveLength(1);
      expect(detail.productionCompanies[0].name).toBe("Regency Enterprises");
    });

    it("handles null runtime", () => {
      const detail = tmdbDetailToMovieDetail({ ...mockMovieDetail, runtime: null });
      expect(detail.runtime).toBeNull();
    });
  });

  describe("tvmazeToShow", () => {
    it("converts TV show", () => {
      const item = tvmazeToShow(mockTvmazeShow);
      expect(item.id).toBe("tv:169");
      expect(item.title).toBe("Breaking Bad");
      expect(item.year).toBe("2008");
      expect(item.type).toBe("series");
      expect(item.source).toBe("tvmaze");
      expect(item.rating).toBe(9.2);
      expect(item.genres).toEqual(["Drama", "Crime", "Thriller"]);
      expect(item.description).toBe("A high school chemistry teacher turned meth cook.");
      expect(item.backdrop).toBe("");
    });

    it("strips HTML from summary", () => {
      const item = tvmazeToShow(mockTvmazeShow);
      expect(item.description).not.toContain("<p>");
    });

    it("handles null premiered", () => {
      const show = { ...mockTvmazeShow, premiered: null };
      const item = tvmazeToShow(show);
      expect(item.year).toBe("");
    });
  });

  describe("posterUrl", () => {
    it("returns poster from item", () => {
      const item = tmdbMovieToContentItem(mockMovieResult);
      expect(posterUrl(item)).toContain("/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg");
    });

    it("returns placeholder when poster is empty", () => {
      const item = tmdbMovieToContentItem(mockMovieResult);
      item.poster = "";
      const url = posterUrl(item);
      expect(url).toContain("placehold.co");
    });
  });

  describe("backdropUrl", () => {
    it("returns backdrop from item", () => {
      const item = tmdbMovieToContentItem(mockMovieResult);
      expect(backdropUrl(item)).toContain("/hZkgoQYus5dXo3H8T7Uef6DNknx.jpg");
    });

    it("falls back to poster", () => {
      const item = tmdbMovieToContentItem(mockMovieResult);
      item.backdrop = "";
      expect(backdropUrl(item)).toContain("/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg");
    });
  });

  describe("typeLabel", () => {
    it("returns Movie for movie type", () => {
      expect(typeLabel("movie")).toBe("Movie");
    });

    it("returns Series for series type", () => {
      expect(typeLabel("series")).toBe("Series");
    });
  });
});
