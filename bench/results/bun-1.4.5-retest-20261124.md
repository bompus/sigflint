# Bun 1.4.5 retest of the nine in-band rows, 2026-11-24

`rerun-2-node-bun.md` lists nine rows where Node was ahead in the median but the Node and Bun ranges overlapped. `rerun-2-alternating.md` took more alternating samples for them (Bun 1.4.3, Node 26.12.0). This note repeats those nine rows on Bun 1.4.5 against Node 26.13.1, both measured in one window. It is a new dated record: `rerun-2-node-bun.md`, `rerun-2-alternating.md` and the other earlier results are not edited.

Result: on Bun 1.4.5 no row has Node ahead. All nine rows have Bun ahead, with the Node and Bun ranges disjoint, and Bun was faster in every pair.

## What was run

- **Candidate:** the published `sigflint` 1.0.5 files `dist/node.js` (`7153026d`) and `dist/bun.js` (`69009b47`), taken from the npm package. Their hashes equal `release-1.0.4-artifacts.sha256`, the files the 1.0.4 and 1.0.5 records measured. Not the build of `rerun-2` (`439a387d` and `21a8a862`).
- **Runtimes:** Node v26.13.1, Bun 1.4.5 (`a7733435c`), both from `PATH` and recorded in every raw row.
- **Libraries and runner:** `bench/package.json` and `bench/bun.lock` at the commit that was `origin/main` that day (`def5cd6`); `@smithy/signature-v4` was 5.7.5 (`rerun-2` had 5.7.4), `aws4` 1.13.2, `tinybench` 6.2.2 through `bench/timing.mjs`. `WINDOW_S=1` and `WARMUP_MS=300` (the defaults, the conditions of `rerun-2`).
- **Harness:** `bench/run-campaign.sh` over `bench/run-admitted.sh`, three campaigns of five rounds each: part A with `ARMS_LIST="aws4 sigflint-B"`, part B with `ARMS_LIST="aws4 smithy"` (the two sigflint controls `final-1` and `final-2` always run) and part C with `ARMS_LIST="aws4 smithy"`. `ADMIT="python3 bench/admit-native-linux.py"`, `OBSERVER="python3 bench/observe-unit.py --workload-cgroup auto"` (the re-vendored copy, see `observer-revendor-20261106.md`), `DEADLINE_S=14400`. Each unit is one library in one round measured under Node and then Bun (Node first in odd rounds, Bun first in even rounds), through the host lock, with a host admission check before and after every unit and the continuous observer.
- **Not used:** `check-freeze.mjs` (it stops on the deleted `bench/package-lock.json`); the artifact hashes, `bench/bun.lock` and `bench/package.json` hashes, the commit and the tool versions were recorded instead.
- **Plan fixed before the first counted run:** five admitted rounds per row; a row is Node-better when the ranges are disjoint with Node lower (or Node is lower in every pair, at least four, with overlapping ranges), Bun-better in the mirror case, and equal otherwise.
- **Host:** shared native Linux, 24 logical CPUs, about 0.1 busy cores when the campaign started. 09:12 to 09:43 MST. 40 units were admitted (A 10, B 20, C 10). Two units were refused by the observer for host pressure (`A-r1-sigflint-B`, `B-r1-final-1`) and run again; 85 admission checks admitted and 2 refused (one memory full pressure over 10 ms, one I/O full pressure over 100 ms). No unit was left unmeasured.

## Rows

Bun over Node is Bun's median divided by Node's, minus one. Units: ns per call for the speed rows, CPU µs per call for the two `cpuUs` rows. "Before" is `rerun-2-alternating.md` (Node 26.12.0, Bun 1.4.3, the `rerun-2` build): Node, Bun, and Bun over Node.

| row | Node 26.13.1 median (min-max) | Bun 1.4.5 median (min-max) | Bun over Node | before | verdict now |
|---|---|---|--:|---|---|
| A speed `bench-download` aws4 | 5,085 (5,025-5,097) | 3,413 (3,390-3,424) | -32.9% | 5,637, 6,071, +7.7% | Bun ahead, ranges disjoint |
| A speed `bench-download` sigflint-B | 961 (957-971) | 645 (640-653) | -32.9% | 1,368, 1,341, -2.0% | Bun ahead, ranges disjoint |
| B speed `any-query` sigflint `final-1` | 1,416 (1,407-1,500) | 1,150 (1,143-1,173) | -18.8% | 1,874, 2,154, +14.9% | Bun ahead, ranges disjoint |
| B speed `any-query` sigflint `final-2` | 1,422 (1,413-1,429) | 1,149 (1,146-1,170) | -19.2% | | Bun ahead, ranges disjoint |
| B speed `event-4k` sigflint `final-1` | 8,931 (8,914-8,952) | 8,127 (8,119-8,150) | -9.0% | 11,150, 12,272, +10.1% | Bun ahead, ranges disjoint |
| B speed `event-4k` sigflint `final-2` | 8,947 (8,943-9,001) | 8,140 (8,129-8,205) | -9.0% | | Bun ahead, ranges disjoint |
| B speed `presign-any` aws4 | 9,993 (9,935-10,018) | 8,555 (8,454-8,593) | -14.4% | 11,151, 14,465, +29.7% | Bun ahead, ranges disjoint |
| B speed `presign-any` smithy | 10,577 (10,339-11,189) | 9,166 (8,854-9,399) | -13.3% | 12,924, 15,223, +17.8% | Bun ahead, ranges disjoint |
| B speed `presign-s3` smithy | 11,135 (10,957-11,578) | 9,476 (9,203-9,619) | -14.9% | 12,804, 18,899, +47.6% | Bun ahead, ranges disjoint |
| C/D cpuUs `bench-body-1k` aws4 | 8.24 (8.22-8.65) | 5.11 (5.05-5.19) | -38.0% | 9.86, 8.18, -17.0% | Bun ahead, ranges disjoint |
| C/D cpuUs `bench-body-1k` smithy | 14.91 (14.51-14.99) | 8.33 (8.27-8.81) | -44.1% | 16.49, 14.64, -11.2% | Bun ahead, ranges disjoint |

