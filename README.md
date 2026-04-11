# wgranados.github.io (Jekyll + Astro)

This repo contains:

- **Jekyll** — the main site and blog.
- **Astro + React** (`arcade/`) — a statically generated game/experiment section served under `/arcade/`.
- **[Pagefind](https://pagefind.app/)** — static, client-side search for **blog pages only** (`/blog/…` HTML). The search bundle is generated into `_site/pagefind/` at build time; the live UI is the Pagefind **Component UI** (modal) loaded only on blog listing pages (see below).

## Local development (Docker)

Build and start both the Jekyll site and the Astro arcade section:

```bash
docker compose up --build
```

That starts **Jekyll**, **Astro arcade**, and **`pagefind-watch`** (Node). After the first Jekyll output appears, the watcher runs `npm run pagefind`, then watches **`_site/blog/**/*.html`** (debounced) and re-indexes when blog HTML changes. The first index may take a few seconds; in logs, wait for Pagefind to finish, then confirm **`pagefind-watch` is watching** `_site/blog/**/*.html`.

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

#### Where search appears

On the **blog index** (including `/blog/page2/` etc.), **Archive** (`/blog/archive/`), and **Tags** (`/blog/tags/`), the centered toolbar matches the theme’s link row: **Archive · Search · Tags** on the index; **Latest posts · Search · Tags** on the archive page; **Latest posts · Archive · Search** on the tags page. **Search** is a normal link that opens the Pagefind modal via `pagefind-modal.open()` (see `_layouts/default-blog.html`). Individual **posts** only show a **Blog index** link in that row—no search—to keep the layout minimal.

The **`/search/`** path is a short HTML redirect to **`/blog/`** (`search.html`).

**Ctrl+K** / **Cmd+K** also opens the modal on pages that load the bundle (the hidden `<pagefind-modal-trigger>` registers the shortcut).

#### What gets indexed

- **Scope:** Only built HTML under **`blog/`** in `_site` (see `npm run pagefind`, which passes `--glob "blog/**/*.html"`). The rest of the site is not in the index.
- **Output:** Static files under **`_site/pagefind/`** (JS, CSS, WASM chunks). Blog templates load them via `_includes/pagefind-head.html` only when `_includes/blog-pagefind-gate.html` enables it for those routes.

#### Jekyll and `keep_files`

`_config.yml` sets **`keep_files: [pagefind]`** so `jekyll serve` does **not** delete `_site/pagefind/` on each regeneration once it exists. You still need an initial Pagefind run (or `pagefind-watch`) to create that folder.

#### Local indexing (Docker)

- **Recommended:** `docker compose up --build` — includes **`pagefind-watch`** so the blog index stays updated while Jekyll reloads.
- **Skip search in Compose:** `docker compose up site arcade`.
- **Full production-like tree + index (Jekyll + arcade merge + Pagefind):** from repo root:

  ```bash
  ./scripts/docker-index-search.sh
  ```

- **Serve without wiping `pagefind` after a full index** (optional):

  ```bash
  docker compose run --rm -p 4000:4000 site bundle exec jekyll serve \
    --host 0.0.0.0 --port 4000 --skip-initial-build --no-watch
  ```

- **One-shot Pagefind only** (after `_site/` exists):  
  `docker compose --profile index run --rm pagefind`

#### Without Docker

From the repo root, after `bundle exec jekyll build` and (if you want `/arcade/` in `_site`) copying `arcade/dist` into `_site/arcade/`:

```bash
npm ci && npm run pagefind
```

#### Production

GitHub Actions (`.github/workflows/pages.yml`) builds Jekyll, builds the arcade app, merges it into `_site/`, then runs **`npm ci && npm run pagefind`** before uploading the artifact. No extra Pages configuration is required for Pagefind beyond shipping `_site` as usual.

## Deployment (GitHub Actions)

Pushes to `master` automatically build and deploy the site via the workflow in
`.github/workflows/pages.yml`. The workflow builds Jekyll, builds the Astro arcade section, merges `arcade/dist` into `_site/arcade/`, runs **Pagefind** on `_site`, then uploads the full `_site` (including `_site/pagefind/`) to GitHub Pages.

### Required one-time repo settings

In the repository **Settings > Pages** section:

1. Set **Source** to **GitHub Actions**.
2. If you use a custom domain, confirm it is listed under **Custom domain**
   and that the `CNAME` file at the repo root contains the correct value.

### Manual deploy

You can also trigger a deploy without pushing code by going to
**Actions > Deploy to GitHub Pages > Run workflow** in the GitHub UI.

## Contact form (`/contact/`)

Messages are submitted through [Formspree](https://formspree.io/) (no server code on GitHub Pages). Create a form, verify your email, then set `contact_form.formspree_id` in `_config.yml` to the id from your form URL (`https://formspree.io/f/<id>`). Until it is set, the contact page shows setup instructions instead of the form. Submissions redirect to `/contact/thanks/`.

## Troubleshooting

- **Port already in use**: change the host-side port mapping in `docker-compose.yml` (e.g. `4400:4000` or `4322:4321`).
- **Gems reinstall every run**: ensure the `bundle_cache` named volume is present; the container now auto-installs missing gems into that cache at startup.
- **Node modules out of date**: run `docker compose down && docker volume rm <project>_arcade_node_modules && docker compose up --build arcade` to force a fresh install.
- **File watching not triggering**: try restarting `docker compose up` and ensure your editor is writing files normally (not via atomic rename-only modes).
- **`/pagefind/...` 404 in the browser**: run Pagefind once (`pagefind-watch`, `./scripts/docker-index-search.sh`, or `docker compose --profile index run --rm pagefind`). If you are not using Compose with `pagefind-watch`, ensure `keep_files` is set and you re-run Pagefind after a clean `_site` delete.
- **Orphan Compose containers**: e.g. `docker compose down --remove-orphans` if you renamed or removed services.

## Credits

Blog and visual theme styling in this site are derived in part from [Tale](https://github.com/chesterhow/tale) by [Chester How](https://github.com/chesterhow), licensed under the MIT License.

See `LICENSE-TALE` for the upstream Tale license text covering the imported theme files and derivatives in this repo.
