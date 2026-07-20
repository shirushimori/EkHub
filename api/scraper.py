from http.server import BaseHTTPRequestHandler
from urllib.request import urlopen, Request

UPSTREAM = "https://4khdhub.one"
PREFIX = "/api/scraper"


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        path = self.path
        if path.startswith(PREFIX):
            path = path[len(PREFIX):]
        url = f"{UPSTREAM}{path}"

        req = Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Referer": f"{UPSTREAM}/",
        })

        try:
            with urlopen(req, timeout=15) as resp:
                body = resp.read()
                self.send_response(resp.status)
                self.send_header("Content-Type", resp.headers.get("Content-Type", "text/html"))
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(body)
        except Exception as e:
            self.send_response(502)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(f'{{"error": "{e}"}}'.encode())
