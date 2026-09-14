# Fluid sim (endoh1, IOCCC 2012)

`endoh1.c` is an unmodified copy of the [2012 IOCCC](https://github.com/ioccc-src/winner/tree/master/2012/endoh1)
winning entry by Yusuke Endoh: a fluid simulator (SPH) that renders ASCII-art
frames to a terminal via raw ANSI escapes. `UPSTREAM_README.md` is the
upstream entry's own README, kept for reference. Both are licensed
**CC BY-SA 4.0** (see the upstream repo) — attribution is shown on the
`/arcade/fluid/` page itself.

## How it runs in the browser

`gen/fluid.mjs` + `gen/fluid.wasm` are compiled from `endoh1.c` via
Emscripten (see `build.sh`) and are committed here since the site's CI
(`npm install && npm run build` in `arcade/`) has no C toolchain. Re-run
`./build.sh` (needs Docker) if `endoh1.c` or the build flags ever change.

The compiled program is loaded in `src/game/fluid/fluid.worker.ts`, which:
- feeds a scene's text in as the program's stdin (each non-space character
  becomes a fluid particle; `#` is a solid wall — this is the upstream
  program's own input format, unchanged),
- captures stdout (the ANSI frames) via Emscripten's `print` hook and
  forwards complete frames to the main thread, throttled to ~30fps,
- and is written to a real `xterm.js` terminal in `FluidGame.tsx`, which
  correctly interprets the program's raw ANSI escapes (cursor-home, etc.)
  exactly as a real terminal would.

`main()` in the C source never returns — it loops forever redrawing frames.
`usleep()` is a no-op in this build (no Asyncify), so the simulation runs as
fast as the CPU allows; that's fine since it's confined to a Worker, and the
only way to stop it is `Worker.terminate()` (which `FluidGame.tsx` does on
"Stop" and before starting a new pour).

The input is capped client-side at 2000 characters: the program's particle
array is a fixed-size buffer with no bounds checking (true to the original
obfuscated entry), so unbounded input isn't safe to feed it.
