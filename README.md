# wgranados.github.io (Jekyll)

This repo is set up to run Jekyll in Docker for local preview/hot-fixing without installing Ruby on your host.

## Local development (Docker)

Build and start the site:

```bash
docker compose up --build
```

On the first run after a clean Docker volume, the container may spend a little extra time installing gems into the shared Bundler cache before Jekyll starts.

Then open:

- `http://localhost:4000`

LiveReload runs on port `35729` and should auto-refresh when you edit files.

Stop:

```bash
docker compose down
```

## Deployment (GitHub Actions)

Pushes to `master` automatically build and deploy the site via the workflow in
`.github/workflows/pages.yml`.

### Required one-time repo settings

In the repository **Settings > Pages** section:

1. Set **Source** to **GitHub Actions**.
2. If you use a custom domain, confirm it is listed under **Custom domain**
   and that the `CNAME` file at the repo root contains the correct value.

### Manual deploy

You can also trigger a deploy without pushing code by going to
**Actions > Deploy to GitHub Pages > Run workflow** in the GitHub UI.

## Troubleshooting

- **Port already in use**: change the host-side port mapping in `docker-compose.yml` (e.g. `4400:4000`).
- **Gems reinstall every run**: ensure the `bundle_cache` named volume is present; the container now auto-installs missing gems into that cache at startup.
- **File watching not triggering**: try restarting `docker compose up` and ensure your editor is writing files normally (not via atomic rename-only modes).

## Credits

Blog and visual theme styling in this site are derived in part from [Tale](https://github.com/chesterhow/tale) by [Chester How](https://github.com/chesterhow), licensed under the MIT License.

See `LICENSE-TALE` for the upstream Tale license text covering the imported theme files and derivatives in this repo.
