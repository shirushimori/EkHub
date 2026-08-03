#!/usr/bin/env python3
"""EkHub launcher — self-hosted native Linux window.

Ensures a Node.js runtime, fetches the EkHub source, builds it, serves it on
localhost, and opens it in a webview window. Falls back to the default browser
when pywebview/WebKit isn't available.
"""
import os
import sys
import threading

_here = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, _here)
sys.path.insert(0, os.path.join(_here, "..", ".."))

import bootstrap  # noqa: E402

BG = "#1a1a1a"
BORDER = "#3a3a3a"
ACCENT = "#4f8cff"
TEXT = "#ffffff"
DIM = "#c0c0c0"
MUTED = "#6b6b6b"

try:
    import tkinter as tk
    import tkinter.font as tkfont

    HAVE_TK = True
except Exception:  # noqa: BLE001
    HAVE_TK = False


def open_app_window(url):
    try:
        import webview
    except Exception:  # noqa: BLE001
        import webbrowser

        webbrowser.open(url)
        return
    webview.create_window(
        "EkHub",
        url,
        width=1280,
        height=820,
        min_size=(960, 600),
        background_color=BG,
    )
    webview.start()


def main():
    if not HAVE_TK:
        proc, url = bootstrap.launch()
        try:
            open_app_window(url)
        finally:
            proc.terminate()
        return

    root = tk.Tk()
    root.title("EkHub")
    root.configure(bg=BG)
    root.geometry("460x190")
    root.resizable(False, False)

    title = tkfont.Font(family="Helvetica", size=22, weight="bold")
    status_font = tkfont.Font(family="Helvetica", size=11)
    sub_font = tkfont.Font(family="Helvetica", size=9)

    tk.Label(root, text="EkHub", font=title, fg=TEXT, bg=BG).pack(pady=(24, 4))
    status = tk.Label(root, text="Setting up EkHub…", font=status_font, fg=DIM, bg=BG)
    status.pack(pady=(2, 0))
    sub = tk.Label(
        root,
        text="First launch downloads Node.js and builds the app.",
        font=sub_font,
        fg=MUTED,
        bg=BG,
    )
    sub.pack(pady=(2, 0))

    result = {}

    def set_status(text):
        root.after(0, lambda: status.config(text=text))

    def worker():
        try:
            runtime = bootstrap.ensure_node()
            set_status("Fetching EkHub source…")
            rdir = bootstrap.ensure_source(runtime)
            set_status("Installing dependencies…")
            bootstrap.build_app(runtime, rdir)
            set_status("Starting local server…")
            proc, url = bootstrap.start_server(runtime, rdir)
            result.update(proc=proc, url=url)
            root.after(0, root.destroy)
        except Exception as e:  # noqa: BLE001
            result["error"] = str(e)
            root.after(0, lambda: (status.config(text="Setup failed"), sub.config(text=str(e))))

    threading.Thread(target=worker, daemon=True).start()
    root.mainloop()

    if "error" in result:
        print(result["error"], file=sys.stderr)
        sys.exit(1)

    try:
        open_app_window(result["url"])
    finally:
        result["proc"].terminate()


if __name__ == "__main__":
    main()
