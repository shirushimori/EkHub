import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft, Star, Play, ExternalLink, ChevronDown, Download, Globe, X, MonitorSmartphone, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useContentStore } from "@/stores/contentStore";
import { posterUrl, typeLabel, type MovieDetail } from "@/types/content";
import { Skeleton } from "@/components/ui/Skeleton";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { getMovieWatchProviders } from "@/providers/tmdb";
import type { DownloadLink, DownloadPack, EpisodeDownload } from "@/types/scraper";
import type { ScraperSource } from "@/types/scraper";
import type { TmdbWatchRegion } from "@/types/movie";
import { BookmarkButton } from "@/components/ui/BookmarkButton";
import { setNativeDownloadContext, isNative } from "@/lib/native";
import type { DownloadContext } from "@/lib/native";

const HIANIME_BASE = "https://hianime.lol";

function notifyNativeDownload(item: MovieDetail | import("@/types/content").ContentItem, extra: Partial<DownloadContext>) {
  setNativeDownloadContext({
    title: item.title,
    type: item.type,
    ...extra,
  });
}

/** Download links hand off to the native shell's default browser; in a plain
 *  browser they keep opening in a new tab. */
function handleDownloadClick(
  e: React.MouseEvent<HTMLAnchorElement>,
  item: MovieDetail | import("@/types/content").ContentItem,
  extra: Partial<DownloadContext>
) {
  notifyNativeDownload(item, extra);
  if (isNative()) e.preventDefault();
}

function isMovieDetail(d: unknown): d is MovieDetail {
  return d != null && typeof d === "object" && "tagline" in d && "cast" in d && "videos" in d;
}

function isAnimeSource(d: unknown): boolean {
  return d != null && typeof d === "object" && "id" in d && typeof (d as { id: string }).id === "string" && (d as { id: string }).id.startsWith("jikan:");
}

