# Release 1.0.4 measurements: plan declared before the run (third plan)

Declared 2026-11-01, before the first measured process of this plan. The frozen inputs are in
`results/release-1.0.4-freeze.json`; the built files the phases run are copied from `dist/` (built
by `npm run build` with Bun 1.4.4) into an untracked `results/release-1.0.4/artifacts/` with a
`SHA256SUMS`, and their hashes are in `results/release-1.0.4-artifacts.sha256`.

## Two earlier plans were stopped

A first plan (12 arms, 3 rounds, 99 units, 824 counted processes; commit `88737dd`) started on 2026-10-31
and was stopped on 2026-11-01 after 13 of its 99 units, because it was larger than the question needs:
most of the comparison's claims are gaps of 3 to 90 times against noise bands of 3 to 6%, and about a
fifth of every unit was two fixed admission windows. A second plan (9 arms, 2 rounds; commit `5985686`)
started the same night and was stopped after 3 units, when its independent review found that it carried
three libraries forward behind two anchor arms, which contradicts the host rule that a move to another
runner reruns every arm and left the decision open after the data, and that its two-round "median" was the
larger of the two values, its reused admission check was timed after the bookkeeping, and several failure
paths still counted as success. A third start was stopped after two minutes, when a review noted that the
host rules ask for a fresh settled interval before every arm. Their admitted rows are kept in `results/release-1.0.4-stopped/` and
`results/release-1.0.4-stopped-2/` and are not used (`results/release-1.0.4-stopped-3/` holds the third
start, which admitted no unit). This plan keeps the second plan's savings (two rounds,
shorter timing windows, extension only for unsettled comparisons) and measures all twelve arms. Its
admission-check reuse was dropped: the host rules require a fresh interval before each arm.

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

Do the speed, memory, import and size figures of the comparison hold for all twelve arms, under the
preferred runners on the current runtimes, when no figure is kept unless the host was quiet right before
and right after it was measured?

## What is measured

All twelve arms, because the timer, the Node patch version (26.13.0 now, 26.12.1 for the published
figures), `@smithy/signature-v4` (5.7.5 now) and four clients changed: sigflint-A and sigflint-B (the
same build; the A/A control), aws4fetch, aws4, `@smithy/signature-v4`, aws-sig, `@wdl-dev/aws-sigv4`,
minio, s3mini, tiny-oss, lean-s3 and s3-lite-client. Nothing is carried forward from earlier releases.
Runtimes: Node 26.13.0 and Bun 1.4.4. Library versions are those of `bench/package-lock.json` (hash in
the freeze record). Workloads and corpora are unchanged.

| Part | What | Runner | Rounds | Counted processes |
|---|---|---|--:|--:|
| A | S3 header speed, four workloads, 12 arms | Tinybench 6.2.2 | 2 | 48 |
| B | other services and presigned URLs, 8 arms (final-1, final-2, aws4, aws4fetch, smithy, aws-sig, wdl, minio) | Tinybench | 2 | 32 |
| C | memory: allocation, run (GC, CPU, growth, peak RSS), signing-key cache (sigflint arms), 12 arms | runtime counters (heap, GC, `process.cpuUsage`, RSS) | 2 | 104 |
| D | import and first signature, 5 cold starts per arm and runtime, plus the no-library control | Hyperfine 2.0.0 | 2 | 260 |
| | allocation calibration, outside the claim sample | runtime counters | 1 | 2 |

Two rounds per arm, not the skill's default of three, is a count declared before the first run on the
owner's request of 2026-11-01 for shorter benchmarks; the extension to three to five rounds follows the
skill's rule for gaps inside the variation criterion, and a comparison still unresolved at five is
reported as inconclusive.

Total: 446 counted processes in 66 units (A 24, B 16, C 24, D 2), plus 52 uncounted Hyperfine warm-up runs. Rounds three to five are added only
for the arms in a comparison that is still unsettled after round two. Extension runs go into a new
result directory (`results/release-1.0.4-extension-N`) with `ARMS_LIST` naming those arms, `FROM_ROUND=3`
and the rounds argument raised to the last round wanted, under the same freeze; a result directory's
unit ids are complete once measured, so reusing a directory would skip them. The analysis pools the
named directories. The cap is five rounds. Size (`sizes.mjs`, `tiers.mjs`) is deterministic and is
measured once on the frozen build and the pinned libraries; the four clients' size is the signing code
only (s3mini: the whole client class), labelled as in `sizes.mjs`.

Timing windows (`WINDOW_S=0.5`, `WARMUP_MS=200`): each signing task runs at least 10 batches of 1,000
calls in about half a second after a warm-up of at least 4 batches and 0.2 s. Every cell records
`rmePct` (Tinybench's error of the mean) and `madPct` (the median absolute deviation of the batches
around the median that is reported); at one second the 2026-10-31 comparison recorded `rmePct` of 0.1 to
4%. The window is a choice for speed, not a measured sufficiency: the verdicts rest on the rounds' own
ranges and the A/A controls, which also absorb any extra noise from the shorter window. A cold start is one fresh process timed by Hyperfine as the arm's command time
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
only inside a part's run. A 10 s native Linux admission window must pass before every unit and after every unit (the host rules take post-run observations as diagnostic and ask for a fresh settled interval before the next arm, so the window that ends one unit does not start the next). Each window requires
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

