#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
DIST="$ROOT/dist"

# Toolchain locations — override with ANDROID_HOME / JAVA_HOME / GRADLE_HOME.
JAVA_HOME="${JAVA_HOME:-$HOME/ekhub-build/jdk}"
ANDROID_HOME="${ANDROID_HOME:-$HOME/ekhub-build/android-sdk}"
GRADLE="${GRADLE_HOME:-$HOME/ekhub-build/gradle/gradle-8.9}/bin/gradle"

if [ ! -x "$GRADLE" ]; then
  echo "ERROR: Gradle not found at $GRADLE. Set GRADLE_HOME." >&2
  exit 1
fi
if [ ! -d "$ANDROID_HOME/platforms" ]; then
  echo "ERROR: Android SDK not found at $ANDROID_HOME. Set ANDROID_HOME." >&2
  exit 1
fi

export JAVA_HOME
export ANDROID_HOME
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"

# Ensure an installable signing key exists (release build falls back to the
# debug keystore when keystore.properties is absent).
KEYSTORE="$HOME/.android/debug.keystore"
if [ ! -f "$KEYSTORE" ] && [ ! -f "$HERE/keystore.properties" ]; then
  mkdir -p "$HOME/.android"
  keytool -genkeypair -v \
    -keystore "$KEYSTORE" -storepass android \
    -alias androiddebugkey -keypass android \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -dname "CN=Android Debug,O=Android,C=US" >/dev/null 2>&1
fi

VERSION_NAME="${VERSION_NAME:-1.0.8}"
VERSION_CODE="${VERSION_CODE:-108}"

(cd "$HERE" && "$GRADLE" assembleRelease \
  -PversionName="$VERSION_NAME" -PversionCode="$VERSION_CODE" --no-daemon)

APK="$HERE/app/build/outputs/apk/release/app-release.apk"
mkdir -p "$DIST"
cp "$APK" "$DIST/EkHub.apk"
echo "Built: $DIST/EkHub.apk ($(du -h "$DIST/EkHub.apk" | cut -f1))"
