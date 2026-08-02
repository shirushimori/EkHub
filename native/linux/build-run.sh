#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
DIST="$ROOT/dist"
PAYLOAD="$HERE/payload"
OUT="$DIST/EkHub.run"

mkdir -p "$DIST"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

tar -C "$PAYLOAD" -czf "$TMP/payload.tgz" .

{ cat "$HERE/run-stub.sh"; cat "$TMP/payload.tgz"; } > "$OUT"
chmod +x "$OUT"

echo "Built: $OUT ($(du -h "$OUT" | cut -f1))"
