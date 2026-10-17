# Extension decisions and run notes for the re-run before the next release (protocol-rerun-2.md)

Each part's decision after round 3, taken from its own analysis before any extension. Times are UTC (MDT is UTC minus 6 hours). Candidate: `dist/` built from `src/` at git tree `712d1eb2`. Runtimes: Node.js 26.12.0, Bun 1.4.3.

## Host admission

Each part ran under the shared host lock after a fresh admission check inside the lock (receipts in the author's scratch directory, kept until 2026-11-16). Part A was admitted at 3.19 combined busy cores. Part B was refused 4 times between 20:18 and 20:20 (combined CPU 4.15 and 4.28 busy cores, 2 to 6 zswap page-ins, I/O pressure 243 ms) while an Android emulator and its video stream, owned by another session, were running; no part B process was started in those attempts. After the emulator was stopped at the user's request, part B was admitted at 20:33 (3.7 combined busy cores, no swap activity). The check after each part (run once the part had ended, while the analysis scripts ran) reported 2 to 6 zswap page-ins and, after part A, 4.77 combined busy cores; those windows are outside the timed regions and no figure is adjusted for them. No continuous observer of native Windows CPU ran during the timed regions (see the protocol).

## Swap-free changes and the swap rule

`run-matrix.sh`, `run-memory.sh` and `run-more.sh` record the change in free swap (`swapFreeDeltaKb`) around every process but do not reject on it, and none records the exit status; a process that failed before printing leaves an `error` row (0 here). The declared "swap rejection" was applied at admission (no swap or zswap activity before each part, see above), not per process. Afterwards 50 of the 2,812 rows in `speed-raw`, `speed-more`, `speed-regression` and `memory-raw` carry a nonzero value. Every one is positive (free swap was higher after the process than before, by 4 to 236 kB). This is a net change between two samples: it shows no net swap growth, but it cannot rule out swap being used and freed again during a process, and no collector here records that.

Sensitivity, so the reader does not have to take that on trust: the three analyzers were re-run on copies of these four files without any row that has a nonzero value (`speed-raw` 192 to 180 rows, `speed-more` 500 to 490, `speed-regression` 120 to 116, `memory-raw` 2,000 to 1,976). No verdict changes in any table: every "more", "less", "no clear change", "unsettled" and "wrong signature" stays. The numbers that move are small: the minio-against-sigflint ratio in part A on Node rises by up to 0.23 times (for example 8.39 to 8.62), the Bun regression bands for `bench-download` and `bench-part-put` fall from 54.3% and 73.1% to 45.8% and 63.2%, and a few memory bands move (for example the `bench-body-1k` band in one memory table from 40.9% to 3.0%, with the same labels). The published figures are the ones computed from all rows.

## Part A, S3 header speed matrix (run 2026-10-16 20:11:48 to 20:17:30, 48 processes, 3 rounds, 0 rejected, 0 errors)

Rule: a comparison the README states a result for (sigflint against each other library that signed correctly, per runtime and workload) is unsettled when the min-max ranges overlap or the median gap is at most twice the reporting band.
Result: 0 of 36 unsettled; no extension for part A. The smallest ratio is 2.62 times the time of sigflint.

## Part B, other services, presigned URLs and the regression check (run 2026-10-16 20:33:28 to 20:41:30, 66 processes, 3 rounds, 0 rejected, 0 errors, max machine busy before a process 9%)

Comparisons: sigflint's build against the older one (`frozen/`, 8 cells) and against each other library that signed correctly (38 cells).
Result: unsettled after round 3, so rounds 4 and 5 are run for the whole part (cap 5).
- Regression check, 8 of 8 unsettled (ranges overlap in 7, the eighth has a gap of 7% against a band of 35%).
- Other libraries, 5 of 38 unsettled: Bun `presign-any` against aws4 and smithy, and Bun `presign-s3` against aws4, smithy and minio (bands 112% to 160%).

## Part C, memory (run 2026-10-16 20:49:13 to 21:02:57, 108 processes and 2 calibration, 3 rounds, 0 rejected, 0 errors)

Comparisons: sigflint against each other library, per runtime and workload, for heap allocated per call, collections, GC pause, CPU time, peak RSS and retained heap (the retained-heap comparisons are stated in `docs/benchmarks.md`).
Result: unsettled after round 3, so rounds 4 and 5 are run for the whole part (cap 5).
- Heap allocated per call, collections, GC pause, CPU time: 0 of 36 unsettled in each.
- Peak RSS, 3 of 12 unsettled (Node: `aws4`, `smithy`, `minio`, all "no clear change").
- Retained heap, 7 of 36 unsettled (Bun: `wdl` on three workloads; Node: `aws4fetch`, `aws4`, `wdl` on `bench-encode` and `aws4` on `bench-body-1k`; bands of 3% to 5289%).

Allocation calibration, from `memory-calibration-final.jsonl`: the protocol's gate is the slope of bytes per call against array length (expected 8 bytes per element, within 10%), not the average bytes per element, which includes a fixed cost per call. Node: (17,259 - 3,990) / (2,048 - 512) = 8.64 bytes per element (+8.0%). Bun, from the parsed collector log with the control subtracted: (19,306.7 - 6,569.5) / 1,536 = 8.29 bytes per element (+3.6%). Both pass.

## Part D, import and first signature (run 2026-10-16 21:03:26 to 21:04:27, 378 processes, 3 rounds, 0 rejected, 0 errors)

Comparisons: sigflint against each other library, for import plus client build and import plus first signature, per runtime.
Result: unsettled after round 3, so rounds 4 and 5 are run for the whole part (cap 5).
- Import plus client build, 5 of 12 unsettled (Bun: `aws4`, `wdl`; Node: `aws4fetch`, `aws4`, `wdl`, all "no clear change").
- Import plus first signature, 1 of 12 unsettled (Node: `aws4`, "no clear change").

## Part B after rounds 4 and 5 (extension run 20:42:56 to 20:48:18, 5 rounds, 0 rejected, 0 errors)

Cap reached. Regression check: 8 of 8 still unsettled, so every cell is reported as "no clear change" against the older build. Other libraries: 5 of 38 still unsettled (the same five Bun presigned-URL cells), reported as inconclusive and left out of any ratio claim.

## Parts C and D after rounds 4 and 5

Part C extension: 2026-10-16 21:09:34 to 21:18:50 (9 min 16 s), 5 rounds, 0 rejected, 0 errors. The first launch (21:07) was refused for 24 swap page-ins with CPU (1.47 combined busy cores), memory pressure and I/O pressure all quiet, right after my own analysis scripts had run; the retry after 90 quiet seconds was admitted at 0.82 combined busy cores with no swap activity. The check after the part reported 313 swap page-ins, outside the timed region; no figure is adjusted for it.
Part D extension: 2026-10-16 21:22:35 to 21:23:32 (57 s), 5 rounds, 0 rejected, 0 errors. The first launch (21:20) was refused for I/O pressure of 424 ms (CPU, memory and swap quiet) right after part C's run; the retry after 120 quiet seconds was admitted at 2.69 combined busy cores and 0.9 ms I/O pressure.

Cap reached, so what is still unsettled is reported as "no clear change" (a result, not a claim of equality):
- Heap allocated per call, collections, GC pause and CPU time: 0 of 36 unsettled in each, as at 3 rounds.
- Peak RSS: 3 of 12 unsettled (Node: `aws4`, `smithy`, `minio`).
- Retained heap: 12 of 36 unsettled; all "no clear change".
- Import plus client build: 6 of 12 unsettled (Bun: `aws4`, `aws-sig`, `wdl`; Node: `aws4fetch`, `aws4`, `wdl`); import plus first signature: 1 of 12 (Node: `aws4`).

## Node and Bun pairing and reporting dispositions

The full pairing (every workload, metric and library measured on both runtimes, 165 rows, values rounded to whole units) is in [`rerun-2-node-bun.md`](rerun-2-node-bun.md). A runtime is ahead when its min-max range over the rounds is disjoint from the other's; otherwise the direction of the medians is given and the ranges overlap.

Node ahead (the only rows that need a reporting disposition):
- Same instrument on both runtimes, ranges disjoint (reproduced across the rounds): speed 12 rows (all four S3 header workloads for sigflint's two arms: Bun takes 1.2 to 1.5 times as long, for example 1.60 against 1.35 µs for the plain GET; two presigned-URL workloads for sigflint; `aws4` on three workloads), CPU time per call 9 rows, signing-key cache heap per entry 1 row (341 against 359 bytes), import 3 rows (sigflint, `aws4`, `minio`), import plus first signature 1 row (`minio`).
- Same instrument, ranges overlap (not confirmed): speed 7 rows, CPU time per call 2 rows. The rule asks for more samples alternating the two runtimes, with the order flipped each round, until each is confirmed or shown to be noise. That was not run: the runs here alternate libraries inside one runtime, and extra rounds for a runtime comparison are new measurement that this release preparation does not include.
- Different instruments on the two runtimes (Node counts heap growth between collections, Bun reads the collector log): garbage-collection pause 22 rows, collections 1 row, heap allocated per call 1 row. These stay suspected, with that reason.
- Bun is ahead in the other rows, including every peak-memory row (Bun's process is smaller), all the other heap-allocated and collection-count rows, and 36 further speed rows.

Disposition of every Node-ahead row above: nothing has been reported to oven-sh/bun. For the reproduced rows, a reduced reproduction and a search of open and closed issues are still to do, and then an issue on Bun's Bug Report form; the decision to file is the user's. The unconfirmed rows need the alternating samples first. Until then the Node and Bun comparison is not closed under the rule (`~/chief-of-staff/guidance/node-vs-bun.md`), and the report to the Manager says so.

## Runtime grid (run 2026-10-16 23:46:28 to 23:48:07Z, 1 min 39 s)

The grid of `docs/benchmarks.md` was run again on the release (source tree `712d1eb2`): one S3 GET per library on Node 26.12.0, Bun 1.4.3, Deno 2.9.6 (the official npm package, installed in a scratch directory) and local workerd through wrangler 4.149.0, with and without `nodejs_compat`, each compared with botocore's signature (`bench/compat/run-all.sh`, `results/compat.jsonl`, 45 rows). Before this, the grid in the document dated from 2026-10-13 and from package version 0.1.0 (source tree `99754401`).
Result: sigflint and `sigflint/web` signed correctly everywhere, including workerd with and without `nodejs_compat`. The other libraries' results did not change: `@smithy/signature-v4` with its default hash fails on workerd in both modes (`Hash.bind is not a function`), `aws4` and `minio` do not load on workerd without the flag.
Admission: a first attempt at 17:38 MDT was refused because another session's job held the host lock (not waited for); the retry at 17:46 MDT was admitted at 3.7 combined busy cores with no swap activity. The check after the run read 7.63 combined busy cores (my document regeneration ran in that window, and 5.4 busy cores were on the Windows side); it is outside the run and the grid is a pass/fail check, not a timing.
