import { useEffect, useRef, useState } from "react";
import { X, Maximize2, Minimize2, Loader2 } from "lucide-react";

interface PlayerModalProps {
  src: string;
  title?: string;
  loading: boolean;
  onLoad?: () => void;
  onClose: () => void;
}

/**
 * Fullscreen-capable player overlay used by the embedded player and the
 * watch-link players. Requests fullscreen on the player container itself so
 * cross-origin iframes never need permission to enter fullscreen.
 */
export function PlayerModal({ src, title, loading, onLoad, onClose }: PlayerModalProps) {
  const playerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(
        document.fullscreenElement === playerRef.current ||
          (document.fullscreenElement != null && playerRef.current?.contains(document.fullscreenElement) === true)
      );
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (playerRef.current) {
        await playerRef.current.requestFullscreen();
      }
    } catch {
      // Fullscreen unsupported or denied (e.g. sandboxed embed) — ignore.
    }
  };

  const handleClose = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div className="relative w-full max-w-4xl px-4" onClick={(e) => e.stopPropagation()}>
        <div className="mb-2 flex items-center justify-end gap-2">
          {title && <span className="mr-auto truncate text-xs text-secondary">{title}</span>}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </button>
          <button
            onClick={handleClose}
            title="Close"
            className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div ref={playerRef} className="relative aspect-video overflow-hidden rounded-xl bg-black shadow-2xl">
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <span className="text-xs text-secondary">Loading player…</span>
            </div>
          )}
          <iframe
            src={src}
            className="h-full w-full border-0"
            allowFullScreen
            allow="autoplay; encrypted-media; fullscreen"
            referrerPolicy="no-referrer"
            onLoad={onLoad}
          />
        </div>
      </div>
    </div>
  );
}
