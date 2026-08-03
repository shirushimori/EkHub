// Native shell bridge — lets the web app talk to the embedded Android/desktop
// wrapper (populated via addJavascriptInterface in native/android).

export interface DownloadContext {
  /** Content title, used as the folder name. */
  title: string;
  /** movie → Movies/<title>/, series → Series/<title>/Season <n>/ */
  type: "movie" | "series";
  season?: string;
  episode?: string;
  /** Hint for the saved file name (fallback only). */
  fileName?: string;
}

interface NativeBridge {
  setDownloadContext(json: string): void;
}

declare global {
  interface Window {
    EkHubNative?: NativeBridge;
  }
}

export function isNative(): boolean {
  return typeof window !== "undefined" && !!window.EkHubNative;
}

export function setNativeDownloadContext(ctx: DownloadContext): void {
  if (typeof window === "undefined" || !window.EkHubNative) return;
  try {
    window.EkHubNative.setDownloadContext(JSON.stringify(ctx));
  } catch {
    // Bridge unavailable — the web build keeps working as a normal browser app.
  }
}
