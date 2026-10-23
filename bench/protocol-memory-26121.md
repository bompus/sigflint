# Protocol: memory and import re-run on Node.js 26.12.1

Declared 2026-10-23, before the counted run.

Question: does Node.js 26.12.1, which reverted the change that loaded most ES modules synchronously, move sigflint's memory per call or its import cost? The memory and import figures in `results/memory-report.md` were measured on Node.js 26.12.0 with Bun 1.4.3.

Candidate: the same hashed build as `protocol-rerun-3.md`, `dist/node.js` (`439a387d`) and `dist/bun.js` (`21a8a862`), read from a copy whose `SHA256SUMS` the driver checks first. Nothing about the code, the other libraries (`frozen/versions.txt`), the workloads, the arms, the rejection rules or the variation criterion changes. Only the Node.js version does.

Runtimes: Node.js 26.12.1 and Bun 1.4.3. Bun 1.4.4 is the installed version on the host now; the Bun 1.4.3 binary kept by Bun's own `previous` slot is copied aside and put first on `PATH` for the run, so the Bun control is the same version as before and a change in a Node figure is not a Bun change. Nothing on the host is upgraded or downgraded.

Parts: C (allocation, GC, CPU, retained growth, peak RSS, signing-key cache, with the allocation calibration first) and D (import + client build and import + first signature), both driven by `run-admitted.sh` as in `protocol-rerun-3.md`: admitted pairs, a host check before the first unit and after every unit, the shared host lock held while measuring, normal priority, all CPUs. The rounds are 5 from the start (the earlier run reached its cap of 5), so there is no extension step. Each part's results are read as one run.

What is compared: this run against the 26.12.0 run, per arm, runtime, workload and metric, with the criterion of `memory-protocol.md` (the larger of the relative floor and twice the larger A/A range, the absolute floor, and non-overlapping ranges). A Node figure that moves outside its band is reported as moved; one that stays inside is reported as no clear change. The Bun figures are the control: they should not move.

Node against Bun: every pair of a metric measured with the same instrument on both runtimes (CPU per call, peak RSS, import time) is paired again with `pair-node-bun.mjs`, and a Node-ahead pair that is new since the 26.12.0 run is listed for the maintainer's decision. Nothing is filed from this run.

Limits: unchanged from `protocol-rerun-3.md`. The host also runs installs of other work; admission is by the host check, and a part that cannot be admitted waits for the lock and for a quiet host rather than measuring through load.

The 26.12.0 figures it is compared with are `results/memory-summary.json` at commit `171d3d5`; `compare-memory-runs.mjs` writes `results/memory-26121-vs-26120.md` from the two summaries.
