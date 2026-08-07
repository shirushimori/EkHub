import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router";
import { Search, Loader2, ChevronDown } from "lucide-react";
import { PosterCard } from "@/components/cards/PosterCard";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { useSearchStore } from "@/stores/contentStore";
import type { ContentType } from "@/types/content";

const TYPE_FILTERS: { label: string; value: ContentType | "" }[] = [
  { label: "All", value: "" },
  { label: "Movies", value: "movie" },
  { label: "Series", value: "series" },
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const {
    query,
    type,
    results,
    totalResults,
    loading,
    loadingMore,
    hasMore,
    error,
    setQuery,
    setType,
    search,
    loadMore,
  } = useSearchStore();

  const [localQuery, setLocalQuery] = useState(initialQuery);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      search();
    }
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setQuery(localQuery);
      setSearchParams(localQuery ? { q: localQuery } : {});
      search();
    },
    [localQuery, setQuery, setSearchParams, search]
  );

  const handleTypeChange = useCallback(
    (newType: ContentType | "") => {
      setType(newType);
      if (query) search();
    },
    [setType, query, search]
  );

  return (
    <div className="px-4 py-6 md:px-8">
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative mx-auto max-w-xl">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary" />
          <input
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="Search movies, series, anime..."
            className="h-12 w-full rounded-xl border border-border bg-surface pl-12 pr-4 text-primary placeholder:text-secondary/60 focus:border-accent focus:outline-none"
          />
        </div>
      </form>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
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

      {!query && results.length === 0 ? (
        <div className="py-12 text-center">
          <Search className="mx-auto mb-4 h-12 w-12 text-border" />
          <h2 className="mb-2 text-lg font-semibold text-primary">
            Search for movies & series
          </h2>
          <p className="text-sm text-secondary">
            Powered by 4KHDHub
          </p>
        </div>
      ) : error && results.length === 0 ? (
        <EmptyState
          icon={<Search className="h-12 w-12" />}
          title="No results found"
          description={error}
        />
      ) : (
        <div>
          {totalResults > 0 && (
            <p className="mb-4 text-sm text-secondary">
              {totalResults} result{totalResults !== 1 ? "s" : ""} found
            </p>
          )}

          <div className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {results.map((item) => (
              <PosterCard
                key={item.id}
                item={item}
                size="sm"
                className="w-full min-w-0 md:w-full md:min-w-0"
              />
            ))}
          </div>

          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
          )}

          {!loading && hasMore && (
            <div className="flex justify-center py-6">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-6 py-3 text-sm font-medium text-primary transition-colors hover:bg-surface/80 disabled:opacity-50"
              >
                {loadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                Load More ({totalResults - results.length} remaining)
              </button>
            </div>
          )}

          {!loading && !hasMore && results.length > 0 && (
            <p className="py-6 text-center text-sm text-secondary">
              Showing all {totalResults} result{totalResults !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
