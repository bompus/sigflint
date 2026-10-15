# Protocol: the re-run on the code that ships

Declared before the counted runs (2026-10-14), in the worktree that holds the harness changes below. The earlier protocols (`protocol.md`, `protocol-more.md`, `memory-protocol.md`) still define each metric, workload, rejection rule and variation criterion; this one says what is measured again, why, and how many rounds.

Question: do the speed, memory and import figures still describe the code that is released? The speed and memory results predate commit 295ec6a (stricter input checks, one shared signing-key cache), and the one-file build that Node and Bun load (`dist/`) had not been timed for speed or peak memory.

Candidate: `dist/node.js` and `dist/bun.js`, built by `npm run build` from `src/` at git tree `6daf9b99`. The matrix and memory runs read a hashed copy of the two files plus `{"type":"module"}` (`SHA256SUMS` is checked first); `run-more.sh` reads `dist/` itself (`SRC`, hashed in `results/more-artifacts.sha256`). `bench/frozen/` is kept only as the reference build for part A of `protocol-more.md`. If `src/` changes before the record, every part is void.

## Rounds: a shorter plan (declared before the first counted run)

The user shortened the benchmark plan: they do not think as many or as long runs are needed. The earlier runs used 5 rounds per arm. This re-run uses:

- **3 rounds per arm** by default (one fresh process per arm, runtime and round; the arms alternate and the order is reversed on even rounds; the two sigflint arms are the A/A noise control, as before).
- **2 more rounds (rounds 4 and 5) only when a claim comparison is unsettled** after round 3: for a comparison the README states a result for (the speed ratios against the other libraries, the regression check against `frozen/`, and the memory and import comparisons against the other libraries), the two arms' min-max ranges over the rounds overlap, or the median gap is at most twice the reporting band (`max(3%, 2 x A/A spread)`; 6% floor for allocation). Cells with disjoint ranges and a larger gap do not trigger it. A round runs every arm, so an extension adds rounds 4 and 5 for the whole part, as a separate lock hold. The cap is 5 rounds.
- Range and round count are reported for every figure. A comparison still unsettled at the cap, or at 3 rounds when it was not extended, is reported as inconclusive or as no clear change. That is a result, not a failure.
- The import part keeps 7 fresh processes per arm and round (the round's value is their median); only the rounds are fewer.

The extension decision is taken from the part's own analysis after round 3 (`analyze.mjs`, `analyze-more.mjs`, `analyze-memory.mjs`) and written next to the results before the extension starts.

## Parts

Each part runs under the shared host lock; one part holds the lock until it ends.

| Part | What | Processes at 3 rounds | Earlier duration at 5 rounds |
|---|---|--:|---|
| A | S3 header speed matrix, 8 arms, Node and Bun (`run-matrix.sh`) | 48 | 14 min |
| B | other services and presigned URLs, and the regression check against `frozen/` (`run-more.sh`) | 66 | 13 min |
| C | memory: calibration, allocation, GC / CPU / growth / peak RSS, key-cache retention (`run-memory.sh`, `KINDS="alloc run cache"`) | 108 and 2 calibration | about 20 min (unmeasured separately) |
| D | import and first signature (`run-memory.sh`, `KINDS=import`) | 378 | 8 min |

Expected: about 3/5 of the earlier times (unmeasured until run).

Unchanged from the earlier protocols: arms, workloads, 7 import repetitions, the 20% busy gate with up to 8 retries, the swap and exit-status rejections, the A/A noise floor from the two sigflint arms and the band `max(3%, 2 x A/A spread)` (6% floor for allocation). Normal priority, all CPUs, no `nice` or `taskset`. Runtimes: whatever `node` and `bun` are installed when the part starts (recorded in each row; library versions in `frozen/versions.txt`). Rejected and errored rows stay in the raw files and are reported; a rejected part is repeated and the first attempt is reported, not hidden.

Claim status: a confirmation that the figures in the README describe the shipped code, with fewer rounds than the first measurement. A change inside the band is "no clear change".
