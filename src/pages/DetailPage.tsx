import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft, Star, Play, ExternalLink, ChevronDown, Download, Globe, X, Camera, BookOpen, MessageSquare, MonitorSmartphone, ChevronLeft, ChevronRight } from "lucide-react";
import { useContentStore } from "@/stores/contentStore";
import { posterUrl, typeLabel, type MovieDetail } from "@/types/content";
import { Skeleton } from "@/components/ui/Skeleton";
import { getMovieWatchProviders } from "@/providers/tmdb";
import type { DownloadPack, EpisodeDownload } from "@/types/scraper";
import type { ScraperSource } from "@/types/scraper";
import type { TmdbWatchRegion } from "@/types/movie";
import { BookmarkButton } from "@/components/ui/BookmarkButton";

const HIANIME_BASE = "https://hianime.lol";

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
    const ss = isMovieDetail(detail) ? (detail as MovieDetail).screenshots || [] : [];
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
  const downloads = movieDetail?.downloads;
  const episodeDownloads = d.episodeDownloads;
  const hasDownloads = (downloads && downloads.length > 0) || (episodeDownloads && episodeDownloads.length > 0);
  const uniqueGenres = Array.from(new Set(d.genres));
  const screenshots = movieDetail?.screenshots || [];
  const watchLinks = movieDetail?.watchLinks || [];
  const embeddedPlayerUrl = movieDetail?.embeddedPlayerUrl || "";
  const director = movieDetail?.director || "";
  const storyline = movieDetail?.storyline || "";
  const review = movieDetail?.review || "";
  const audioLanguages = movieDetail?.audioLanguages || "";
  const printQuality = movieDetail?.printQuality || "";

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
            <div className="aspect-video overflow-hidden rounded-xl bg-black shadow-2xl">
              <iframe
                src={embeddedPlayerUrl}
                className="h-full w-full"
                allowFullScreen
                allow="autoplay; encrypted-media"
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

          {/* Watch Now Buttons */}
          {(embeddedPlayerUrl || watchLinks.length > 0 || isAnimeSource(d)) && (
            <div className="mb-6 flex flex-wrap gap-3">
              {embeddedPlayerUrl && (
                <button
                  onClick={() => setShowPlayer(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
                >
                  <Play className="h-4 w-4 fill-white" />
                  Watch Now
                </button>
              )}
              {watchLinks.map((link, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveWatchLink(link);
                    setShowWatchLinkPlayer(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 text-sm font-medium text-primary backdrop-blur-sm transition-colors hover:bg-white/20"
                >
                  <Play className="h-4 w-4" />
                  {link.label}
                </button>
              ))}
              {isAnimeSource(d) && (
                <a
                  href={`${HIANIME_BASE}/search?keyword=${encodeURIComponent(d.title)}`}
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
                <div className="aspect-video overflow-hidden rounded-xl bg-black shadow-2xl">
                  <iframe
                    src={activeWatchLink.url}
                    className="h-full w-full border-0"
                    allowFullScreen
                    allow="autoplay; encrypted-media"
                    referrerPolicy="no-referrer"
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
            <p className="mb-6 text-sm leading-relaxed text-secondary select-auto">
              {d.description}
            </p>
          )}

          {/* Cast */}
          {movieDetail && movieDetail.cast.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-secondary">
                Cast
              </h3>
              <p className="text-sm text-secondary select-auto">
                {movieDetail.cast.map((c) => c.name).join(", ")}
              </p>
            </div>
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
            <div className="mb-6">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-secondary">
                <Camera className="h-4 w-4" />
                Screenshots
              </h3>
              <div className="group relative">
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
            </div>
          )}

          {/* Storyline */}
          {storyline && (
            <div className="mb-6">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-secondary">
                <BookOpen className="h-4 w-4" />
                Storyline
              </h3>
              <p className="text-sm leading-relaxed text-secondary select-auto">
                {storyline}
              </p>
            </div>
          )}

          {/* Review */}
          {review && (
            <div className="mb-6">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-secondary">
                <MessageSquare className="h-4 w-4" />
                Review
              </h3>
              <p className="text-sm leading-relaxed text-secondary select-auto">
                {review}
              </p>
            </div>
          )}

          {/* Downloads - mobile */}
          {hasDownloads && (
            <div className="mt-6 lg:hidden">
              <DownloadSection downloads={downloads} episodeDownloads={episodeDownloads} />
            </div>
          )}
        </div>

        {/* Downloads panel - desktop */}
        {hasDownloads && (
          <div className="hidden lg:block">
            <div className="sticky top-20">
              <DownloadSection downloads={downloads} episodeDownloads={episodeDownloads} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Download Section ──────────────────────────────────────

function DownloadSection({
  downloads,
  episodeDownloads,
}: {
  downloads?: DownloadPack[];
  episodeDownloads?: EpisodeDownload[];
}) {
  const seasonMap = new Map<string, Map<string, DownloadPack[]>>();
  for (const dl of downloads || []) {
    const season = dl.season || "default";
    const format = dl.format || "default";
    if (!seasonMap.has(season)) seasonMap.set(season, new Map());
    const fmtMap = seasonMap.get(season)!;
    if (!fmtMap.has(format)) fmtMap.set(format, []);
    fmtMap.get(format)!.push(dl);
  }

  const epSeasonMap = new Map<string, Map<string, EpisodeDownload[]>>();
  for (const ep of episodeDownloads || []) {
    const season = ep.season || "default";
    const format = ep.format || "default";
    if (!epSeasonMap.has(season)) epSeasonMap.set(season, new Map());
    const fmtMap = epSeasonMap.get(season)!;
    if (!fmtMap.has(format)) fmtMap.set(format, []);
    fmtMap.get(format)!.push(ep);
  }

  const totalItems = (downloads?.length || 0) + (episodeDownloads?.length || 0);
  const hasSeasons = seasonMap.size > 1 || epSeasonMap.size > 1;
  const seasonKeys = Array.from(new Set([...seasonMap.keys(), ...epSeasonMap.keys()]))
    .filter((s) => s !== "default")
    .sort();

  if (seasonKeys.length === 0 && (seasonMap.has("default") || epSeasonMap.has("default"))) {
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
          const fmtMap = seasonMap.get(season);
          const epFmtMap = epSeasonMap.get(season);
          const formats = Array.from(new Set([
            ...Array.from(fmtMap?.keys() || []),
            ...Array.from(epFmtMap?.keys() || []),
          ])).filter((f) => f !== "default");

          const hasDefaultPack = fmtMap?.has("default");
          const hasDefaultEp = epFmtMap?.has("default");
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

              {hasDefaultPack && fmtMap!.get("default")!.map((dl, i) => (
                <PackItem key={`p-${season}-${i}`} dl={dl} />
              ))}

              {hasDefaultEp && epFmtMap!.get("default")!.map((ep, i) => (
                <EpisodeItem key={`e-${season}-${i}`} ep={ep} />
              ))}

              {formats.map((format) => (
                <div key={format}>
                  <div className="border-b border-border/50 bg-surface/30 px-4 py-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary">
                      {format}
                    </span>
                  </div>

                  {fmtMap?.get(format)?.map((dl, i) => (
                    <PackItem key={`p-${season}-${format}-${i}`} dl={dl} />
                  ))}

                  {epFmtMap?.get(format)?.map((ep, i) => (
                    <EpisodeItem key={`e-${season}-${format}-${i}`} ep={ep} />
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

function PackItem({ dl }: { dl: DownloadPack }) {
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

// ── Episode Item ──────────────────────────────────────────

function EpisodeItem({ ep }: { ep: EpisodeDownload }) {
  return (
    <details className="group border-b border-border">
      <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 transition-colors hover:bg-surface/50">
        {ep.episode && (
          <span className="shrink-0 rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold text-accent">
            {ep.episode}
          </span>
        )}
        <span className="flex-1 text-xs font-medium leading-snug">
          {ep.title}
        </span>
        <span className="text-[10px] text-secondary">
          {ep.downloads.length} file{ep.downloads.length !== 1 ? "s" : ""}
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-secondary transition-transform group-open:rotate-180" />
      </summary>

      <div className="border-t border-border/50 bg-surface/30 px-4 pb-3 pt-2">
        <div className="flex flex-col gap-2">
          {ep.downloads.map((file, j) => (
            <details key={j} className="group/file">
              <summary className="flex cursor-pointer items-center gap-2 rounded-lg bg-surface/50 px-3 py-2 transition-colors hover:bg-surface">
                <span className="flex-1 text-[11px] font-medium text-primary">
                  {file.title}
                </span>
                {file.fileSize && (
                  <span className="rounded bg-orange-500/20 px-1.5 py-0.5 text-[10px] text-orange-400">
                    {file.fileSize}
                  </span>
                )}
                <ChevronDown className="h-3 w-3 shrink-0 text-secondary transition-transform group-open/file:rotate-180" />
              </summary>

              <div className="ml-2 mt-1 flex flex-col gap-1 border-l-2 border-border pl-3">
                <div className="flex flex-wrap gap-1 py-1">
                  {file.quality && (
                    <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] text-blue-400">
                      {file.quality}
                    </span>
                  )}
                  {file.language && (
                    <span className="rounded bg-teal-500/20 px-1.5 py-0.5 text-[10px] text-teal-400">
                      {file.language}
                    </span>
                  )}
                  {file.codec && (
                    <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] text-purple-400">
                      {file.codec}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  {file.links.map((link, k) => (
                    <a
                      key={k}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-lg bg-accent/10 px-3 py-1.5 text-[11px] font-medium text-accent transition-colors hover:bg-accent/20"
                    >
                      <span className="truncate">{link.label}</span>
                      <ExternalLink className="ml-2 h-3 w-3 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>
    </details>
  );
}
