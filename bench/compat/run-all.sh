#!/usr/bin/env bash
# Runs the runtime compatibility probe everywhere (Node, Bun, Deno, local workerd with and without nodejs_compat);
# results/compat.jsonl has one line per (runtime, library). Deno: put it on PATH or set DENO=/path/to/deno.
set -u
cd "$(dirname "$0")" || exit 1
OUT=../results/compat.jsonl
DENO=${DENO:-deno}
{
  node run.mjs
  bun run.mjs
  "$DENO" run --no-prompt --allow-read --node-modules-dir=manual run.mjs
  rm -rf workers
  node run-workerd.mjs
} >"$OUT"
