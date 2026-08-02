#!/bin/sh
#
# EkHub self-extracting installer (.run)
# Extracts an embedded gzip tarball and runs its install.sh
#
set -e

SCRIPT="$0"
MARKER='__EKHUB_ARCHIVE_BELOW__'

LINE=$(grep -an '^__EKHUB_ARCHIVE_BELOW__$' "$SCRIPT" | head -n1 | cut -d: -f1)
if [ -z "$LINE" ]; then
    echo "error: installer is corrupt (archive marker missing)" >&2
    exit 1
fi

START=$((LINE + 1))
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT HUP INT TERM

tail -n +"$START" "$SCRIPT" | tar -xzf - -C "$TMP"

exec sh "$TMP/install.sh" "$TMP"

__EKHUB_ARCHIVE_BELOW__
