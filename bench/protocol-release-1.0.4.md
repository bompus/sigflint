# Release 1.0.4 measurements: plan declared before the run

Declared 2026-10-31, before the first measured process. The frozen inputs are in
`results/release-1.0.4-freeze.json`; the built files the phases run are copied from `dist/` (built
by `npm run build` with Bun 1.4.4) into an untracked `results/release-1.0.4/artifacts/` with a
`SHA256SUMS`, and their hashes are in `results/release-1.0.4-artifacts.sha256`.

## Why measure again

The code under test has not changed: `src/` is tree `90a032d5`, the same tree as v1.0.2 and
v1.0.3, and the built `node.js` and `bun.js` have the release 1.0.2 hashes. What changed is
the comparison. Four S3 clients (s3mini, tiny-oss, lean-s3, s3-lite-client) join the speed,
memory, import and size tables, and the timing moved from hand-written loops to Tinybench
(signing speed) and Hyperfine (cold starts). The two methods agree on the same artifact (a
median 2.0% apart over 78 speed cells; cold-start figures within 1.5 ms), but figures from
different runners are not directly comparable, so every published speed, memory and import
figure is measured again by one method on one host in one campaign. Earlier results are not
pooled with these.

Because the code is byte-identical to 1.0.2 and 1.0.3, the regression comparisons against the
pre-split baseline and the published 1.0.1 package (part R in earlier releases) are not run:
there is nothing for them to detect.

## Question

Do the speed, memory, import and size figures of the comparison hold for the twelve arms below,
under the preferred runners, on the frozen cohort, when no figure is kept unless the host was
quiet right before and right after it was measured?

## Cohort and parts

Arms (12): sigflint-A and sigflint-B (the same build; the A/A control), aws4fetch, aws4,
`@smithy/signature-v4`, aws-sig, `@wdl-dev/aws-sigv4`, minio, s3mini, tiny-oss, lean-s3,
s3-lite-client. Runtimes: Node 26.13.0 and Bun 1.4.4. Library versions are those of
`bench/package-lock.json` (hash in the freeze record). Workloads and corpora are unchanged.

| Part | What | Runner | Rounds | Counted processes |
|---|---|---|--:|--:|
| A | S3 header speed, four workloads | Tinybench 6.2.2 | 3 | 72 |
| B | other services and presigned URLs, 8 arms (final-1, final-2, aws4, aws4fetch, smithy, aws-sig, wdl, minio) | Tinybench | 3 | 48 |
| C | memory: allocation, run (GC, CPU, growth, peak RSS), signing-key cache | runtime counters (heap, GC, `process.cpuUsage`, RSS) | 3 | 156 |
| D | import and first signature, 7 cold starts per arm and runtime, plus the no-library control | Hyperfine 2.0.0 | 3 | 546 |
| | allocation calibration, outside the claim sample | runtime counters | 1 | 2 |

Total: 824 counted processes. Rounds four and five are added to a whole part only when a
comparison is unsettled after round three, decided from the part's own analysis; the cap is five.
Size (`sizes.mjs`, `tiers.mjs`) is deterministic and is measured once on the frozen build and
the pinned libraries; the four clients' size is the signing code only (s3mini: the whole client
class), labelled as in `sizes.mjs`.

Timing windows: each signing task runs at least 10 batches of 1,000 calls in about one second
after a warm-up of at least 4 batches and 0.3 s. A cold start is one fresh process timed by
Hyperfine as the arm's command time; the start-up cost is its median minus the median of the
no-library control in the same round and runtime. One warm-up run precedes each command's seven
timed runs so the first arm in a round does not pay for cold file caches. Memory counters are
runtime counters because neither runner reports them.

Order: arms are run in a fixed order that is reversed on even rounds; Node and Bun alternate
which goes first. The reporting band is what the analyzers compute, as in `protocol-rerun-3.md`:
the larger of 3% and twice the larger run-to-run range of the two sigflint control arms, with a
6% floor for allocation and the absolute floors in `analyze-memory.mjs`; in part B it is also
widened by the gap between the two sigflint (`final-1`, `final-2`) medians (`analyze-more.mjs`).
A comparison is unsettled as `analyze.mjs`, `analyze-more.mjs` and `analyze-memory.mjs` decide it,
and rounds 4 and 5 follow that decision and nothing else.

