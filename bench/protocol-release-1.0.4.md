# Release 1.0.4 measurements: plan declared before the run (second plan)

Declared 2026-11-01, before the first measured process of this plan. The frozen inputs are in
`results/release-1.0.4-freeze.json`; the built files the phases run are copied from `dist/` (built
by `npm run build` with Bun 1.4.4) into an untracked `results/release-1.0.4/artifacts/` with a
`SHA256SUMS`, and their hashes are in `results/release-1.0.4-artifacts.sha256`.

## The first plan was stopped

A first plan (12 arms, 3 rounds, 99 units, 824 counted processes; commit `88737dd`) started on
2026-10-31 and was stopped on 2026-11-01 after 13 of its 99 units, because it was larger than the
question needs: most of the comparison's claims are gaps of 3 to 90 times against noise bands of 3 to 6%,
and about a fifth of every unit was two fixed admission windows. Its admitted rows are kept in
`results/release-1.0.4-stopped/` and are not used. This plan measures what changed, with fewer rounds
and shorter windows, and extends only the comparisons that stay unsettled.

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

Do the speed, memory, import and size figures of the comparison hold for the libraries whose
measurement is out of date, under the preferred runners, when no figure is kept unless the host
was quiet right before and right after it was measured?

## What is measured, and what is carried forward

The published figures (1.0.2 and 1.0.3) were measured on 2026-10-29 with the hand-written timer on
Node 26.12.1 and Bun 1.4.4. Out of date: the four new clients (never measured), `@smithy/signature-v4`
(5.7.5 now), the Node patch version (26.13.0 now), and the timer. Not out of date: sigflint (byte
identical), `aws-sig`, `@wdl-dev/aws-sigv4`, minio, `aws4`, `aws4fetch` (same versions, same corpora).

Arms measured (9): sigflint-A and sigflint-B (the same build; the A/A control), `@smithy/signature-v4`,
s3mini, tiny-oss, lean-s3, s3-lite-client, and two anchors, `aws4` and `aws4fetch`. The anchors decide
the carry-forward: if, on both runtimes, every anchor workload's new median is within the reporting
band of its published median (after the timer difference measured on 2026-10-31, a median 2.0%), the
published figures of `aws-sig`, `@wdl-dev/aws-sigv4` and minio are carried forward and labelled with
their date, runtime version and timer. If any anchor falls outside, those three are measured too with
`ARMS_LIST="aws-sig wdl minio"` and the same parts and rounds. Runtimes: Node 26.13.0 and Bun 1.4.4.
Library versions are those of `bench/package-lock.json` (hash in the freeze record). Workloads and
corpora are unchanged.

| Part | What | Runner | Rounds | Counted processes |
|---|---|---|--:|--:|
| A | S3 header speed, four workloads, 9 arms | Tinybench 6.2.2 | 2 | 36 |
| B | other services and presigned URLs: final-1, final-2 (sigflint), aws4, aws4fetch, smithy | Tinybench | 2 | 20 |
| C | memory: allocation, run (GC, CPU, growth, peak RSS), signing-key cache (sigflint arms), 9 arms | runtime counters (heap, GC, `process.cpuUsage`, RSS) | 2 | 80 |
| D | import and first signature, 5 cold starts per arm and runtime, plus the no-library control | Hyperfine 2.0.0 | 2 | 200 |
| | allocation calibration, outside the claim sample | runtime counters | 1 | 2 |

Total: 338 counted processes in 48 units (A 18, B 10, C 18, D 2). Rounds three to five are added only
for the arms in a comparison that is still unsettled after round two, by running those arms again with
`ARMS_LIST` and `FROM_ROUND=3`; the cap is five. Size (`sizes.mjs`, `tiers.mjs`) is deterministic and is
measured once on the frozen build and the pinned libraries; the four clients' size is the signing code
only (s3mini: the whole client class), labelled as in `sizes.mjs`.

Timing windows (`WINDOW_S=0.5`, `WARMUP_MS=200`): each signing task runs at least 10 batches of 1,000
calls in about half a second after a warm-up of at least 4 batches and 0.2 s. At one second the
relative error of the median was 0.1 to 4% in the 2026-10-31 comparison (every cell records its
`rmePct`), so half a second is enough for bands of 3% and more, and the recorded `rmePct` of each cell
shows whether it was. A cold start is one fresh process timed by Hyperfine as the arm's command time
(`REPS=5` timed runs per command); the start-up cost is its median minus the median of the no-library
control in the same round and runtime. One warm-up run precedes each command's timed runs so the first
arm in a round does not pay for cold file caches. Memory counters are
runtime counters because neither runner reports them.

Order: arms are run in a fixed order that is reversed on even rounds; Node and Bun alternate
which goes first. The reporting band is what the analyzers compute, as in `protocol-rerun-3.md`:
the larger of 3% and twice the larger run-to-run range of the two sigflint control arms, with a
6% floor for allocation and the absolute floors in `analyze-memory.mjs`; in part B it is also
widened by the gap between the two sigflint (`final-1`, `final-2`) medians (`analyze-more.mjs`).
A comparison is unsettled as `analyze.mjs`, `analyze-more.mjs` and `analyze-memory.mjs` decide it
(a gap within twice the band, overlapping ranges, or fewer than two rounds behind the arm or its
baseline),
and rounds three to five follow that decision and nothing else.

## Host, admission and the lock

