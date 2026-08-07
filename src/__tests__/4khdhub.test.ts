import { describe, it, expect } from "vitest";
import { parseDetailPage } from "../providers/4khdhub";

const WATCH_PAGE_HTML = `
<html><head></head><body>
<div class="page-title">Beast Race (2026) 4K HDR WEB-DL | Movie</div>
<div class="movie-tagline">A high-octane race.</div>
<div class="poster-image"><img src="https://image.tmdb.org/t/p/w500/beast.jpg" /></div>
<div class="imdb-score">7.1</div>
<p class="mt-4">Racers battle across the desert.</p>
<div class="metadata-item"><span class="metadata-label">Director:</span><span class="metadata-value">Jane Doe</span></div>
<div class="badge-outline">Action</div>
<div class="badge-outline">1080p</div>
<div class="badge-outline">4K</div>
<div class="badge-outline">WEB-DL</div>

<select id="videoSource" class="video-select">
  <option value="4K">4K</option>
  <option value="Autoembed">Autoembed</option>
</select>
<iframe id="videoPlayer" class="video-player" src="https://player.videasy.net/movie/1263532" width="100%" height="100%" allowfullscreen="" title="Video Player - Beast Race"></iframe>
<script>
  const videoSources = {
    '4K': 'https://player.videasy.net/movie/',
    'Autoembed': 'https://player.autoembed.cc/embed/movie/',
  };
  const defaultVideoId = '1263532';
</script>

<div class="download-item">
  <div class="download-header">
    <div class="episode-number">S01</div>
    <div class="flex-1 text-left font-semibold">Beast Race (4K HDR WEB-DL)
      <br><code><span class="badge">4.2 GB</span><span class="badge">Hindi, English</span><span class="badge">WEB-DL</span></code>
    </div>
  </div>
  <div class="grid grid-cols-2 gap-2">
    <a target="_blank" href="https://hubcloud.cx/drive/abc123" class="btn w-full">Download HubCloud</a>
    <a target="_blank" href="https://hubdrive.tips/file/123456789" class="btn w-full">Download HubDrive</a>
  </div>
</div>
</body></html>
`;

describe("4khdhub watch-online parser", () => {
  it("extracts embedded player from #videoPlayer iframe", () => {
    const detail = parseDetailPage(WATCH_PAGE_HTML, "beast-race-movie-7639");
    expect(detail.embeddedPlayerUrl).toBe("https://player.videasy.net/movie/1263532");
  });

  it("builds watch links from videoSources + defaultVideoId", () => {
    const detail = parseDetailPage(WATCH_PAGE_HTML, "beast-race-movie-7639");
    expect(detail.watchLinks).toContainEqual({
      label: "4K",
      url: "https://player.videasy.net/movie/1263532",
    });
    expect(detail.watchLinks).toContainEqual({
      label: "Autoembed",
      url: "https://player.autoembed.cc/embed/movie/1263532",
    });
  });

  it("still parses hubcloud/hubdrive download links", () => {
    const detail = parseDetailPage(WATCH_PAGE_HTML, "beast-race-movie-7639");
    expect(detail.downloads).toHaveLength(1);
    expect(detail.downloads[0].links).toContainEqual({
      label: "Download HubCloud",
      url: "https://hubcloud.cx/drive/abc123",
    });
    expect(detail.downloads[0].links).toContainEqual({
      label: "Download HubDrive",
      url: "https://hubdrive.tips/file/123456789",
    });
  });
});
