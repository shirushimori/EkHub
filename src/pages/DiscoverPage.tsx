import { useEffect } from "react";
import { PosterCard } from "@/components/cards/PosterCard";
import { GenreCard } from "@/components/cards/GenreCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useContentStore } from "@/stores/contentStore";
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

export default function DiscoverPage() {
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

  const allItems = [...trending, ...popular, ...topRated, ...recentlyAdded];
  const seen = new Set<string>();
  const unique = allItems.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  return (
    <div className="px-4 py-6 md:px-8">
      <SectionHeader title="Discover" subtitle="Explore all content" />

      <section className="mb-8">
        <SectionHeader title="Browse by Genre" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {GENRES.map((genre) => (
            <Link key={genre} to={`/search?q=${encodeURIComponent(genre)}`}>
              <GenreCard genre={genre} />
            </Link>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          title="All Content"
          subtitle={`${unique.length} titles loaded`}
        />
        <div className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {unique.length > 0
            ? unique.map((item) => (
                <PosterCard
                  key={item.id}
                  item={item}
                  size="sm"
                  className="w-full min-w-0 md:w-full md:min-w-0"
                />
              ))
            : Array.from({ length: 18 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[2/3] rounded-xl" />
              ))}
        </div>
      </section>
    </div>
  );
}
