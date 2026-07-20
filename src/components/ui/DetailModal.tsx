import { motion, AnimatePresence } from "motion/react";
import { X, Film, Calendar, Star, Clock } from "lucide-react";
import { posterUrl, backdropUrl, type ContentItem } from "@/types/content";

interface DetailModalProps {
  item: ContentItem | null;
  onClose: () => void;
}

export function DetailModal({ item, onClose }: DetailModalProps) {
  return (
    <AnimatePresence>
      {item && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed inset-x-4 top-[5%] z-50 mx-auto max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl sm:inset-x-auto"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="relative">
              <img
                src={backdropUrl(item) || posterUrl(item)}
                alt={item.title}
                className="h-48 w-full object-cover sm:h-64"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />

              <button
                onClick={onClose}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              <h2 className="mb-2 text-xl font-bold text-primary">
                {item.title}
              </h2>

              <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-secondary">
                {item.year && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {item.year}
                  </span>
                )}
                {item.rating != null && (
                  <span className="flex items-center gap-1 text-warning">
                    <Star className="h-3.5 w-3.5 fill-warning" />
                    {item.rating}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Film className="h-3.5 w-3.5" />
                  {item.type === "series" ? "Series" : "Movie"}
                </span>
                {item.runtime != null && item.runtime > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {item.runtime}m
                  </span>
                )}
              </div>

              {item.genres.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {item.genres.map((g) => (
                    <span
                      key={g}
                      className="rounded-lg bg-surface px-2.5 py-1 text-xs text-secondary"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {item.description && (
                <p className="mb-4 text-sm leading-relaxed text-secondary">
                  {item.description}
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
