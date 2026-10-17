# Extension decisions and run notes for the re-run with a host check around every pair (protocol-rerun-3.md)

Each part's decision after round 3, taken from its own analysis before any extension. Times are UTC (MDT is UTC minus 6 hours). Candidate: `dist/` built from `src/` at git tree `712d1eb2`, the same hashed build as `protocol-rerun-2.md`. Runtimes: Node.js 26.12.0, Bun 1.4.3. The raw results of the earlier run, which used the per-process Linux CPU gate and one host check around each part, are in `rerun-2-per-process-gate/` and are not pooled with these.

## Part A, S3 header speed matrix (run 2026-10-17 07:04:04 to 07:17:28, 48 processes in 24 units, 3 rounds, 0 rejected, 0 errors)

Rule: a comparison the README states a result for (sigflint against each other library that signed correctly, per runtime and workload) is unsettled when the min-max ranges overlap or the median gap is at most twice the reporting band.
Result: 0 of 36 unsettled; no extension for part A. The smallest ratio is 2.73 times the time of sigflint (Node, `aws4`, `bench-body-1k`). The eight sigflint-against-sigflint comparisons (the noise control) are not claims.

## Parts R and B, regression check and other services and presigned URLs (R: 2026-10-17 07:17:28 to 07:24:12, B: 07:24:12 to 07:38:55; 3 rounds, 0 rejected, 0 errors)

Comparisons: sigflint's build against the older one (`frozen/`, 8 cells) and against each other library that signed correctly (38 cells).
Result: unsettled after round 3, so rounds 4 and 5 are run for both parts (they are one part in `protocol-more.md`; cap 5).
- Regression check, 8 of 8 unsettled (ranges overlap in 6, and in the other 2 the gap of 4% to 5% is inside twice the band of 4% to 6%).
- Other libraries, 3 of 38 unsettled: Bun `presign-s3` against `aws4`, `smithy` and `minio` (band 108%).

## Part C, memory (run 2026-10-17 07:38:55 to 07:58:46, 108 processes and 2 calibration, 24 units, 3 rounds, 0 rejected, 0 errors)

Comparisons: sigflint against each other library, per runtime and workload, for heap allocated per call, collections, GC pause, CPU time, peak RSS and retained heap, counted by `node unsettled-memory.mjs` (ranges overlap, or median gap at most twice the band).
Result: unsettled after round 3, so rounds 4 and 5 are run for the whole part (cap 5).
- Heap allocated per call, collections, GC pause, CPU time: 0 of 36 unsettled in each.
- Peak RSS: 4 of 12 unsettled (Node: `aws4`, `smithy`, `minio`; Bun: `aws4fetch`).
- Retained heap: 35 of 36 unsettled by this rule (bands of 3% to 453%; most differences are inside the absolute floor of 64 KiB).
The count of unsettled retained-heap, import and peak-RSS comparisons in `rerun-2-notes.md` came from a script that was not kept and is not reproduced by `unsettled-memory.mjs`; this run's counts are all from the kept script.

## Part D, import and first signature (run 2026-10-17 07:58:46 to 08:01:37, 378 processes in 3 units, 3 rounds, 0 rejected, 0 errors)

Comparisons: sigflint against each other library, for import plus client build and import plus first signature, per runtime.
Result: unsettled after round 3, so rounds 4 and 5 are run for the whole part (cap 5).
- Import plus client build, 8 of 12 unsettled (Node: `aws4fetch`, `aws4`, `aws-sig`, `wdl`; Bun: the same four).
- Import plus first signature, 4 of 12 unsettled (Node: `aws4`; Bun: `aws4fetch`, `aws4`, `aws-sig`).

## Parts R and B after rounds 4 and 5 (R: 2026-10-17 08:01:38 to 08:04:52, B: 08:04:52 to 08:14:00; 5 rounds, 0 rejected, 0 errors)

Cap reached. Regression check: 8 of 8 still unsettled, so every cell is reported as "no clear change" against the older build (the Node `bench-part-put` difference of 5.4% equals its band). Other libraries: 5 of 38 still unsettled, all on Bun presigned URLs: `aws4` and `smithy` on both presigned-URL requests and `minio` on the S3 one. They are reported as inconclusive and left out of any ratio claim.

## Parts C and D after rounds 4 and 5 (C: 2026-10-17 08:14:03 to 08:27:20, D: 08:27:22 to 08:28:59; 5 rounds, 0 rejected, 0 errors)

Cap reached. Counted by `node unsettled-memory.mjs results/memory-summary.json` over the 5 rounds: heap allocated per call, collections and CPU time 0 of 36 unsettled each; GC pause 1 of 36 (Bun `bench-part-put`, `aws4`); peak RSS 4 of 12; retained heap 35 of 36 (the absolute floor of 64 KiB is wider than most gaps; one comparison is settled and clear, `aws4fetch` on Node for the plain GET; `wdl` there has a gap outside its band but within twice the band, so it counts as unsettled); import plus client build 8 of 12; import plus first signature 4 of 12. `analyze-memory.mjs` applies the rule (a field `unsettled` on every comparison): an unsettled comparison is reported as no clear change and is not a claim, which removed the multiplier from Bun peak memory for `aws4fetch` and from Bun import plus first signature for `aws-sig`. The same rule gives 34 of 36 retained, 3 of 12 peak RSS, 8 of 12 import and 4 of 12 first-signature unsettled for the 2026-10-16 data after 5 rounds.

