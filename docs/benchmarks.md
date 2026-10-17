# Benchmarks, tests and limits

How sigflint compares with the other libraries, and how it is checked. The summary is in the [README](../README.md).

The speed, memory, import and size figures were measured on the code that ships: the built file that Node and Bun load, from the same source as `src/`. The benchmarks are re-run on the code of each release before it is published. This release is 1.0.1; the figures were measured on 2026-10-17 while `package.json` still said 1.0.0, on source tree `712d1eb2` and the built files `dist/node.js` (`439a387d`) and `dist/bun.js` (`21a8a862`), which are byte for byte what 1.0.1 builds (`bench/results/more-artifacts.sha256`). The re-run for this release used a shorter plan ([`bench/protocol-rerun-3.md`](../bench/protocol-rerun-3.md), which keeps [`bench/protocol-rerun-2.md`](../bench/protocol-rerun-2.md) and [`bench/protocol-rerun.md`](../bench/protocol-rerun.md)): 3 rounds per library, and 2 more only for parts where a comparison was unsettled, with Node and Bun measured back to back for each library and round and the host checked before and after each pair; every range and round count is given with the figures, and [`bench/results/rerun-3-notes.md`](../bench/results/rerun-3-notes.md) records which parts were extended and why. The earlier run of 2026-10-16, which checked the host once around each part, is kept in `bench/results/rerun-2-per-process-gate/`; its Bun wall-clock times were higher than these (for example about 18% against Node on a plain S3 GET, about 5% here), and they are not pooled with these.

## Runtimes

<!-- BEGIN runtimes -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="runtimes-dark.svg">
  <img alt="Grid: which runtimes each library runs on" src="runtimes-light.svg">
</picture>

| Library | Node.js | Bun | Deno | Workers + nodejs_compat | Workers, no flag |
|---|:-:|:-:|:-:|:-:|:-:|
| **sigflint** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **sigflint/web** | ✓ | ✓ | ✓ | ✓ | ✓ |
| aws4fetch | ✓ | ✓ | ✓ | ✓ | ✓ |
| aws4 | ✓ | ✓ | ✓ | ✓ | ✗ |
| @smithy/signature-v4 | ✓ | ✓ | ✓ | ✗ | ✗ |
| @smithy/signature-v4 (web hash) | ✓ | ✓ | ✓ | ✓ | ✓ |
| aws-sig | ✓ | ✓ | ✓ | ✓ | ✓ |
| @wdl-dev/aws-sigv4 | ✓ | ✓ | ✓ | ✓ | ✓ |
| minio | ✓ | ✓ | ✓ | ✓ | ✗ |

Runtimes: node 26.12.0, bun 1.4.3, deno 2.9.6; Workers run in local workerd through wrangler (see bench/frozen/versions.txt). ✗ cells: smithy on Workers + nodejs_compat: Hash.bind is not a function; aws4 on Workers, no flag: does not load (bundle error); smithy on Workers, no flag: Hash.bind is not a function; minio on Workers, no flag: does not load (bundle error).
<!-- END runtimes -->

Each library signed one S3 GET on each runtime and was checked against botocore's signature. The grid ran on 2026-10-16 on the code that is released (source tree `712d1eb2`, run while `package.json` still said 1.0.0; the built package as each runtime resolves it): one signature per library and runtime, so it shows that each signature matched, not how often it does. “Workers” ran in a local workerd through wrangler, not on Cloudflare's network. `smithy` needs a SHA-256 class you supply; the “web hash” row passes it `@aws-crypto/sha256-js`, and its default Node one does not run in workerd. sigflint has three code paths so that each runtime gets the fastest primitive it has: Bun uses its own hasher, Node and Deno use `node:crypto`, and Workers and browsers use WebCrypto. A plain `import 'sigflint'` selects the right one; `sigflint/web` forces the WebCrypto one on any runtime.

## Correctness

<!-- BEGIN correctness -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="correctness-dark.svg">
  <img alt="Bar chart: how many requests each library signs the same as botocore" src="correctness-light.svg">
</picture>

