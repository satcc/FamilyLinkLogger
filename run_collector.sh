#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting Family Link Collector..."
export PYTHONIOENCODING=utf-8

if [ -f ".venv/bin/python" ]; then
    .venv/bin/python scraper/collector.py
else
    python3 scraper/collector.py
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Finished."
