# Memory and import re-run on Node.js 26.12.1: notes

Protocol: [`../protocol-memory-26121.md`](../protocol-memory-26121.md). Times are UTC (MDT is UTC minus 6 hours). Candidate: the same hashed `dist/` build as the run on Node.js 26.12.0 (`more-artifacts.sha256`). Runtimes: Node.js 26.12.1 and Bun 1.4.3.

## Run

- Parts C and D of `run-admitted.sh`, 5 rounds each, 2026-10-23. The host was not admitted for the first 38 minutes (combined CPU above 4 busy cores from other work on the host); the driver waited for the lock and a quiet host and started measuring at 17:38:24, part C finished 18:13:02 and part D 18:19:14.
- 45 units admitted (40 in part C, 5 in part D), 0 rejected rows, 0 errors, the analysis reports 2,000 rows, 1,750 accepted, none rejected or errored (the same counts as on Node.js 26.12.0). Two units were refused once by the check around them and measured again, each admitted the second time (`C-r4-aws-sig`, `D-r1-round`); the refused attempt is in `memory-26121-not-admitted.jsonl`, the receipts of all 82 host checks in `memory-26121-admission.jsonl`.
- Allocation calibration, taken at the start of part C on these runtimes: Node 8.64 B per element (+8.0%), Bun about 8.32 (+4.0%), inside the 10% the protocol allows and the same as on Node 26.12.0.
- The Bun binary is the 1.4.3 build that Bun keeps in its `previous` slot, copied aside and put first on `PATH`; the host's `bun` is now 1.4.4.

## Result

Compared with the run on Node.js 26.12.0 (`memory-26121-vs-26120.md`: one comparison per library, workload and runtime, so 52 for each per-workload metric, 16 for peak memory, import and import plus first signature, and 4 for the cache):

- Node: no figure moved outside its band. Heap allocated per call, collections, GC pause, CPU per call, retained heap, peak memory, bytes per cached key, import and import plus first signature are all "no clear change". For sigflint on Node, heap allocated per call is byte for byte the same (2,625, 4,048, 5,632 and 4,130 B for the four workloads); import plus client is 1.25 ms against 1.15 ms and import plus first signature 2.54 ms against 2.43 ms, both inside their bands.
- Bun (the control): allocation, collections, GC pause, CPU per call, retained heap, cache, import and first signature did not move. Peak memory moved down for every library, by 5% to 7% (sigflint 64.9 to 60.9 MiB). Bun 1.4.3 did not change, so this is not the runtime version. A repeat of three sigflint processes on the same 1.4.3 binary after the run gave 60.2 to 61.7 MiB, so the lower reading is stable on this host now; its cause is not known (the host, kernel or the page cache of the binary are candidates; nothing was changed on purpose). It does not touch the Node comparison: Node's peak memory did not move.
- The tables and charts in `docs/benchmarks.md` and `memory-report.md` are regenerated from this run; the prose figures that changed are updated.

## Not counted

A one-off check of three sigflint processes on the host's current Bun 1.4.4 (the same file, run mode, not admitted, not part of any claim) gave a peak memory of 70.1 to 70.8 MiB against 60.2 to 61.7 MiB on 1.4.3. It is a lead for the Bun comparison, not a result: it was not measured under the protocol, and nothing is filed from it.

## Node against Bun

`rerun-3-node-bun.md` has its C/D rows replaced with the pairing of this run (`node pair-node-bun.mjs results <out> results/rerun-3-node-bun.md`, with the earlier table named so that the "was ..." texts compare with the 26.12.0 rows), spliced into the committed table by hand, and one sentence added to its header (the pairing now shows two decimals for values under 100, so ranges of CPU and time rows can be read; the A and B rows are unchanged by that); the A and B rows are those of the run on Node.js 26.12.0. Ten C/D verdicts changed. Six are rows where Bun was ahead in both runs (CPU per call: `wdl` on part-put, `aws4fetch` on encode and the 1 KiB body, `minio` on the 1 KiB body; import: `aws-sig`, `wdl`). The four that involve Node being ahead in one of the runs:

- `cpuUs` `bench-download` `aws-sig`: was Bun ahead (ranges overlap), now Node ahead in the median with overlapping ranges. Needs alternating samples before it is a gap or noise.
- `cpuUs` `bench-body-1k` `aws4`: was Node ahead in the median with overlapping ranges, now Node ahead with disjoint ranges. One disjoint run after an overlapping one is not a reproduced gap by the rule of `rerun-3-notes.md`; it has no disposition yet.
- `cpuUs` `bench-body-1k` `smithy`: was Node ahead with disjoint ranges, now overlapping.
- `firstMs` sigflint: was Node ahead in the median with overlapping ranges, now Bun ahead.

Nothing has been filed, edited or commented on at oven-sh/bun from this run, and the Node-against-Bun comparison stays open as before.