export default function DetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { detail, detailSources, activeSource, loading, error, fetchDetail, switchSource } = useContentStore();
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [watchProviders, setWatchProviders] = useState<TmdbWatchRegion | null>(null);
  const [showWatchLinkPlayer, setShowWatchLinkPlayer] = useState(false);
  const [activeWatchLink, setActiveWatchLink] = useState<{ label: string; url: string } | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (slug) {
      fetchDetail(slug, "movie");
    }
  }, [slug, fetchDetail]);

  useEffect(() => {
    if (!detail) return;
    if (!detail.id?.startsWith("tmdb:")) return;
    const tmdbId = parseInt(detail.id.split(":")[1], 10);
    if (!isNaN(tmdbId)) {
      getMovieWatchProviders(tmdbId)
        .then((res) => {
          const region = res.results?.["IN"] || res.results?.["US"] || Object.values(res.results || {})[0];
          if (region) setWatchProviders(region);
        })
        .catch(() => {});
    }
  }, [detail]);

  useEffect(() => {
    if (!showSourceDropdown) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSourceDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showSourceDropdown]);

  useEffect(() => {
    if (lightboxIndex === null || !detail) return;
    const ss = detail.screenshots || [];
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft" && lightboxIndex > 0) setLightboxIndex(lightboxIndex - 1);
      if (e.key === "ArrowRight" && lightboxIndex < ss.length - 1) setLightboxIndex(lightboxIndex + 1);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [lightboxIndex, detail]);

  const handleSourceChange = (source: ScraperSource) => {
    switchSource(source);
    setShowSourceDropdown(false);
  };

  if (loading) {
    return (
      <div className="px-4 py-6 md:px-8">
        <Skeleton className="mb-4 h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-[300px_1fr]">
          <Skeleton className="aspect-[2/3] rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-96" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="mb-4 text-secondary">{error || "Not found"}</p>
        <Link to="/" className="text-accent hover:underline">
          Go Home
        </Link>
      </div>
    );
  }

  const d = detail;
  const movieDetail = isMovieDetail(d) ? d as MovieDetail : null;
  const downloads = d.downloads;
  const episodeDownloads = d.episodeDownloads;
  const hasDownloads = !!downloads && downloads.length > 0;
  const episodeItems = (episodeDownloads || []).filter(
    (ep) => (ep.downloads && ep.downloads.length > 0) || (ep.watchLinks && ep.watchLinks.length > 0)
  );
  const uniqueGenres = Array.from(new Set(d.genres));
  const screenshots = d.screenshots || [];
  const watchLinks = d.watchLinks || [];
  const embeddedPlayerUrl = d.embeddedPlayerUrl || "";
  const director = d.director || "";
  const storyline = d.storyline || "";
  const review = d.review || "";
  const audioLanguages = d.audioLanguages || "";
  const printQuality = d.printQuality || "";

  return (
    <div className="select-none mx-auto max-w-7xl px-4 py-6 md:px-8">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-secondary hover:text-primary select-auto"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      {/* Embedded Player Overlay */}
      {showPlayer && embeddedPlayerUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowPlayer(false)}>
          <div className="relative w-full max-w-4xl px-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowPlayer(false)}
              className="absolute -top-10 right-0 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="relative aspect-video overflow-hidden rounded-xl bg-black shadow-2xl">
              {playerLoading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                  <span className="text-xs text-secondary">Loading player…</span>
                </div>
              )}
              <iframe
                src={embeddedPlayerUrl}
                className="h-full w-full"
                allowFullScreen
                allow="autoplay; encrypted-media"
                onLoad={() => setPlayerLoading(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* 3-column: Poster | Info | Downloads panel */}
      <div className="grid gap-6 md:grid-cols-[280px_1fr] lg:grid-cols-[280px_1fr_320px]">
        {/* Poster */}
        <div className="mx-auto w-full max-w-[320px] md:mx-0">
          <div className="sticky top-20 overflow-hidden rounded-xl bg-card shadow-lg">
            <img
              src={posterUrl(d)}
              alt={d.title}
              className="aspect-[2/3] w-full object-cover"
            />
          </div>
        </div>

        {/* Info */}
        <div className="min-w-0">
          <h1 className="mb-2 text-2xl font-bold leading-tight sm:text-3xl md:text-4xl">
            {d.title}
          </h1>

          <div className="mb-3">
            <BookmarkButton item={d as import("@/types/content").ContentItem} size="md" />
          </div>

          {/* Source Selector */}
          {detailSources.length > 1 && (
            <div className="mb-4 relative" ref={dropdownRef}>
              <button
                onClick={() => setShowSourceDropdown(!showSourceDropdown)}
                className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary transition-colors hover:border-accent/50"
              >
                <Globe className="h-4 w-4 text-accent" />
                <span>Source: {detailSources.find((s) => s.source === activeSource)?.label || "Unknown"}</span>
                <ChevronDown className={`h-4 w-4 text-secondary transition-transform ${showSourceDropdown ? "rotate-180" : ""}`} />
              </button>

              {showSourceDropdown && (
                <div className="absolute z-50 mt-1 w-48 rounded-lg border border-border bg-card shadow-lg">
                  {detailSources.map((s) => (
                    <button
                      key={s.source}
                      onClick={() => handleSourceChange(s.source)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors ${
                        s.source === activeSource
                          ? "bg-accent/10 text-accent"
                          : "text-primary hover:bg-surface"
                      }`}
                    >
                      <Globe className="h-4 w-4" />
                      <span>{s.label}</span>
                      {s.source === activeSource && (
                        <span className="ml-auto text-xs text-accent">Active</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {d.tagline && (
            <p className="mb-3 italic text-secondary">{d.tagline}</p>
          )}

          {d.sourceUrl && (
            <a
              href={d.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-4 inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary transition-colors hover:border-accent/50 hover:text-accent"
            >
              <ExternalLink className="h-4 w-4 text-accent" />
              View on {detailSources.find((s) => s.source === activeSource)?.label || "Original Source"}
            </a>
          )}

          {/* Meta row */}
          <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-secondary">
            {d.year && <span>{d.year}</span>}
            {d.rating != null && (
              <span className="flex items-center gap-1 text-warning">
                <Star className="h-3.5 w-3.5 fill-warning" />
                {d.rating}
              </span>
            )}
            <span>{typeLabel(d.type)}</span>
            {d.seasonInfo && <span>{d.seasonInfo}</span>}
            {director && <span>Dir: {director}</span>}
          </div>

          {/* Language */}
          {audioLanguages && (
            <p className="mb-2 text-sm text-secondary">
              <span className="font-medium text-primary">Language:</span> {audioLanguages}
            </p>
          )}

          {/* Quality */}
          {printQuality && (
            <p className="mb-2 text-sm text-secondary">
              <span className="font-medium text-primary">Quality:</span> {printQuality}
            </p>
          )}

          {/* Quality badges */}
          {d.qualityBadges && d.qualityBadges.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {d.qualityBadges.map((b) => (
                <span
                  key={b}
                  className="rounded-md bg-accent/20 px-2 py-0.5 text-xs font-bold text-accent"
                >
                  {b}
                </span>
              ))}
            </div>
          )}

          {/* Anime-specific metadata */}
          {isAnimeSource(d) && (
            <div className="mb-4 space-y-1.5 text-sm text-secondary">
              {d.seasonInfo && (
                <p>
                  <span className="font-medium text-primary">Episodes:</span> {d.seasonInfo}
                </p>
              )}
              {director && (
                <p>
                  <span className="font-medium text-primary">Studios:</span> {director}
                </p>
              )}
              {d.year && (
                <p>
                  <span className="font-medium text-primary">Aired:</span> {d.year}
                </p>
              )}
            </div>
          )}

          {/* Watch Providers */}
          {watchProviders && (
            <div className="mb-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-secondary">
                <MonitorSmartphone className="h-4 w-4" />
                Where to Watch
              </h3>
              <div className="flex flex-wrap gap-2">
                {watchProviders.flatrate?.map((p) => (
                  <div
                    key={p.provider_id}
                    className="flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1.5 text-xs text-secondary"
                  >
                    {p.logo_path && (
                      <img
                        src={`https://image.tmdb.org/t/p/w45${p.logo_path}`}
                        alt={p.provider_name}
                        className="h-5 w-5 rounded-sm object-cover"
                      />
                    )}
                    <span>{p.provider_name}</span>
                    <span className="text-[10px] text-green-400">Stream</span>
                  </div>
                ))}
                {watchProviders.free?.map((p) => (
                  <div
                    key={p.provider_id}
                    className="flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1.5 text-xs text-secondary"
                  >
                    {p.logo_path && (
                      <img
                        src={`https://image.tmdb.org/t/p/w45${p.logo_path}`}
                        alt={p.provider_name}
                        className="h-5 w-5 rounded-sm object-cover"
                      />
                    )}
                    <span>{p.provider_name}</span>
                    <span className="text-[10px] text-blue-400">Free</span>
                  </div>
                ))}
                {watchProviders.rent?.map((p) => (
                  <div
                    key={p.provider_id}
                    className="flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1.5 text-xs text-secondary"
                  >
                    {p.logo_path && (
                      <img
                        src={`https://image.tmdb.org/t/p/w45${p.logo_path}`}
                        alt={p.provider_name}
                        className="h-5 w-5 rounded-sm object-cover"
                      />
                    )}
                    <span>{p.provider_name}</span>
                    <span className="text-[10px] text-orange-400">Rent</span>
                  </div>
                ))}
                {watchProviders.buy?.map((p) => (
                  <div
                    key={p.provider_id}
                    className="flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1.5 text-xs text-secondary"
                  >
                    {p.logo_path && (
                      <img
                        src={`https://image.tmdb.org/t/p/w45${p.logo_path}`}
                        alt={p.provider_name}
                        className="h-5 w-5 rounded-sm object-cover"
                      />
                    )}
                    <span>{p.provider_name}</span>
                    <span className="text-[10px] text-purple-400">Buy</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Genres */}
          {uniqueGenres.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {uniqueGenres.map((g) => (
                <span
                  key={g}
                  className="rounded-lg bg-surface px-2.5 py-1 text-xs text-secondary"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Watch Online */}
          <WatchSection
            item={d}
            embeddedPlayerUrl={embeddedPlayerUrl}
            watchLinks={watchLinks}
            episodeDownloads={episodeItems}
            animeSearchUrl={
              isAnimeSource(d) ? `${HIANIME_BASE}/search?keyword=${encodeURIComponent(d.title)}` : ""
            }
            onPlayEmbedded={() => {
              setPlayerLoading(true);
              setShowPlayer(true);
            }}
            onPlayWatchLink={(link) => {
              setActiveWatchLink(link);
              setPlayerLoading(true);
              setShowWatchLinkPlayer(true);
            }}
          />

          {/* Watch Link Player Overlay */}
          {showWatchLinkPlayer && activeWatchLink && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => { setShowWatchLinkPlayer(false); setActiveWatchLink(null); }}>
              <div className="relative w-full max-w-5xl px-4" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => { setShowWatchLinkPlayer(false); setActiveWatchLink(null); }}
                  className="absolute -top-10 right-0 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="relative aspect-video overflow-hidden rounded-xl bg-black shadow-2xl">
                  {playerLoading && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black">
                      <Loader2 className="h-8 w-8 animate-spin text-accent" />
                      <span className="text-xs text-secondary">Loading player…</span>
                    </div>
                  )}
                  <iframe
                    src={activeWatchLink.url}
                    className="h-full w-full border-0"
                    allowFullScreen
                    allow="autoplay; encrypted-media"
                    referrerPolicy="no-referrer"
                    onLoad={() => setPlayerLoading(false)}
                  />
                </div>
                <p className="mt-2 text-center text-xs text-secondary">
                  {activeWatchLink.label}
                </p>
              </div>
            </div>
          )}

          {/* Screenshot Lightbox */}
          {lightboxIndex !== null && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
              onClick={() => setLightboxIndex(null)}
            >
              <div className="relative flex max-h-[90vh] max-w-[95vw] items-center" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setLightboxIndex(null)}
                  className="absolute -top-10 right-0 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </button>

                {lightboxIndex > 0 && (
                  <button
                    onClick={() => setLightboxIndex(lightboxIndex - 1)}
                    className="absolute -left-12 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/25 max-sm:-left-10"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                )}

                <img
                  src={screenshots[lightboxIndex]}
                  alt={`Screenshot ${lightboxIndex + 1}`}
                  className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
                />

                {lightboxIndex < screenshots.length - 1 && (
                  <button
                    onClick={() => setLightboxIndex(lightboxIndex + 1)}
                    className="absolute -right-12 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/25 max-sm:-right-10"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                )}

                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-white/60">
                  {lightboxIndex + 1} / {screenshots.length}
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          {d.description && (
            <CollapsibleSection title="Description" defaultOpen>
              <p className="mb-6 text-sm leading-relaxed text-secondary select-auto">
                {d.description}
              </p>
            </CollapsibleSection>
          )}

          {/* Cast */}
          {movieDetail && movieDetail.cast.length > 0 && (
            <CollapsibleSection title="Cast">
              <p className="mb-6 text-sm text-secondary select-auto">
                {movieDetail.cast.map((c) => c.name).join(", ")}
              </p>
            </CollapsibleSection>
          )}

          {/* Trailer */}
          {movieDetail && movieDetail.videos.length > 0 && (
            <div className="mb-6">
              <a
                href={movieDetail.videos[0].key}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                <Play className="h-4 w-4 fill-white" />
                Watch Trailer
              </a>
            </div>
          )}

          {/* Screenshots */}
          {screenshots.length > 0 && (
            <CollapsibleSection title="Screenshots">
              <div className="mb-6 group relative">
                <div
                  ref={scrollContainerRef}
                  className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin"
                >
                  {screenshots.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setLightboxIndex(i)}
                      className="shrink-0 overflow-hidden rounded-lg border border-border transition-colors hover:border-accent/50 focus:outline-none"
                    >
                      <img
                        src={src}
                        alt={`Screenshot ${i + 1}`}
                        className="h-[130px] w-[230px] object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>

                {screenshots.length > 2 && (
                  <>
                    <button
                      onClick={() => {
                        const el = scrollContainerRef.current;
                        if (el) el.scrollBy({ left: -260, behavior: "smooth" });
                      }}
                      className="absolute left-0 top-1/2 hidden -translate-y-1/2 rounded-r-lg bg-black/50 p-2 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/70 group-hover:opacity-100 md:block"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {
                        const el = scrollContainerRef.current;
                        if (el) el.scrollBy({ left: 260, behavior: "smooth" });
                      }}
                      className="absolute right-0 top-1/2 hidden -translate-y-1/2 rounded-l-lg bg-black/50 p-2 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/70 group-hover:opacity-100 md:block"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
            </CollapsibleSection>
          )}

          {/* Storyline */}
          {storyline && (
            <CollapsibleSection title="Storyline">
              <p className="mb-6 text-sm leading-relaxed text-secondary select-auto">
                {storyline}
              </p>
            </CollapsibleSection>
          )}

          {/* Review */}
          {review && (
            <CollapsibleSection title="Review">
              <p className="mb-6 text-sm leading-relaxed text-secondary select-auto">
                {review}
              </p>
            </CollapsibleSection>
          )}

          {/* Downloads - mobile */}
          {hasDownloads && (
            <div className="mt-6 lg:hidden">
              <DownloadSection item={d} downloads={downloads} />
            </div>
          )}
        </div>

        {/* Downloads panel - desktop */}
        {hasDownloads && (
          <div className="hidden lg:block">
            <div className="sticky top-20">
              <DownloadSection item={d} downloads={downloads} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Watch Section ────────────────────────────────────────

function WatchSection({
  item,
  embeddedPlayerUrl,
  watchLinks,
  episodeDownloads,
  animeSearchUrl,
  onPlayEmbedded,
  onPlayWatchLink,
}: {
  item: MovieDetail | import("@/types/content").ContentItem;
  embeddedPlayerUrl: string;
  watchLinks: DownloadLink[];
  episodeDownloads: EpisodeDownload[];
  animeSearchUrl: string;
  onPlayEmbedded: () => void;
  onPlayWatchLink: (link: DownloadLink) => void;
}) {
  const hasEmbedded = Boolean(embeddedPlayerUrl);
  const hasSources = watchLinks.length > 0;
  const hasEpisodes = episodeDownloads.length > 0;
  const hasAnime = Boolean(animeSearchUrl);
  const isTrailerEmbed = /youtube|dailymotion|vimeo/i.test(embeddedPlayerUrl);

  if (!hasEmbedded && !hasSources && !hasEpisodes && !hasAnime) return null;

  return (
    <div className="mb-6">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-secondary">
        <Play className="h-4 w-4 text-accent" />
        Watch Online
      </h3>

      {(hasEmbedded || hasSources || hasAnime) && (
        <div className="mb-4 flex flex-wrap gap-3">
          {hasEmbedded && (
            <button
              onClick={onPlayEmbedded}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              <Play className="h-4 w-4 fill-white" />
              {isTrailerEmbed ? "Trailer" : "Watch Now"}
            </button>
          )}
          {watchLinks.map((link, i) => (
            <button
              key={i}
              onClick={() => onPlayWatchLink(link)}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 text-sm font-medium text-primary backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              <Play className="h-4 w-4" />
              {link.label}
            </button>
          ))}
          {hasAnime && (
            <a
              href={animeSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:from-purple-700 hover:to-pink-700"
            >
              <Play className="h-4 w-4 fill-white" />
              Watch on HiAnime
            </a>
          )}
        </div>
      )}

      {hasEpisodes && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border bg-surface/50 px-4 py-3">
            <MonitorSmartphone className="h-4 w-4 text-accent" />
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">
              Episodes
            </span>
            <span className="ml-auto rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent">
              {episodeDownloads.length}
            </span>
          </div>
          <div className="max-h-[calc(100dvh-6rem)] overflow-y-auto p-3">
            <div className="flex flex-col gap-2">
              {episodeDownloads.map((ep) => {
                const watches = ep.watchLinks || [];
                const files = ep.downloads || [];
                return (
                  <div
                    key={`${ep.season}-${ep.episode}-${ep.title}`}
                    className="flex flex-col gap-2 rounded-xl border border-border bg-surface/40 p-2.5"
                  >
                    <div className="flex items-center gap-1.5">
                      {ep.episode && (
                        <span className="shrink-0 rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold text-accent">
                          {ep.episode}
                        </span>
                      )}
                      <span className="truncate text-[11px] font-medium leading-snug text-primary" title={ep.title}>
                        {ep.title}
                      </span>
                    </div>

                    {watches.length > 0 && (
                      <button
                        onClick={() => onPlayWatchLink(watches[0])}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-accent-hover"
                      >
                        <Play className="h-3.5 w-3.5 fill-white" />
                        Watch {watches[0].label && watches[0].label !== "WATCH" ? watches[0].label : "Now"}
                      </button>
                    )}

                    {watches.length > 1 && (
                      <div className="flex flex-wrap gap-1">
                        {watches.slice(1).map((link, k) => (
                          <button
                            key={k}
                            onClick={() => onPlayWatchLink(link)}
                            className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-medium text-primary transition-colors hover:bg-white/20"
                          >
                            {link.label && link.label !== "WATCH" ? link.label : "Watch"}
                          </button>
                        ))}
                      </div>
                    )}

                    {files.map((file, fi) => (
                      <div key={fi} className="border-t border-border/50 pt-2 first:border-t-0 first:pt-0">
                        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-400">
                            {file.quality || file.title || "Download"}
                          </span>
                          {file.codec && (
                            <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] text-purple-400">
                              {file.codec}
                            </span>
                          )}
                          {file.fileSize && (
                            <span className="rounded bg-orange-500/20 px-1.5 py-0.5 text-[10px] text-orange-400">
                              {file.fileSize}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {file.links.map((link, li) => (
                            <a
                              key={li}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) =>
                                handleDownloadClick(e, item, {
                                  season: ep.season,
                                  episode: ep.episode,
                                  fileName: ep.title,
                                  url: link.url,
                                })
                              }
                              className="inline-flex items-center gap-1 rounded-lg bg-accent/10 px-2 py-1 text-[10px] font-medium text-accent transition-colors hover:bg-accent/20"
                            >
                              {link.label}
                              <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}

                    {watches.length === 0 && files.length === 0 && (
                      <p className="text-[10px] text-secondary">No links available.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Download Section ──────────────────────────────────────

function DownloadSection({
  item,
  downloads,
}: {
  item: MovieDetail | import("@/types/content").ContentItem;
  downloads?: DownloadPack[];
}) {
  const packs = downloads || [];
  const seasonMap = new Map<string, DownloadPack[]>();
  for (const dl of packs) {
    const season = dl.season || "default";
    if (!seasonMap.has(season)) seasonMap.set(season, []);
    seasonMap.get(season)!.push(dl);
  }

  const totalItems = packs.length;
  const hasSeasons = seasonMap.size > 1;
  const seasonKeys = Array.from(seasonMap.keys())
    .filter((s) => s !== "default")
    .sort();

  if (seasonKeys.length === 0 && seasonMap.has("default")) {
    seasonKeys.push("default");
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border bg-surface/50 px-4 py-3">
        <Download className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">
          Downloads
        </h3>
        <span className="ml-auto rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent">
          {totalItems}
        </span>
      </div>

      <div className="max-h-[calc(100dvh-6rem)] overflow-y-auto">
        {seasonKeys.map((season) => {
          const seasonPacks = seasonMap.get(season) || [];
          const formats = Array.from(
            new Set(seasonPacks.map((p) => p.format).filter((f) => f && f !== "default"))
          );
          const defaultPacks = seasonPacks.filter((p) => !p.format || p.format === "default");
          const showSeasonHeader = hasSeasons && season !== "default";

          return (
            <div key={season}>
              {showSeasonHeader && (
                <div className="border-b border-border bg-accent/5 px-4 py-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-accent">
                    {season}
                  </span>
                </div>
              )}

              {defaultPacks.map((dl, i) => (
                <PackItem key={`p-${season}-${i}`} item={item} dl={dl} />
              ))}

              {formats.map((format) => (
                <div key={format}>
                  <div className="border-b border-border/50 bg-surface/30 px-4 py-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary">
                      {format}
                    </span>
                  </div>

                  {seasonPacks
                    .filter((p) => p.format === format)
                    .map((dl, i) => (
                      <PackItem key={`p-${season}-${format}-${i}`} item={item} dl={dl} />
                    ))}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Pack Item ──────────────────────────────────────────────

function PackItem({ item, dl }: { item: MovieDetail | import("@/types/content").ContentItem; dl: DownloadPack }) {
  return (
    <details className="group border-b border-border">
      <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 transition-colors hover:bg-surface/50">
        <span className="flex-1 text-xs font-medium leading-snug">
          {dl.title}
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-secondary transition-transform group-open:rotate-180" />
      </summary>

      <div className="border-t border-border/50 bg-surface/30 px-4 pb-3 pt-2">
        <div className="mb-2 flex flex-wrap gap-1">
          {dl.fileSize && (
            <span className="rounded bg-orange-500/20 px-1.5 py-0.5 text-[10px] text-orange-400">
              {dl.fileSize}
            </span>
          )}
          {dl.quality && (
            <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] text-blue-400">
              {dl.quality}
            </span>
          )}
          {dl.language && (
            <span className="rounded bg-teal-500/20 px-1.5 py-0.5 text-[10px] text-teal-400">
              {dl.language}
            </span>
          )}
          {dl.source && (
            <span className="rounded bg-green-500/20 px-1.5 py-0.5 text-[10px] text-green-400">
              {dl.source}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          {dl.links.map((link, j) => (
            <a
              key={j}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => handleDownloadClick(e, item, { season: dl.season, fileName: link.label, url: link.url })}
              className="flex items-center justify-between rounded-lg bg-accent/10 px-3 py-2 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
            >
              <span className="truncate">{link.label}</span>
              <ExternalLink className="ml-2 h-3 w-3 shrink-0" />
            </a>
          ))}
        </div>
      </div>
    </details>
  );
}
