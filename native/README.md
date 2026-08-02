# Native apps

Thin wrappers that open the EkHub web app. The web app talks to the Python
scraper API **server-side**, so the native apps are just shells — no scraping
runs on-device.

All three are built automatically by `.github/workflows/build-native.yml`
when you push a tag (`git tag v1.0 && git push origin v1.0`) and attached to
the GitHub Release. The lander at `/` links to those artifacts.

## Build locally

### Linux — `EkHub.run` (self-extracting installer)

```bash
bash native/linux/build-run.sh
# → dist/EkHub.run
```

Installs to `~/.local/share/ekhub`, adds an app-menu entry, and opens the web
app in a tiny tkinter window (falls back to the default browser if no GUI).

### Windows — `EkHub.exe` (pywebview + PyInstaller)

Run `native/windows/build_exe.ps1` on a Windows machine (needs Python 3.12).
Requires the Edge WebView2 runtime (preinstalled on Windows 10/11).

### Android — `EkHub.apk` (WebView shell)

```bash
bash native/android/build-apk.sh
# → dist/EkHub.apk
```

(or `cd native/android && gradle assembleRelease -PversionName=1.0 -PversionCode=1`
on a machine with the Android SDK + JDK 17 + Gradle 8.9 — outputs
`app/build/outputs/apk/release/app-release.apk`).

Zero AndroidX dependencies — plain framework WebView — so the APK stays tiny
and runs fine on low-end devices. In-app pages stay on `ekhub.vercel.app`;
every external link (watch players, download mirrors) opens in the default
browser so nothing ever dead-ends.

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
