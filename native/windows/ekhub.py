"""EkHub — native Windows launcher for the web app.

The web app talks to the Python scraper API server-side, so this window is
just a WebView2 shell pointing at it. If pywebview/WebView2 is missing it
falls back to the default browser so the app never silently breaks.
"""
import os
import sys

URL = os.environ.get("EKHUB_URL", "https://dotrent.vercel.app")


def main():
    try:
        import webview
    except Exception:
        import webbrowser

        webbrowser.open(URL)
        sys.exit(0)

    webview.create_window(
        "EkHub",
        URL,
        width=1280,
        height=820,
        min_size=(960, 600),
        background_color="#1a1a1a",
    )
    webview.start()


if __name__ == "__main__":
    main()
