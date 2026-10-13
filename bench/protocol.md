# Signer speed protocol

Declared before the timed runs. The results are in `results/speed-raw.jsonl` and `results/speed-summary.json`.

Question: how long does each signer take to produce the SigV4 Authorization for S3 requests, on Bun and on Node.js?
Candidate: sigflint, from a frozen copy of `src/` in `bench/frozen/` (hashes in `frozen/SHA256SUMS`); the Bun process runs `frozen/bun.js` and the Node process runs `frozen/node.js`.
Others: aws4fetch, aws4, @smithy/signature-v4, aws-sig, @wdl-dev/aws-sigv4, minio signV4 (versions in `frozen/versions.txt`).
Not timed, with reasons: `Bun.S3Client.presign` (query-string signing, a different request form), `@aws-lite/client` (wraps aws4).

Workloads (4, the `bench-*` cases in `test/corpus.json`): GET of a plain key; part PUT with `?partNumber&uploadId`, `x-amz-acl` and an unsigned payload; GET with a path and query that need encoding; PUT with a 1 KiB signed body.

Timed region: one call that returns the signature. It includes the library call plus the adapter's input building and output parsing; the adapter work has the same shape in every arm. URL objects are parsed once per case. Async signers are awaited. Setup, import and compilation are not timed.
Warm-up 0.3 s, then batches of about 50 ms for 1 s; the per-process result is the median batch time per call.
Correctness gate: before timing, each arm's signature for the workload must equal the botocore reference (fixed clock). A wrong result is reported and not timed.

Frozen artifact: `frozen/` holds the final `src/` files (core, node, bun, web); `SHA256SUMS` is checked against `src/` before the run.

Arms: 8 (sigflint-A, sigflint-B, and 6 others). sigflint-A and sigflint-B are the same code in separate processes: the A/A noise floor. Runtimes: 2. Rounds: 5. One process per (round, runtime, arm); the arm order is reversed on even rounds. 80 processes, 4 workloads each.

Variation criterion (preset): the reporting band for a workload and runtime is max(3%, 2 x the larger of the A and B run-to-run ranges). A difference is clear only when the median gap is outside the band and the two arms' ranges do not overlap. Otherwise: no clear change.
Run rejection (preset): whole-machine CPU busy over the 1 s before a process above 20%, after up to 8 retries 15 s apart. Rejected runs are kept in the raw file, listed, and excluded. The CPU busy figure after each process is recorded as a diagnostic.
Scheduling: normal priority, all CPUs, no `nice` or `taskset`.

Limits: the signing date is fixed for the libraries that take one, so their signing-key caches hit as they would within a day in production; no network; synthetic requests.
