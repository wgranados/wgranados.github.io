# wgranados.github.io (Jekyll + Astro)

This repo contains:

- **Jekyll** — the main site and blog.
- **Astro + React** (`arcade/`) — a statically generated game/experiment section served under `/arcade/`.

## Local development (Docker)

Build and start both the Jekyll site and the Astro arcade section:

```bash
docker compose up --build
```

That starts **Jekyll**, **Astro arcade**, and **`pagefind-watch`** (Node). The watcher creates `_site/pagefind/` after the first Jekyll build and re-runs Pagefind when HTML under `_site/` changes, so `/pagefind/*` assets are served and blog search works. The first index may take a few seconds after Jekyll finishes; watch the `pagefind-watch` logs for `watching _site`.

To **skip** the Pagefind container (e.g. you only care about arcade): `docker compose up site arcade`.

On the first run the containers will install dependencies into cached volumes, so subsequent starts are faster.

Then open:

- `http://localhost:4000` — Jekyll main site
- `http://localhost:4321/arcade/` — Astro game section

Both services hot-reload when you edit files.

Stop:

```bash
docker compose down
```

To run only one service:

```bash
docker compose up site      # Jekyll only
docker compose up arcade    # Astro only
```

### Adding a new game

Create a new directory under `arcade/src/pages/<game-slug>/` with an `index.astro` page that imports a React component with `client:load`.

### Search (Pagefind)

Search uses [Pagefind](https://pagefind.app/). The **Search** link (same style as the other toolbar links) appears on the **blog index** (including paginated URLs like `/blog/page2/`), **Archive**, and **Tags**; individual posts use a minimal row without search. The index only includes HTML under **`/blog/`**. **Ctrl+K** / **Cmd+K** opens the modal on those pages after the Pagefind bundle has loaded. The old `/search/` URL redirects to `/blog/`. The bundle lives under `_site/pagefind/` and is created **after** Jekyll builds (and after the arcade merge into `_site/arcade/` if you run the full Docker index script).

**Docker (no local Node required):** from the repo root:

```bash
./scripts/docker-index-search.sh
```

Then serve **without** an initial rebuild (otherwise Jekyll may wipe `_site/pagefind/`):

```bash
docker compose run --rm -p 4000:4000 site bundle exec jekyll serve \
  --host 0.0.0.0 --port 4000 --skip-initial-build --no-watch
```

Open `http://localhost:4000/blog/` and use **Search** in the toolbar (after indexing). Re-run `./scripts/docker-index-search.sh` when you want to refresh the index.

**One-shot index in Docker** (after `_site/` is already built): `docker compose --profile index run --rm pagefind`.

**Without Docker:** `bundle exec jekyll build`, build arcade into `arcade/dist`, merge into `_site/arcade/`, then `npm ci && npm run pagefind` from the repo root.

Jekyll is configured with **`keep_files: [pagefind]`** so `jekyll serve` **keeps** `_site/pagefind/` across regenerations once it exists. With **`docker compose up`**, `pagefind-watch` creates and refreshes that folder. For a **one-shot** index without the watcher: **`docker compose --profile index run --rm pagefind`** or **`./scripts/docker-index-search.sh`**. **Production** still runs Pagefind once in GitHub Actions after the full build.

## Deployment (GitHub Actions)

Pushes to `master` automatically build and deploy the site via the workflow in
`.github/workflows/pages.yml`. The workflow builds Jekyll first, then builds the Astro arcade section and merges the output into the Jekyll `_site/` before uploading.

### Required one-time repo settings

In the repository **Settings > Pages** section:

1. Set **Source** to **GitHub Actions**.
2. If you use a custom domain, confirm it is listed under **Custom domain**
   and that the `CNAME` file at the repo root contains the correct value.

### Manual deploy

You can also trigger a deploy without pushing code by going to
**Actions > Deploy to GitHub Pages > Run workflow** in the GitHub UI.

## Troubleshooting

- **Port already in use**: change the host-side port mapping in `docker-compose.yml` (e.g. `4400:4000` or `4322:4321`).
- **Gems reinstall every run**: ensure the `bundle_cache` named volume is present; the container now auto-installs missing gems into that cache at startup.
- **Node modules out of date**: run `docker compose down && docker volume rm <project>_arcade_node_modules && docker compose up --build arcade` to force a fresh install.
- **File watching not triggering**: try restarting `docker compose up` and ensure your editor is writing files normally (not via atomic rename-only modes).

## Credits

Blog and visual theme styling in this site are derived in part from [Tale](https://github.com/chesterhow/tale) by [Chester How](https://github.com/chesterhow), licensed under the MIT License.

See `LICENSE-TALE` for the upstream Tale license text covering the imported theme files and derivatives in this repo.
