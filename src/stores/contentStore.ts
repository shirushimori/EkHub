import { create } from "zustand";
import { scraperService, type SourceDetail } from "@/services/scraperService";

import type { ContentItem, MovieDetail, TvDetail, ContentType } from "@/types/content";
import type { ScraperSource } from "@/types/scraper";

type ContentDetail = MovieDetail | TvDetail;

// ── Search Store ──────────────────────────────────────────────

interface SearchState {
  query: string;
  type: ContentType | "";
  results: ContentItem[];
  totalResults: number;
  loading: boolean;
  error: string | null;
  setQuery: (q: string) => void;
  setType: (t: ContentType | "") => void;
  search: () => Promise<void>;
  reset: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: "",
  type: "",
  results: [],
  totalResults: 0,
  loading: false,
  error: null,

  setQuery: (query) => set({ query }),
  setType: (type) => set({ type, results: [], totalResults: 0 }),

  search: async () => {
    const { query, type } = get();
    if (!query.trim()) return;

    set({ loading: true, error: null });

    try {
      const allResults = await scraperService.search(query);

      const filtered = type
        ? allResults.filter((i) => i.type === type)
        : allResults;

      set({
        results: filtered,
        totalResults: filtered.length,
        loading: false,
      });
    } catch {
      set({ loading: false, error: "Failed to search" });
    }
  },

  reset: () =>
    set({
      query: "",
      type: "",
      results: [],
      totalResults: 0,
      loading: false,
      error: null,
    }),
}));

// ── Content Store ─────────────────────────────────────────────

interface ContentState {
  trending: ContentItem[];
  popular: ContentItem[];
  topRated: ContentItem[];
  recentlyAdded: ContentItem[];
  movies: ContentItem[];
  series: ContentItem[];
  anime: ContentItem[];
  korean: ContentItem[];
  detail: ContentDetail | null;
  detailSources: SourceDetail[];
  activeSource: ScraperSource | null;
  loading: boolean;
  error: string | null;
  loaded: boolean;

  fetchAll: () => Promise<void>;
  fetchMovies: () => Promise<void>;
  fetchSeries: () => Promise<void>;
  fetchAnime: () => Promise<void>;
  fetchKorean: () => Promise<void>;
  fetchCategory: (slug: string) => Promise<void>;
  fetchDetail: (id: string, type: ContentType) => Promise<void>;
  switchSource: (source: ScraperSource) => Promise<void>;
}

export const useContentStore = create<ContentState>((set, get) => ({
  trending: [],
  popular: [],
  topRated: [],
  recentlyAdded: [],
  movies: [],
  series: [],
  anime: [],
  korean: [],
  detail: null,
  detailSources: [],
  activeSource: null,
  loading: false,
  error: null,
  loaded: false,

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const homeItems = await scraperService.getHome();

      const movies = homeItems.filter((i) => i.type === "movie");
      const seriesItems = homeItems.filter((i) => i.type === "series");

      set({
        trending: homeItems.slice(0, 20),
        popular: homeItems.slice(0, 20),
        topRated: homeItems.slice(10, 30),
        recentlyAdded: homeItems.slice(0, 20),
        movies: movies.slice(0, 20),
        series: seriesItems.slice(0, 20),
        loading: false,
        loaded: true,
      });
    } catch {
      set({ loading: false, error: "Failed to load content" });
    }
  },

  fetchMovies: async () => {
    try {
      const { items } = await scraperService.getCategory("movies");
      set({ movies: items });
    } catch {
      set({ error: "Failed to load movies" });
    }
  },

  fetchSeries: async () => {
    try {
      const { items } = await scraperService.getCategory("series");
      set({ series: items });
    } catch {
      set({ error: "Failed to load series" });
    }
  },

  fetchAnime: async () => {
    try {
      const { items } = await scraperService.getCategory("anime");
      set({ anime: items });
    } catch {
      set({ error: "Failed to load anime" });
    }
  },

  fetchKorean: async () => {
    try {
      const { items } = await scraperService.getCategory("korean-series");
      set({ korean: items });
    } catch {
      set({ error: "Failed to load Korean series" });
    }
  },

  fetchCategory: async (slug: string) => {
    try {
      const { items } = await scraperService.getCategory(slug);
      if (slug === "movies" || slug === "hindi-movies" || slug === "english-movies") {
        set({ movies: items });
      } else if (slug === "series" || slug === "hindi-series" || slug === "english-series" || slug === "drama-series") {
        set({ series: items });
      } else if (slug === "anime") {
        set({ anime: items });
      } else if (slug === "korean-series") {
        set({ korean: items });
      }
    } catch {
      set({ error: "Failed to load category" });
    }
  },

  fetchDetail: async (id: string, _type: ContentType) => {
    console.log(`%c[store] %cfetchDetail("${id}")`, "color:#4F8CFF;font-weight:bold", "color:inherit");
    set({ loading: true, detail: null, error: null });
    try {
      const result = await scraperService.getDetailMulti(id);
      console.log(`%c[store] %cfetchDetail OK: ${result.sources.length} source(s) [${result.sources.map((s) => s.source).join(", ")}]`, "color:#44ff44;font-weight:bold", "color:inherit");
      set({
        detail: result.primary,
        detailSources: result.sources,
        activeSource: result.sources[0]?.source || null,
        loading: false,
      });
    } catch (e) {
      console.error(`%c[store] %cfetchDetail failed:`, "color:#ff4444;font-weight:bold", "color:inherit", e);
      set({ loading: false, error: "Failed to load details" });
    }
  },

  switchSource: async (source: ScraperSource) => {
    const { detailSources } = get();
    console.log(`%c[store] %cswitchSource("${source}")`, "color:#4F8CFF;font-weight:bold", "color:inherit");
    const match = detailSources.find((s) => s.source === source);
    if (match) {
      set({ detail: match.detail, activeSource: source });
    }
  },
}));
