import { describe, it, expect } from "vitest";
import { parseListPage, parseDetailPage } from "../providers/hdhub4u";

const LIST_HTML = `
<html><body>
<ul class="recent-movies">
  <li class="thumb col-md-2 col-sm-4 col-xs-6">
    <figure>
      <img src="https://image.tmdb.org/t/p/w342/3bEqHqeaQlFykaLQ7N4gDkIvL5w.jpg" alt="Desire">
      <a href="https://new3.hdhub4u.cl/desire-2026-hindi-webrip-full-movie/"><div class="thumb-hover"></div></a>
    </figure>
    <figcaption>
      <a href="https://new3.hdhub4u.cl/desire-2026-hindi-webrip-full-movie/">
        <p>Desire (2026) WEB-DL [Hindi (DD5.1) &amp; English] 4K 1080p 720p &amp; 480p Dual Audio [x264/10Bit-HEVC] | Full Movie</p>
      </a>
    </figcaption>
  </li>
  <li class="thumb col-md-2 col-sm-4 col-xs-6">
    <figure>
      <img src="https://image.tmdb.org/t/p/w342/eml0QA3zUMizBvrlfQKhWI0swVh.jpg" alt="India's Got Latent">
      <a href="https://new3.hdhub4u.cl/indias-got-latent-season-2-hindi-webrip-all-episodes/"><div class="thumb-hover"></div></a>
    </figure>
    <figcaption>
      <a href="https://new3.hdhub4u.cl/indias-got-latent-season-2-hindi-webrip-all-episodes/">
        <p>India's Got Latent (Season 2) WEB-DL [Hindi DD5.1] 4K 1080p 720p &amp; 480p [x264/HEVC] HD | [NF Series] [EP-03 Added]</p>
      </a>
    </figcaption>
  </li>
</ul>
<div class="pagination-wrap">
  <ul class="pagination">
    <li><span class="page-numbers current">1</span></li>
    <li><a class="page-numbers" href="/page/2/">2</a></li>
    <li><a class="page-numbers" href="/page/3/">3</a></li>
    <li><a class="next page-numbers" href="/page/2/"><span>Next</span></a></li>
  </ul>
</div>
</body></html>
`;

const DETAIL_HTML = `
<html><head>
  <meta property="og:image" content="https://image.tmdb.org/t/p/w500/3bEqHqeaQlFykaLQ7N4gDkIvL5w.jpg" />
</head><body>
<h1 class="page-title"><i class="material-icons">&#xE02C;</i><span class="material-text">Desire (2026) WEB-DL [Hindi (DD5.1) &amp; English] 4K 1080p 720p &amp; 480p Dual Audio [x264/10Bit-HEVC] | Full Movie</span></h1>
<main class="page-body">
  <img class="aligncenter" src="https://image.tmdb.org/t/p/w500/3bEqHqeaQlFykaLQ7N4gDkIvL5w.jpg" alt="Poster" />
  <div class="kno-rdesc">
    <span>Lucero's life appears immaculate: a wealthy household, a devoted husband, and two children.</span>
  </div>
  <div>
    <span><strong>iMDB Rating: </strong><a href="https://www.imdb.com/title/tt41617470/">6.3/10</a></span>
  </div>
  <div>
    <span><strong>Genre:</strong> Drama | Mystery</span>
  </div>
  <div>
    <span><strong>Stars:</strong> Ludwika Paleta, Jose Maria Yazpik</span>
  </div>
  <div>
    <span><strong>Language:</strong> Dual Audio [Hindi (DD5.1) + English]</span>
  </div>
  <div>
    <span><strong>Quality: </strong>WEB-DL 4K | 1080p | 720p | 480p</span>
  </div>
  <h2 style="text-align: center;"><span style="color: #ff0000;"><em>: DOWNLOAD LINKS :</em></span></h2>
  <h3><a href="https://hubcdn.sbs/file/Zu8aDOQkMqMp30oHPlKGu9tkh" target="_blank" rel="nofollow">480p [390MB]</a></h3>
  <hr />
  <h4><a href="https://hubdrive.tips/file/2111890636" target="_blank" rel="nofollow">720p 10Bit HEVC [760MB]</a></h4>
  <hr />
  <h3><a href="https://gadgetsweb.xyz/?id=abc" target="_blank" rel="nofollow">720p x264 [1GB]</a></h3>
  <hr />
  <h4><a href="https://hubdrive.tips/file/1997589668" target="_blank" rel="nofollow">1080p 10Bit HEVC [1.6GB]</a></h4>
  <hr />
  <h3><a href="https://gadgetsweb.xyz/?id=def" target="_blank" rel="nofollow">1080p x264 [2.1GB]</a></h3>
  <hr />
  <h4><a href="https://hubdrive.tips/file/3658240708" target="_blank" rel="nofollow">1080p WEB-DL [4.7GB]</a></h4>
  <hr />
  <h4><a href="https://hubdrive.tips/file/13907925865" target="_blank" rel="nofollow">4K [2160p SDR WEB-DL - 13.9GB]</a></h4>
</main>
</body></html>
`;

