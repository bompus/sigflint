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
which goes first. The reporting band is the larger of 3% and twice the larger run-to-run range of
the two sigflint control arms (as in `protocol-rerun-3.md`).

## Host, admission and the lock

Native Linux, 24 logical CPUs, shared with other sessions. Each part runs through
`run-admitted.sh`, which re-executes once inside one `systemd-run` scope with a 2 GiB memory cap,
takes the host lock `~/.cache/setupLinuxHost/post-upgrade-bench.lock` without waiting, and holds it
only inside a part's run. Before and after every unit a 10 s native Linux admission window must pass
(at most 4 busy cores, at least 8 GiB available, no swap-out or zswap activity, memory full pressure at
most 10 ms and I/O full pressure at most 100 ms in any second), and the continuous observer
(`observe-unit.py`, the house-rules unit observer) must report a clean unit. A unit is a round of one
arm, or a whole round for part D. A refused unit gives up the lock; the driver retries after a minute
and holds nothing while it waits. A unit has at most four attempts. A unit that uses all four stays
missing and the arm's median uses the rounds it has; the number of rounds behind every figure is
reported. Free swap falling by more than 50 MB (parts A and B) or 64 MiB (parts C and D) while a
process runs rejects it. The host is shared, so refusals are expected; they are retained in the
admission receipts and are not edited.

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
`PATH`, then for each part
`ADMIT="python3 $PWD/bench/admit-native-linux.py" OBSERVER="python3 $PWD/bench/observe-unit.py --workload-cgroup auto" bash bench/run-admitted.sh <A|B|C|D> $PWD/bench/results/release-1.0.4/artifacts 3`
from `bench/`, with `RESULTS=` pointing at the result directory. The admission command and observer
are in this repository; the host's own lock path is the default.