## Host, admission and the lock

Native Linux, 24 logical CPUs, shared with other sessions. Each part runs through
`run-admitted.sh`, which re-executes once inside one `systemd-run` scope with a 2 GiB memory cap,
takes the host lock `~/.cache/setupLinuxHost/post-upgrade-bench.lock` without waiting, and holds it
only inside a part's run. Before and after every unit a 10 s native Linux admission window must pass
(at most 4 busy cores, at least 8 GiB available, no swap-out, zswap-out or zswap writeback, memory
full pressure at most 10 ms and I/O full pressure at most 100 ms in any second; zswap page-ins are
recorded, not a reason to refuse). The continuous observer (`observe-unit.py`, the house-rules unit
observer, vendored from the commit named in its header) must report a clean unit: competing CPU
(host busy cores minus the workload's own) at most 4, pressure within the same limits per interval,
counters unchanged and monotonic, and its own cost within 0.05 cores and 128 MiB. Two more rules
reject a unit: the whole machine more than 20% busy in the second before a process starts (once per
runtime before part D's Hyperfine call), and free swap falling by more than 50 MB (parts A and B) or
64 MiB (parts C and D) over a process; in part D the swap check wraps one runtime's Hyperfine
call for a round, not each cold start.

A unit is a round of one arm, or a whole round for part D. A refused before-check (host not quiet)
or a rejected unit makes `run-admitted.sh` exit 6 and give up the lock; the driver reruns the part
after a minute and holds nothing while it waits. A refused before-check uses no attempt. A measured
attempt writes a `unit-start` receipt, and a unit may start four times. After the fourth, the next
invocation skips that unit, runs the others and exits 7 naming it: the unit stays missing and the
arm's median uses the rounds it has. The number of rounds behind every figure is reported. The host
is shared, so refusals are expected; they are retained in the admission receipts and are not edited.

## Expected duration, pilot and stop rule

Unmeasured estimate: 99 units (A 36, B 24, C 36, D 3) have a lower bound of about 33 minutes of
admission windows; with the timed work, about two hours when the host is quiet. The 2026-10-31
comparison of the old and new timers on this artifact (parts A and D under the same driver and
tooling, not pooled with these results) admitted about one part A unit in 30 seconds when quiet and
about one in 2 to 4 minutes when the shared host was busy, so the elapsed time on this host can
reach six to eight hours. That comparison is the pilot. The run is stopped, and reported as
incomplete with the parts finished, if eight hours of wall-clock time pass from its first measured
process without all four parts ending; a finished part stays valid and a later run may resume the
unfinished parts in the same result directory.

## Rules fixed in advance

- A wrong-result row is retained and not timed; an unsupported workload is reported as such.
- Raw rows, admission receipts and observer receipts are kept unedited in `results/release-1.0.4/`.
- Nothing from `results/` of earlier releases is pooled. No profile, reduced reproduction or upstream
  submission is part of this campaign.
- If `bench/` outside `bench/results` differs from the harness commit in the freeze record at the end of
  the run, the run is reported with that difference.
- The published figures, charts and tables are regenerated from these results only after the run
  ends, and the README, listing text and changelog are audited against them before the release is
  prepared.

## Reproduction

`npm ci` in the repository and in `bench/`, `bun bench/compat/build-clients.mjs`, Hyperfine 2 on
`PATH`, then, from the repository root, for each part
`RESULTS=$PWD/bench/results/release-1.0.4 ADMIT="python3 $PWD/bench/admit-native-linux.py" OBSERVER="python3 $PWD/bench/observe-unit.py --workload-cgroup auto" bash bench/run-admitted.sh <A|B|C|D> $PWD/bench/results/release-1.0.4/artifacts 3`.
`RESULTS` must name a fresh directory: the default, `bench/results`, holds earlier releases' admission
receipts, and `run-admitted.sh` skips any unit that already has an admitted receipt. The analyzers
read fixed paths under `bench/results`, so they run on copies of the files placed there after the run.
The admission command and observer are in this repository; the host's own lock path is the default.
