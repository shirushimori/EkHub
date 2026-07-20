import { describe, it, expect } from "vitest";
import { parseListPage, parseDetailPage } from "../providers/4khdhub";

const LIST_HTML = `
<html><body>
<div class="card-grid">
  <a href="/silo-series-851/" class="movie-card">
    <div class="movie-card-image">
      <div class="quality-badges">
        <span class="quality-badge badge-4k" title="4K Ultra HD">4K</span>
        <span class="quality-badge badge-dv" title="Dolby Vision">DV</span>
        <span class="quality-badge badge-hdr" title="HDR">HDR</span>
      </div>
      <img src="https://image.tmdb.org/t/p/w500/c2OijvbFEXBW1onbzuvENr4CGQB.jpg" alt="Silo">
      <div class="movie-card-overlay">
        <div class="movie-card-formats">
          <span class="movie-card-format">Drama</span>
          <span class="movie-card-format">Sci-Fi &amp; Fantasy</span>
          <span class="movie-card-format">English</span>
          <span class="movie-card-format">2160p</span>
          <span class="movie-card-format">1080p</span>
          <span class="movie-card-format">Series</span>
          <span class="movie-card-format">Apple TV+</span>
        </div>
      </div>
    </div>
    <div class="movie-card-content">
      <h3 class="movie-card-title">Silo</h3>
      <p class="movie-card-meta">2023              • S01-S03 EP03</p>
    </div>
  </a>

  <a href="/desire-movie-7470/" class="movie-card">
    <div class="movie-card-image">
      <div class="quality-badges">
        <span class="quality-badge badge-4k" title="4K Ultra HD">4K</span>
        <span class="quality-badge badge-dv" title="Dolby Vision">DV</span>
      </div>
      <img src="https://image.tmdb.org/t/p/w500/5lJPvf7cJ2r2EiNrnvBVYpusKFM.jpg" alt="Desire">
      <div class="movie-card-overlay">
        <div class="movie-card-formats">
          <span class="movie-card-format">Drama</span>
          <span class="movie-card-format">Thriller</span>
          <span class="movie-card-format">Movies</span>
        </div>
      </div>
    </div>
    <div class="movie-card-content">
      <h3 class="movie-card-title">Desire</h3>
      <p class="movie-card-meta">2026</p>
    </div>
  </a>
</div>
<div class="pagination">
  <a class="pagination-item active">1</a>
  <a href="/page/2/" class="pagination-item">2</a>
  <a href="/page/359/" class="pagination-item">359</a>
</div>
</body></html>
`;

