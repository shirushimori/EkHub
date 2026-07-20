import { useEffect } from "react";
import { useContentStore } from "@/stores/contentStore";
import { PosterCard } from "@/components/cards/PosterCard";
import { GenreCard } from "@/components/cards/GenreCard";
import { Carousel } from "@/components/carousel/Carousel";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { HeroBanner } from "@/components/layout/HeroBanner";
import type { ContentItem } from "@/types/content";
import { Link } from "react-router";

const GENRES = [
  "Action",
  "Comedy",
  "Drama",
  "Horror",
  "Sci-Fi",
  "Romance",
  "Thriller",
  "Animation",
  "Documentary",
  "Fantasy",
  "Adventure",
  "Crime",
  "Mystery",
];

function ContentRow({
  title,
  items,
  size,
}: {
  title: string;
  items: ContentItem[];
  size?: "sm" | "md" | "lg";
}) {
  return (
    <section>
      <SectionHeader title={title} />
      <Carousel>
        {items.length > 0
          ? items.map((item) => (
              <PosterCard
                key={item.id}
                item={item}
                size={size}
              />
            ))
          : Array.from({ length: 6 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-[290px] w-[150px] min-w-[150px] rounded-xl md:h-[320px] md:w-[180px] md:min-w-[180px]"
              />
            ))}
      </Carousel>
    </section>
  );
}

export default function HomePage() {
  const {
    trending,
    popular,
    topRated,
    recentlyAdded,
    loaded,
    fetchAll,
  } = useContentStore();

  useEffect(() => {
    if (!loaded) fetchAll();
  }, [loaded, fetchAll]);

  return (
    <div>
      {trending.length > 0 ? (
        <HeroBanner items={trending.slice(0, 10)} />
      ) : (
        <div className="h-[50vh] md:h-[60vh]">
          <Skeleton className="h-full w-full rounded-none" />
        </div>
      )}

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-8">
        <ContentRow
          title="Trending Now"
          items={trending.slice(0, 20)}
          size="lg"
        />

        <section>
          <SectionHeader title="Browse by Genre" />
          <Carousel spacing="gap-2">
            {GENRES.map((genre) => (
              <Link
                key={genre}
                to={`/search?q=${encodeURIComponent(genre)}`}
              >
                <GenreCard genre={genre} />
              </Link>
            ))}
          </Carousel>
        </section>

        <ContentRow
          title="Popular"
          items={popular.slice(0, 20)}
        />

        <ContentRow
          title="Top Rated"
          items={topRated.slice(0, 20)}
        />

        <ContentRow
          title="Recently Added"
          items={recentlyAdded.slice(0, 20)}
        />
      </div>
    </div>
  );
}
