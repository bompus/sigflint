#!/bin/bash
# The two builds protocol-minified.md compares, from the src/ of this checkout:
#   <out>/shipped   dist/ as `npm run build` makes it (bun build, unminified), the build the package ships
#   <out>/minified  the same bun build with --minify, as an application that bundles and minifies sigflint would load it
# Each directory gets node.js, bun.js and SHA256SUMS, the layout run-admitted.sh reads, plus a package.json that marks them as ES modules,
# so Node loads them as bench/frozen/ is loaded instead of parsing them twice.
# Usage: build-minified.sh <out dir>
set -euo pipefail
OUT=${1:?out dir}
ROOT=$(cd "$(dirname "$0")/.." && pwd)
for variant in shipped minified; do
  flags=()
  [ "$variant" = minified ] && flags=(--minify)
  mkdir -p "$OUT/$variant"
  bun build "$ROOT/src/node.js" --target=node "${flags[@]}" --outfile="$OUT/$variant/node.js"
  bun build "$ROOT/src/bun.js" --target=bun "${flags[@]}" --outfile="$OUT/$variant/bun.js"
  echo '{ "type": "module" }' >"$OUT/$variant/package.json"
  (cd "$OUT/$variant" && sha256sum node.js bun.js package.json >SHA256SUMS)
done
echo "src tree $(git -C "$ROOT" rev-parse HEAD:src), bun $(bun --version)"
