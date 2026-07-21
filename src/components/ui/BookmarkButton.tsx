import { Bookmark } from "lucide-react";
import { useBookmarkStore } from "@/stores/bookmarkStore";
import type { ContentItem } from "@/types/content";

interface Props {
  item: ContentItem;
  size?: "sm" | "md";
  className?: string;
}

export function BookmarkButton({ item, size = "sm", className = "" }: Props) {
  const isBookmarked = useBookmarkStore((s) => s.isBookmarked(item.id));
  const toggle = useBookmarkStore((s) => s.toggle);
  const active = isBookmarked;

  const sizeClasses = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const iconSize = size === "sm" ? 14 : 18;

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(item);
      }}
      className={`inline-flex items-center justify-center rounded-full transition-colors ${
        active
          ? "bg-accent/20 text-accent"
          : "bg-black/40 text-white/70 hover:bg-black/60 hover:text-white"
      } ${sizeClasses} ${className}`}
      title={active ? "Remove bookmark" : "Add bookmark"}
    >
      <Bookmark
        size={iconSize}
        className={active ? "fill-accent" : ""}
      />
    </button>
  );
}
