# Protocol: Bun's SHA-256 against node:crypto, and encodeURIComponent in the presigner

Declared 2026-10-29 16:58 MDT (22:58 UTC), before the counted run.

Two questions, from issue #23:

1. **Which SHA-256 is faster on Bun?** The Bun build hashes with `Bun.SHA256.hash(data, 'hex')` (`hexHash` in `src/bun.js`); the Node build uses `crypto.hash('sha256', data, 'hex')` (`src/node.js`), which Bun also provides. Which is faster on Bun, for what sigflint hashes? Node's `crypto.hash` is measured alongside for reference.
2. **How much of the presigner's time is `encodeURIComponent`?** Presigning was slower on Bun than on Node in `results/rerun-3-node-bun.md` (Bun 1.4.3). In the 1.0.2 run (`results/release-1.0.2/node-bun-pairing.md`, Bun 1.4.4) Bun is ahead on both presigned-URL rows, so the share is measured on each runtime and any difference between runtimes is attributed only if a Bun slowdown is still there.

Nothing in `src/` changes. Switching the Bun build's hash would be a separate change.

## What is measured

One process per runtime and round runs `hash-encode.mjs`. Every case is one call, timed as ns per call: the median of 15 batches of a fixed number of calls, after a warm-up of 5,000 to 300,000 calls, which is well past the roughly 12,000 calls in which Bun's top compiler tier compiles (`docs/benchmarks.md`). Each arm is timed in two passes in the same process, A in one order and B in the reverse order; the A and B passes of the same arm are the A/A control. The call counts per batch and warm-up are recorded in every row.

| Group | Case | Arms (runtime) |
|---|---|---|
| hash | string to sign (about 130 bytes), canonical request (284 bytes), 1 KiB body as a string, 1 KiB body as bytes, 64 KiB body as bytes | `crypto.hash` (Node and Bun), `Bun.SHA256.hash` (Bun only; Node has no such call) |
| encode | the credential string of an execute-api and an S3 request, the signed-headers string `host`, a 12-character session token (as in the corpus) and a 400-character synthetic token | `encodeURIComponent` alone, and `encodeQueryPart` (`src/presign.js`, what the presigner calls) |
| presign | `presign` from `src/node.js` or `src/bun.js` on corpus requests `p-execute-api-0031` (the `presign-any` speed workload), `p-s3-0003` (`presign-s3`) and `p-s3-0008` (a request with a session token, timed but not analysed: see the limits) | the production presigner |

Checks outside the timed region, before any timing: every hash arm must return the reference SHA-256 of its input (computed with `crypto.createHash`), and the presigner's output at the corpus's own clock must end with botocore's signature recorded in the corpus. A process that fails a check exits with an error row and the unit is not counted. Every row records the SHA-256 of its input and of its checked output; the analysis requires them to agree across runtimes.

Inventory: 5 hash cases with 2 arms on Bun and 1 on Node, 5 encode cases with 2 arms, 3 presign cases with 1 arm, on 2 runtimes. Nothing is untested or unsupported except `Bun.SHA256.hash` on Node.

## Candidate, runtimes, source

- Source: `src/` at tree `90a032d5` (the tree of the 1.0.2 and 1.0.3 releases), read directly from the repository, not from a built bundle; the Bun build and the Node build differ only in the primitives passed to the shared signer and presigner, which these cases call through their exported entry points.
- Runtimes: Bun 1.4.4 (`1.4.4+38afee6c8`, sha256 of the binary `10702245…`, the latest release as of 2026-10-22) and Node.js 26.13.0 (the host's default). The earlier runs used Node 26.12.1; no Node figure here is compared with them. The runtime's own version string is in every row.
- Normal priority, all available CPUs, no affinity, no memory cap (each process stays well under 1 GiB). The effective priority is recorded in each header row.

## Rounds, admission, repetition

- Rounds: 3, one process per runtime in each (6 counted processes), node first in odd rounds, bun first in even rounds. Extension, declared here: if any comparison classified below is unsettled after round 3, rounds 4 and 5 are run for every arm (the default stopping rule: 3, plus 2 only for unresolved comparisons, cap 5). A comparison still unsettled at 5 rounds is reported as inconclusive; nothing is added beyond 5.
- Host: the host's shared benchmark lock (the file `BENCH_LOCK` names) is held for the whole run, and `admit-native-linux.py` (10 s window: at most 4 busy cores on average, at least 8 GiB available, no swap-out or zswap activity, the memory and I/O pressure limits, or their stand-ins where the kernel offers no pressure files) runs before the first unit and after every unit. A unit counts only when the check before it and the check after it both admit. A unit that fails is kept in `results/hash-encode/not-admitted.jsonl` and measured again, up to 4 attempts per round. The driver is `run-hash-encode.sh`; the receipt of every check is `results/hash-encode/admission.jsonl`.
- Trial: before this protocol the script ran once on each runtime, without the lock or a host check, to see that it works (about 12 s each). Those rows are not counted and not committed.

## Variation criterion and verdicts (preset)

- The round value of an arm is the mean of its A and B passes. The A/A spread of an arm in a round is |A - B| divided by their mean.
- For a comparison of two arms (base and other) on one case: the band is max(3%, 2 x the largest A/A spread of either arm in any round), as a share of the base median, with an absolute floor of 2 ns. **Clear** when the medians differ by more than the band, the min-max ranges over the rounds do not overlap and the sign of the difference is the same in every round. **No clear change** when the medians differ by no more than the band. **Unsettled** otherwise.
- Question 1 compares `crypto.hash` (base) with `Bun.SHA256.hash` on Bun, per case. Question 2's decision comparison is the presign call, Node against Bun, per workload. Every other Node-against-Bun pair is reference only: reported with the same rule, never extended.
- The share of the presign call is reported as median and range over the rounds of (the isolated time of the encoder calls one presign makes) divided by (the presign time of the same process and round). The calls are the credential string and the signed-headers string (`host` for both workloads analysed).
- If `Bun.SHA256.hash` is not clearly faster on the cases that match what sigflint hashes (the string to sign and the canonical request, which every signature hashes), the issue's condition for changing the hash is not met. If `crypto.hash` is clearly faster on Bun for any case, that is reported to the maintainer as an offer; the code is not changed here.

## Plan and forecast

Whole task started 2026-10-29 (the afternoon the assignment arrived). The counted run is 6 processes of about 12 to 13 s each, with 10 s host checks around each unit: forecast about 4 minutes (unmeasured for the counted run, from the two trial runs), at most about 8 minutes with the extension to 5 rounds, before any retry. Raw rows and receipts are in `results/hash-encode/`; `analyze-hash-encode.mjs` writes `summary.json` and `report.md` from them.

## Limits

One host, one Bun version, one Node version, synthetic inputs (the corpus requests, one fixed string to sign and canonical request, deterministic pseudo-random bodies, one synthetic long token). The encoder share is an estimate from separate timings of the encoder calls and the presign call, not a measurement inside the presigner (the presigner is not run with its encoder removed, because that would change its output). The timings are wall time per call after warm-up; they do not include JIT warm-up or CPU on background threads (see `docs/benchmarks.md`, CPU per call and warm-up). The results hold for Node.js 26.13.0 and Bun 1.4.4 on this machine.

The request with a session token (`p-s3-0008`) signs the headers `content-md5;host;x-amz-meta-a`, not `host`; that string was not among the timed encoder inputs, so its share of the presign call cannot be computed from this run. Its presign rows are kept in `raw.jsonl` and are not analysed or reported.
