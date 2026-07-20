import { memo } from "react";
import { motion } from "motion/react";
import { Play } from "lucide-react";
import { useNavigate } from "react-router";
import { cn } from "@/lib/cn";
import { posterUrl, typeLabel, type ContentItem } from "@/types/content";

interface PosterCardProps {
  item: ContentItem;
  className?: string;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

const sizeClasses = {
  sm: "w-[130px] min-w-[130px] md:w-[150px] md:min-w-[150px]",
  md: "w-[150px] min-w-[150px] md:w-[180px] md:min-w-[180px]",
  lg: "w-[180px] min-w-[180px] md:w-[220px] md:min-w-[220px]",
} as const;

export const PosterCard = memo(function PosterCard({
  item,
  className,
  size = "md",
  onClick,
}: PosterCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (item.slug) {
      navigate(`/detail/${item.slug}`);
    }
  };

  return (
    <motion.div
      className={cn(
        "group relative shrink-0 cursor-pointer",
        sizeClasses[size],
        className
      )}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={handleClick}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-card">
        <img
          src={posterUrl(item)}
          alt={item.title}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/90 shadow-lg">
            <Play className="h-4 w-4 fill-white text-white" />
          </div>
        </div>

        {item.rating != null && (
          <div className="absolute right-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-medium text-warning">
            ★ {item.rating}
          </div>
        )}

        {item.qualityBadges && item.qualityBadges.length > 0 && (
          <div className="absolute left-2 top-2 flex gap-1">
            {item.qualityBadges.slice(0, 3).map((b) => (
              <span
                key={b}
                className="rounded bg-black/70 px-1 py-0.5 text-[9px] font-bold text-white"
              >
                {b}
              </span>
            ))}
          </div>
        )}

        {!item.qualityBadges?.length && (
          <div className="absolute left-2 top-2 rounded-md bg-accent/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
            {typeLabel(item.type)}
          </div>
        )}
      </div>

      <div className="mt-2 px-0.5">
        <h3 className="truncate text-sm font-medium text-primary">
          {item.title}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-secondary">
          {item.year && <span>{item.year}</span>}
          {item.year && (
            <span className="text-border">|</span>
          )}
          <span>{typeLabel(item.type)}</span>
          {item.seasonInfo && (
            <>
              <span className="text-border">|</span>
              <span>{item.seasonInfo}</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
});
