import { create } from "zustand";

export type SourceMode = "hdhub4u" | "4khdhub" | "mix";

const STORAGE_KEY = "ekhub_source_mode";

interface SourceState {
  mode: SourceMode;
  setMode: (mode: SourceMode) => void;
}

function load(): SourceMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "hdhub4u" || raw === "4khdhub" || raw === "mix") return raw;
  } catch {}
  return "mix";
}

function save(mode: SourceMode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {}
}

export const useSourceStore = create<SourceState>((set) => ({
  mode: load(),
  setMode: (mode) => {
    set({ mode });
    save(mode);
  },
}));
