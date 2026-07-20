import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

interface CarouselProps {
  children: React.ReactNode;
  className?: string;
  spacing?: string;
}

export function Carousel({ children, className, spacing = "gap-3" }: CarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <div className={cn("group/carousel relative", className)}>
      <div ref={emblaRef} className="overflow-hidden">
        <div className={cn("flex", spacing)}>{children}</div>
      </div>

      {canScrollPrev && (
        <button
          onClick={scrollPrev}
          className="absolute -left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 text-secondary opacity-70 shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-card hover:text-primary md:opacity-0 md:group-hover/carousel:opacity-100"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {canScrollNext && (
        <button
          onClick={scrollNext}
          className="absolute -right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 text-secondary opacity-70 shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-card hover:text-primary md:opacity-0 md:group-hover/carousel:opacity-100"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
