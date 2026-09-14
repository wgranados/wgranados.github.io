#!/usr/bin/env bash
# Compiles the unmodified upstream endoh1.c (IOCCC 2012, by Yusuke Endoh) to
# a WebAssembly module via Emscripten, running inside the emsdk Docker image
# so no local Emscripten install is required.
#
# Output (fluid.mjs / fluid.wasm) is committed to the repo under gen/ since
# the site's CI build (npm install && npm run build in arcade/) has no C
# toolchain — this script only needs to be re-run by hand when endoh1.c or
# the build flags change.
#
# Usage: ./build.sh
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT="$DIR/gen"
mkdir -p "$OUT"

docker run --rm -v "$DIR":/src -u "$(id -u):$(id -g)" -w /src emscripten/emsdk:3.1.64 \
  emcc endoh1.c \
    -DG=1 -DP=4 -DV=8 -D_BSD_SOURCE \
    -O2 \
    -s MODULARIZE=1 \
    -s EXPORT_ES6=1 \
    -s EXPORT_NAME=createFluidModule \
    -s ENVIRONMENT=worker \
    -s INVOKE_RUN=0 \
    -s EXIT_RUNTIME=0 \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s "EXPORTED_RUNTIME_METHODS=['callMain']" \
    -o gen/fluid.mjs

echo "Built $OUT/fluid.mjs + $OUT/fluid.wasm"
