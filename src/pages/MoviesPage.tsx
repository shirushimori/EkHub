import { useEffect } from "react";
import { PosterCard } from "@/components/cards/PosterCard";
import { Carousel } from "@/components/carousel/Carousel";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useContentStore } from "@/stores/contentStore";

export default function MoviesPage() {
  const { movies, fetchMovies } = useContentStore();

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  return (
    <div className="px-4 py-6 md:px-8">
      <SectionHeader title="Movies" subtitle="Watch the latest movies" />

      <section className="mb-8">
        <SectionHeader title="Popular Movies" />
        <Carousel>
          {movies.length > 0
            ? movies.slice(0, 15).map((item) => (
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
      </section>

      <section>
        <SectionHeader
          title="All Movies"
          subtitle={`${movies.length} movies loaded`}
        />
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {movies.length > 0
            ? movies.map((item) => (
                <PosterCard
                  key={item.id}
                  item={item}
                  size="sm"
                />
              ))
            : Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[2/3] rounded-xl" />
              ))}
        </div>
      </section>
    </div>
  );
}
