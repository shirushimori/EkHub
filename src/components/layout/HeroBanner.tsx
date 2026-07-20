import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router";
import { cn } from "@/lib/cn";
import { posterUrl, typeLabel, type ContentItem } from "@/types/content";

interface HeroBannerProps {
  items: ContentItem[];
}

export function HeroBanner({ items }: HeroBannerProps) {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
  };

  const item = items[current];
  if (!item) return null;

  return (
    <div
      className="group/hero relative -mt-14 h-[60vh] min-h-[400px] overflow-hidden md:h-[64vh] md:min-h-[440px]"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <img
            src={posterUrl(item)}
            alt={item.title}
            className="h-full w-full object-cover blur-[2px] scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/80 to-bg/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/20 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 flex items-center">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-8 px-4 md:px-8">
          <div className="flex-1 py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={item.id}
                className="max-w-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <span className="mb-3 inline-block rounded-md bg-accent/20 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
                  {typeLabel(item.type)}
                </span>

                <h1 className="mb-3 text-3xl font-bold text-primary md:text-5xl">
                  {item.title}
                </h1>

                <div className="mb-3 flex items-center gap-2 text-sm text-secondary">
                  {item.year && <span>{item.year}</span>}
                  {item.rating != null && (
                    <>
                      <span className="text-border">|</span>
                      <span className="text-warning">★ {item.rating}</span>
                    </>
                  )}
                  {item.genres.length > 0 && (
                    <>
                      <span className="text-border">|</span>
                      <span>{item.genres.slice(0, 3).join(", ")}</span>
                    </>
                  )}
                </div>

                {item.description && (
                  <p className="mb-5 line-clamp-2 text-sm leading-relaxed text-secondary">
                    {item.description}
                  </p>
                )}

                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      item.slug && navigate(`/detail/${item.slug}`)
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-accent px-7 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
                  >
                    <Play className="h-4 w-4 fill-white" />
                    Play Now
                  </button>
                  <button
                    onClick={() =>
                      item.slug && navigate(`/detail/${item.slug}`)
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-7 py-3 text-sm font-medium text-primary backdrop-blur-sm transition-colors hover:bg-white/20"
                  >
                    <Info className="h-4 w-4" />
                    More Info
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={item.id}
              className="relative hidden shrink-0 md:block"
              initial={{ opacity: 0, x: 40, rotateY: -8 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              exit={{ opacity: 0, x: -40, rotateY: 8 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="relative h-[320px] w-[220px] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10">
                <img
                  src={posterUrl(item)}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-xs font-semibold text-white/90 line-clamp-2">
                    {item.title}
                  </p>
                  {item.year && (
                    <p className="mt-0.5 text-[10px] text-white/50">
                      {item.year}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <button
        onClick={prev}
        className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-70 backdrop-blur-sm transition-opacity hover:bg-black/60 md:opacity-0 md:group-hover/hero:opacity-100"
        aria-label="Previous"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        onClick={next}
        className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-70 backdrop-blur-sm transition-opacity hover:bg-black/60 md:opacity-0 md:group-hover/hero:opacity-100"
        aria-label="Next"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={cn(
              "h-1 rounded-full transition-all duration-300",
              i === current ? "w-6 bg-accent" : "w-1.5 bg-white/30"
            )}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
