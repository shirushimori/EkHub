from http.server import BaseHTTPRequestHandler
from urllib.request import urlopen, Request
import json
import urllib.parse
import re

UPSTREAM = "https://hianime.lol"
PREFIX = "/api/hianime"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "identity",
    "Cache-Control": "no-cache",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
}


def try_fetch(url):
    try:
        req = Request(url, headers=HEADERS)
        with urlopen(req, timeout=15) as resp:
            body = resp.read()
            content_type = resp.headers.get("Content-Type", "")
            return 200, content_type, body
    except Exception as e:
        return 502, "application/json", json.dumps({"error": str(e)}).encode()


def extract_search_results(html):
    results = []
    pattern = r'<a[^>]*href="([^"]*)"[^>]*class="[^"]*dynamic-name[^"]*"[^>]*>([^<]+)</a>'
    for m in re.finditer(pattern, html, re.DOTALL | re.IGNORECASE):
        href, title = m.group(1), m.group(2).strip()
        if href and title:
            results.append({"title": title, "url": f"{UPSTREAM}{href}" if href.startswith("/") else href})
    return results


class HianimeHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        path = self.path
        if path.startswith(PREFIX):
            path = path[len(PREFIX):]

        parsed = urllib.parse.urlparse(path)
        params = urllib.parse.parse_qs(parsed.query)

        # /api/hianime/search?keyword=...
        if "/search" in path:
            keyword = params.get("keyword", [""])[0]
            if not keyword:
                self.send_json(400, {"error": "keyword required"})
                return

            # Try to scrape hianime.lol search page
            search_url = f"{UPSTREAM}/search?keyword={urllib.parse.quote(keyword)}"
            status, ctype, body = try_fetch(search_url)

            if status == 200 and "text/html" in ctype:
                results = extract_search_results(body)
                self.send_json(200, {
                    "keyword": keyword,
                    "search_url": search_url,
                    "results": results,
                    "scraped": True,
                })
            else:
                # Fall back to URL construction
                self.send_json(200, {
                    "keyword": keyword,
                    "search_url": search_url,
                    "results": [],
                    "scraped": False,
                    "proxy_error": body.decode() if status != 200 else None,
                })
            return

        # /api/hianime/watch?id=...&ep=...
        if "/watch" in path:
            anime_id = params.get("id", [""])[0]
            ep = params.get("ep", ["1"])[0]
            if not anime_id:
                self.send_json(400, {"error": "id required"})
                return

            watch_url = f"{UPSTREAM}/watch/{anime_id}?ep={ep}"
            self.send_json(200, {
                "anime_id": anime_id,
                "episode": ep,
                "watch_url": watch_url,
                "embed_url": watch_url,
            })
            return

        # Proxy: fetch any hianime.lol page
        proxy_url = f"{UPSTREAM}{path}"
        status, ctype, body = try_fetch(proxy_url)

        self.send_response(status)
        self.send_header("Access-Control-Allow-Origin", "*")
        if "text/html" in ctype or ctype.startswith("text/"):
            self.send_header("Content-Type", ctype)
        else:
            self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)

    def send_json(self, status, data):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def log_message(self, format, *args):
        pass


handler = HianimeHandler
