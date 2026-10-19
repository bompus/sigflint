# Protocol: sigflint bundled and minified

Declared before any counted run (2026-10-19). The runs happen at the next release re-run, after that run's own parts, on the same `src/` and in the same session; until then there are no figures for this scenario, and nothing in the README or `docs/benchmarks.md` depends on it.

## Question

Does an application that bundles and minifies sigflint sign or start differently from one that loads the shipped, unminified `dist/`? The size tables in `docs/benchmarks.md` are already bundled and minified for every library; the speed, memory and import figures are measured on `dist/` as shipped. A pilot on 2026-10-18 (`bun build src/node.js`, Node import and first signature, 3 rounds of 60 processes, not admitted-pair) found no clear speed difference and about 0.2 to 0.3 MiB less peak memory when minified; this run checks the speed and cold-start part of that under the release re-run's rules.

## Builds

`bench/build-minified.sh <dir>` builds, from the checkout's `src/`, `<dir>/shipped` (the `npm run build` commands: `bun build --target=node` for `node.js`, `--target=bun` for `bun.js`) and `<dir>/minified` (the same commands with `--minify`). Each directory holds `node.js`, `bun.js`, a `package.json` with `"type": "module"` (so Node does not parse the files twice; see `memory-protocol.md`) and a `SHA256SUMS`; the script prints the `src/` git tree and the Bun version. Record both in the results directory before the first run. If `src/` changes before the record, the run is void.

## Parts

Results go to `results/minified/`, apart from the release figures. Host admission, the busy gate and its retries, the lock, rounds (3, then 4 and 5 for a whole part only when a comparison is unsettled after round 3, cap 5), normal priority and all CPUs are those of `protocol-rerun-3.md`, unchanged.

- **Speed.** `BASE=<dir>/shipped RESULTS=results/minified ADMIT=… run-admitted.sh R <dir>/minified`. Arm `frozen` is the shipped build here (part R's baseline arm keeps its name); `final-1` and `final-2` are the minified build twice, the A/A control. Workloads: the four of `speed.mjs`. Summary: `RESULTS=results/minified node analyze-more.mjs` (part A only). Band: the larger of 3% and twice the A/A spread, as in `protocol-more.md`.
- **Import and first signature.** Part D twice, back to back: `RESULTS=results/minified/shipped … run-admitted.sh D <dir>/shipped`, then `RESULTS=results/minified/minified … run-admitted.sh D <dir>/minified`. Only the `sigflint-A` and `sigflint-B` rows are compared; each run's other libraries and its `none` control check that the two runs saw the same host. Summary: `node analyze-memory.mjs <raw.jsonl> <summary.json>` for each run. A difference is clear only outside the larger of the two runs' bands for import and first signature (3%, 1 ms floor, `memory-protocol.md`).
- **Size.** The bytes of both builds, raw, gzip and brotli, from the build itself (bytes do not depend on the host).

Peak memory is not part of this run: the pilot's difference is inside the 2 MiB floor `memory-protocol.md` uses for peak RSS.

## Limits

The two import runs are not paired, so load that changes between them shows as a difference; the `none` control and the other libraries' rows are how that would be seen, not a guarantee. The speed part is paired within each unit as `protocol-rerun-3.md` describes. One Bun version builds both directories; another Bun version could minify differently.

## Claim status

A new comparison, not a correction of any published figure. A difference inside the band is reported as "no clear change". Whether any result goes into `docs/benchmarks.md` is the maintainer's decision after the run.
