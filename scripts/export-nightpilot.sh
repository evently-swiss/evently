#!/usr/bin/env bash
# One-time export of nightpilot MongoDB collections to JSON.
# Run this on the machine that has access to the nightpilot MongoDB.
#
# Usage:
#   MONGO_HOST=localhost MONGO_PORT=27017 bash scripts/export-nightpilot.sh
#
# Output: scripts/migration-data/*.json  (gitignored)

set -euo pipefail

HOST="${MONGO_HOST:-localhost}"
PORT="${MONGO_PORT:-27017}"
DB="${MONGO_DB:-nightpilot}"
OUT_DIR="$(dirname "$0")/migration-data"

mkdir -p "$OUT_DIR"

echo "Exporting from mongodb://$HOST:$PORT/$DB …"

for collection in events loungereservations guests; do
  out="$OUT_DIR/nightpilot_${collection}.json"
  echo "  → $collection …"
  mongoexport \
    --host "$HOST" \
    --port "$PORT" \
    --db "$DB" \
    --collection "$collection" \
    --out "$out"
  count=$(wc -l < "$out")
  echo "     $count records → $out"
done

echo "Export complete. Files in $OUT_DIR"
