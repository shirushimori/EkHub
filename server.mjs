#!/usr/bin/env node
// EkHub local server for the native desktop apps.
//
// Serves the built SPA (dist/) and proxies the /api/* endpoints exactly like
// the Vercel Python lambdas do, so localhost behaves like the hosted site.
//
//   EKHUB_PORT        port to listen on (default 43210)
//   TMDB_API_KEY      TMDB v4 API key used by /api/tmdb
import http from "node:http";
import https from "node:https";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const ROOT = process.cwd();
const DIST = join(ROOT, "dist");
const PORT = Number(process.env.EKHUB_PORT || 43210);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".webmanifest": "application/manifest+json",
  ".woff2": "font/woff2",
  ".wasm": "application/wasm",
  ".apk": "application/vnd.android.package-archive",
};

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "identity",
  "Cache-Control": "no-cache",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
};

function sendJson(res, status, data, extra = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    ...extra,
  });
  res.end(JSON.stringify(data));
}

function sendFile(res, file) {
  res.writeHead(200, {
    "Content-Type": MIME[extname(file).toLowerCase()] || "application/octet-stream",
  });
  createReadStream(file).pipe(res);
}

function isFile(file) {
  try {
    return existsSync(file) && statSync(file).isFile();
  } catch {
    return false;
  }
}

// ── /api proxy (mirrors the Vercel Python lambdas) ─────────────────────

function proxy(req, res, upstream, prefix) {
  let rest = req.url.slice(prefix.length);
  if (!rest.startsWith("/")) rest = "/" + rest;
  const target = new URL(upstream + rest);
  const mod = target.protocol === "https:" ? https : http;
  const preq = mod.request(
    target,
    { method: req.method, headers: BROWSER_HEADERS },
    (pres) => {
      res.writeHead(pres.statusCode || 502, {
        "Content-Type": pres.headers["content-type"] || "text/html",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300",
      });
      pres.pipe(res);
    }
  );
  preq.on("error", () => sendJson(res, 502, { error: "upstream unreachable" }));
  if (req.method === "POST" || req.method === "PUT") req.pipe(preq);
  else preq.end();
}

function tmdb(req, res) {
  const key = process.env.TMDB_API_KEY || "";
  if (!key) {
    return sendJson(res, 404, { error: "TMDB API key not configured" });
  }
  let rest = req.url.slice("/api/tmdb".length);
  if (!rest.startsWith("/")) rest = "/" + rest;
  const target = new URL("https://api.themoviedb.org/3" + rest);
  if (target.searchParams.has("api_key")) target.searchParams.set("api_key", key);
  else target.searchParams.append("api_key", key);
  const preq = https.request(
    target,
    {
      method: req.method,
      headers: { Accept: "application/json", "User-Agent": "Dotrent/1.0" },
    },
    (pres) => {
      res.writeHead(pres.statusCode || 502, {
        "Content-Type": pres.headers["content-type"] || "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
      });
      pres.pipe(res);
    }
  );
  preq.on("error", () => sendJson(res, 502, { error: "upstream unreachable" }));
  preq.end();
}

function handleApi(req, res, path) {
  if (path.startsWith("/api/tmdb")) return tmdb(req, res);
  if (path.startsWith("/api/scraper"))
    return proxy(req, res, "https://4khdhub.one", "/api/scraper");
  if (path.startsWith("/api/hd4u"))
    return proxy(req, res, "https://new3.hdhub4u.cl", "/api/hd4u");
  if (path.startsWith("/api/hianime"))
    return proxy(req, res, "https://hianime.lol", "/api/hianime");
  return sendJson(res, 404, { error: "not found" });
}

// ── static serving with SPA fallback ──────────────────────────────────

function handleStatic(req, res, pathname) {
  if (pathname === "/") return sendFile(res, join(DIST, "index.html"));
  if (pathname.startsWith("/app")) {
    const rel = pathname.slice(4).replace(/^[/\\]+/, "");
    const file = rel ? join(DIST, "app", rel) : join(DIST, "app", "index.html");
    if (isFile(file)) return sendFile(res, file);
    return sendFile(res, join(DIST, "app", "index.html"));
  }
  const clean = pathname.split("?")[0].replace(/^[/\\]+/, "");
  const file = resolve(DIST, normalize(clean));
  if (file.startsWith(resolve(DIST)) && isFile(file)) return sendFile(res, file);
  return sendFile(res, join(DIST, "index.html"));
}

const server = http.createServer((req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    if (pathname.startsWith("/api/")) return handleApi(req, res, pathname);
    return handleStatic(req, res, pathname);
  } catch {
    sendJson(res, 500, { error: "internal error" });
  }
});

server.listen(PORT, () => {
  console.log(`EkHub serving ${DIST} at http://localhost:${PORT}`);
});