Requests whose signature equals botocore’s (same key, same clock). The version in the table is the one `package.json` said when the corpus ran: sigflint's row is the source of 1.0.1 (tree `712d1eb2`), before the version was changed.

| Library | Version | Ordinary requests (1,520) | Edge cases (1,522) |
|---|---|--:|--:|
| **sigflint** | 1.0.0 | 1,520 (100.0%) | 1,522 (100.0%) |
| aws4fetch | 1.0.20 | 1,408 (92.6%) | 595 (39.1%) |
| aws4 | 1.13.2 | 1,264 (83.2%) | 268 (17.6%) |
| @smithy/signature-v4 | 5.7.4 | 904 (59.5%) | 236 (15.5%) |
| @wdl-dev/aws-sigv4 | 3.0.4 | 666 (43.8%) | 44 (2.9%) |
| minio | 8.0.7 | 526 (34.6%) | 3 (0.2%) |
| aws-sig | 2.1.0 | 226 (14.9%) | 12 (0.8%) |
<!-- END correctness -->

The reference is botocore's S3 signer (`S3SigV4Auth`), run with a fixed clock on the same requests after `conformance/oracle.py` has normalized each path and query, plus the four example signatures printed in the S3 documentation. “Ordinary requests” are valid S3 requests: keys and queries with spaces, unicode, reserved characters, repeated and unsorted parameters. “Edge cases” are requests a strict reading of the specification covers but most libraries do not: a stray `%` or invalid UTF-8 in the URL, a raw `+` in the path, a query pair with an empty name, and headers some libraries never sign (`date`, `range`). sigflint also passes all 316 requests with a session token; the others were not run on those. The sigflint row shows version 1.0.0, the version in `package.json` when this comparison ran on the code that is released; the release may carry a later number. `npm test` checks the shipped code against the same corpus (`test/corpus.json`, 3,360 requests).

Some of the other libraries expect the caller to canonicalize the path and query first. When the harness hands `@smithy/signature-v4` botocore's canonical path and query, it matches 1,519 of the 1,520 ordinary requests; `minio` matches 1,320 of them (`bench/results/screen-node.json`). The table above is what each library produces when given the URL as an application has it.

### Other services and presigned URLs

Requests whose signature equals botocore's, from `bench/compat-more.mjs` (each library called through its normal public API; same fixed clock). The sigflint row is `npm test` on the same corpora:

<!-- BEGIN pic-compat-more -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="compat-more-dark.svg">
  <img alt="Bar chart: how many header and presigned-URL requests for other services each library signs the same as botocore" src="compat-more-light.svg">
</picture>
<!-- END pic-compat-more -->

| Library | Header signing, other services (1,622) | Presigned URLs, other services (696) | Presigned URLs, S3 (777) |
|---|--:|--:|--:|
| **sigflint** | 1,622 (100%) | 696 (100%) | 777 (100%) |
| @smithy/signature-v4 | 1,622 (100%) | 696 (100%) | 777 (100%) |
| aws4fetch | 1,371 (84.5%), 251 it cannot express | 696 (100%) | 777 (100%) |
| aws4 | 930 (57.3%) | 696 (100%) | 777 (100%) |
| aws-sig | 776 (47.8%) | 183 (26.3%) | 0 |
| @wdl-dev/aws-sigv4 | 826 (50.9%), 223 it cannot express | cannot presign | cannot presign |
| minio | S3 only | S3 only | 598 (77%) |

Read the `aws4` row with care: all 692 differences are headers that `aws4` itself adds and signs (`content-length`, a default `content-type`), which is its documented behaviour, so its signature is valid for the request it sends. The reference does not add them. Presigned URLs where the caller opts out of payload signing (127 cases) are not shown: every library differed from botocore there, which points at the comparison rather than at the libraries. `aws-sig` differs on special characters, session tokens and unsigned payloads; the cause was not investigated. SigV4a, chunked uploads and event streams have no counterpart in these libraries (except `@smithy/signature-v4` for chunks and events, against which they are tested).

## Speed

<!-- BEGIN speed -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="speed-dark.svg">
  <img alt="Bar chart: time to sign one request on Node.js and Bun" src="speed-light.svg">