Allocation calibration (start of part C, a known allocator of 512 B and 2048 B per call): Node slope 8.64 against the true value, +8.0%; Bun about 8.32, +3.9%, both inside the 10% the protocol allows. `memory-calibration-final.jsonl` has the rows.

## Host checks and units

Every unit (one library in one round, Node and Bun back to back) was bracketed by host checks (`rerun-3-admission.jsonl`; `node admission-summary.mjs` prints this table). The host check itself is not in this repository.

| part | units admitted | units refused | checks | checks refused | refusal reasons | combined busy cores of admitting checks (min, median, max) | worst memory / I/O pressure of admitting checks (ms) |
|---|--:|--:|--:|--:|---|---|---|
| A | 24 | 1 | 28 | 2 | io full PSI above 100 ms (1); memory full PSI above 10 ms (1) | 0.7, 1.07, 2.17 | 9.6 / 35.8 |
| R | 15 | 1 | 20 | 2 | io full PSI above 100 ms (1); combined CPU above 4 busy cores (1); memory full PSI above 10 ms (1) | 0.59, 1.33, 3.7 | 3.6 / 26.6 |
| B | 40 | 1 | 44 | 1 | combined CPU above 4 busy cores (1) | 0.48, 1.11, 2.86 | 0.8 / 84.6 |
| C | 40 | 0 | 42 | 0 | none | 0.49, 1.05, 2.6 | 0.0 / 36.1 |
| D | 5 | 0 | 7 | 0 | none | 0.78, 1.23, 2.79 | 0.2 / 15.3 |

Three units were refused once and measured again, each time with both checks passing the second time: `A-r3-minio` (the check after it saw I/O pressure above the limit), `R-r1-final-1` and `B-r2-final-1` (see `rerun-3-admission.jsonl` for the check numbers). Their 36 process rows are in `rerun-3-not-admitted.jsonl` and are not in any figure. 124 units counted (A 24, R 15, B 40, C 40, D 5). No process was rejected by the per-process Linux busy gate or ended in error.

Lock windows (UTC, 2026-10-17): A 07:04:04 to 07:17:28, R 07:17:28 to 07:24:12, B 07:24:12 to 07:38:55, C 07:38:55 to 07:58:46, D 07:58:46 to 08:01:37, R rounds 4 and 5 08:01:38 to 08:04:52, B rounds 4 and 5 08:04:52 to 08:14:00, C rounds 4 and 5 08:14:03 to 08:27:20, D rounds 4 and 5 08:27:22 to 08:28:59. The lock was held for the timed runs only and given up between parts.

Part B pools sigflint's two copies (`final-1`, `final-2`) as one library in the pairing, where the earlier pairing used `final-1` alone; the speed tables of `docs/benchmarks.md` are unchanged by that.

What the gate watched: the per-process gate still looks at Linux CPU only. This run added a host check of Linux and Windows CPU, memory and I/O pressure and swap activity around every unit. Load that begins and ends between two checks is still not seen.

## Node and Bun pairing and open rows

The full pairing is in [`rerun-3-node-bun.md`](rerun-3-node-bun.md) (`node pair-node-bun.mjs`; 165 rows, values rounded to whole units). Counts: Node ahead with disjoint ranges 49, Node ahead with overlapping ranges 12, Bun ahead disjoint 90, Bun ahead with overlapping ranges 14. The earlier pairing (`rerun-2-node-bun.md`) had Bun's wall-clock times higher; for the plain S3 GET with sigflint, Bun took 1,600 ns against Node's 1,352 ns then (18% more) and 1,378 against 1,313 ns now (5% more, ranges overlap).

Nothing was filed, edited or commented on at oven-sh/bun from this run. Under the reporting rule for Node-against-Bun differences the comparison is open: an in-band Node-ahead row needs alternating samples until it is confirmed or shown to be noise, and nothing is closed until every required report is submitted or the user defers it.

Rows whose class changed from the earlier pairing, or that lost the earlier alternating-sample support, are marked "no disposition yet" (nine rows):
- Weaker, disjoint to overlap: S3 download sigflint (Node 1,313, Bun 1,378 ns); S3 part upload `aws4` (6,658 and 8,036 ns); CPU time per call, part upload, `smithy` (15 and 16 µs).
- Stronger, overlap to disjoint: presigned URL (S3) `smithy` (12,339 and 12,765 ns); CPU time per call, 1 KiB body, `smithy` (16 and 18 µs).
- Direction changed to Node ahead in the median, ranges overlapping: presigned URL (S3) `aws4` (was Bun ahead); first signature, sigflint (was Bun ahead; 2 ms against 2 ms rounded).
- Still Node ahead with overlap, but the earlier alternating-sample confirmation is not carried over: presigned URL (any) `aws4` and `smithy`.

All 12 rows where Node is ahead with overlapping ranges are open in the same way. The next step for these is a decision for the user: follow-up alternating samples for the in-band rows, and whether any row changes what oven-sh/bun#45627 or #45700 say. The 23 Node-ahead rows with disjoint ranges that were report-ready before keep their earlier disposition; the 24 rows on different instruments stay suspected only.
