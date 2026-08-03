# Native apps

The desktop apps (Windows/Linux) are **self-hosting**: on launch they ensure a
Node.js runtime, fetch the EkHub source, `npm run build` it, and serve `dist/`
on localhost, then open it in a webview window. The Android app is a WebView
shell around the hosted app (`https://ekhub.vercel.app/app`) with ad blocking,
a download manager, a download-complete banner, and a built-in video player.

All three are built automatically by `.github/workflows/build-native.yml`
when you push a tag (`git tag v1.0 && git push origin v1.0`) and attached to
the GitHub Release. The lander at `/` links to those artifacts.

## Build locally

### Linux — `EkHub.run` (self-extracting installer)

```bash
bash native/linux/build-run.sh
# → dist/EkHub.run
```

Installs to `~/.local/share/ekhub`, adds an app-menu entry, and launches a
status window that bootstraps the app (Node.js, source, build, localhost),
then opens a webview window (falls back to the default browser if
pywebview/WebKit isn't available).

### Windows — `EkHub.exe` (pywebview + PyInstaller)

Run `native/windows/build_exe.ps1` on a Windows machine (needs Python 3.12).
Requires the Edge WebView2 runtime (preinstalled on Windows 10/11). First
launch downloads Node.js and builds the app; subsequent launches are fast.

## Self-hosting details (shared `native/bootstrap.py`)

- **Node.js** — uses one already on `PATH`, else downloads a private copy
  (`nodejs.org/dist`) into the per-user data dir (`%APPDATA%\EkHub` /
  `~/.local/share/ekhub`).
- **Source** — `git clone` when git exists, otherwise a codeload tarball of
  `main`; updates itself with `git pull` on re-launch.
- **Build** — `npm ci`/`npm install` once, then `vite build` → `dist/`.
- **Server** — `node server.mjs` serves `dist/` and proxies the `/api/*`
  endpoints (tmdb / scraper / hd4u / hianime) exactly like the Vercel Python
  lambdas. Set `TMDB_API_KEY` for TMDB data; port via `EKHUB_PORT`.

### Android — `EkHub.apk` (WebView shell)

```bash
bash native/android/build-apk.sh
# → dist/EkHub.apk
```

(or `cd native/android && gradle assembleRelease -PversionName=1.0 -PversionCode=1`
on a machine with the Android SDK + JDK 17 + Gradle 8.9 — outputs
`app/build/outputs/apk/release/app-release.apk`).

Zero AndroidX dependencies — plain framework WebView — so the APK stays tiny
and runs fine on low-end devices. The app loads `ekhub.vercel.app/app`.
Navigation is whitelisted: watch players, download mirrors, YouTube, and TMDB
images load inside the app; everything else opens in the external browser:

- **Ad blocking** — known ad/tracker hosts are blocked at the WebView layer
  (navigations, new windows) *and* client-side via injected JS that stops
  scripted popups, `target=_blank` ad links, and hides ad containers.
  Popups the players throw up when you hit play never open.
- **Downloads** — when you pick a download link, the mirror's procedure opens
  in-app; the finished file is captured by Android's DownloadManager and saved
  into an organized, app-private tree (no storage permission needed):
  `Movies/<Title>/<file>` or `Series/<Title>/Season <n>/<file>`.
- **Download-complete banner** — a Crunchyroll-style banner slides up when a
  download finishes; "View" opens the built-in video player
  (`PlayerActivity`) for video files.

The web app pushes download metadata (title/season/episode) to the shell over
the `EkHubNative` JS bridge so files land in the right folder.

**Signing:** the release build signs with the debug keystore by default so
every build is installable. For a real release key, create
`native/android/keystore.properties`:

```properties
storeFile=/abs/path/release.keystore
storePassword=...
keyAlias=...
keyPassword=...
```

(recommended: keep `keystore.properties` + keystore out of the repo, e.g. as
GitHub Actions secrets injected in CI).
