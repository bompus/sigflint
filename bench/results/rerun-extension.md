# Extension decisions (protocol-rerun.md)

Each part's decision after round 3, taken from its own analysis before any extension.

## Part A, S3 header speed matrix (run 2026-10-14 18:59:12 to 19:04:57 MDT, 48 processes, 3 rounds, 0 rejected, max machine busy before a process 16%)

Rule: a comparison the README states a result for (sigflint against each other library that signed correctly, per runtime and workload: 36 comparisons) is unsettled when the min-max ranges overlap or the median gap is at most twice the reporting band.
Result: 0 of 36 unsettled. No range overlaps; the smallest gap is 2.64 times the time of sigflint, against bands of 8.7% to 63.7% (the A/A control gaps are 0.7% to 19.4%, inside their bands). No extension for part A. Ratio range on this matrix: 2.64 to 507 times.

## Part B, other services, presigned URLs and the regression check (run 2026-10-14 19:06:10 to 19:14:28 MDT, 66 processes, 3 rounds, 0 rejected, 0 errors, max machine busy before a process 18%)

Rule as above, comparisons: sigflint's new build against the older one (`frozen/`, 8 cells) and against each other library that signed correctly (38 cells).
Result: unsettled after round 3, so rounds 4 and 5 are run for the whole part (cap 5).
- Regression check, 8 of 8 unsettled: the new build is 4% to 7% slower than the older one on Node (bands 6% to 22%, ranges do not overlap on Node download and the other three, but the gap is inside twice the band) and inside the noise on Bun (ranges overlap; bands 19% to 47%).
- Other libraries, 2 of 38 unsettled: Bun `presign-s3` against aws4 (12.05 vs 5.09 microseconds, gap 137%, band 85%) and against minio (9.36 vs 5.09, gap 84%, band 85%). The other 36 are clear.

### Part B after the extension (rounds 4 and 5, run 2026-10-14 19:15:40 to 19:21:02 MDT, cap reached: 5 rounds)

120 regression rows and 500 other-services rows over rounds 1 to 5, 0 rejected, 0 errors, max machine busy before a process 18%, no swap.
- Regression check: all 8 cells are "no clear change" at 5 rounds (Node: +3.9% to +5.6% against bands of 8.8% to 22.0%; Bun: +0.3% to +5.1% against bands of 31.5% to 51.7%). The Node point estimates are a few percent slower than the older build and stay inside the noise; they are reported as such, not as "equal".
- Other libraries: 34 of 38 comparisons are clear with a gap above twice the band and disjoint ranges. 4 Bun presigned-URL cells stay near their wide bands (85% to 101%, from the A/A control): presign-any against aws4 and smithy, presign-s3 against aws4: gap above the band and ranges disjoint, so clear but near the noise; presign-s3 against minio (9.25 against 5.09 microseconds, 82% gap, band 85%): inconclusive, reported as no clear change.

## Part D, import and first signature (run 2026-10-14 19:21:46 to 19:23:06 MDT, 378 processes, 3 rounds x 7 fresh processes per arm, 0 rejected, 0 errors)

Rule as above, comparisons: sigflint against each other library, per runtime, for import and for import plus first signature.
Result: unsettled after round 3, so rounds 4 and 5 are run (cap 5). On Node, import alone is "no clear change" against aws4fetch, aws4 and wdl, while import plus first signature is clear against all six. On Bun, import alone is "no clear change" against aws4fetch (which is lower than sigflint), aws4, aws-sig and wdl, and import plus first signature against aws4fetch and aws4. smithy and minio are clear everywhere.

## Part C, memory: allocation, GC / CPU, peak RSS, key-cache retention (run 2026-10-14 19:53:39 to 20:06:49 MDT, 108 counted processes and 12 calibration, 3 rounds, 0 rejected, 0 errors)

Rule as above, comparisons: sigflint against each other library, per runtime and workload, for each metric (library rows that returned a wrong result on a workload are left out, as before).
Result by metric after round 3:
- Settled, no extension needed on their own: heap bytes allocated per call, GC count and GC time, CPU time per call (all 0 unsettled; ratios 1.6 to 247 times).
- Unsettled: peak RSS on Node against aws4, smithy and minio (ranges overlap, gap 0% to 1% against a 3.5% band), and retained heap per 10,000 calls (second pass, forced GC): 34 of 36 comparisons have overlapping ranges or a gap inside twice the band. For retained heap the claim in `docs/benchmarks.md` is a null result ("no library showed a clear growth") plus one stated exception (`aws4fetch` and `@wdl-dev/aws-sigv4` on Node, plain GET, which is "more" and clear at 3 rounds).
- The import and first-signature cells in the same summary come from part D and are extended there.

Decision: unsettled after round 3, so rounds 4 and 5 are run for the whole part (cap 5), as its own lock hold.

### Part C after the extension (rounds 4 and 5, run 2026-10-14 20:18:32 to 20:27:18 MDT, cap reached: 5 rounds)

548 more rows, 0 rejected, 0 errors (1,748 rows over rounds 1 to 5 in `memory-raw.jsonl`, including part D's import rows so far).
- Clear at 5 rounds: heap bytes allocated per call, GC count, GC time and CPU time per call (36 of 36 comparisons each); peak RSS 9 of 12.
- No clear change at 5 rounds: peak RSS on Node against aws4, smithy and minio (ranges overlap), reported as no clear change; retained heap per 10,000 calls, second pass: 34 of 36 comparisons (ranges overlap or gap inside the band), the two clear ones being `aws4fetch` (6.3 times) and `@wdl-dev/aws-sigv4` (3.7 times) on Node, plain GET, the exception the memory section already states. Retention is reported as "no clear growth shown", not as equal.

### Part D after the extension (rounds 4 and 5, run 2026-10-14 20:29:32 to 20:30:25 MDT, cap reached: 5 rounds)

252 more processes (630 import processes in all: 5 rounds x 7 fresh processes x 9 arm-and-baseline slots x 2 runtimes), 0 rejected, 0 errors.
- Import plus first signature: Node, sigflint 2.19 ms, clear against all six libraries (1.5 to 7.9 times); Bun, 2.23 ms, clear against smithy, aws-sig, wdl and minio (1.9 to 8.3 times), and no clear change against `aws4fetch` (1.30 times) and `aws4` (1.34 times).
- Import alone: no clear change against `aws4fetch`, `aws4` and `wdl` on Node and against `aws4fetch`, `aws4`, `aws-sig` and `wdl` on Bun (on Bun `aws4fetch` and `wdl` point lower than sigflint); clear against smithy and minio on both, and against `aws-sig` on Node. These cells stay at no clear change at the cap and are reported that way.