describe("hdhub4u scraper", () => {
  describe("parseListPage", () => {
    it("extracts items from list HTML", () => {
      const { items, totalPages } = parseListPage(LIST_HTML);
      expect(items).toHaveLength(2);
      expect(totalPages).toBe(3);
    });

    it("parses title correctly", () => {
      const { items } = parseListPage(LIST_HTML);
      expect(items[0].title).toBe("Desire");
      expect(items[1].title).toBe("India's Got Latent");
    });

    it("parses year from title", () => {
      const { items } = parseListPage(LIST_HTML);
      expect(items[0].year).toBe("2026");
    });

    it("parses slug from href", () => {
      const { items } = parseListPage(LIST_HTML);
      expect(items[0].slug).toBe("desire-2026-hindi-webrip-full-movie");
      expect(items[1].slug).toBe("indias-got-latent-season-2-hindi-webrip-all-episodes");
    });

    it("parses poster URL", () => {
      const { items } = parseListPage(LIST_HTML);
      expect(items[0].poster).toContain("image.tmdb.org");
    });

    it("determines movie type", () => {
      const { items } = parseListPage(LIST_HTML);
      expect(items[0].type).toBe("movie");
    });

    it("determines series type from Season keyword", () => {
      const { items } = parseListPage(LIST_HTML);
      expect(items[1].type).toBe("series");
    });

    it("returns empty items for empty HTML", () => {
      const { items } = parseListPage("<html><body></body></html>");
      expect(items).toHaveLength(0);
    });
  });

  describe("parseDetailPage", () => {
    it("parses title correctly", () => {
      const detail = parseDetailPage(DETAIL_HTML, "desire-2026");
      expect(detail.title).toBe("Desire");
    });

    it("parses year from title", () => {
      const detail = parseDetailPage(DETAIL_HTML, "desire-2026");
      expect(detail.year).toBe("2026");
    });

    it("parses slug", () => {
      const detail = parseDetailPage(DETAIL_HTML, "desire-2026");
      expect(detail.slug).toBe("desire-2026");
    });

    it("parses poster from og:image", () => {
      const detail = parseDetailPage(DETAIL_HTML, "desire-2026");
      expect(detail.poster).toContain("image.tmdb.org");
    });

    it("parses description", () => {
      const detail = parseDetailPage(DETAIL_HTML, "desire-2026");
      expect(detail.description).toContain("Lucero's life");
    });

    it("parses IMDb rating", () => {
      const detail = parseDetailPage(DETAIL_HTML, "desire-2026");
      expect(detail.imdbRating).toBe("6.3");
    });

    it("parses stars", () => {
      const detail = parseDetailPage(DETAIL_HTML, "desire-2026");
      expect(detail.stars).toContain("Ludwika Paleta");
    });

    it("parses genres", () => {
      const detail = parseDetailPage(DETAIL_HTML, "desire-2026");
      expect(detail.genres).toContain("Drama");
      expect(detail.genres).toContain("Mystery");
    });

    it("parses quality", () => {
      const detail = parseDetailPage(DETAIL_HTML, "desire-2026");
      expect(detail.printQuality).toContain("WEB-DL");
    });

    it("parses audio languages", () => {
      const detail = parseDetailPage(DETAIL_HTML, "desire-2026");
      expect(detail.audioLanguages).toContain("Hindi");
    });

    it("parses download links from h3 and h4", () => {
      const detail = parseDetailPage(DETAIL_HTML, "desire-2026");
      expect(detail.downloads).toHaveLength(7);
    });

    it("extracts quality from download link text", () => {
      const detail = parseDetailPage(DETAIL_HTML, "desire-2026");
      expect(detail.downloads[0].quality).toBe("480p");
      expect(detail.downloads[0].fileSize).toBe("390MB");
    });

    it("extracts file size from download link text", () => {
      const detail = parseDetailPage(DETAIL_HTML, "desire-2026");
      expect(detail.downloads[1].fileSize).toBe("760MB");
    });

    it("extracts codec from download link text", () => {
      const detail = parseDetailPage(DETAIL_HTML, "desire-2026");
      expect(detail.downloads[1].codec).toBe("HEVC");
    });

    it("parses download URL", () => {
      const detail = parseDetailPage(DETAIL_HTML, "desire-2026");
      expect(detail.downloads[0].links[0].url).toContain("hubcdn.sbs");
    });

    it("determines movie type", () => {
      const detail = parseDetailPage(DETAIL_HTML, "desire-2026");
      expect(detail.type).toBe("movie");
    });

    it("returns empty episodes for movie", () => {
      const detail = parseDetailPage(DETAIL_HTML, "desire-2026");
      expect(detail.episodes).toHaveLength(0);
    });
  });
});