const DETAIL_HTML = `
<html><body>
<div class="content-main">
  <h1 class="page-title">Silo (2023)</h1>
  <p class="movie-tagline">The key to the future lies in the past.</p>
  <div class="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground">
    <div class="imdb-badge badge">
      <span class="imdb-logo">IMDb</span>
      <span class="imdb-score">8.1</span>
    </div>
    <span>•</span>
    <span class="badge badge-outline"><a href="/category/horror/">Horror</a></span>
    <span class="badge badge-outline"><a href="/category/mystery/">Mystery</a></span>
    <span class="badge badge-outline"><a href="/category/science_fiction/">Science Fiction</a></span>
    <span class="badge badge-outline"><a href="/category/movies/">Movies</a></span>
    <span class="badge badge-outline"><a href="/category/2160p/">2160p</a></span>
    <span class="badge badge-outline"><a href="/category/1080p/">1080p</a></span>
    <span class="badge badge-outline"><a href="/category/web-dl/">WEB-DL</a></span>
    <span class="badge badge-outline"><a href="/category/english/">English</a></span>
  </div>
  <p class="mt-2 text-muted-foreground"> • S01-S03 </p>

  <div class="content-section">
    <p class="mt-4">In a ruined and toxic future, thousands live in a giant silo deep underground.</p>
    <div class="metadata-list">
      <div class="metadata-item" style="display: flex;">
        <span class="metadata-label">Stars:</span>
        <span class="metadata-value">Rebecca Ferguson, Common</span>
      </div>
      <div class="metadata-item" style="display: flex;">
        <span class="metadata-label">Print:</span>
        <span class="metadata-value">2160p, 1080p WEB-DL</span>
      </div>
      <div class="metadata-item" style="display: flex;">
        <span class="metadata-label">Audios:</span>
        <span class="metadata-value">English</span>
      </div>
      <div class="metadata-item" style="display: flex;">
        <span class="metadata-label">Seasons:</span>
        <span class="metadata-value">S03, S02, S01</span>
      </div>
    </div>
    <button id="trailer-btn" data-trailer-url="https://www.youtube.com/embed/8ZYhuvIv1pA?autoplay=1">Watch Trailer</button>
  </div>

  <div class="content-section">
    <h2 class="section-title" style="color:#ff9800">Download Links</h2>
    <div class="space-y-4">
      <div class="download-item border rounded-lg overflow-hidden">
        <div class="download-header px-4 py-3 bg-muted/20 flex items-center justify-between cursor-pointer" data-file-id="file1">
          <div class="flex-1 text-left font-semibold">
            Silo (2160p WEB-DL DV HDR H265)
            <br><code>
              <span class="badge" style="background-color: #ea580c; color: white;">19.49 GB</span>
              <span class="badge" style="background-color: #0d9488; color: white;">English</span>
              <span class="badge" style="background-color: #15803d; color: white;">WEB-DL</span>
            </code>
          </div>
          <svg class="chevron-icon h-4 w-4"><path d="m6 9 6 6 6-6" /></svg>
        </div>
        <div id="content-file1" class="px-4 pb-4 pt-2 hidden">
          <div class="file-title">Silo.2023.2160p.WEB-DL.mkv</div>
          <div class="grid gap-4" style="padding-top:10px;">
            <div class="grid grid-cols-2 gap-2">
              <a target="_blank" href="https://hubcloud.ist/drive/abc123" class="btn w-full flex justify-between items-center">
                <span>Download HubCloud</span>
              </a>
              <a target="_blank" href="https://hubdrive.tips/file/xyz789" class="btn w-full flex justify-between items-center">
                <span>Download HubDrive</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div class="download-item border rounded-lg overflow-hidden">
        <div class="download-header px-4 py-3 bg-muted/20 flex items-center justify-between cursor-pointer" data-file-id="file2">
          <div class="flex-1 text-left font-semibold">
            Silo (1080p WEB-DL H264)
            <br><code>
              <span class="badge" style="background-color: #ea580c; color: white;">7.38 GB</span>
              <span class="badge" style="background-color: #0d9488; color: white;">English</span>
              <span class="badge" style="background-color: #15803d; color: white;">WEB-DL</span>
            </code>
          </div>
          <svg class="chevron-icon h-4 w-4"><path d="m6 9 6 6 6-6" /></svg>
        </div>
        <div id="content-file2" class="px-4 pb-4 pt-2 hidden">
          <div class="file-title">Silo.2023.1080p.WEB-DL.mkv</div>
          <div class="grid gap-4" style="padding-top:10px;">
            <div class="grid grid-cols-2 gap-2">
              <a target="_blank" href="https://hubcloud.ist/drive/def456" class="btn w-full flex justify-between items-center">
                <span>Download HubCloud</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="poster-container">
    <div class="poster-image">
      <img src="https://image.tmdb.org/t/p/w780/c2OijvbFEXBW1onbzuvENr4CGQB.jpg" alt="Poster">
    </div>
  </div>
</div>
</body></html>
`;

