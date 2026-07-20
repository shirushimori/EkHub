import { memo } from "react";
import { motion } from "motion/react";
import { Play, Clock } from "lucide-react";
import { cn } from "@/lib/cn";
import { posterUrl, type ContentItem } from "@/types/content";

interface ContinueWatchingCardProps {
  item: ContentItem & {
    progress?: number;
    currentEpisode?: string;
    lastWatched?: string;
  };
  className?: string;
  onClick?: () => void;
}

export const ContinueWatchingCard = memo(function ContinueWatchingCard({
  item,
  className,
  onClick,
}: ContinueWatchingCardProps) {
  const progress = item.progress ?? Math.floor(Math.random() * 80 + 10);

  return (
    <motion.div
      className={cn(
        "group relative w-[280px] min-w-[280px] cursor-pointer md:w-[320px] md:min-w-[320px]",
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={onClick}
    >
      <div className="relative aspect-video overflow-hidden rounded-xl bg-card">
        <img
          src={posterUrl(item)}
          alt={item.title}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/90 shadow-lg">
            <Play className="h-5 w-5 fill-white text-white" />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="mb-2 h-1 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-accent transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="truncate text-sm font-semibold text-primary">
                {item.title}
              </h3>
              {item.currentEpisode && (
                <p className="text-xs text-secondary">{item.currentEpisode}</p>
              )}
            </div>
            {item.lastWatched && (
              <div className="flex items-center gap-1 text-xs text-secondary">
                <Clock className="h-3 w-3" />
                <span>{item.lastWatched}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});
