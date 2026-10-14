# Protocol: the split layout and the signers beyond S3 headers

Declared before the runs; written to `bench/protocol-more.md` and committed with the harness. `protocol.md` still governs the S3 header benchmark.

## Questions

A. Regression. Does the 1.0 module layout (`src/`: header signer, presigner, SigV4a, chunks and events in separate modules, loaded lazily) change the speed of S3 header
   signing against `bench/frozen/` (the build the README speed tables were measured on)?
B. Other services and presigned URLs. How does `src/` compare with the other libraries on requests for services other than S3 and on presigned URLs, among the
   libraries that sign them correctly? The workloads that only sigflint offers (SigV4a, chunked uploads, event streams) are timed alone.

## Arms, workloads, runs

- A: arms `frozen`, `final-1`, `final-2` (`final-1` and `final-2` are the same `src/` code, the A/A control). Workloads: the four of `speed.mjs` (`bench-download`, `bench-part-put`, `bench-encode`,
  `bench-body-1k`), unchanged. Node and Bun, 5 rounds, one fresh process per (round, runtime, arm), arm order reversed on even rounds: 3 x 2 x 5 = 30 processes.
- B: arms `final-1`, `final-2`, `aws4`, `aws4fetch`, `smithy`, `aws-sig`, `wdl`, `minio`. Workloads (`speed-more.mjs`): `any-post-json` (DynamoDB, POST with a JSON body), `any-token` (API Gateway,
  session token), `any-query` (SQS, query parameters), `presign-any` (API Gateway), `presign-s3`; sigflint alone: `sigv4a-header`, `sigv4a-presign`, `chunk-64k`, `chunk-end-trailer`, `event-4k`.
  Node and Bun, 5 rounds, order reversed on even rounds: 8 x 2 x 5 = 80 processes.
- Unit: one call that returns the signature, the clock read by the library. Before timing, each library's result is checked against botocore with a frozen clock; a wrong result is reported as such and not timed.
  Each process times batches of about 50 ms for one second after 0.3 s of warm-up and reports the median per call.
- Summary: median over rounds. Band: the larger of 3% and twice the A/A spread, where the spread is the larger of the two control arms' ranges over rounds and the gap between their medians, as a
  percentage of their pooled median. A gap inside the band is "no clear change". The other libraries are called through their usual public API (`adapters-more.mjs`).

## Rejection and controls

- A process is rejected when the whole machine is more than 20% busy over the second before it starts (up to 8 waits of 15 s, then rejected), when free swap drops by more than 50 MB while it runs, or when it exits with an error.
  Rejected processes stay in the raw file and are reported.
- The host lock `~/.cache/bench-host.lock` is held for the whole run. Normal priority, all CPUs, no other work from the session while it runs.
- Artifacts: `src/` and `bench/frozen/` are hashed in `results/more-artifacts.sha256` before the first run; the run refuses to start if a hash differs.

## Claim status

The run is a confirmation of the final code, with the control arms above; it is not the three-library S3 protocol. Cross-library ratios are reported with their band.
