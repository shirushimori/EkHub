# Android app

The Android app is a zero-AndroidX WebView shell around the hosted web app
(`https://ekhub.vercel.app/app`) with:

- **Whitelist-driven navigation** — only hosts listed in `whitelist.txt`
  (repo root, refreshed from `githubusercontent.com`) load in-app; everything
  else is blocked (never the external browser).
- **Ad blocking on video players** — the ad/tracker host list is applied only
  while a video player page is open (`player.videasy.net`,
  `player.autoembed.cc`, `hubstream`, `hdstream4u`, `player.*`). Host lists
  load lazily the first time a player is opened.
- **Fullscreen player** — the web player's fullscreen button drives a native
  bridge (`EkHubNative.toggleFullscreen`) that shows a real fullscreen view;
  the embedded player's own HTML5 fullscreen also works via
  `WebChromeClient.onShowCustomView`.
- **In-app update checker** — prompts, downloads, validates, and installs new
  APKs via the PackageInstaller API.
- **Popout button** — opens the current third-party page in the default
  browser.

## Build

```bash
bash native/android/build-apk.sh   # → dist/EkHub.apk
```

(or `cd native/android && gradle assembleRelease -PversionName=1.0 -PversionCode=1`
on a machine with the Android SDK + JDK 17 + Gradle 8.9 — outputs
`app/build/outputs/apk/release/app-release.apk`).

Built automatically by `.github/workflows/build-native.yml` when you push a
tag (`git tag v1.0 && git push origin v1.0`) and attached to the GitHub
Release.

**Signing:** the release build signs with the debug keystore by default so
every build is installable. For a real release key, create
`native/android/keystore.properties`:

```properties
storeFile=/abs/path/release.keystore
storePassword=...
keyAlias=...
keyPassword=...
```

(keep `keystore.properties` + keystore out of the repo; pass them to CI as
secrets instead).