The sigflint rows of part B appear twice because the harness runs two controls of the same build (`final-1`, `final-2`); both agree.

### Every round, Node / Bun

- `bench-download` aws4: 1: 5,065 / 3,413; 2: 5,025 / 3,424; 3: 5,085 / 3,413; 4: 5,090 / 3,423; 5: 5,097 / 3,390
- `bench-download` sigflint-B: 1: 962 / 650; 2: 971 / 645; 3: 957 / 643; 4: 957 / 640; 5: 961 / 653
- `any-query` `final-1`: 1: 1,407 / 1,150; 2: 1,421 / 1,143; 3: 1,416 / 1,167; 4: 1,410 / 1,173; 5: 1,500 / 1,148
- `any-query` `final-2`: 1: 1,426 / 1,150; 2: 1,413 / 1,146; 3: 1,422 / 1,149; 4: 1,420 / 1,170; 5: 1,429 / 1,148
- `event-4k` `final-1`: 1: 8,952 / 8,127; 2: 8,938 / 8,119; 3: 8,931 / 8,150; 4: 8,921 / 8,138; 5: 8,914 / 8,122
- `event-4k` `final-2`: 1: 9,001 / 8,205; 2: 8,946 / 8,129; 3: 8,947 / 8,132; 4: 8,943 / 8,140; 5: 8,973 / 8,162
- `presign-any` aws4: 1: 9,935 / 8,475; 2: 9,943 / 8,564; 3: 10,018 / 8,555; 4: 9,993 / 8,593; 5: 10,011 / 8,454
- `presign-any` smithy: 1: 10,434 / 9,399; 2: 10,339 / 9,275; 3: 10,586 / 9,166; 4: 10,577 / 8,854; 5: 11,189 / 8,860
- `presign-s3` smithy: 1: 11,578 / 9,619; 2: 10,957 / 9,476; 3: 11,115 / 9,616; 4: 11,135 / 9,360; 5: 11,187 / 9,203
- `cpuUs` `bench-body-1k` aws4: 1: 8.22 / 5.05; 2: 8.65 / 5.19; 3: 8.24 / 5.10; 4: 8.24 / 5.11; 5: 8.27 / 5.17
- `cpuUs` `bench-body-1k` smithy: 1: 14.91 / 8.28; 2: 14.51 / 8.27; 3: 14.75 / 8.81; 4: 14.91 / 8.64; 5: 14.99 / 8.33

## What this does and does not show

- On Bun 1.4.5 these nine rows no longer show Node ahead. Nothing in them supports a report to the Bun project.
- The rows for third-party libraries (aws4, smithy) differ from the earlier run only by runtime and host: Node moved by about 10% (26.12.0 to 26.13.1) and Bun by about 40% (1.4.3 to 1.4.5). The two sigflint rows also differ by build (the released 1.0.5 files, not the `rerun-2` build), so their change is not the runtime alone.
- The Node baseline is Node 26.13.1 measured in this window; it is not the Node 26.12.0 of `rerun-2`. The raw rows of the earlier run were not re-read for this comparison, only the figures in `rerun-2-alternating.md`.
- Only these nine rows were run. The 50 other rows of `rerun-2-node-bun.md` where Node was ahead with disjoint ranges (including the GC rows listed there as suspected only because the two runtimes use different instruments) were not retested and keep their recorded verdicts and dispositions.
- Two libraries report wrong results in the harness on both runtimes in workloads outside these rows (aws4 `any-post-json`, smithy `bench-encode`); those rows are not timed, as before.
- Limits: a shared host, no continuous observer of a second operating system's CPU (the host is native Linux), a single window of 31 minutes, five rounds per row, one machine.
- No speed, memory or size figure in `README.md` or `docs/benchmarks.md` was regenerated from this run. The published figures stay those of the release 1.0.4 record.
