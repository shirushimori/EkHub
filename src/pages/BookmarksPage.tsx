import { Bookmark, Trash2 } from "lucide-react";
import { Link } from "react-router";
import { EmptyState } from "@/components/ui/EmptyState";
import { typeLabel } from "@/types/content";
import { useBookmarkStore } from "@/stores/bookmarkStore";

export default function BookmarksPage() {
  const items = useBookmarkStore((s) => s.items);
  const remove = useBookmarkStore((s) => s.remove);
  const clear = useBookmarkStore((s) => s.clear);

  if (items.length === 0) {
    return (
      <div className="px-4 py-6 md:px-8">
        <EmptyState
          icon={<Bookmark className="h-12 w-12" />}
          title="No bookmarks yet"
          description="Save your favorite content here for quick access."
        />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 md:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Bookmarks</h1>
        <button
          onClick={clear}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-secondary transition-colors hover:border-red-500/50 hover:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
        {items.map((item) => (
          <div key={item.id} className="group relative">
            <Link
              to={`/detail/${item.slug}`}
              className="block overflow-hidden rounded-xl bg-card transition-transform duration-200 hover:scale-[1.02]"
            >
              <div className="relative aspect-[2/3]">
                <img
                  src={item.poster || `https://placehold.co/300x450/151515/4F8CFF?text=${encodeURIComponent(item.title)}`}
                  alt={item.title}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <div className="absolute left-2 top-2 rounded-md bg-accent/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  {typeLabel(item.type)}
                </div>
              </div>
              <div className="p-2.5">
                <h3 className="truncate text-sm font-medium text-primary">
                  {item.title}
                </h3>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-secondary">
                  {item.year && <span>{item.year}</span>}
                  {item.seasonInfo && (
                    <>
                      <span className="text-border">|</span>
                      <span>{item.seasonInfo}</span>
                    </>
                  )}
                </div>
              </div>
            </Link>
            <button
              onClick={() => remove(item.id)}
              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white/70 opacity-0 transition-opacity hover:bg-red-500/80 hover:text-white group-hover:opacity-100"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