const SERIES_DETAIL_HTML = `
<html><head>
  <meta property="og:image" content="https://image.tmdb.org/t/p/w500/east-palace.jpg" />
</head><body>
<h1 class="page-title"><i class="material-icons">&#xE02C;</i><span class="material-text">The East Palace (Season 1) WEB-DL [Hindi (DD5.1) &amp; English] 4K 1080p 720p &amp; 480p Dual Audio [x264/ESubs] | NF Series</span></h1>
<main class="page-body">
  <div class="kno-rdesc">
    <span>A man who walks the spirit world and a court lady who hears the dead enter the East Palace.</span>
  </div>
  <div>
    <span><strong>iMDB Rating: </strong>8.2/10</span>
  </div>
  <div>
    <span><strong>Genre:</strong> Drama | Fantasy</span>
  </div>
  <div>
    <span><strong>Stars:</strong> Actor One, Actor Two</span>
  </div>
  <div>
    <span><strong>Language:</strong> Dual Audio [Hindi (DD5.1) + English]</span>
  </div>
  <div>
    <span><strong>Quality: </strong>WEB-DL 4K | 1080p | 720p | 480p</span>
  </div>
  <div style="text-align: center;">
    <h3><a href="https://gadgetsweb.xyz/?id=abc" target="_blank" rel="nofollow">480p x264 [1.5GB]</a></h3>
    <hr>
    <h3><a href="https://gadgetsweb.xyz/?id=def" target="_blank" rel="nofollow">720p x264 [3.9GB]</a></h3>
    <hr>
    <h3><a href="https://gadgetsweb.xyz/?id=ghi" target="_blank" rel="nofollow">1080p x264 [8.5GB]</a></h3>
    <hr>
    <h4><a href="https://hubdrive.tips/file/5851434294" target="_blank" rel="nofollow">1080p WEB-DL PACK [27.5GB]</a></h4>
    <hr>
    <h4><a href="https://hubdrive.tips/packs/dinxllnb" target="_blank" rel="nofollow">4K [2160p SDR WEB-DL PACK – 52.4GB]</a></h4>
    <hr>
    <h4 style="text-align: center;"><a href="https://4khdhub.one/the-east-palace-series-7475/" target="_blank" rel="nofollow">4K | SDR | HDR | DV | AV1</a></h4>
    <hr>
    <h2 style="text-align: center;"><span style="color: #ff0000;"><em>: Single Episode x264 Links :</em></span></h2>
    <hr>
    <div class="Z1hOCe">
      <div style="text-align: center;">
        <h4><span style="color: #ff9900;"><strong>EPiSODE 1</strong></span></h4>
        <h4 style="text-align: center;"><span style="color: #ff0000;">720p –</span><span> <a href="https://hubdrive.tips/file/2168087908">Drive</a> | <a href="https://hubcdn.sbs/file/ALBy5w9diVUDq5zvXz0YVIfqA">Instant</a> | <a href="https://hubstream.art/#8zbrd3"><span style="color: #00ffff;">WATCH</span></a></span></h4>
        <h4 style="text-align: center;"><span style="color: #ff0000;">1080p –</span> <a href="https://hubdrive.tips/file/2368197983">Drive</a> | <a href="https://hubcdn.sbs/file/a3KhO1ncbe7DkMQXSgYBT0Wid">Instant</a></h4>
        <hr>
        <h4><span style="color: #ff9900;"><strong>EPiSODE 2</strong></span></h4>
        <h4 style="text-align: center;"><span style="color: #ff0000;">720p –</span><span> <a href="https://hubdrive.tips/file/1947162861">Drive</a> | <a href="https://hubcdn.sbs/file/ratPcctwSCTAfOrWebWWm7IJf">Instant</a> | <a href="https://hubstream.art/#qwydud"><span style="color: #00ffff;">WATCH</span></a></span></h4>
        <h4 style="text-align: center;"><span style="color: #ff0000;">1080p –</span> <a href="https://hubdrive.tips/file/1827998315">Drive</a> | <a href="https://hubcdn.sbs/file/2OHOZNh5m6IU24kdFZ183Kqk0">Instant</a></h4>
        <hr>
        <h4><span style="color: #ff9900;"><strong>EPiSODE 3</strong></span></h4>
        <h4 style="text-align: center;"><span style="color: #ff0000;">720p –</span><span> <a href="https://hubdrive.tips/file/2130083884">Drive</a> | <a href="https://hubcdn.sbs/file/idZqL63rmlXSv8K6z33BfxXGs">Instant</a> | <a href="https://hubstream.art/#xpu1yv"><span style="color: #00ffff;">WATCH</span></a></span></h4>
        <h4 style="text-align: center;"><span style="color: #ff0000;">1080p –</span> <a href="https://hubdrive.tips/file/2031827276">Drive</a> | <a href="https://hubcdn.sbs/file/0TCakGIfzeSJK8NzR48gRKwBC">Instant</a></h4>
      </div>
    </div>
  </div>
</main>
</body></html>
`;

