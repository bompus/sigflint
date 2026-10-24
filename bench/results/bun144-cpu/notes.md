# Bun 1.4.4 peak memory and alternating CPU samples: notes

Protocol: [`../../protocol-bun144-cpu.md`](../../protocol-bun144-cpu.md). Times are MDT (UTC minus 6 hours), 2026-10-23. Candidate: the same hashed 1.0.1 `dist/` build as the earlier runs (`../more-artifacts.sha256`). This is a new baseline on a different machine (native Linux, Intel Core Ultra 7 270K Plus, 24 cores, 122 GiB, kernel 7.2.12-x64v3-xanmod1, governor `performance`); the earlier figures came from a WSL2 virtual machine and are not compared with these.

Runtimes: Node.js 26.12.1, Bun 1.4.3 (`1.4.3+c6da4a4d3`) and Bun 1.4.4 (`1.4.4+38afee6c8`). Both Bun binaries were extracted from the official `bun-linux-x64.zip` of their release after the zip's sha256 matched that release's `SHASUMS256.txt` (the same file is published with the release, so this proves the download is intact, not who made it). The 1.4.4 binary is byte for byte the one installed on the host.

## Run

- Part C of `run-admitted.sh`, 5 rounds, 8 libraries, 40 units, each unit measured under Node, Bun 1.4.3 and Bun 1.4.4 back to back (order flipped every round). Counted run 23:18:02 to 23:40:35 (22.5 minutes including the restart; forecast 45 to 55 minutes, so the measured time was under half the forecast: the forecast was taken from a single trial unit of 77 s that also included the calibration and two host checks, while the 40 counted units averaged about 33 s each).
- 40 units admitted, 1 refused once and measured again (`C-r2-sigflint-B`, refused by its host check at 23:23; receipt in `not-admitted.jsonl`), 0 rejected or errored rows in the accepted data (2,250 raw rows; the analysis reports 1,370 per pairing with 1,120 accepted, none rejected). 44 host checks in `admission.jsonl`, 42 admitted (busy cores 0.17 to 3.52, median 0.79; worst single second 9.12 cores) and 2 refused (23:23, reclaim and iowait stand-ins; 23:23, more than 4 busy cores). The allocation calibration is in `memory-calibration-final.jsonl` (Node 8.64 B per element, the same as on the earlier machine).
- **A restart of the tool that hosted the session killed the driver at 23:23**, after round 1 and one refused attempt of round 2's first unit. Nothing counted was half written; the driver was started again at 23:24:41 and continued with the units not yet admitted (as it is built to do), now as its own user service. Because the driver restarted, `C-r2-sigflint-B` got a fresh set of up to 4 attempts instead of the 3 it had left; it was admitted on the first attempt after the restart.
- **The admission probe counted guest CPU time twice** in the 44 receipts of this run: it summed every field of `/proc/stat`, and Linux already includes guest time in the user fields. Receipts taken while a virtual machine ran (the window above) therefore overstate the busy cores, never understate them, so no unit was admitted because of the error; the probe was corrected afterwards (and its pressure limits are now taken per second of elapsed time, which the run's non-PSI path did not use). The figures "2.1 to 3.2 busy cores" above are the recorded, possibly inflated values.
- **Pressure signals are not available on this kernel** (PSI compiled in, not enabled at boot). The probe (`admit-native-linux.py`) used stand-ins and says `"psi": "unavailable"` in every receipt. That clause of the host rules is not met; the evidence below carries that limit.
- **Foreign load in round 1.** The owner of other work reported a virtual machine build on the host from about 23:19 to 23:22, paused at 23:22. Round 1's units 2 to 8 (23:18:55 to 23:22:38) are in that window: the checks between them admitted with 2.1 to 3.2 busy cores (against a median of 0.8 for the whole run). By the protocol those units count. The sensitivity analysis the protocol declared (the same analysis without those seven units, 4 rounds for seven libraries) gives the same verdict for every comparison below (peak memory: sigflint-A is unchanged because its round-1 unit was before the window; the three CPU rows: Bun ahead in all 4 remaining rounds for each Bun version, which is below the 5 paired rounds the verdict rule asks for, so it counts as agreement in direction, not as a verdict). Across all 560 library-and-runtime cells of the two pairings exactly one verdict differs: `minio` peak memory on Bun 1.4.3 against sigflint-A (the library comparison inside one Bun version, not one of the two questions) reads "no clear change" in the full analysis and "more than sigflint" without those units, because the reporting band narrows from 6.2% to 5.2%. This run makes no claim about that comparison; calling it would need the replacement rounds the protocol names, which were not run.
- The protocol text was corrected after the run for its declared time (it first said 23:25; the commit was 23:17:49 and the run started 23:18:02) and reworded to name no private paths; no measurement rule changed.

## Question 1: is Bun 1.4.4's peak memory higher than Bun 1.4.3's?

No clear change on this machine. Peak RSS of the whole process, MiB, median (min-max) over 5 rounds:

| library | Node 26.12.1 | Bun 1.4.3 | Bun 1.4.4 | Bun 1.4.4 over 1.4.3 | verdict |
|---|---|---|---|---|---|
| sigflint-A | 79.5 (78.7-81.9) | 62.6 (61.8-63.4) | 64.6 (63.3-64.9) | +3.2% (+2.0 MiB) | no clear change (ranges overlap) |
| sigflint-B (A/A) | 80.5 (78.6-81.7) | 61.9 (61.6-63.5) | 64.0 (62.8-64.3) | +3.3% | no clear change |
| aws4fetch | 98.5 (96.8-99.4) | 65.9 (64.9-66.8) | 66.3 (64.6-67.3) | +0.5% | no clear change |
| aws4 | 79.8 (79.7-81.1) | 68.8 (68.2-70.4) | 68.1 (67.7-69.5) | -0.9% | no clear change |
| smithy | 80.9 (80.0-81.1) | 72.5 (70.4-73.9) | 74.4 (71.1-78.8) | +2.5% | no clear change |
| aws-sig | 134.6 (134.2-135.0) | 76.5 (75.9-76.9) | 77.4 (77.1-78.5) | +1.2% | no clear change |
| wdl | 94.5 (94.2-95.1) | 72.5 (70.1-73.3) | 73.6 (71.8-77.8) | +1.6% | no clear change |
| minio | 82.2 (81.6-82.5) | 70.0 (68.7-71.2) | 68.2 (68.1-69.2) | -2.5% | no clear change |

Criterion: the larger of 3% and twice the sigflint A/A range, at least 2 MiB, and non-overlapping ranges (`vs.md`: 0 of 16 peak-memory figures moved; also 0 of 52 for each per-workload metric: heap per call, retained heap, collections, GC pause and CPU per call, and 0 of 4 for the cache). Node's rows are identical in both pairings, as the control, and none moved.

The earlier lead (70.1 to 70.8 MiB on 1.4.4 against 60.2 to 61.7 MiB on 1.4.3, three processes, on the earlier machine, outside the protocol) did not reproduce here: sigflint on 1.4.4 is 63.3 to 64.9 MiB and 1.4.3 61.8 to 63.4 MiB, with overlapping ranges. This run does not say why the earlier machine gave a larger gap; the machines differ in hardware and kernel, and the earlier machine's memory settings were not recorded (transparent huge pages are `always` here). The result holds for this machine, 5 rounds, this build.

## Question 2: the open Node-ahead CPU rows

Alternating samples of CPU per call (µs, user plus system, whole process; Node and Bun measured back to back, order flipped every round), 5 rounds each, from `cpu-row-signs.mjs`:

| row | Bun | Node median (min-max) | Bun median (min-max) | Node lower in | verdict |
|---|---|---|---|--:|---|
| `aws4`, `bench-body-1k` | 1.4.3 | 8.46 (8.29-8.52) | 5.60 (5.17-5.73) | 0 of 5 | shown to be noise: Bun ahead, ranges disjoint |
| `aws4`, `bench-body-1k` | 1.4.4 | 8.46 (8.29-8.52) | 4.99 (4.98-5.14) | 0 of 5 | Bun ahead, ranges disjoint |
| `aws-sig`, `bench-download` | 1.4.3 | 64.93 (64.45-66.74) | 47.48 (43.12-47.90) | 0 of 5 | Bun ahead, ranges disjoint |
| `aws-sig`, `bench-download` | 1.4.4 | 64.93 (64.45-66.74) | 45.89 (40.82-46.84) | 0 of 5 | Bun ahead, ranges disjoint |
| `smithy`, `bench-body-1k` | 1.4.3 | 15.07 (14.59-15.83) | 8.78 (8.66-8.87) | 0 of 5 | Bun ahead, ranges disjoint |
| `smithy`, `bench-body-1k` | 1.4.4 | 15.07 (14.59-15.83) | 8.79 (8.19-9.05) | 0 of 5 | Bun ahead, ranges disjoint |

On this machine none of the three rows has Node ahead, in any round, with either Bun version. So none is a Node-ahead row to report, and the earlier Node leads in them (on the earlier machine) did not reproduce here; no extension rounds were needed. This is a statement about this machine and these 5 rounds, not about the earlier measurements, which stand for their own machine.

## Other Node-ahead pairs in the same output (found, not extended)

The pairing of this run (`split/bun143/node-bun-pairing.md`, `split/bun144/node-bun-pairing.md`) pairs every row, 96 per Bun version, against the earlier table's dispositions. Node-ahead CPU rows (the protocol lists them and does not investigate them):

| row | Bun 1.4.3 | Bun 1.4.4 | per-round signs | note |
|---|---|---|---|---|
| `sigflint-A`, `bench-encode` | 2.72 (2.49-2.85) Node, 3.81 (3.52-4.16) Bun | 3.82 (3.56-3.86) Bun | Node lower in 5 of 5, both versions | confirmed Node ahead on both; already "report-ready" in the earlier table, now seen on a second machine |
| `aws4`, `bench-download` | 8.93 (8.82-9.08) Node, 12.66 (11.85-13.09) Bun | 12.14 (11.86-12.78) Bun | 5 of 5, both versions | confirmed Node ahead on both; already "report-ready" |
| `smithy`, `bench-download` | 15.81 (15.46-16.15) Node, 18.03 (17.22-19.11) Bun | 17.56 (14.99-18.91) Bun | 5 of 5 and 4 of 5 | confirmed on 1.4.3, unsettled on 1.4.4 |
| `sigflint-A`, `bench-part-put` | 2.20 (2.16-2.27) Node, 2.34 (2.25-2.50) Bun | 2.01 (1.76-2.15) Bun | 5 of 5 and 0 of 5 | unsettled on 1.4.3, noise on 1.4.4 |

The GC pause and heap-allocation rows use different instruments on the two runtimes, so their direction is not a result. None of these rows has a reduced reproduction, an issue search or a report; nothing has been filed, edited or commented on at oven-sh/bun from this run. Reporting any of them is a separate offer that the user sees first.

The per-version files in `split/` (summary, report, pairing) are made from `memory-raw.jsonl` with `node split-runtimes.mjs memory-raw.jsonl split`, then `analyze-memory.mjs` and `pair-node-bun.mjs` on each directory; `vs.md` is `compare-memory-runs.mjs` on the two summaries; `cpu-row-signs.md` is `cpu-row-signs.mjs` on the raw file.

## Limits

One machine, 5 rounds, shared with other work (receipts above); pressure stand-ins instead of PSI; a virtual machine build overlapped round 1 (sensitivity run agrees); the driver restarted once. CPU per call includes runtime background threads, which differ between runtimes. Peak RSS includes start-up and the other three workloads. The results hold for Node.js 26.12.1, Bun 1.4.3 and 1.4.4 and this build on this machine.
