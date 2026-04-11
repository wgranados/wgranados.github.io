#!/bin/sh
# Waits for Jekyll to produce _site, indexes once, then re-runs Pagefind when HTML changes.
set -eu
cd "$(dirname "$0")/.."

echo "pagefind-watch: npm ci (parallel) + waiting for _site from Jekyll…"
npm ci &
npm_pid=$!

n=0
while ! [ -f _site/index.html ]; do
  n=$((n + 1))
  if [ "$n" -gt 180 ]; then
    echo "pagefind-watch: timeout waiting for _site/index.html" >&2
    kill "$npm_pid" 2>/dev/null || true
    wait "$npm_pid" 2>/dev/null || true
    exit 1
  fi
  sleep 1
done

wait "$npm_pid"

# Brief pause so the first build can settle
sleep 2
npm run pagefind

echo "pagefind-watch: watching _site/**/*.html (debounced); Ctrl+C to stop"
exec npm run pagefind:watch