describe("hdhub4u series detail parser", () => {
  it("parses series type", () => {
    const detail = parseDetailPage(SERIES_DETAIL_HTML, "the-east-palace-season-1");
    expect(detail.type).toBe("series");
  });

  it("parses season info from title", () => {
    const detail = parseDetailPage(SERIES_DETAIL_HTML, "the-east-palace-season-1");
    expect(detail.seasonInfo).toBe("Season 1");
  });

  it("extracts flat movie downloads (before episodes)", () => {
    const detail = parseDetailPage(SERIES_DETAIL_HTML, "the-east-palace-season-1");
    expect(detail.downloads).toHaveLength(5);
  });

  it("parses episode count", () => {
    const detail = parseDetailPage(SERIES_DETAIL_HTML, "the-east-palace-season-1");
    expect(detail.episodes).toHaveLength(3);
  });

  it("parses episode numbers", () => {
    const detail = parseDetailPage(SERIES_DETAIL_HTML, "the-east-palace-season-1");
    expect(detail.episodes[0].episode).toBe("EPISODE 1");
    expect(detail.episodes[1].episode).toBe("EPISODE 2");
    expect(detail.episodes[2].episode).toBe("EPISODE 3");
  });

  it("parses quality levels per episode", () => {
    const detail = parseDetailPage(SERIES_DETAIL_HTML, "the-east-palace-season-1");
    expect(detail.episodes[0].downloads).toHaveLength(2);
    expect(detail.episodes[0].downloads[0].quality).toBe("720p");
    expect(detail.episodes[0].downloads[1].quality).toBe("1080p");
  });

  it("parses multiple mirror links per quality", () => {
    const detail = parseDetailPage(SERIES_DETAIL_HTML, "the-east-palace-season-1");
    const ep1_720p = detail.episodes[0].downloads[0];
    expect(ep1_720p.links).toHaveLength(3);
    expect(ep1_720p.links[0].label).toBe("Drive");
    expect(ep1_720p.links[1].label).toBe("Instant");
    expect(ep1_720p.links[2].label).toBe("WATCH");
  });

  it("parses episode download URLs", () => {
    const detail = parseDetailPage(SERIES_DETAIL_HTML, "the-east-palace-season-1");
    expect(detail.episodes[0].downloads[0].links[0].url).toContain("hubdrive.tips");
    expect(detail.episodes[0].downloads[0].links[1].url).toContain("hubcdn.sbs");
  });

  it("skips 4khdhub.one cross-links in flat downloads", () => {
    const detail = parseDetailPage(SERIES_DETAIL_HTML, "the-east-palace-season-1");
    const has4khdhub = detail.downloads.some((d) =>
      d.links.some((l) => l.url.includes("4khdhub.one"))
    );
    expect(has4khdhub).toBe(false);
  });
});