const SERIES_DETAIL_HTML = `
<html><body>
<div class="content-main">
  <h1 class="page-title">The East Palace</h1>
  <p class="movie-tagline">Beyond boundaries, they unearth the truth.</p>
  <div class="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground">
    <span class="badge badge-outline"><a href="/category/action_%26_adventure/">Action &amp; Adventure</a></span>
    <span class="badge badge-outline"><a href="/category/mystery/">Mystery</a></span>
    <span class="badge badge-outline"><a href="/category/series/">Series</a></span>
    <span class="badge badge-outline"><a href="/category/horror/">Horror</a></span>
    <span class="badge badge-outline"><a href="/category/1080p/">1080p</a></span>
    <span class="badge badge-outline"><a href="/category/netflix/">Netflix</a></span>
  </div>
  <p class="mt-2 text-muted-foreground"> • S01 </p>

  <div class="content-section">
    <p class="mt-4">A man who walks the spirit world and a court lady who hears the dead enter the East Palace.</p>
    <div class="metadata-list">
      <div class="metadata-item" style="display: flex;">
        <span class="metadata-label">Stars:</span>
        <span class="metadata-value">Nam Joo-hyuk, Roh Yoon-seo</span>
      </div>
      <div class="metadata-item" style="display: flex;">
        <span class="metadata-label">Print:</span>
        <span class="metadata-value">1080p, 720p | WEB-DL | H264</span>
      </div>
      <div class="metadata-item" style="display: flex;">
        <span class="metadata-label">Audios:</span>
        <span class="metadata-value">Hindi, English, Korean</span>
      </div>
      <div class="metadata-item" style="display: flex;">
        <span class="metadata-label">Seasons:</span>
        <span class="metadata-value">S01</span>
      </div>
    </div>
  </div>

  <div class="content-section">
    <div class="series-tabs" id="series-tabs">
      <button class="series-tab active" data-tab="complete-pack">Zip/Pack</button>
      <button class="series-tab" data-tab="episodes">Single EP's</button>
    </div>

    <div class="series-tab-content active" id="complete-pack">
      <div class="space-y-4">
        <div class="download-item border rounded-lg overflow-hidden">
          <div class="download-header px-2 py-3 bg-muted/20 flex items-center justify-between cursor-pointer" data-file-id="file100">
            <div class="episode-number pr-4">S01</div>
            <div class="flex-1 text-left font-semibold">
              The East Palace S01 H264 (NF 1080p WEB-DL)
              <br><code>
                <span class="badge" style="background-color: #ea580c; color: white;">27.54 GB</span>
                <span class="badge" style="background-color: #0d9488; color: white;">Hindi, English</span>
                <span class="badge" style="background-color: #15803d; color: white;">WEB-DL</span>
              </code>
            </div>
            <svg class="chevron-icon h-4 w-4"><path d="m6 9 6 6 6-6" /></svg>
          </div>
          <div id="content-file100" class="px-4 pb-4 pt-2 hidden">
            <div class="file-title">The.East.Palace.S01.1080p.zip</div>
            <div class="grid gap-4" style="padding-top:10px;">
              <div class="grid grid-cols-2 gap-2">
                <a target="_blank" href="https://hubcloud.cx/drive/aaa" class="btn w-full flex justify-between items-center">
                  <span>Download HubCloud</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="series-tab-content" id="episodes">
      <div class="episodes-list">
        <div class="episode-item">
          <div class="episode-header" data-episode-id="ep1">
            <div class="episode-number">E01</div>
            <div class="episode-info">
              <div class="episode-title">The Beginning</div>
            </div>
          </div>
          <div class="episode-content">
            <div class="episode-downloads">
              <div class="episode-download-item">
                <div class="episode-file-title">The.East.Palace.S01E01.1080p.mkv</div>
                <div class="episode-file-info">
                  <span class="badge" style="background-color: #1e40af; color: white;">1080p</span>
                  <span class="badge" style="background-color: #15803d; color: white;">WEB-DL</span>
                  <span class="badge" style="background-color: #0d9488; color: white;">Hindi</span>
                </div>
                <div class="episode-links">
                  <a target="_blank" href="https://hubcloud.ist/drive/ep1a" class="btn">
                    <span>Download HubCloud</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="episode-item">
          <div class="episode-header" data-episode-id="ep2">
            <div class="episode-number">E02</div>
            <div class="episode-info">
              <div class="episode-title">The Secret</div>
            </div>
          </div>
          <div class="episode-content">
            <div class="episode-downloads">
              <div class="episode-download-item">
                <div class="episode-file-title">The.East.Palace.S01E02.1080p.mkv</div>
                <div class="episode-file-info">
                  <span class="badge" style="background-color: #1e40af; color: white;">1080p</span>
                  <span class="badge" style="background-color: #15803d; color: white;">WEB-DL</span>
                </div>
                <div class="episode-links">
                  <a target="_blank" href="https://hubcloud.ist/drive/ep2a" class="btn">
                    <span>Download HubCloud</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</body></html>
`;

