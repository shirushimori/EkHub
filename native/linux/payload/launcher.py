#!/usr/bin/env python3
"""EkHub launcher — tiny native window, opens the web app.

The web app talks to the Python scraper API server-side, so this wrapper is
just a pretty shortcut. If tkinter is missing, falls back to the default browser.
"""
import os
import sys
import webbrowser

URL = os.environ.get("EKHUB_URL", "https://ekhub.vercel.app/app")

try:
    import tkinter as tk
    import tkinter.font as tkfont
except Exception:
    webbrowser.open(URL)
    sys.exit(0)

BG = "#1a1a1a"
BORDER = "#3a3a3a"
ACCENT = "#4f8cff"
TEXT = "#ffffff"
DIM = "#c0c0c0"


def open_app(root):
    webbrowser.open(URL)
    root.destroy()


def main():
    root = tk.Tk()
    root.title("EkHub")
    root.configure(bg=BG)
    root.geometry("380x230")
    root.resizable(False, False)

    title = tkfont.Font(family="Helvetica", size=22, weight="bold")
    sub = tkfont.Font(family="Helvetica", size=11)
    btn = tkfont.Font(family="Helvetica", size=12, weight="bold")

    tk.Label(root, text="EkHub", font=title, fg=TEXT, bg=BG).pack(pady=(30, 2))
    tk.Label(root, text="Movies · Series · Anime link indexer", font=sub, fg=DIM, bg=BG).pack()

    button = tk.Button(
        root,
        text="Open EkHub",
        font=btn,
        fg="white",
        bg=ACCENT,
        activebackground="#6ba0ff",
        activeforeground="white",
        bd=0,
        highlightthickness=0,
        padx=24,
        pady=10,
        cursor="hand2",
        command=lambda: open_app(root),
    )
    button.pack(pady=(26, 6))

    tk.Label(root, text=URL, font=sub, fg=BORDER, bg=BG).pack()
    root.mainloop()


if __name__ == "__main__":
    main()
