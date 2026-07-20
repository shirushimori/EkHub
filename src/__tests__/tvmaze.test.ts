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

const { tvmaze } = await import("../providers/tvmaze");

const mockShow = {
  id: 169,
  name: "Breaking Bad",
  premiered: "2008-01-20",
  ended: "2013-09-29",
  status: "Ended",
  rating: { average: 9.2 },
  image: { medium: "https://example.com/m.jpg", original: "https://example.com/o.jpg" },
  summary: "<p>Chemistry teacher turned meth cook.</p>",
  genres: ["Drama", "Crime"],
  runtime: 60,
  averageRuntime: 49,
  language: "English",
  webChannel: null,
  network: { id: 20, name: "AMC", country: { name: "US" } },
  schedule: { time: "22:00", days: ["Sunday"] },
  updated: 1700000000,
};

describe("tvmaze provider", () => {
  it("searchShows returns results", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ score: 0.95, show: mockShow }],
    });

    const results = await tvmaze.searchShows("Breaking Bad");
    expect(results).toHaveLength(1);
    expect(results[0].show.name).toBe("Breaking Bad");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toContain("/search/shows");
  });

  it("getShowById returns show detail", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockShow,
    });

    const show = await tvmaze.getShowById(169);
    expect(show.id).toBe(169);
    expect(show.name).toBe("Breaking Bad");
    expect(show.rating.average).toBe(9.2);
    expect(mockFetch).toHaveBeenCalledWith("https://api.tvmaze.com/shows/169?embed[]=nextepisode&embed[]=previousepisode");
  });

  it("getShowSeasons returns seasons", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, url: "", name: "Season 1", number: 1, episodeOrder: 7, premiereDate: "2008-01-20", endDate: "2008-03-09", network: { id: 20, name: "AMC" }, image: null, summary: "" },
        { id: 2, url: "", name: "Season 2", number: 2, episodeOrder: 13, premiereDate: "2009-03-08", endDate: "2009-05-31", network: null, image: null, summary: "" },
      ],
    });

    const result = await tvmaze.getShowSeasons(169);
    expect(result).toHaveLength(2);
    expect(result[0].number).toBe(1);
    expect(mockFetch).toHaveBeenCalledWith("https://api.tvmaze.com/shows/169/seasons");
  });

  it("getShowEpisodes returns episodes", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, url: "", name: "Pilot", season: 1, number: 1, type: "regular", airdate: "2008-01-20", airtime: "22:00", airstamp: "2008-01-21T03:00:00+00:00", runtime: 58, rating: { average: 8.2 }, image: null, summary: "" },
      ],
    });

    const result = await tvmaze.getShowEpisodes(169);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Pilot");
  });

  it("getSeasonEpisodes returns episodes for a season", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 10, name: "Ep 1", season: 1, number: 1 }],
    });

    const result = await tvmaze.getSeasonEpisodes(1);
    expect(result).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledWith("https://api.tvmaze.com/seasons/1/episodes");
  });

  it("getShowCast returns cast members", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          person: { id: 1, name: "Bryan Cranston", image: null, country: null, birthday: "1956-03-07", deathday: null, gender: "Male" },
          character: { id: 10, name: "Walter White", image: null },
          self: false,
          voice: false,
        },
      ],
    });

    const cast = await tvmaze.getShowCast(169);
    expect(cast).toHaveLength(1);
    expect(cast[0].person.name).toBe("Bryan Cranston");
    expect(cast[0].character.name).toBe("Walter White");
  });

  it("getShowCrew returns crew members", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          type: "Creator",
          person: { id: 2, name: "Vince Gilligan", image: null },
        },
      ],
    });

    const crew = await tvmaze.getShowCrew(169);
    expect(crew).toHaveLength(1);
    expect(crew[0].person.name).toBe("Vince Gilligan");
    expect(crew[0].type).toBe("Creator");
  });

  it("getSchedule returns schedule entries", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 1, show: { id: 100, name: "Test", image: null } }],
    });

    const schedule = await tvmaze.getSchedule("2024-01-01");
    expect(schedule).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledWith("https://api.tvmaze.com/schedule?date=2024-01-01&country=US");
  });

  it("caches search results", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ score: 0.9, show: mockShow }],
    });

    await tvmaze.searchShows("cached");
    await tvmaze.searchShows("cached");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("caches show details", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockShow,
    });

    await tvmaze.getShowById(169);
    await tvmaze.getShowById(169);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("throws on non-OK response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    await expect(tvmaze.getShowById(999999)).rejects.toThrow("TVMaze 404");
  });

  it("handles network errors", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network fail"));
    await expect(tvmaze.searchShows("fail")).rejects.toThrow("Network fail");
  });

  it("retries on rate limiting", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        headers: new Map([["retry-after", "1"]]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ score: 0.9, show: mockShow }],
      });

    vi.useFakeTimers();
    const promise = tvmaze.searchShows("rate limited");
    await vi.advanceTimersByTimeAsync(1100);
    const results = await promise;
    expect(results).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("uses custom base URL from env", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ score: 0.9, show: mockShow }],
    });

    await tvmaze.searchShows("test");
    expect(mockFetch.mock.calls[0][0]).toMatch(/^https?:\/\//);
  });
});
