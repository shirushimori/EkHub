#!/bin/sh
set -e

SRC="$1"
DEST="${EKHUB_DEST:-$HOME/.local/share/ekhub}"
BIN="$DEST/launcher"

mkdir -p "$DEST" "$HOME/.local/share/applications"

cp "$SRC/launcher.py" "$BIN"
chmod +x "$BIN"
cp "$SRC/bootstrap.py" "$DEST/bootstrap.py"
cp "$SRC/icon.svg" "$DEST/icon.svg"

sed -e "s|@BIN@|$BIN|g" -e "s|@ICON@|$DEST/icon.svg|g" "$SRC/ekhub.desktop" > "$HOME/.local/share/applications/EkHub.desktop"

cp "$SRC/uninstall.sh" "$DEST/uninstall.sh"
chmod +x "$DEST/uninstall.sh"

command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database "$HOME/.local/share/applications" >/dev/null 2>&1 || true

echo
echo "EkHub installed."
echo "  Launch:  $BIN   (or find \"EkHub\" in your app menu)"
echo "  Remove:  $DEST/uninstall.sh"
