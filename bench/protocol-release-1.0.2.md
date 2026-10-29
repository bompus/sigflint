# Release 1.0.2 measurements

Measured 2026-10-29 on source commit `c610c42`, source tree `90a032d5`,
Node 26.12.1 and Bun 1.4.4. Node 26.13.0's release metadata did not identify
an engine change relevant to this cohort. Dependencies and corpora are unchanged.
The built candidate hashes are in `results/release-1.0.2-artifacts.sha256`.
Both built files come from `bun build` 1.4.4, also pinned for CI and publishing.

The existing `protocol-rerun-3.md` admitted-pair plan was declared before the
run: three rounds per part, two more only for unsettled comparisons, cap five;
the same arms, workloads, A/A control, alternation, timing windows, metric
definitions and variation floors. No optional minified timing matrix was run.
The shorter plan initially counted 602 processes including calibration.

Completed rounds:

| Part | Rounds | Counted processes |
|---|--:|--:|
| S3 library speed matrix | 3 | 48 |
| Older pre-split baseline comparison | 5 | 30 |
| Published 1.0.1 baseline comparison | 5 | 30 |
| Other services and presigned URLs | 3 | 48 |
| Allocation, run and signing-key cache | 5 | 180 |
| Import and first signature, seven processes per arm and round | 5 | 630 |
| Allocation calibration, outside claim sample | 1 | 2 |

Total: 968 processes, including the separate published-package comparison and
calibration. Extension decisions are in `results/release-1.0.2/extension-decisions.json`.
Unsettled comparisons at five rounds remain inconclusive; no further rounds
were added. The direct published-package comparison has no clear S3 speed
change. The older pre-split comparison is retained separately and is not a
comparison with the last release.

The existing serial driver is used with task-local artifact/result/lock paths.
A 2 GiB cgroup cap surrounds each serial phase instead of nesting one scope
per child. Each part holds the shared host benchmark lock. Normal priority,
all available CPUs, no affinity restriction. Native Linux admission runs
before and after each pair (each import round); a continuous process-tree and
cgroup observer additionally checks competing CPU, memory and I/O pressure,
swap activity, OOM and memory-limit events. Accepted phases passed those
checks. Observer cost is retained without claiming negligible overhead.
No Windows-side measurement applies on this native Linux host.

An interrupted older-baseline extension had no complete continuous-observer
receipt and supplies no accepted extension rows. A subsequent attempt had an
unadmitted errored unit and was stopped. Both attempts remain retained outside
the accepted sample; the clean final extension supplies rounds four and five.
Raw exclusions and admission receipts are kept in the release result directory
and the private release custody record. Historical results are not pooled.

S3 screens and the full test suite check correctness outside timing; a
wrong-result competitor row is retained and not timed. Runtime compatibility
and extended-corpus comparison evidence remains labelled with its historical
cohort. The release makes no new live-service or cross-runtime compatibility
claim from timing alone.

`results/release-1.0.2/node-bun-pairing.md` pairs every shared runtime metric.
Different allocation/GC instruments remain non-comparable. Existing CPU
warm-up observations and unresolved upstream-reporting work remain explicit;
this release adds no profiling, reduced-reproduction or upstream submission
campaign.

Reproduction uses the existing `run-admitted.sh`, `analyze.mjs`,
`analyze-more.mjs`, `analyze-memory.mjs`, `pair-node-bun.mjs`, `sizes.mjs`,
`tiers.mjs`, `make-assets.mjs` and `make-memory-assets.mjs`. The host admission
command and continuous observer are external to this public repository.
