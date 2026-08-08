import { useEffect, useRef, useState } from "react";
import { X, Maximize2, Minimize2, Loader2 } from "lucide-react";

interface EkHubNative {
  toggleFullscreen?: () => void;
  exitFullscreen?: () => void;
}

declare global {
  interface Window {
    EkHubNative?: EkHubNative;
  }
}

interface PlayerModalProps {
  src: string;
  title?: string;
  loading: boolean;
  onLoad?: () => void;
  onClose: () => void;
}

/**
 * Player overlay used by the embedded player and the watch-link players.
 *
 * Fullscreen:
 * - In the Android app (`window.EkHubNative`) a native bridge toggles a real
 *   fullscreen view — DOM fullscreen is unreliable in WebView.
 * - In the browser the player container itself is put in fullscreen so
 *   cross-origin iframes never need permission to enter fullscreen.
 */
export function PlayerModal({ src, title, loading, onLoad, onClose }: PlayerModalProps) {
  const playerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const native = typeof window !== "undefined" ? window.EkHubNative : undefined;

  useEffect(() => {
    if (native) return;
    const onChange = () => {
      setIsFullscreen(
        document.fullscreenElement === playerRef.current ||
          (document.fullscreenElement != null && playerRef.current?.contains(document.fullscreenElement) === true)
      );
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [native]);

  const toggleFullscreen = () => {
    if (native) {
      native.toggleFullscreen?.();
      setIsFullscreen((f) => !f);
      return;
    }
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else if (playerRef.current) {
        playerRef.current.requestFullscreen();
      }
    } catch {
      // Fullscreen unsupported or denied (e.g. sandboxed embed) — ignore.
    }
  };

  const handleClose = () => {
    if (native) {
      if (isFullscreen) native.exitFullscreen?.();
    } else if (document.fullscreenElement) {
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
            <>
              <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-center gap-2 bg-black/80 px-3 py-1.5 text-xs font-semibold text-white/90">
                Wait Let it load
              </div>
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
                <span className="text-xs text-secondary">Loading player…</span>
              </div>
            </>
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
