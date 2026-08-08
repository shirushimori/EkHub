#!/usr/bin/env python3
"""EkHub launcher — self-hosted native Linux window (WebKit2GTK).

Ensures a Node.js runtime, fetches the EkHub source, builds it, serves it on
localhost, and opens it in a WebKit2GTK window. The HTML5 Fullscreen API is
enabled so the app's fullscreen player button works natively. Falls back to
the default browser when WebKit2GTK isn't available.
"""
import os
import sys
import threading

_here = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, _here)

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


def _has_webkit():
    try:
        import gi  # noqa: F401

        gi.require_version("Gtk", "3.0")
        gi.require_version("WebKit2", "4.1")
        return True
    except Exception:  # noqa: BLE001
        return False


class AppWindow:
    def __init__(self, url):
        import gi

        gi.require_version("Gtk", "3.0")
        gi.require_version("WebKit2", "4.1")
        from gi.repository import Gtk, Gdk, WebKit2

        self.Gtk = Gtk
        self.server = None

        win = Gtk.Window()
        win.set_title("EkHub")
        win.set_default_size(1280, 820)
        win.set_size_request(960, 600)
        win.set_border_width(0)

        settings = WebKit2.Settings()
        settings.set_enable_fullscreen(True)
        settings.set_media_playback_requires_user_gesture(False)
        settings.set_media_playback_allows_inline(True)
        try:
            settings.set_enable_developer_extras(True)
        except Exception:  # noqa: BLE001
            pass

        wv = WebKit2.WebView.new_with_settings(settings)
        wv.set_background_color(Gdk.RGBA(0.10, 0.10, 0.10, 1.0))
        wv.load_uri(url)

        def _on_enter_fullscreen(_wv):
            win.fullscreen()

        def _on_leave_fullscreen(_wv):
            win.unfullscreen()

        try:
            wv.connect("enter-fullscreen", _on_enter_fullscreen)
            wv.connect("leave-fullscreen", _on_leave_fullscreen)
        except Exception:  # noqa: BLE001
            pass

        scrolled = Gtk.ScrolledWindow()
        scrolled.add(wv)
        win.add(scrolled)

        win.connect("delete-event", lambda *_: self.close())
        win.connect("destroy", lambda *_: self.close())

        win.show_all()
        wv.grab_focus()
        self.win = win
        self.wv = wv

    def run(self):
        self.Gtk.main()

    def close(self, *args):
        if self.server is not None:
            try:
                self.server.terminate()
            except Exception:  # noqa: BLE001
                pass
            self.server = None
        if hasattr(self, "Gtk"):
            self.Gtk.main_quit()
        return False


def open_app_window(url, proc):
    if not _has_webkit():
        import webbrowser

        webbrowser.open(url)
        return

    win = AppWindow(url)
    win.server = proc
    win.run()


def main():
    if not HAVE_TK:
        proc, url = bootstrap.launch()
        open_app_window(url, proc)
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
        open_app_window(result["url"], result["proc"])
    finally:
        try:
            result["proc"].terminate()
        except Exception:  # noqa: BLE001
            pass


if __name__ == "__main__":
    main()