</picture>

Microseconds per signature, median of 3 processes. “wrong signature” means the library’s result differed from botocore’s for that request, so it was not timed; a blank means the library does not offer that API.

**Node 26.12.0**

| Library | GET, plain key | part upload (query, headers) | GET, key and query to encode | PUT, 1 KiB body |
|---|--:|--:|--:|--:|
| **sigflint** | **1.31** | **1.64** | **2.21** | **2.31** |
| aws4fetch | 232.63 | 223.89 | 235.23 | 216.90 |
| aws4 | 5.56 | 6.66 | 7.97 | 6.29 |
| @smithy/signature-v4 | 9.63 | 9.90 | wrong signature | 11.17 |
| aws-sig | 55.46 | wrong signature | wrong signature | wrong signature |
| @wdl-dev/aws-sigv4 | 724.93 | 618.06 | 720.21 | wrong signature |
| minio | 10.92 | 10.71 | wrong signature | 11.71 |

**Bun 1.4.3**

| Library | GET, plain key | part upload (query, headers) | GET, key and query to encode | PUT, 1 KiB body |
|---|--:|--:|--:|--:|
| **sigflint** | **1.38** | **1.97** | **2.67** | **2.58** |
| aws4fetch | 212.79 | 208.19 | 224.29 | 215.72 |
| aws4 | 5.83 | 8.04 | 9.72 | 7.80 |
| @smithy/signature-v4 | 9.20 | 8.54 | wrong signature | 9.42 |
| aws-sig | 38.65 | wrong signature | wrong signature | wrong signature |
| @wdl-dev/aws-sigv4 | 580.14 | 540.06 | 559.73 | wrong signature |
| minio | 6.99 | 7.40 | wrong signature | 8.01 |

Reporting band (the larger of 3% and twice the larger run-to-run range of the two sigflint control arms): node 26.12.0 bench-download: 5%; node 26.12.0 bench-part-put: 5%; node 26.12.0 bench-encode: 8%; node 26.12.0 bench-body-1k: 4%; bun 1.4.3 bench-download: 44%; bun 1.4.3 bench-part-put: 31%; bun 1.4.3 bench-encode: 30%; bun 1.4.3 bench-body-1k: 32%. Every gap between sigflint and another library is far outside its band.

<!-- END speed -->

### Other services, presigned URLs, and the 1.0 layout

These were measured under [`bench/protocol-more.md`](../bench/protocol-more.md): the same fresh-process method as above, 5 rounds (3 rounds were not enough to settle the check against the older code, so rounds 4 and 5 were added), a second copy of sigflint as the noise control. The older code is the S3 header code from before it was split into modules and hardened; part A re-times it against the shipped build.

**S3 header signing, older code and shipped build** (nanoseconds per call; positive change is slower):

| Runtime | Workload | Before | After | Change | Reporting band | |
|---|---|--:|--:|--:|--:|---|
| node 26.12.0 | bench-download | 1,285 | 1,321 | +2.8% | 9.4% | no clear change |
| node 26.12.0 | bench-part-put | 1,569 | 1,654 | +5.4% | 5.4% | no clear change |
| node 26.12.0 | bench-encode | 2,127 | 2,178 | +2.4% | 6.2% | no clear change |
| node 26.12.0 | bench-body-1k | 2,243 | 2,318 | +3.3% | 6.0% | no clear change |
| bun 1.4.3 | bench-download | 1,370 | 1,366 | -0.3% | 33.7% | no clear change |
| bun 1.4.3 | bench-part-put | 1,783 | 1,830 | +2.6% | 30.2% | no clear change |
| bun 1.4.3 | bench-encode | 2,780 | 2,707 | -2.6% | 35.9% | no clear change |
| bun 1.4.3 | bench-body-1k | 2,645 | 2,631 | -0.5% | 27.9% | no clear change |

