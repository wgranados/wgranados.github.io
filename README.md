# wgranados.github.io (Jekyll)

This repo is set up to run Jekyll in Docker for local preview/hot-fixing without installing Ruby on your host.

## Local development (Docker)

Build and start the site:

```bash
docker compose up --build
```

Then open:

- `http://localhost:4000`

LiveReload runs on port `35729` and should auto-refresh when you edit files.

Stop:

```bash
docker compose down
```

## Troubleshooting

- **Port already in use**: change the host-side port mapping in `docker-compose.yml` (e.g. `4400:4000`).\n- **Gems reinstall every run**: ensure the `bundle_cache` named volume is present (it caches `/usr/local/bundle`).\n- **File watching not triggering**: try restarting `docker compose up` and ensure your editor is writing files normally (not via atomic rename-only modes).

## Credits

Blog and visual theme styling in this site are derived in part from [Tale](https://github.com/chesterhow/tale) by [Chester How](https://github.com/chesterhow), licensed under the MIT License.

See `LICENSE-TALE` for the upstream Tale license text covering the imported theme files and derivatives in this repo.
