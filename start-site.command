#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
MODE="${1:-}"

if [[ -z "$MODE" ]]; then
  echo "Select start mode:"
  echo "  1) site"
  echo "  2) dev"
  read -r MODE
fi

if [[ "$MODE" == "2" || "${MODE,,}" == "dev" ]]; then
  PORT=8001
  OPEN_PATH="/admin/"
else
  PORT=8000
  OPEN_PATH="/"
fi

PYTHON_BIN="$(command -v python3 || command -v python || true)"
if [[ -z "$PYTHON_BIN" ]]; then
  echo "Python 3 was not found. Install Python and try again."
  exit 1
fi

exec "$PYTHON_BIN" "$ROOT/scripts/start_server.py" --root "$ROOT" --port "$PORT" --open-path "$OPEN_PATH"
