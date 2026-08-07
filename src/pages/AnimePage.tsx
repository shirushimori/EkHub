import { useEffect } from "react";
import { PosterCard } from "@/components/cards/PosterCard";
import { Carousel } from "@/components/carousel/Carousel";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { Skeleton } from "@/components/ui/Skeleton";
import { useContentStore } from "@/stores/contentStore";

export default function AnimePage() {
  const { anime, fetchAnime } = useContentStore();

  useEffect(() => {
    fetchAnime();
  }, [fetchAnime]);

  return (
    <div className="px-4 py-6 md:px-8">
      <SectionHeader title="Anime" subtitle="Explore anime series and movies" />

      <CollapsibleSection title="Trending Anime" defaultOpen>
        <Carousel>
          {anime.length > 0
            ? anime.slice(0, 15).map((item) => (
                <PosterCard
                  key={item.id}
                  item={item}
                  size="lg"
                />
              ))
            : Array.from({ length: 6 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-[370px] w-[220px] min-w-[220px] rounded-xl"
                />
              ))}
        </Carousel>
      </CollapsibleSection>

      <CollapsibleSection
        title="All Anime"
        subtitle={`${anime.length} anime loaded`}
      >
        <div className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {anime.length > 0
            ? anime.map((item) => (
                <PosterCard
                  key={item.id}
                  item={item}
                  size="sm"
                  className="w-full min-w-0 md:w-full md:min-w-0"
                />
              ))
            : Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[2/3] rounded-xl" />
              ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}
