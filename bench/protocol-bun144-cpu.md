# Protocol: Bun 1.4.4 peak memory and alternating CPU samples on a new host

Declared 2026-10-23 23:17 MDT (2026-10-24 05:17 UTC; committed 23:17:49), before the counted run, which started 23:18:02.

Two questions, one run:

1. **Peak memory.** Three one-off sigflint processes on Bun 1.4.4 reached 70.1 to 70.8 MiB peak against 60.2 to 61.7 MiB on Bun 1.4.3 (`results/memory-26121-notes.md`, not counted, not under any protocol). Is Bun 1.4.4's peak memory higher than Bun 1.4.3's under the memory protocol, for sigflint and for the other libraries?
2. **CPU per call, Node against Bun.** The rows of the Node and Bun pairing that are open with Node ahead or that flipped in the last run: CPU per call of `aws4` on `bench-body-1k`, of `aws-sig` on `bench-download` and of `smithy` on `bench-body-1k`. Do alternating Node and Bun samples confirm a Node lead or show noise?

This is a new baseline on a different machine. The earlier runs (`results/memory-26121-notes.md` and before) ran on a WSL2 virtual machine; their figures are not compared with these.

## What is measured

- Part C of `run-admitted.sh` (`protocol-rerun-3.md`), unchanged except that a unit is measured under three runtimes instead of two: all eight arms (sigflint-A, aws4fetch, aws4, smithy, aws-sig, wdl, minio, sigflint-B), the four workloads, allocation, GC, CPU per call, retained growth, peak RSS, and the signing-key cache for sigflint. The harness scripts, workloads, arms, libraries (`frozen/versions.txt`, checked), rejection rules and the botocore check are those of the earlier runs. Part D (import) and the speed parts are not run.
- Candidate: the same hashed 1.0.1 build as before, `dist/node.js` (`439a387d`) and `dist/bun.js` (`21a8a862`), from a copy whose `SHA256SUMS` the driver checks first.
- Runtimes: Node.js 26.12.1 (`/usr/local/bin/node`, sha256 `08f12d42…`, the current release on this host), Bun 1.4.3 (`1.4.3+c6da4a4d3`, sha256 `7ce7d6b6…`) and Bun 1.4.4 (`1.4.4+38afee6c8`, sha256 `10702245…`, byte for byte the host's installed Bun). Both Bun binaries were extracted from the official `bun-linux-x64.zip` of their release, whose sha256 matched that release's `SHASUMS256.txt`; they run from copies, so the host's Bun cannot change under the run. Each result row records the runtime's own version string.
- Units: 8 arms x 5 rounds = 40, each measured under `node`, `bun143` and `bun144` back to back. The order is Node, Bun 1.4.3, Bun 1.4.4 in odd rounds and the reverse in even rounds, and the arm order is reversed in even rounds, so the two Bun versions swap places every round and drift reaches each runtime equally. The allocation calibration (`memory-calibration-final.jsonl`) is taken first on all three runtimes and must stay within 10%.
- Rounds: 5. Extension for question 2 only, declared here: after round 5, each of the three CPU rows is classified for each Bun version (below). For a row that is neither confirmed nor shown to be noise, its arm alone is measured for rounds 6 to 10 (`ONLY=<arm> FROM_ROUND=6`, same driver, same checks), and the row is then classified from all 10 rounds of that arm. 10 is the cap; a row still unsettled is reported as inconclusive with its sample count.

## Host admission

Applies the host admission limits of the maintainer's benchmarking rules on a native Linux host (`bench/admit-native-linux.py`): before the first unit and after every unit, a 10 s window with at most 4 busy cores (mean), at least 8 GiB available memory, no swap-out, zswap-out or zswap writeback. A unit counts only when the check before it and the check after it both admit. The per-process gate (whole-machine CPU busy at most 20% over the second before a process, up to 8 retries 15 s apart) applies as before. A unit that fails is kept in `results/bun144-cpu/not-admitted.jsonl`, measured again, and after 4 failed attempts the run stops and gives up the host lock.

**Pressure signals are not available on this host.** The kernel is built with PSI but not booted with `psi=1` (`/proc/pressure` is missing), so the memory and I/O pressure limits of the host rules (10 ms and 100 ms per second) cannot be read. The probe records `"psi": "unavailable"` in every receipt and refuses instead on stand-ins: a direct-reclaim or compaction stall in the window (memory) or more than 100 ms of iowait CPU time in any second (I/O). The stand-ins are not PSI and do not meet that clause of the host rules. They are a limit of this evidence, reported with it. Nothing on the host was changed to enable PSI.

The host is shared and being reconfigured. Nothing was paused for this run; other work shows up as busy cores in the receipts and refuses a unit only when it passes 4 busy cores or the stand-ins fire. Priority, affinity and CPU frequency policy are the host's defaults (normal priority, all 24 cores, governor `performance`, each process under `run-capped 2G`).

**Foreign load reported during the run (added 23:24 MDT, before any result was read).** The owner of other work on the host reported that a virtual machine build (8 vCPUs, first boot) ran from about 23:19 to 23:22 MDT, overlapping the first round, and paused it at 23:22. The host checks admitted every unit of that window (mean 2.1 to 3.2 busy cores in the windows between units, no stand-in tripped), so by the rules above those units count. Because the checks only sample between units, the analysis is also run a second time without the round-1 units that were measured in that window (aws4fetch to sigflint-B), as a sensitivity check. A verdict that differs between the two is reported as such and the affected arms get replacement rounds (same driver, new round numbers) before it is called.

## Variation criterion and verdicts (preset)

The criterion of `memory-protocol.md`: for each runtime, workload and metric, the reporting band is max(relative floor, 2 x the larger of the sigflint-A and sigflint-B ranges over the rounds); a difference is clear only when the medians differ by more than the band and the metric's absolute floor and the min-max ranges do not overlap. Floors: peak RSS 3% and 2 MiB; CPU per call 3% and 0.1 µs; heap allocated per call 6% and 64 B; others as in `memory-protocol.md`.

- **Question 1.** Bun 1.4.4 against Bun 1.4.3 per library, from `compare-memory-runs.mjs` on the two per-version summaries (Node rows are identical in both, so Node cells serve as the control and must read "no clear change"). The sigflint peak memory is the headline: higher than 1.4.3 outside the band means the lead is real and reproduces on this host; inside the band means not confirmed.
- **Question 2.** `pair-node-bun.mjs` on each per-version pairing, with the per-round signs (in how many of the rounds Node's CPU per call is below Bun's, the two runtimes measured back to back in that round). For each Bun version and row: **confirmed Node ahead** when Node's range is disjoint below Bun's and Node is lower in every round; **shown to be noise** when Bun's median is lower or Node is lower in at most 2 of the rounds; otherwise **unsettled** (extend as above). A confirmed row gets a reporting disposition under the maintainer's rule for Bun reports (reduced reproduction, search of open and closed issues, then an issue offer that the user sees first); nothing is filed from this run.
- Every other Node-ahead pair in the same output is listed as found, with its class, and is not extended or investigated here.

## Plan and forecast

Whole task started 2026-10-23 23:09 MDT. The counted run is 40 units; a trial unit (sigflint-A, three runtimes, 1 round, two host checks) took 77 s on this host. The forecast is about 45 to 55 minutes (unmeasured for the whole part on this host, since no earlier run exists here; the WSL run of part C with two runtimes took 35 minutes). Extension rounds, if any, add about 3 minutes per arm per round. Raw rows, receipts of every host check and unit, and the analysis are in `results/bun144-cpu/`.

## Limits

One host, shared and being reconfigured; pressure stand-ins instead of PSI; synthetic requests with a fixed signing date; peak RSS carries the whole runtime and the other three workloads; CPU per call includes the runtime's background threads (garbage collection), which differ between runtimes; the allocation methods differ per runtime, so heap figures are not compared across runtimes. The results hold for Node.js 26.12.1, Bun 1.4.3 and 1.4.4 on this machine.