No workload changed outside its band, but the Node differences (+2.4% to +5.4%) all point the same way, so the shipped build may be a few percent slower on Node than the older code; those gaps are inside the bands (5.4% to 9.4%, the `bench-part-put` gap equals its band) and 5 rounds cannot separate them. On Bun the differences are -2.6% to +2.6% inside bands of 28% to 36%. Restoring the fixed-string path for a request with no extra signed headers and no session token (the usual request) removed a larger slowdown that an earlier version of the split had.

**node 26.12.0**, microseconds per call (times as long as sigflint in brackets):

<!-- BEGIN pic-speed-more-node -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="speed-more-node-dark.svg">
  <img alt="Bar chart: time to sign other-service and presigned-URL requests on Node.js" src="speed-more-node-light.svg">
</picture>
<!-- END pic-speed-more-node -->

| Request | sigflint | aws4 | aws4fetch | @smithy/signature-v4 | aws-sig | @wdl-dev/aws-sigv4 | minio |
|---|--:|--:|--:|--:|--:|--:|--:|
| DynamoDB POST, JSON body | **1.75** | wrong signature | 322.64 (184.0×) | 11.20 (6.4×) | 54.66 (31.2×) | wrong signature | wrong signature |
| API Gateway GET, session token | **1.57** | 4.93 (3.1×) | 287.89 (183.0×) | 9.56 (6.1×) | wrong signature | 732.32 (465.6×) | wrong signature |
| SQS, query parameters | **1.85** | 6.31 (3.4×) | 291.20 (157.2×) | 10.64 (5.7×) | 55.26 (29.8×) | 692.50 (373.9×) | wrong signature |
| presigned URL, API Gateway | **3.38** | 10.67 (3.2×) | 322.65 (95.4×) | 11.65 (3.4×) | wrong signature | wrong signature | wrong signature |
| presigned URL, S3 | **3.64** | 10.82 (3.0×) | 237.95 (65.3×) | 12.34 (3.4×) | wrong signature | wrong signature | 13.42 (3.7×) |

**bun 1.4.3**, microseconds per call (times as long as sigflint in brackets):

<!-- BEGIN pic-speed-more-bun -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="speed-more-bun-dark.svg">
  <img alt="Bar chart: time to sign other-service and presigned-URL requests on Bun" src="speed-more-bun-light.svg">
</picture>
<!-- END pic-speed-more-bun -->

| Request | sigflint | aws4 | aws4fetch | @smithy/signature-v4 | aws-sig | @wdl-dev/aws-sigv4 | minio |
|---|--:|--:|--:|--:|--:|--:|--:|
| DynamoDB POST, JSON body | **1.66** | wrong signature | 213.91 (129.1×) | 9.74 (5.9×) | 37.91 (22.9×) | wrong signature | wrong signature |
| API Gateway GET, session token | **1.48** | 4.34 (2.9×) | 213.62 (144.0×) | 8.95 (6.0×) | wrong signature | 550.54 (371.2×) | wrong signature |
| SQS, query parameters | **2.12** | 5.51 (2.6×) | 218.65 (103.0×) | 10.15 (4.8×) | 38.14 (18.0×) | 579.74 (273.2×) | wrong signature |
| presigned URL, API Gateway | **4.55** | 11.61 (2.5×, no clear change) | 231.09 (50.8×) | 12.21 (2.7×, no clear change) | wrong signature | wrong signature | wrong signature |
| presigned URL, S3 | **5.02** | 11.14 (2.2×, no clear change) | 217.38 (43.3×) | 12.77 (2.5×, no clear change) | wrong signature | wrong signature | 9.31 (1.9×, no clear change) |

“Wrong signature” means the result differed from botocore's for that request, so it was not timed; for `aws4` that is the headers it adds and signs itself (see above), and `minio` signs S3 only. Reporting band (the larger of 3% and twice the spread of the two sigflint arms): Node 8% to 18%, Bun 49% to 110%, so the Bun ratios are much less precise than the Node ones. On Node every gap shown is far outside its band. On Bun the gaps against `aws4fetch`, `aws-sig` and `@wdl-dev/aws-sigv4` are far outside theirs. Five Bun presigned-URL comparisons are not clear after 5 rounds: the ranges of the two arms overlap or the gap is within twice the band, namely `aws4` and `@smithy/signature-v4` on both presigned-URL requests and `minio` on the S3 one. They are shown as no clear change, and their multipliers are not a claim.

