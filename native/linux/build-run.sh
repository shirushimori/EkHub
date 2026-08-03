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

STAGE="$TMP/stage"
mkdir -p "$STAGE"
cp -r "$PAYLOAD/." "$STAGE/"
cp "$HERE/../bootstrap.py" "$STAGE/bootstrap.py"

tar -C "$STAGE" -czf "$TMP/payload.tgz" .

{ cat "$HERE/run-stub.sh"; cat "$TMP/payload.tgz"; } > "$OUT"
chmod +x "$OUT"

echo "Built: $OUT ($(du -h "$OUT" | cut -f1))"
