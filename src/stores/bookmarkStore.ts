import { create } from "zustand";
import type { ContentItem, ContentType } from "@/types/content";

const STORAGE_KEY = "ekhub_bookmarks";

export interface BookmarkItem {
  id: string;
  title: string;
  poster: string;
  slug: string;
  type: ContentType;
  year: string;
  seasonInfo?: string;
  addedAt: number;
}

interface BookmarkState {
  items: BookmarkItem[];
  add: (item: ContentItem) => void;
  remove: (id: string) => void;
  toggle: (item: ContentItem) => void;
  isBookmarked: (id: string) => boolean;
  clear: () => void;
}

function load(): BookmarkItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(items: BookmarkItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch { /* quota exceeded etc */ }
}

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
  items: load(),

  add: (item) => {
    const exists = get().items.some((b) => b.id === item.id);
    if (exists) return;
    const bookmark: BookmarkItem = {
      id: item.id,
      title: item.title,
      poster: item.poster,
      slug: item.slug || item.id.split(":").slice(1).join(":"),
      type: item.type,
      year: item.year,
      seasonInfo: item.seasonInfo,
      addedAt: Date.now(),
    };
    const next = [bookmark, ...get().items];
    set({ items: next });
    save(next);
  },

  remove: (id) => {
    const next = get().items.filter((b) => b.id !== id);
    set({ items: next });
    save(next);
  },

  toggle: (item) => {
    const exists = get().items.some((b) => b.id === item.id);
    if (exists) get().remove(item.id);
    else get().add(item);
  },

  isBookmarked: (id) => get().items.some((b) => b.id === id),

  clear: () => {
    set({ items: [] });
    save([]);
  },
}));
