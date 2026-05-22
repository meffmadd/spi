#!/usr/bin/env bash
set -euo pipefail

# ── Check pre-requisites ──────────────────────────────────────────

if ! command -v docker >/dev/null 2>&1; then
  echo "spi: docker not found" >&2
  exit 1
fi

# ── Resolve compose file (two-tier, exclusive) ────────────────────

if [[ -f "$PWD/spi-compose.yaml" ]]; then
  file="$PWD/spi-compose.yaml"
else
  file="$HOME/.pi/spi-compose.yaml"
fi

if [[ ! -f "$file" ]]; then
  echo "spi: no compose file found. Run /spi init inside pi first." >&2
  exit 1
fi

# ── Run ───────────────────────────────────────────────────────────

exec docker compose -f "$file" run --rm pi "$@"
