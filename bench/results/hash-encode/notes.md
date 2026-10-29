# Bun's SHA-256 against node:crypto, and encodeURIComponent in the presigner: notes

Protocol: [`../../protocol-hash-encode.md`](../../protocol-hash-encode.md), committed 2026-10-29 16:58:16 MDT, eight seconds before the counted run started (16:58:24). Raw rows: `raw.jsonl`; host-check receipts: `admission.jsonl`; analysis: `report.md` and `summary.json`, written by `analyze-hash-encode.mjs`. Source: `src/` at tree `90a032d5`. Runtimes: Bun 1.4.4 (`1.4.4+38afee6c8`, binary sha256 `10702245…`, the latest release) and Node.js 26.13.0 (binary sha256 `0adde40d…`), on one native Linux host.

## Run

- 3 rounds, one process per runtime in each (6 counted processes), node first in odd rounds, bun first in even rounds, under the host benchmark lock. Counted run 16:58:24 to 17:00:12 MDT (1.8 minutes; the forecast was about 4 minutes, so the measured time was under half of it). Nothing was extended: no comparison was unsettled after round 3.
- 3 units admitted at the first attempt, 0 refused, 0 error rows. 4 host checks, all admitted. The check before the first unit read a mean of 3.18 busy cores (limit 4; its busiest second was 5.13) and the three after read 1.28, 0.69 and 0.98. Memory and I/O pressure files were available; the largest memory pressure in any check was 0.92 ms per second and the largest I/O pressure 1.9 ms per second. At least 86.9 GiB of memory was available. The source of the load before the first unit was not identified; the host was shared and nothing was paused.
- Normal priority (0), all CPUs, no cap. Every process printed the same SHA-256 of its input and of its checked output for every case; the analysis finds them identical across all six processes and both runtimes.
- A trial of the script on each runtime ran before the protocol (no lock, no host check, about 12 s each); it is not counted and not kept.
- After the run, the header rows were rewritten to keep the local path of the runtime executable out of the public record: `execPath` became `executable` (the file name, `node` or `bun`), and `hash-encode.mjs` now writes that field. Nothing else in `raw.jsonl` changed; the analysis gives the same report before and after.

## Findings

**Question 1: `Bun.SHA256.hash` is faster than `crypto.hash` on Bun for everything up to 1 KiB, and the same at 64 KiB.** Clear in every case below 64 KiB, outside the band, with disjoint ranges and the same sign in all 3 rounds:

| Input | `crypto.hash` | `Bun.SHA256.hash` | Benefit |
|---|--:|--:|--:|
| string to sign (about 130 bytes) | 134.1 ns | 99.4 ns | 25.9% less time (1.35x) |
| canonical request (284 bytes) | 156.7 ns | 129.3 ns | 17.5% less time (1.21x) |
| 1 KiB body, string | 303.3 ns | 277.3 ns | 8.6% less time (1.09x) |
| 1 KiB body, bytes | 298.8 ns | 271.8 ns | 9.1% less time (1.10x) |
| 64 KiB body, bytes | 12,995 ns | 12,981 ns | no clear change |

The Bun build already hashes with `Bun.SHA256.hash`, so the measurement supports the current code. The issue's condition for changing the hash (`crypto.hash` faster on Bun) is not met in any case. For reference, Node's `crypto.hash` takes 167.6, 198.7, 360.4, 331.0 and 13,048 ns on the same inputs; Bun's `crypto.hash` is 9.7% to 21.1% faster than Node's on the four inputs up to 1 KiB and no different at 64 KiB.

**Question 2: the encoders are 5.5% to 7.1% of a presign call on Bun and 4.7% to 6.1% on Node, and there is no Bun slowdown to attribute in this run.** In `report.md`, the share of the presign call spent in `encodeQueryPart` (the credential, the signed-headers string, and the token when there is one) is 6.3% (any service), 5.5% (S3) and 7.1% (S3 with a session token) on Bun, against 5.4%, 4.7% and 6.1% on Node. `encodeURIComponent` alone is 5.1%, 4.4% and 5.7% on Bun and 3.0%, 2.5% and 3.2% on Node. The presign call itself shows no clear difference between the runtimes: Bun's median is 1.6% to 3.5% above Node's, inside bands of 6.9% to 11.3%. Presigning took 2.72 to 3.18 µs on Bun and 2.65 to 3.13 µs on Node. The slowdown of `rerun-3-node-bun.md` (Bun 1.4.3: 4.50 and 5.00 µs against 3.37 and 3.64 µs) is not present on Bun 1.4.4; the 1.0.2 run also had Bun ahead on both presigned-URL rows. Where Bun's median is above Node's, the larger encoder time on Bun (28 to 35 ns per presign, about 1% of the call) would cover only part of it.

`encodeURIComponent` on its own is clearly slower on Bun than on Node for these strings, by 59% to 142% (1.6 to 2.4 times as long: 102.6 against 64.5 ns for the credential string, 37.3 against 15.4 ns for `host`, 406 against 246 ns for a 400-character token). That is the behaviour reported in oven-sh/bun#45700. `encodeQueryPart`, which adds a replace step, is 14% to 48% slower on Bun, because the replace step costs less on Bun (11 to 16 ns against 25 to 39 ns).

## Decision

- Hash: **reject a change.** Keep `Bun.SHA256.hash` in the Bun build; `crypto.hash` is not faster on Bun in any measured case.
- Encoder share: **adopt as measured.** Encoding is about 5 to 7% of a presign call on both runtimes; nothing in the presigner needs to change for the share. The Node-against-Bun gap on `encodeURIComponent` is already filed upstream (#45700); nothing new to file from this run.

## Limits

One host, one Bun version, one Node version; synthetic inputs (the corpus requests, one fixed string to sign and canonical request, deterministic pseudo-random bodies, one synthetic 400-character token). The encoder share is an estimate from separate timings, not a measurement inside the presigner. Timings are wall time per call after warm-up and do not include JIT warm-up or background-thread CPU. The results hold for Node.js 26.13.0 and Bun 1.4.4 on this machine; the earlier runs used Node 26.12.1.