describe("4khdhub scraper", () => {
  describe("parseListPage", () => {
    it("extracts items from list HTML", () => {
      const { items, totalPages } = parseListPage(LIST_HTML);
      expect(items).toHaveLength(2);
      expect(totalPages).toBe(359);
    });

    it("parses title correctly", () => {
      const { items } = parseListPage(LIST_HTML);
      expect(items[0].title).toBe("Silo");
      expect(items[1].title).toBe("Desire");
    });

    it("parses slug from href", () => {
      const { items } = parseListPage(LIST_HTML);
      expect(items[0].slug).toBe("silo-series-851");
      expect(items[1].slug).toBe("desire-movie-7470");
    });

    it("parses year from meta text", () => {
      const { items } = parseListPage(LIST_HTML);
      expect(items[0].year).toBe("2023");
      expect(items[1].year).toBe("2026");
    });

    it("parses season info", () => {
      const { items } = parseListPage(LIST_HTML);
      expect(items[0].seasonInfo).toBe("S01");
    });

    it("parses quality badges", () => {
      const { items } = parseListPage(LIST_HTML);
      expect(items[0].qualityBadges).toContain("4K");
      expect(items[0].qualityBadges).toContain("DV");
      expect(items[0].qualityBadges).toContain("HDR");
    });

    it("parses format tags", () => {
      const { items } = parseListPage(LIST_HTML);
      expect(items[0].formats).toContain("Drama");
      expect(items[0].formats).toContain("English");
      expect(items[0].formats).toContain("Series");
    });

    it("determines type from formats", () => {
      const { items } = parseListPage(LIST_HTML);
      expect(items[0].type).toBe("series");
      expect(items[1].type).toBe("movie");
    });

    it("parses poster URL", () => {
      const { items } = parseListPage(LIST_HTML);
      expect(items[0].poster).toContain("image.tmdb.org");
    });

    it("constructs full URL", () => {
      const { items } = parseListPage(LIST_HTML);
      expect(items[0].url).toContain("silo-series-851");
    });

    it("returns empty items for empty HTML", () => {
      const { items } = parseListPage("<html><body></body></html>");
      expect(items).toHaveLength(0);
    });
  });

  describe("parseDetailPage", () => {
    it("parses detail page title and slug", () => {
      const detail = parseDetailPage(DETAIL_HTML, "silo-series-851");
      expect(detail.title).toBe("Silo (2023)");
      expect(detail.slug).toBe("silo-series-851");
    });

    it("parses tagline", () => {
      const detail = parseDetailPage(DETAIL_HTML, "silo-series-851");
      expect(detail.tagline).toBe("The key to the future lies in the past.");
    });

    it("parses IMDb rating", () => {
      const detail = parseDetailPage(DETAIL_HTML, "silo-series-851");
      expect(detail.imdbRating).toBe("8.1");
    });

    it("parses description", () => {
      const detail = parseDetailPage(DETAIL_HTML, "silo-series-851");
      expect(detail.description).toContain("ruined and toxic future");
    });

    it("parses metadata fields", () => {
      const detail = parseDetailPage(DETAIL_HTML, "silo-series-851");
      expect(detail.stars).toBe("Rebecca Ferguson, Common");
      expect(detail.printQuality).toBe("2160p, 1080p WEB-DL");
      expect(detail.audioLanguages).toBe("English");
      expect(detail.seasons).toBe("S03, S02, S01");
    });

    it("parses trailer URL", () => {
      const detail = parseDetailPage(DETAIL_HTML, "silo-series-851");
      expect(detail.trailerUrl).toContain("youtube.com");
    });

    it("parses poster", () => {
      const detail = parseDetailPage(DETAIL_HTML, "silo-series-851");
      expect(detail.poster).toContain("w780");
    });

    it("extracts genres separately from formats", () => {
      const detail = parseDetailPage(DETAIL_HTML, "silo-series-851");
      expect(detail.genres).toContain("Horror");
      expect(detail.genres).toContain("Mystery");
      expect(detail.genres).toContain("Science Fiction");
      expect(detail.genres).not.toContain("Movies");
      expect(detail.genres).not.toContain("2160p");
      expect(detail.genres).not.toContain("English");
    });

    it("extracts formats without genres", () => {
      const detail = parseDetailPage(DETAIL_HTML, "silo-series-851");
      expect(detail.formats).toContain("Movies");
      expect(detail.formats).toContain("2160p");
      expect(detail.formats).toContain("English");
      expect(detail.formats).toContain("WEB-DL");
      expect(detail.formats).not.toContain("Horror");
    });

    it("parses download packs", () => {
      const detail = parseDetailPage(DETAIL_HTML, "silo-series-851");
      expect(detail.downloads).toHaveLength(2);
      expect(detail.downloads[0].title).toBe("Silo (2160p WEB-DL DV HDR H265)");
      expect(detail.downloads[0].fileSize).toBe("19.49 GB");
      expect(detail.downloads[0].links).toHaveLength(2);
      expect(detail.downloads[0].links[0].url).toContain("hubcloud.ist");
      expect(detail.downloads[1].title).toBe("Silo (1080p WEB-DL H264)");
    });

    it("determines movie type correctly", () => {
      const detail = parseDetailPage(DETAIL_HTML, "silo-series-851");
      expect(detail.type).toBe("movie");
    });

    it("determines series type from series-tab", () => {
      const detail = parseDetailPage(SERIES_DETAIL_HTML, "east-palace-7475");
      expect(detail.type).toBe("series");
    });

    it("extracts genres from series page", () => {
      const detail = parseDetailPage(SERIES_DETAIL_HTML, "east-palace-7475");
      expect(detail.genres).toContain("Action & Adventure");
      expect(detail.genres).toContain("Mystery");
      expect(detail.genres).toContain("Horror");
      expect(detail.genres).not.toContain("Series");
      expect(detail.genres).not.toContain("Netflix");
    });

    it("parses series complete pack downloads", () => {
      const detail = parseDetailPage(SERIES_DETAIL_HTML, "east-palace-7475");
      expect(detail.downloads.length).toBeGreaterThanOrEqual(1);
      expect(detail.downloads[0].season).toBe("S01");
      expect(detail.downloads[0].title).toContain("The East Palace S01");
    });

    it("parses series episodes", () => {
      const detail = parseDetailPage(SERIES_DETAIL_HTML, "east-palace-7475");
      expect(detail.episodes).toHaveLength(2);
      expect(detail.episodes[0].episode).toBe("E01");
      expect(detail.episodes[0].title).toBe("The Beginning");
      expect(detail.episodes[0].downloads).toHaveLength(1);
      expect(detail.episodes[0].downloads[0].title).toContain("S01E01");
      expect(detail.episodes[0].downloads[0].quality).toBe("1080p");
    });
  });
});
