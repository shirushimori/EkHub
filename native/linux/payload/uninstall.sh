#!/bin/sh
set -e

DEST="${EKHUB_DEST:-$HOME/.local/share/ekhub}"

rm -f "$HOME/.local/share/applications/EkHub.desktop"
rm -rf "$DEST"

command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database "$HOME/.local/share/applications" >/dev/null 2>&1 || true

echo "EkHub removed."