Unmeasured estimate: 66 units have a lower bound of about 22 minutes of admission windows (a
before and an after window of 10 s for each unit); with the timed work, about two hours when the
host is quiet. The first plan's run admitted a part A unit about every 100 s including
refusals, which on this shared host puts the elapsed time between one and four hours. The 2026-10-31 comparison of the old and new timers on this
artifact (parts A and D under the same driver and tooling, not pooled with these results) and a pilot of
one part B and one part C unit with the calibration are the pilots; their numbers are in
`results/release-1.0.4-pilot.md`. `run-campaign.sh` stops the campaign, reported as incomplete with the
parts finished, if four hours of wall-clock time pass from its first attempt (`DEADLINE_S=14400`, kept in
`campaign-start` in the result directory) without all four parts ending; a finished part stays valid
and a later run may resume the unfinished parts in the same result directory.

## Rules fixed in advance

- A wrong-result row is retained and not timed; an unsupported workload is reported as such.
- Raw rows, admission receipts and observer receipts are kept unedited in `results/release-1.0.4/`; the stopped plans' partial results stay in `results/release-1.0.4-stopped/`, `-stopped-2/` and `-stopped-3/` and are not used.
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

`npm ci` in the repository and in `bench/`, `bun bench/compat/build-clients.mjs`, `npm run build` with Bun 1.4.4
and Hyperfine 2 on `PATH`. Stage the built files in a fresh result directory, which must not be
`bench/results/release-1.0.4` (that holds the recorded run and its `artifacts/` is untracked):
`mkdir -p bench/results/release-1.0.4-repeat/artifacts && cp dist/node.js dist/bun.js bench/results/release-1.0.4-repeat/artifacts/ && (cd bench/results/release-1.0.4-repeat/artifacts && sha256sum node.js bun.js > SHA256SUMS)`;
the two hashes must equal `results/release-1.0.4-artifacts.sha256`, which is also what the freeze
record names. Then, from the repository root,
`RESULTS=$PWD/bench/results/release-1.0.4-repeat FREEZE=$PWD/bench/results/release-1.0.4-freeze.json WINDOW_S=0.5 WARMUP_MS=200 REPS=5 DEADLINE_S=14400 ADMIT="python3 $PWD/bench/admit-native-linux.py" OBSERVER="python3 $PWD/bench/observe-unit.py --workload-cgroup auto" bash bench/run-campaign.sh $PWD/bench/results/release-1.0.4-repeat/artifacts 2`.
The client bundles `bench/compat/compiled` are ignored by git and their bytes differ between builds, so a repeat run
fails the recorded freeze at the compiled-bundle hashes; write a new freeze file for the repeat
(`bun bench/check-freeze.mjs <new freeze file> --write`, then pass it as `FREEZE`). Such a run repeats the
measurement; it does not reproduce the frozen bundles.
`RESULTS` must name a fresh directory: the default, `bench/results`, holds earlier releases' admission
receipts. `analyze-more.mjs` reads `RESULTS`; the other analyzers read fixed paths under
`bench/results`, so they run on copies of the files placed there after the run. The admission command
and observer are in this repository; the host's own lock path is the default.

## Limits of the harness that ran

Four behaviours of `run-campaign.sh` and `check-freeze.mjs` were found in review after the run and
did not occur in it. The `bench/` code that was frozen and measured is unchanged since the freeze commit `2685da5` (only the analysis
scripts, this protocol and one guard in `run-admitted.sh` changed after it: the cleanup of rows left by an
interrupted attempt now stops with exit 7 if `grep` fails, instead of replacing the raw file with a partial copy;
that failure did not occur in this run), so they are recorded here, not fixed, in this change, and are to be fixed in a later change before another
campaign:

- The controller runs each part from `bench/` and keeps the caller's `RESULTS` and artifact paths as given, so
  they must be absolute; this run passed absolute paths.
- `check-freeze.mjs` records the `bun` and `node` found on `PATH`; a campaign that selects other
  executables through the driver's environment is not covered by the check. This run used the default
  executables.
- The deadline is checked before each invocation of the driver, not between its units, so a part that
  starts before the deadline runs to its end; the 4-hour stop was not reached in this run (the first pass took
  60 minutes, the extension about an hour including waits for the lock).
- The campaign deadline is counted from the first `campaign-start`; a run resumed after it has
  expired stops at once. To resume one on purpose, delete `campaign-start` (the controller then records
  a new start). The extension run was resumed within the deadline.

The committed admission receipts have the home directory replaced by `~` and the checkout
directory by `<repo>`, and the per-user cgroup paths in the observer receipts by `<cgroup>`; no other field
was edited.