Only sigflint offers SigV4a (`@smithy/signature-v4` also offers chunked uploads and event streams, which were not timed here). Microseconds per call, Node / Bun: SigV4a headers 15.1 / 13.3, SigV4a presigned URL 17.0 / 16.6, one 64 KiB chunk 32.5 / 31.1, the last chunk with a trailer 3.0 / 1.8, a 4 KiB event 11.2 / 11.7. SigV4a is dominated by the ECDSA signature.

## Memory

<!-- BEGIN memory -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="memory-alloc-dark.svg">
  <img alt="Bar chart: heap allocated per signature on Node.js and Bun" src="memory-alloc-light.svg">
</picture>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="memory-gc-dark.svg">
  <img alt="Bar chart: garbage-collection pause per 10,000 signatures on Node.js and Bun" src="memory-gc-light.svg">
</picture>

**Node 26.12.0**, plain GET of one key:

| Library | Heap allocated per call | Collections per 10,000 calls | GC pause per 10,000 calls | Peak memory of the process | Import + first signature |
|---|--:|--:|--:|--:|--:|
| **sigflint** | **2.6 KiB** | **6** | **1.1 ms** | **117.0 MiB** | **2.4 ms** |
| aws4 | 9.8 KiB (3.8×) | 24 (4.0×) | 6.3 ms (5.6×) | 117.2 MiB (no clear change) | 3.3 ms (no clear change) |
| minio | 8.3 KiB (3.2×) | 19 (3.2×) | 22.2 ms (20×) | 117.9 MiB (no clear change) | 16.6 ms (6.9×) |
| aws4fetch | 29.3 KiB (11×) | 90 (15×) | 32.8 ms (29×) | 128.6 MiB (1.1×) | 17.3 ms (7.1×) |
| @smithy/signature-v4 | 17.9 KiB (7.0×) | 44 (7.3×) | 20.2 ms (18×) | 115.9 MiB (no clear change) | 12.5 ms (5.1×) |
| aws-sig | 69.4 KiB (27×) | 46 (7.7×) | 36.0 ms (32×) | 170.0 MiB (1.5×) | 8.0 ms (3.3×) |
| @wdl-dev/aws-sigv4 | 58.0 KiB (23×) | 175 (29×) | 82.8 ms (73×) | 125.6 MiB (1.1×) | 17.8 ms (7.4×) |

**Bun 1.4.3**, plain GET of one key:

| Library | Heap allocated per call | Collections per 10,000 calls | GC pause per 10,000 calls | Peak memory of the process | Import + first signature |
|---|--:|--:|--:|--:|--:|
| **sigflint** | **1.4 KiB** | **3** | **5.2 ms** | **64.9 MiB** | **2.5 ms** |
| aws4 | 6.4 KiB (4.6×) | 14 (4.7×) | 26.5 ms (5.1×) | 72.1 MiB (1.1×) | 3.1 ms (no clear change) |
| minio | 7.0 KiB (5.1×) | 16 (5.3×) | 31.3 ms (6.1×) | 70.6 MiB (1.1×) | 19.5 ms (7.9×) |
| aws4fetch | 15.1 KiB (11×) | 28 (9.3×) | 57.3 ms (11×) | 69.2 MiB (no clear change) | 2.9 ms (no clear change) |
| @smithy/signature-v4 | 13.2 KiB (9.5×) | 24 (8.0×) | 48.2 ms (9.3×) | 72.5 MiB (1.1×) | 10.8 ms (4.4×) |
| aws-sig | 47.8 KiB (34×) | 80 (27×) | 157 ms (30×) | 79.9 MiB (1.2×) | 4.4 ms (no clear change) |
| @wdl-dev/aws-sigv4 | 29.9 KiB (21×) | 49 (16×) | 109 ms (21×) | 75.2 MiB (1.2×) | 4.5 ms (1.8×) |

