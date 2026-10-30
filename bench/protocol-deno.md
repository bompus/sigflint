# Protocol: the Deno speed row

Declared 2026-10-30, before the figures were added to the README or `docs/benchmarks.md`.

Question: what are sigflint's signing times on Deno 2.9.6, and how do they compare with the libraries that run there?

Candidate: `dist/node.js`, the same build as the Node row, because that is the code path Deno gets (`node:crypto`). The build used was `sha256 7153026dd6ac0cd8...` (the Bun build for the same tree, `69009b478cae42d0...`, was made at the same time). It was built from `src/` at git tree `90a032d5d5296cca4471ac13dcacd154e5459ded` (commit `1f2ba50`) and matches the published `dist/node.js` for that tree; the copy is not kept in the repository.

Plan: `run-matrix.sh` with `RUNTIMES=deno`, 3 rounds, the same eight arms, four workloads and 1 s per process as the other rows, arm order reversed on even rounds, and a reset of the whole-machine CPU gate (≤ 20% busy, up to 8 retries 15 s apart) before every process. A result that differs from botocore is reported and not timed. The figure per cell is the median of the three rounds.

What differs from `protocol-rerun-3.md`:

- **No host admission.** The Windows-side CPU, memory and I/O checks, the lock and the before/after admission that the Node and Bun figures carry are not applied here. Only the per-process Linux CPU gate was used, so load that starts and ends between two processes is unobserved.
- **One runtime, not a pair.** There is no Node process back to back with each Deno process, so a shift in load affects the two rows differently. The Node and Bun tables come from an earlier session on Node 26.12.1 and Bun 1.4.4, and are not recomputed here.
- **Host state.** Load average ran between 1.84 and 4.51 during the run; every counted process saw a CPU gate of 13% or less before it and 9% or less after it.
- **Noise check.** The two control arms (sigflint measured twice per round) agree within 1.3% on every workload, which is the only noise figure this run has.

Limits: the load range is wider than the admitted runs, so the Deno figures are less firmly bounded than the Node and Bun ones. They are consistent enough to place sigflint against the other libraries, whose gaps are far larger than the spread.

Claim status: a first measurement on Deno. It confirms nothing earlier and corrects nothing.
