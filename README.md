# EkHub

A link indexer that aggregates movie, series, and anime links from HDHub4u, 4KHub, and MyAnimeList (Jikan). Does not host any content — only indexes links from third-party sources.

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

## License

MIT