Median of 5 rounds, one fresh process per library, runtime and round (for import, each round is the median of 7 fresh processes). “(×)” is the library's value divided by sigflint's; “no clear change” means the gap is inside the reporting band. Across all four workloads, the libraries that sign them correctly allocate 2.0 to 34 times as much heap per call as sigflint. Reporting bands (the larger of the metric's floor and twice the larger spread of the two sigflint control arms): heap per call 6%; GC pause 33% to 87%; peak memory 3% to 4%; import + first signature 15% to 35%. Every gap shown with a multiplier is outside its band.
<!-- END memory -->

What is counted: the JavaScript heap that one `getAuthHeaders` call allocates (native memory, such as hash state, is not in it), the stop-the-world garbage-collection time over 10,000 calls, the peak resident memory of a process that loaded only that library, and the time to import the library and sign once in a fresh process. Importing alone takes 1.2 ms on Node and 1.9 ms on Bun, with no clear difference from `aws4fetch`, `aws4` and `@wdl-dev/aws-sigv4` on either runtime (and from `aws-sig` on Bun, where `aws4fetch` and `@wdl-dev/aws-sigv4` are, if anything, a little lower). Importing plus the first signature takes 2.4 ms on Node, faster than `aws4fetch`, `@smithy/signature-v4`, `aws-sig`, `@wdl-dev/aws-sigv4` and `minio` (3.3 to 7.4 times as fast) and inside the noise band of `aws4`; on Bun it takes 2.5 ms, faster than `@smithy/signature-v4`, `@wdl-dev/aws-sigv4` and `minio` (1.8 to 7.9 times) and not clearly different from `aws4`, `aws4fetch` and `aws-sig`. Across 20,000 calls no library showed a clear growth in retained heap: 35 of 36 comparisons with sigflint are no clear change after 5 rounds, which does not show that they are equal; by the protocol's rule (the ranges overlap, or the gap is within twice the band, which is at least 64 KiB) those 35 were also still unsettled at the 5-round cap. The one clear difference is `aws4fetch` on Node for the plain GET, which kept about 190 KiB per 10,000 calls against sigflint's 29 KiB; that is not shown to be a leak. `@wdl-dev/aws-sigv4` kept about 110 KiB on that workload, but its gap is within twice the band, so it is not a claim. Peak memory of a process that loaded sigflint was not clearly different from `aws4`, `@smithy/signature-v4` and `minio` on Node. sigflint keeps up to 1,000 signing keys, about 340 bytes each on Node and 360 on Bun, so a full cache is about 340 KB; the other libraries' caches were not measured.

All figures in this section were measured again on the single built file that Node and Bun load (`dist/`, from the same source tree as the package), in one fresh process per library, runtime and round, with the import part taking the median of 7 fresh processes per round: 3 rounds, then rounds 4 and 5 because some comparisons were unsettled. No process was rejected or failed. Some comparisons were still unsettled at the 5-round cap (retained heap 35 of 36, peak memory 4 of 12, import 8 of 12, import plus first signature 4 of 12, counted by [`bench/unsettled-memory.mjs`](../bench/unsettled-memory.mjs)); an unsettled comparison is shown as no clear change and is not a claim. The numbers for the other three workloads, the per-round values and the calibration of the allocation counters are in [`bench/results/memory-report.md`](../bench/results/memory-report.md) and [`bench/memory-protocol.md`](../bench/memory-protocol.md); the shortened plan and the extension decisions are in [`bench/protocol-rerun-3.md`](../bench/protocol-rerun-3.md), [`bench/protocol-rerun-2.md`](../bench/protocol-rerun-2.md), [`bench/protocol-rerun.md`](../bench/protocol-rerun.md) and [`bench/results/rerun-3-notes.md`](../bench/results/rerun-3-notes.md).

## Size

<!-- BEGIN size -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="size-dark.svg">
  <img alt="Bar chart: bundled, minified and gzipped size of each library" src="size-light.svg">
</picture>

| Library | Source, all signers (bytes) | Bundled + minified (bytes) | + gzip | + brotli | Direct dependencies | Installed on disk (bytes) |
|---|--:|--:|--:|--:|--:|--:|
| **sigflint** | 35,051 | 5,667 | 2,774 | 2,557 | 0 |  |
| aws4fetch |  | 7,428 | 2,915 | 2,626 | 0 | 65,541 |
| aws4 |  | 9,026 | 3,251 | 2,971 | 0 | 23,399 |
| @smithy/signature-v4 |  | 140,787 | 45,924 | 39,907 | 3 | 106,103 |
| aws-sig |  | 9,942 | 4,167 | 3,787 | 0 | 270,403 |
| @wdl-dev/aws-sigv4 |  | 15,979 | 5,484 | 4,986 | 0 | 82,832 |
| minio |  | 330,170 | 85,329 | 74,103 | 13 | 2,092,892 |
<!-- END size -->

What a bundle contains depends on what it imports. Minified size of the `node` entry with only the named signers imported (`bench/tiers.mjs`, `bun build --minify`; the other libraries' rows above are the header signer only):

<!-- BEGIN pic-size-tiers -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="size-tiers-dark.svg">
  <img alt="Bar chart: gzipped and minified size of sigflint for each combination of signers" src="size-tiers-light.svg">
</picture>
<!-- END pic-size-tiers -->

| Imports | Minified | gzip |
|---|--:|--:|
| `getAuthHeaders` | 5,667 | 2,774 |
| `getAuthHeaders`, `presign` | 7,291 | 3,352 |
| `getAuthHeadersV4a` | 6,118 | 2,980 |
| `presignV4a` | 6,142 | 3,026 |
| `chunkSigner` | 2,906 | 1,516 |
| `eventSigner` | 3,117 | 1,613 |
| all six | 12,253 | 5,128 |

The Bun and web entries are 5,034 / 2,535 and 5,233 / 2,608 bytes for `getAuthHeaders`. Node and Bun load one built file (`dist/`, made by `npm run build`) rather than six modules: on Node that imports in about 1.2 ms (the import figure in the memory section, measured on `dist/`). The `workerd`, `worker` and `browser` conditions and bundlers that do not pick the `node` or `bun` condition get the per-signer modules in `src/`; a bundler that does pick `node` gets the built file and drops unused signers just as well. The package sets `"sideEffects": false`; nothing runs at import, and the lookup tables and the one-shot HMAC check are built on first use. Tree shaking was checked with `bun build` and `esbuild`; other bundlers were not.

## How it is tested

`npm test` signs every request in these files and compares:

| File | Cases | Reference |
|---|--:|---|
| `test/corpus.json` | 3,360 | botocore's S3 signer: the four S3 documentation examples, hand-picked edge cases and 3,300 seeded random requests |
| `test/corpus-general.json` | 1,622 | botocore's `SigV4Auth` for 15 other services: hand-written request shapes and 1,500 seeded random requests |
| `test/corpus-presign.json` | 1,600 | botocore's `SigV4QueryAuth` and `S3SigV4QueryAuth`, half of them S3 |
| `test/corpus-v4a.json` | 662 | the AWS CRT's SigV4a signers (headers and presigned URLs). ECDSA signatures differ on every run, so the test verifies the reference's signature under the public key derived here and checks that ours verifies too and that the other parameters are equal |
| `test/corpus-stream.json` | 60 chunk chains, 60 event chains | the AWS SDK's smithy signer (its event signer signs the same string as a chunk when the headers are empty), every chunk and event in every chain; the two chunked-upload examples in the S3 documentation; event frames are also checked for lengths and checksums |

Each runs against the synchronous source, the built file that Node and Bun load, and the WebCrypto entry. The corpora are generated by `conformance/` (`npm run conformance` rebuilds them with the pinned botocore and awscrt; `node conformance/build.mjs` is the S3 one alone). The generators, the cases and the reference scripts are in the repository. The same tests run on Node 22, 24 and 26, Bun and Deno in CI.

## Methodology and limits

- Speed: one process per library, runtime and round; 3 rounds (5 for the other-services part) with Node and Bun measured back to back for each library and round, Node first on odd rounds and Bun first on even ones, and the library order reversed on every other round; 8 arms, so sigflint ran twice (A and B) as a noise control. Each process validates its signature against botocore first, then times batches of about 50 ms for one second and reports the median. The reporting band is the larger of 3% and twice the larger spread of the two sigflint arms; every gap in the tables above is far outside it except the five Bun presigned-URL comparisons marked “no clear change”, which stay inconclusive after five rounds. The protocol was written before the runs ([`bench/protocol.md`](../bench/protocol.md), shortened by [`bench/protocol-rerun.md`](../bench/protocol-rerun.md), [`bench/protocol-rerun-2.md`](../bench/protocol-rerun-2.md) and [`bench/protocol-rerun-3.md`](../bench/protocol-rerun-3.md)) and the raw results are in `bench/results/`.
- Memory: 5 rounds (3, then 2 more because comparisons were unsettled), each process under a 2 GB cgroup cap; allocation is counted differently on Node (heap growth between collections) and Bun (the engine's collector log), checked against a known allocator to within 10%, so Node and Bun numbers are not compared with each other. The protocol was written before the run ([`bench/memory-protocol.md`](../bench/memory-protocol.md)).
- The requests are synthetic and the signing date is fixed, so each library's signing-key cache behaves as it would within one day. Nothing here measures a network request, and a single signature is microseconds beside it.
- Machine: one shared Linux host, normal priority, no CPU pinning. The per-process gate watched Linux CPU only; Windows-side load was not checked, and the wall-clock figures may carry the load of the Windows side. This re-run kept that gate and added a host check of Linux and Windows CPU, memory and I/O pressure, and swap activity before the first run of each part and after every library-and-round pair of Node and Bun runs; a pair is kept only when the check before it and the check after it both passed ([`bench/protocol-rerun-3.md`](../bench/protocol-rerun-3.md)). Load that began and ended between two checks would not show in either. Versions of everything are in `bench/frozen/versions.txt`, except Node: the runtime grid and the speed, memory and import figures ran on Node 26.12.0 (that file lists 26.11.1). The correctness comparison did not record a Node version.
- Other services, presigned URLs and the check against the pre-split build: a second protocol, written before the runs ([`bench/protocol-more.md`](../bench/protocol-more.md)), run on the final code; raw results in `bench/results/speed-regression.jsonl` and `speed-more.jsonl`.
- Not timed: `Bun.S3Client.presign` (a different request) and `@aws-lite/client` (wraps `aws4`).
- Not tested: real Cloudflare and real AWS. The signatures are checked against botocore, the AWS CRT and the AWS SDK's signer; the only live server tried is a local `s3s-fs` 0.17.0 on loopback, once, with header-signed requests (see [the guide on a raw `+`](guide.md#how-it-reads-the-url)). SigV4a, presigned URLs, chunked uploads and event streams have not been sent to any service.
- Node against Bun: the Node and Bun times of one library and workload are paired in [`bench/results/rerun-3-node-bun.md`](../bench/results/rerun-3-node-bun.md) (`node bench/pair-node-bun.mjs`). Where Node is ahead with ranges that overlap, the pairing says so and does not call it a gap, and no row is marked as explained; some rows have no follow-up yet and are marked so there. This page does not say why Bun differs on any of them, and the Node-against-Bun comparison is not closed.
- Reproduce: `cd bench && npm ci && node screen.mjs ../src/node.js`, then the counted runs with `ADMIT=<host check command> ./run-admitted.sh <A|R|B|C|D> <artifact dir> 3` for each part (see `bench/protocol-rerun-3.md`; the host check is not in this repository and must print JSON with an `admit` field), then rounds 4 and 5 only for the parts where a comparison was still unsettled after round 3, which was R, B, C and D and not A in this run (`FROM_ROUND=4 ADMIT=<host check command> ./run-admitted.sh <R|B|C|D> <artifact dir> 5`; the decisions are in `bench/results/rerun-3-notes.md`), then `node analyze.mjs && node analyze-memory.mjs results/memory-raw.jsonl results/memory-summary.json && node pair-node-bun.mjs && node sizes.mjs && node make-assets.mjs && node make-memory-assets.mjs`.
