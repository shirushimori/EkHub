from http.server import BaseHTTPRequestHandler
from urllib.request import urlopen, Request
from urllib.parse import urlencode
import os, json

API_KEY = os.environ.get("TMDB_API_KEY", "")
BASE = "https://api.themoviedb.org/3"


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if not API_KEY:
            self.send_response(404)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "TMDB API key not configured"}).encode())
            return

        path = self.path.lstrip("/")
        if path.startswith("api/tmdb/"):
            path = path[len("api/tmdb/"):]

        url = f"{BASE}/{path}"
        if "?" in url:
            url += f"&api_key={API_KEY}"
        else:
            url += f"?api_key={API_KEY}"

        req = Request(url, headers={
            "Accept": "application/json",
            "User-Agent": "Dotrent/1.0",
        })

        try:
            with urlopen(req, timeout=10) as resp:
                body = resp.read()
                self.send_response(resp.status)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400")
                self.end_headers()
                self.wfile.write(body)
        except Exception as e:
            self.send_response(502)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
