import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft, Star, Play, ExternalLink, ChevronDown, Download, Globe } from "lucide-react";
import { useContentStore } from "@/stores/contentStore";
import { posterUrl, typeLabel, type MovieDetail } from "@/types/content";
import { Skeleton } from "@/components/ui/Skeleton";
import type { DownloadPack, EpisodeDownload } from "@/types/scraper";
import type { ScraperSource } from "@/types/scraper";

function isMovieDetail(d: unknown): d is MovieDetail {
  return d != null && typeof d === "object" && "tagline" in d && "cast" in d && "videos" in d;
}

export default function DetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { detail, detailSources, activeSource, loading, error, fetchDetail, switchSource } = useContentStore();
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (slug) {
      fetchDetail(slug, "movie");
    }
  }, [slug, fetchDetail]);

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

  return (
    <div className="select-none mx-auto max-w-7xl px-4 py-6 md:px-8">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-secondary hover:text-primary select-auto"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

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

          {/* Source Selector - show when multiple sources available */}
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

          {/* Meta row: year, rating, type, season */}
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
          </div>

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

          {/* Downloads - mobile: below info */}
          {hasDownloads && (
            <div className="mt-6 lg:hidden">
              <DownloadSection downloads={downloads} episodeDownloads={episodeDownloads} />
            </div>
          )}
        </div>

        {/* Downloads panel - desktop only, sticky */}
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
  // Group downloads by season, then by format
  const seasonMap = new Map<string, Map<string, DownloadPack[]>>();
  for (const dl of downloads || []) {
    const season = dl.season || "default";
    const format = dl.format || "default";
    if (!seasonMap.has(season)) seasonMap.set(season, new Map());
    const fmtMap = seasonMap.get(season)!;
    if (!fmtMap.has(format)) fmtMap.set(format, []);
    fmtMap.get(format)!.push(dl);
  }

  // Group episodes by season, then by format
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

  // If no seasons at all, add "default"
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
              {/* Season header */}
              {showSeasonHeader && (
                <div className="border-b border-border bg-accent/5 px-4 py-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-accent">
                    {season}
                  </span>
                </div>
              )}

              {/* Default packs (no format group) */}
              {hasDefaultPack && fmtMap!.get("default")!.map((dl, i) => (
                <PackItem key={`p-${season}-${i}`} dl={dl} />
              ))}

              {/* Default episodes (no format group) */}
              {hasDefaultEp && epFmtMap!.get("default")!.map((ep, i) => (
                <EpisodeItem key={`e-${season}-${i}`} ep={ep} />
              ))}

              {/* Format groups */}
              {formats.map((format) => (
                <div key={format}>
                  <div className="border-b border-border/50 bg-surface/30 px-4 py-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary">
                      {format}
                    </span>
                  </div>

                  {/* Packs in this format */}
                  {fmtMap?.get(format)?.map((dl, i) => (
                    <PackItem key={`p-${season}-${format}-${i}`} dl={dl} />
                  ))}

                  {/* Episodes in this format */}
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
