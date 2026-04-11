#!/bin/sh
# Build Jekyll _site, merge Astro arcade output, run Pagefind — all via Docker Compose.
# After this, /search/ works for the current _site/ tree (see README for how to serve it).
set -eu
cd "$(dirname "$0")/.."

docker compose run --rm site bundle exec jekyll build
docker compose run --rm arcade npm run build
docker compose run --rm site sh -c 'rm -rf _site/arcade && mkdir -p _site && cp -r arcade/dist _site/arcade'
docker compose run --rm pagefind

echo ""
echo "Pagefind index written under _site/pagefind/"
echo "Serve without rebuilding (keeps search):"
echo "  docker compose run --rm -p 4000:4000 site bundle exec jekyll serve --host 0.0.0.0 --port 4000 --skip-initial-build --no-watch"
