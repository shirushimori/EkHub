# EkHub

A link indexer that aggregates movie, series, and anime links from HDHub4u, 4KHub, and MyAnimeList (Jikan). Does not host any content — only indexes links from third-party sources.

## Structure

- **Lander** (`/`) — Static, OS-aware landing page offering "Continue to Web" or app install per platform
- **Web App** (`/app`) — The full React indexer
- **Native apps** — WebView wrappers built per platform (`native/`), downloadable from the lander:
  - Android `.apk` — zero-AndroidX WebView shell, minSdk 26
  - Windows `.exe` — pywebview + PyInstaller launcher
  - Linux `.run` — self-extracting shell installer

## Features

- **Multi-source browsing** — Switch between HDHub4u, 4KHub, or Mix mode via the navbar dropdown
- **Download links** — Quality-sorted download packs and episode-by-episode links
- **Screenshots & trailers** — Embedded player and screenshot gallery
- **Bookmarks** — Save content with localStorage persistence
- **Search** — Real-time search across all active sources
- **Dark mode** — Mobile-first dark UI with responsive layout

## Tech Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · Motion · Zustand

Data: HDHub4u · 4KHDHub · Jikan (MyAnimeList) · TMDB · TVMaze

## Development

```bash
npm install
npm run dev
```

## Deployment

Auto-deployed to Vercel on push to `main`.

Production: [https://ekhub.vercel.app](https://ekhub.vercel.app)
Legacy redirect: [https://dotrent.vercel.app](https://dotrent.vercel.app) → ekhub.vercel.app

### Native builds

```bash
# All three apps (Linux + Android work locally; Windows .exe needs a Windows host)
bash native/linux/build-run.sh      # dist/EkHub.run
bash native/android/build-apk.sh    # dist/EkHub.apk (needs JDK 17 + Android SDK; see native/README.md)
```

Windows `.exe` is built by CI (`.github/workflows/build-native.yml`) on tag pushes.

Release artifacts are attached to GitHub Releases on `v*` tags. The lander's
download URLs point at `https://github.com/shirushimori/EkHub/releases/latest/download/{EkHub.apk,EkHub.exe,EkHub.run,EkHub.ipa,EkHub.dmg}`.

To sign with a real release key instead of the debug fallback, create
`native/android/keystore.properties` (see `native/README.md`).

## License

MIT