Native Linux, 24 logical CPUs, shared with other sessions. Each part runs through
`run-admitted.sh`, which re-executes once inside one `systemd-run` scope with a 2 GiB memory cap,
takes the host lock `~/.cache/setupLinuxHost/post-upgrade-bench.lock` without waiting, and holds it
only inside a part's run. A 10 s native Linux admission window must pass before a part's first unit and after every unit; the window that ends one unit also starts the next when it is at most 20 s old (`REUSE_S`), as `protocol-rerun-3.md` has it, and the continuous observer covers the gap. Each window requires
(at most 4 busy cores, at least 8 GiB available, no swap-out, zswap-out or zswap writeback, memory
full pressure at most 10 ms and I/O full pressure at most 100 ms in any second; page-ins are not a
reason to refuse, and neither the admission command nor the observer records host page-ins, so no
page-in diagnostic exists for this campaign). The continuous observer (`observe-unit.py`, the house-rules unit
observer, vendored from the commit named in its header) must report a clean unit: competing CPU
(host busy cores minus the workload's own) at most 4, pressure within the same limits per interval,
counters unchanged and monotonic, and its own cost within 0.05 cores and 128 MiB of resident memory.
No separate observer I/O budget is enforced: its logical log bytes are in its receipt, and physical I/O
is not attributed to it; this is a disclosed limit of the shared observer. Two more rules
reject a unit: the whole machine more than 20% busy in the second before a process starts (once per
runtime before part D's Hyperfine call), and free swap falling by more than 51,200 KiB (50 MiB; parts A and B) or
65,536 KiB (64 MiB; parts C and D) over a process; in part D the swap check wraps one runtime's Hyperfine
call for a round, not each cold start.

A unit is a round of one arm, or a whole round for part D. A refused before-check (host not quiet)
or a rejected unit makes `run-admitted.sh` exit 6 and give up the lock; `run-campaign.sh` reruns the
part after a minute (at most 30 times per part) and holds nothing while it waits. A refused
before-check uses no attempt. A measured attempt writes a `unit-start` receipt, and a unit may start
four times. After the fourth, the next invocation skips that unit, runs the others and exits 9 naming
it; the campaign records the gap and goes on. Exit 7 is a real failure (a write error, an errored
unit, or a part that ended with a unit neither complete nor named as out of attempts) and stops the
campaign. A unit is complete only with an admitted receipt and its rows in the raw file; rows left by
an interrupted attempt are dropped before the unit runs again, and `tidy-results.mjs` drops any left
for a unit that never ran again before the analyzers read the files, so no sample is counted twice or
counted without an admitted receipt. A unit with no rows of its own, a Hyperfine report that lacks a
command or has the wrong number of runs, and a part in which no unit matched are failures, not data. A unit
that stays missing leaves its arm's median on the rounds it has, and the number of rounds behind
every figure is reported; a comparison from fewer than two rounds is not given a clear verdict.
The host is shared, so refusals are expected; they are retained in the admission receipts and are not
edited. The allocation calibration (part C, round one) runs between two admission checks and is
discarded if either refuses.

## Expected duration, pilot and stop rule

Unmeasured estimate: 48 units have a lower bound of about 9 minutes of admission windows (one per
unit, plus the first of each part); with the timed work, about an hour when the host is quiet. The first
plan's run admitted a part A unit about every 100 s including refusals, which on this shared host puts
the elapsed time between one and four hours. The 2026-10-31 comparison of the old and new timers on this
artifact (parts A and D under the same driver and tooling, not pooled with these results) and a pilot of
one part B and one part C unit with the calibration are the pilots; their numbers are in
`results/release-1.0.4-pilot.md`. `run-campaign.sh` stops the campaign, reported as incomplete with the
parts finished, if four hours of wall-clock time pass from its first attempt (`DEADLINE_S=14400`, kept in
`campaign-start` in the result directory) without all four parts ending; a finished part stays valid
and a later run may resume the unfinished parts in the same result directory.

## Rules fixed in advance

- A wrong-result row is retained and not timed; an unsupported workload is reported as such.
- Raw rows, admission receipts and observer receipts are kept unedited in `results/release-1.0.4/`; the first plan's partial results stay in `results/release-1.0.4-stopped/` and are not used.
- Nothing from `results/` of earlier releases is pooled. No profile, reduced reproduction or upstream
  submission is part of this campaign.
- Every part starts only if `check-freeze.mjs` (run by `run-admitted.sh` when `FREEZE` names the freeze
  record) finds the source tree, the committed `bench/` tree outside `bench/results`, the compiled client
  bundles, the built artifacts, the corpora and lock files, and the runtime and runner versions as
  frozen, with no uncommitted change under `src/` or `bench/`; otherwise it exits 4. The compiled
  bundles are rebuilt by `npm run check`, which changes their bytes, so the freeze is written with
  `check-freeze.mjs --write` after the last such build and no check runs during the campaign.
- The published figures, charts and tables are regenerated from these results only after the run
  ends, and the README, listing text and changelog are audited against them before the release is
  prepared.

## Reproduction

`npm ci` in the repository and in `bench/`, `bun bench/compat/build-clients.mjs`, Hyperfine 2 on
`PATH`, then, from the repository root,
`RESULTS=$PWD/bench/results/release-1.0.4 FREEZE=$PWD/bench/results/release-1.0.4-freeze.json ARMS_LIST="sigflint-A sigflint-B smithy s3mini tiny-oss lean-s3 s3-lite-client aws4 aws4fetch" WINDOW_S=0.5 WARMUP_MS=200 REPS=5 DEADLINE_S=14400 ADMIT="python3 $PWD/bench/admit-native-linux.py" OBSERVER="python3 $PWD/bench/observe-unit.py --workload-cgroup auto" bash bench/run-campaign.sh $PWD/bench/results/release-1.0.4/artifacts 2`.
`RESULTS` must name a fresh directory: the default, `bench/results`, holds earlier releases' admission
receipts. `analyze-more.mjs` reads `RESULTS`; the other analyzers read fixed paths under
`bench/results`, so they run on copies of the files placed there after the run. The admission command
and observer are in this repository; the host's own lock path is the default.
