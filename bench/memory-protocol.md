# Signer memory protocol

Declared before the counted runs. Raw results go to `results/memory-raw.jsonl`, the summary to `results/memory-summary.json`. The speed protocol (`protocol.md`) still governs the speed numbers; this one covers memory and start-up.

Question: how much memory does each signer allocate, retain and hold, how much GC work does it cause, and how long does it take to load and sign for the first time, on Bun and on Node.js?
Candidate: sigflint, from the frozen copy of `src/` in `frozen/` (the same files and hashes as the speed matrix; `run-memory.sh` checks `SHA256SUMS` first).
Others: aws4fetch, aws4, @smithy/signature-v4, aws-sig, @wdl-dev/aws-sigv4, minio signV4, at the versions in `frozen/versions.txt`. Runtimes: Bun 1.4.3 and Node.js 26.11.1.
Workloads: the four speed workloads (`bench-download`, `bench-part-put`, `bench-encode`, `bench-body-1k` in `test/corpus.json`). Each arm's signature must equal the botocore reference (fixed clock) before anything is measured; a wrong result is reported and not measured.

## Metrics, units and what is counted

| Metric | Unit | How |
|---|---|---|
| Heap allocated per call | bytes per call, managed heap only | Node: heap growth over 40 chunks of 200 calls, with a 128 MB fixed young generation so a scavenge is rare; a chunk in which a collection was seen is dropped, at least 10 of 40 must remain. Bun: JavaScriptCore reports its heap size only at a collection, so a pass of 10,000 calls is bracketed by two eden collections and the collector log (`BUN_JSC_logGC=1`) is summed (`parse-jsc-log.mjs`). Both: a no-op with the same await shape is measured the same way and subtracted. Native memory (hash state, Buffers) is not in these numbers; Node's external + ArrayBuffer growth is recorded next to it. Methods are different per runtime, so Node and Bun numbers are not compared with each other. |
| Collections and pause time | count and ms per 10,000 calls | Node: the `gc` performance observer (stop-the-world duration). Bun: the collector log, sum of the pause per collection. Pass 1 of the run mode. |
| CPU time | µs per call, user + system, whole process | `process.cpuUsage()` over pass 1 (10,000 calls). Includes GC threads. |
| Retained growth | bytes of managed heap after a forced full GC, per 10,000 calls | After a 2,000-call warm-up and a forced GC (baseline), pass 1 (10,000 calls), forced GC, pass 2 (10,000 calls), forced GC. Reported: heap after pass 2 minus heap after pass 1, i.e. growth in steady state, so a one-time cost of compiling code or filling a cache does not count; a leak would show as growth that repeats. Forced collections are never inside a counted pass. |
| Peak RSS | bytes, whole process | `process.resourceUsage().maxRSS` at the end; it includes start-up, the other three workloads and all dependencies, so it is a footprint, not a signing cost. Only the candidate's own library is loaded in each process. |
| Signing-key cache | bytes per cached key, sigflint only | `cache.mjs`: each call uses a new signing day; heap after a forced GC at 0, 250, 500, 1,000, 1,500 and 2,000 entries (the cap is 1,000, so the last two show the plateau). Control: the same number of calls on one day. The other libraries' caches are not measured. |
| Import and first signature | ms | `import-time.mjs`, a fresh process per sample: time from the end of runtime start-up to the library loaded (with its client object built, as the adapter does it), and to the first signature. A `none` process that imports nothing is the control for the start-up part. |

Not measured, with reasons: native (non-JS) allocation per call; allocation of the web (WebCrypto) entry, which is not in the speed matrix either; live-server behaviour; Deno and Workers; memory of the caller's own code around the signer.

## Calibration of the allocation methods (done before the counted runs, kept apart from the claim sample)
A pseudo-candidate `calib` allocates arrays of 512 and 2,048 elements per call. The expected slope is 8 bytes per element. Measured on 2026-10-14: Node 8.64 B/element (+8%), Bun 7.66 B/element (-4%). So each method is linear to within 10%, and a difference between two arms on the same runtime is read as relative; the allocation reporting band therefore has a 6% floor, not 3%. Calibration rows: `results/memory-calibration.jsonl`.

