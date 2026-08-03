"""EkHub — native Windows app.

Self-hosting shell: ensures a Node.js runtime, fetches the EkHub source, builds
it, serves it on localhost, and opens that in a WebView2 window. Falls back to
the default browser if pywebview/WebView2 is unavailable.
"""
import os
import sys
import threading

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import bootstrap  # noqa: E402


def show_status_window():
    try:
        import tkinter as tk
    except Exception:
        return None, None, None

    root = tk.Tk()
    root.title("EkHub")
    root.configure(bg="#1a1a1a")
    root.geometry("460x170")
    root.resizable(False, False)

    tk.Label(
        root, text="EkHub", fg="#ffffff", bg="#1a1a1a", font=("Segoe UI", 22, "bold")
    ).pack(pady=(26, 2))
    label = tk.Label(
        root,
        text="Setting up EkHub…",
        fg="#c0c0c0",
        bg="#1a1a1a",
        font=("Segoe UI", 11),
    )
    label.pack(pady=(4, 0))
    sub = tk.Label(
        root,
        text="First launch downloads Node.js and builds the app.",
        fg="#6b6b6b",
        bg="#1a1a1a",
        font=("Segoe UI", 9),
    )
    sub.pack(pady=(2, 0))
    root.update()
    return root, label, sub


def main():
    root, label, sub = show_status_window()
    result = {}
    have_ui = root is not None

    def set_status(text):
        if have_ui:
            try:
                root.after(0, lambda: label.config(text=text))
            except Exception:
                pass

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
            if have_ui:
                root.after(0, root.destroy)
        except Exception as e:  # noqa: BLE001
            result["error"] = str(e)
            if have_ui:
                root.after(0, lambda: (label.config(text="Setup failed"), sub.config(text=str(e))))

    threading.Thread(target=worker, daemon=True).start()

    if have_ui:
        root.mainloop()

    if "error" in result:
        if have_ui:
            try:
                import ctypes

                ctypes.windll.user32.MessageBoxW(0, result["error"], "EkHub", 0x10)
            except Exception:
                print(result["error"])
        else:
            print(result["error"])
        sys.exit(1)

    proc = result["proc"]
    url = result["url"]
    try:
        try:
            import webview
        except Exception:
            import webbrowser

            webbrowser.open(url)
            return
        webview.create_window(
            "EkHub",
            url,
            width=1280,
            height=820,
            min_size=(960, 600),
            background_color="#1a1a1a",
        )
        webview.start()
    finally:
        proc.terminate()


if __name__ == "__main__":
    main()
