import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router";
import { PosterCard } from "@/components/cards/PosterCard";
import { Chip } from "@/components/ui/Chip";
import { useSearchStore } from "@/stores/contentStore";
import type { ContentType, ContentItem } from "@/types/content";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

const TYPE_FILTERS: { label: string; value: ContentType | "" }[] = [
  { label: "All", value: "" },
  { label: "Movies", value: "movie" },
  { label: "Series", value: "series" },
];

export function SearchModal({ open, onClose }: SearchModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localQuery, setLocalQuery] = useState("");
  const navigate = useNavigate();

  const {
    type,
    results,
    totalResults,
    loading,
    error,
    setQuery,
    setType,
    search,
    reset,
  } = useSearchStore();

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setLocalQuery("");
      reset();
    }
  }, [open, reset]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setQuery(localQuery);
      search();
    },
    [localQuery, setQuery, search]
  );

  const handleCardClick = useCallback(
    (item: ContentItem) => {
      onClose();
      if (item.slug) navigate(`/detail/${item.slug}`);
    },
    [onClose, navigate]
  );

  const handleTypeChange = useCallback(
    (newType: ContentType | "") => {
      setType(newType);
      if (localQuery) {
        setQuery(localQuery);
        search();
      }
    },
    [setType, localQuery, setQuery, search]
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 flex h-full w-full flex-col overflow-hidden bg-bg md:mx-auto md:mt-16 md:h-[80vh] md:max-w-2xl md:rounded-2xl md:border md:border-border md:shadow-2xl"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <form onSubmit={handleSubmit} className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
                <input
                  ref={inputRef}
                  type="text"
                  value={localQuery}
                  onChange={(e) => setLocalQuery(e.target.value)}
                  placeholder="Search movies, series, anime..."
                  className="h-10 w-full rounded-lg border border-border bg-surface pl-10 pr-4 text-sm text-primary placeholder:text-secondary/60 focus:border-accent focus:outline-none"
                />
              </form>
              <button
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-secondary hover:bg-surface hover:text-primary"
                aria-label="Close search"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 border-b border-border px-4 py-2">
              {TYPE_FILTERS.map((f) => (
                <Chip
                  key={f.value}
                  active={type === f.value}
                  onClick={() => handleTypeChange(f.value)}
                >
                  {f.label}
                </Chip>
              ))}
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {!localQuery && results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Search className="mb-4 h-12 w-12 text-border" />
                  <h2 className="mb-2 text-lg font-semibold text-primary">
                    Search for movies & series
                  </h2>
                  <p className="text-sm text-secondary">
                    Powered by 4KHDHub
                  </p>
                </div>
              ) : loading && results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="mb-3 h-8 w-8 animate-spin text-accent" />
                  <p className="text-sm text-secondary">Searching…</p>
                </div>
              ) : error && results.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-secondary">{error}</p>
                </div>
              ) : (
                <div>
                  {totalResults > 0 && (
                    <p className="mb-4 text-sm text-secondary">
                      {totalResults} result{totalResults !== 1 ? "s" : ""} found
                    </p>
                  )}

                  <div className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-4">
                    {results.map((item) => (
                      <PosterCard
                        key={item.id}
                        item={item}
                        size="sm"
                        onClick={() => handleCardClick(item)}
                        className="w-full min-w-0 md:w-full md:min-w-0"
                      />
                    ))}
                  </div>

                  {loading && (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-accent" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