## Plan and counts
Arms: 8 (sigflint-A, sigflint-B, six others). sigflint-A and sigflint-B are the same code in separate processes: the A/A noise floor. Rounds: 5. The arm order is reversed on even rounds.
- allocation: 1 process per (round, runtime, arm) = 80
- run (GC, CPU, retained growth, peak RSS): 80
- cache retention (sigflint-A and -B): 20
- import time: 9 arms (the 8 and `none`) x 2 runtimes x 5 rounds x 7 fresh processes = 630; one round's value for an arm is the median of its 7.
Total 810 processes. The one-round pilot (about 190 processes) took 5 min 42 s, so the counted run is forecast at about 30 to 35 minutes. Each process runs under `run-capped 2G`. Normal priority, all CPUs, no `nice` or `taskset`; the host lock is held for the whole run.

Run rejection (preset, as in the speed protocol plus memory conditions):
- whole-machine CPU busy over the 1 s before a process above 20%, after up to 8 retries 15 s apart (import: checked once per group of 9 processes);
- free swap falls by more than 64 MiB while a process runs; or the process exits non-zero (137 or 143 is an out-of-memory kill; check `journalctl --user | grep oom-kill`);
- an allocation sample with fewer than 10 of 40 kept chunks (Node), or a missing collector log region (Bun);
- the frozen files not matching `SHA256SUMS`, or the calibration slope outside 10%.
Rejected and errored rows are kept in the raw file, listed in the report, and excluded. The pilot (`results/memory-pilot.jsonl`, one round, 1 import repetition) shaped the harness: heap retained after a forced GC over the whole 20,000 calls moved by hundreds of KiB for one-time reasons (compiled code, lazy tables), which is why the retained metric is the second pass only. The pilot is not part of any claim.

## Variation criterion (preset)
For each (runtime, workload, metric): the reporting band is max(relative floor, 2 x the larger of the A and B run-to-run ranges), with a range being (max - min) / median over the 5 rounds. A difference from sigflint-A is clear only when the median gap is outside the band, is larger than the metric's absolute floor, and the two arms' ranges do not overlap. Otherwise: no clear change.

| Metric | Relative floor | Absolute floor |
|---|---|---|
| heap allocated per call | 6% | 64 B |
| retained growth per 10,000 calls (second pass) | 3% | 64 KiB |
| collections per 10,000 calls | 3% | 2 |
| GC pause per 10,000 calls | 3% | 1 ms |
| CPU per call | 3% | 0.1 µs |
| peak RSS | 3% | 2 MiB |
| import and first signature | 3% | 1 ms |
| bytes per cached key | 3% | 5 B |

Charts and tables show the median and range of the 5 rounds. Lower is better for every metric here. A result is reported for sigflint even when another arm is lower.

## Limits
Synthetic requests with a fixed signing date; one machine (WSL2) shared with other work, with the busy check above as the only guard; young-generation sizes differ between the Node allocation run (fixed 128 MB) and the Node run mode (defaults), so GC counts describe default settings only; Bun's collector log adds a small cost to its GC time; peak RSS carries the whole runtime; the allocation methods differ per runtime; the web entry, Deno and Workers are not covered.

## Re-run on the final code (declared 2026-10-14, before the run)
The counted run above measured `frozen/`, the code before it was split into modules. The run is repeated on the final code: the candidate is `src/` at commit 39738e2, copied to a directory with a `SHA256SUMS` (`run-memory.sh` reads the copy; the copy is identical to `src/`, checked with `diff -r`). Everything else is unchanged: arms, workloads, 5 rounds, 7 import repetitions, rejection rules, variation criterion, floors. All eight arms are re-measured, so the comparison is within one run. The runtimes are Bun 1.4.3 and Node.js 26.12.0 (the earlier run used 26.11.1); the allocation calibration is repeated on the same runtimes first and must stay within 10%. The earlier raw results stay in the repository history.
Expected duration: about 30 minutes (the earlier run took 10:55 to 11:24 UTC). The host lock is held for the whole run and the Chief of Staff asks other sessions to pause heavy work.
The first attempt of this re-run was discarded: the candidate copy lacked a `package.json` with `"type": "module"`, so Node re-parsed each module as ESM and printed a warning for it; that inflated Node import and cache-process rows for sigflint only (Node import 3.92 ms against 2.24 ms before). Its raw rows are kept outside the repository and are in no claim. The copy now carries a minimal `package.json` (`{"type":"module"}`, in its `SHA256SUMS`), as `bench/` does for the other candidates, and the whole matrix is run again. A discarded run is reported, not hidden.
