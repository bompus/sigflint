# Benchmarks, tests and limits

How sigflint compares with the other libraries, and how it is checked. The summary is in the [README](../README.md).

The speed, memory, import and size figures were measured on the code that ships: the built file that Node and Bun load, from the same source as `src/`. The benchmarks are re-run on the code of each release before it is published. The re-run for this release used a shorter plan ([`bench/protocol-rerun-2.md`](../bench/protocol-rerun-2.md), which keeps [`bench/protocol-rerun.md`](../bench/protocol-rerun.md)): 3 rounds per library, and 2 more only for parts where a comparison was unsettled; every range and round count is given with the figures, and [`bench/results/rerun-2-notes.md`](../bench/results/rerun-2-notes.md) records which parts were extended and why.

## Runtimes

<!-- BEGIN runtimes -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="runtimes-dark.svg">
  <img alt="Grid: which runtimes each library runs on" src="runtimes-light.svg">
</picture>

| Library | Node.js | Bun | Deno | Workers + nodejs_compat | Workers, no flag |
|---|:-:|:-:|:-:|:-:|:-:|
| **sigflint** | ✓ | ✓ | ✓ | ✓ | ✓ |
| aws4fetch | ✓ | ✓ | ✓ | ✓ | ✓ |
| aws4 | ✓ | ✓ | ✓ | ✓ | ✗ |
| @smithy/signature-v4 | ✓ | ✓ | ✓ | ✗ | ✗ |
| @smithy/signature-v4 (web hash) | ✓ | ✓ | ✓ | ✓ | ✓ |
| aws-sig | ✓ | ✓ | ✓ | ✓ | ✓ |
| @wdl-dev/aws-sigv4 | ✓ | ✓ | ✓ | ✓ | ✓ |
| minio | ✓ | ✓ | ✓ | ✓ | ✗ |

Runtimes: node 26.12.0, bun 1.4.3, deno 2.9.6; Workers run in local workerd through wrangler (see bench/frozen/versions.txt). ✗ cells: smithy on Workers + nodejs_compat: Hash.bind is not a function; aws4 on Workers, no flag: does not load (bundle error); smithy on Workers, no flag: Hash.bind is not a function; minio on Workers, no flag: does not load (bundle error).
<!-- END runtimes -->

Each library signed one S3 GET on each runtime and was checked against botocore's signature. The grid ran on 2026-10-16 on the code that is released (package version 1.0.0, source tree `712d1eb2`, the built package as each runtime resolves it): one signature per library and runtime, so it shows that each signature matched, not how often it does. “Workers” ran in a local workerd through wrangler, not on Cloudflare's network. `smithy` needs a SHA-256 class you supply; the “web hash” row passes it `@aws-crypto/sha256-js`, and its default Node one does not run in workerd. sigflint has three code paths so that each runtime gets the fastest primitive it has: Bun uses its own hasher, Node and Deno use `node:crypto`, and Workers and browsers use WebCrypto. A plain `import 'sigflint'` selects the right one; `sigflint/web` forces the WebCrypto one on any runtime.

## Correctness

<!-- BEGIN correctness -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="correctness-dark.svg">
  <img alt="Bar chart: how many requests each library signs the same as botocore" src="correctness-light.svg">
</picture>

Requests whose signature equals botocore’s (same key, same clock).

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
| **sigflint** | **1.35** | **1.69** | **2.22** | **2.41** |
| aws4fetch | 226.05 | 225.20 | 238.06 | 222.04 |
| aws4 | 5.67 | 6.82 | 8.39 | 6.45 |
| @smithy/signature-v4 | 10.22 | 10.72 | wrong signature | 11.99 |
| aws-sig | 58.21 | wrong signature | wrong signature | wrong signature |
| @wdl-dev/aws-sigv4 | 698.62 | 611.26 | 667.34 | wrong signature |
| minio | 11.34 | 11.04 | wrong signature | 12.27 |

**Bun 1.4.3**

| Library | GET, plain key | part upload (query, headers) | GET, key and query to encode | PUT, 1 KiB body |
|---|--:|--:|--:|--:|
| **sigflint** | **1.60** | **2.06** | **3.23** | **2.82** |
| aws4fetch | 208.56 | 210.79 | 218.26 | 213.21 |
| aws4 | 6.08 | 8.26 | 10.11 | 7.39 |
| @smithy/signature-v4 | 9.22 | 10.18 | wrong signature | 10.28 |
| aws-sig | 48.85 | wrong signature | wrong signature | wrong signature |
| @wdl-dev/aws-sigv4 | 581.90 | 553.09 | 588.32 | wrong signature |
| minio | 7.29 | 7.92 | wrong signature | 8.34 |

Reporting band (the larger of 3% and twice the larger run-to-run range of the two sigflint control arms): bun 1.4.3 bench-download: 58%; bun 1.4.3 bench-part-put: 61%; bun 1.4.3 bench-encode: 60%; bun 1.4.3 bench-body-1k: 30%; node 26.12.0 bench-download: 9%; node 26.12.0 bench-part-put: 17%; node 26.12.0 bench-encode: 20%; node 26.12.0 bench-body-1k: 10%. Every gap between sigflint and another library is far outside its band.

<!-- END speed -->

### Other services, presigned URLs, and the 1.0 layout

These were measured under [`bench/protocol-more.md`](../bench/protocol-more.md): the same fresh-process method as above, 5 rounds (3 rounds were not enough to settle the check against the older code, so rounds 4 and 5 were added), a second copy of sigflint as the noise control. The older code is the S3 header code from before it was split into modules and hardened; part A re-times it against the shipped build.

**S3 header signing, older code and shipped build** (nanoseconds per call; positive change is slower):

| Runtime | Workload | Before | After | Change | Reporting band | |
|---|---|--:|--:|--:|--:|---|
| node 26.12.0 | bench-download | 1,278 | 1,356 | +6.1% | 35.5% | no clear change |
| node 26.12.0 | bench-part-put | 1,590 | 1,681 | +5.7% | 22.2% | no clear change |
| node 26.12.0 | bench-encode | 2,107 | 2,209 | +4.8% | 25.1% | no clear change |
| node 26.12.0 | bench-body-1k | 2,227 | 2,337 | +4.9% | 20.8% | no clear change |
| bun 1.4.3 | bench-download | 1,411 | 1,396 | -1.1% | 54.3% | no clear change |
| bun 1.4.3 | bench-part-put | 1,811 | 1,794 | -0.9% | 73.1% | no clear change |
| bun 1.4.3 | bench-encode | 2,886 | 2,613 | -9.5% | 89.8% | no clear change |
| bun 1.4.3 | bench-body-1k | 2,622 | 2,660 | +1.4% | 45.6% | no clear change |

No workload changed outside its band, but the Node differences (+4.8% to +6.1%) all point the same way, so the shipped build may be a few percent slower on Node than the older code; those gaps are inside the bands (21% to 36%) and 5 rounds cannot separate them. On Bun the differences are -9.5% to +1.4% inside bands of 46% to 90%. Restoring the fixed-string path for a request with no extra signed headers and no session token (the usual request) removed a larger slowdown that an earlier version of the split had.

**node 26.12.0**, microseconds per call (times as long as sigflint in brackets):

<!-- BEGIN pic-speed-more-node -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="speed-more-node-dark.svg">
  <img alt="Bar chart: time to sign other-service and presigned-URL requests on Node.js" src="speed-more-node-light.svg">
</picture>
<!-- END pic-speed-more-node -->

| Request | sigflint | aws4 | aws4fetch | @smithy/signature-v4 | aws-sig | @wdl-dev/aws-sigv4 | minio |
|---|--:|--:|--:|--:|--:|--:|--:|
| DynamoDB POST, JSON body | **1.76** | wrong signature | 315.96 (179.6×) | 11.44 (6.5×) | 56.13 (31.9×) | wrong signature | wrong signature |
| API Gateway GET, session token | **1.59** | 5.08 (3.2×) | 305.11 (191.9×) | 9.35 (5.9×) | wrong signature | 726.31 (456.8×) | wrong signature |
| SQS, query parameters | **1.84** | 6.32 (3.4×) | 306.11 (165.9×) | 10.61 (5.8×) | 55.36 (30.0×) | 725.93 (393.5×) | wrong signature |
| presigned URL, API Gateway | **3.37** | 10.61 (3.1×) | 309.71 (91.8×) | 11.70 (3.5×) | wrong signature | wrong signature | wrong signature |
| presigned URL, S3 | **3.61** | 10.93 (3.0×) | 233.61 (64.7×) | 12.26 (3.4×) | wrong signature | wrong signature | 13.44 (3.7×) |

**bun 1.4.3**, microseconds per call (times as long as sigflint in brackets):

<!-- BEGIN pic-speed-more-bun -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="speed-more-bun-dark.svg">
  <img alt="Bar chart: time to sign other-service and presigned-URL requests on Bun" src="speed-more-bun-light.svg">
</picture>
<!-- END pic-speed-more-bun -->

| Request | sigflint | aws4 | aws4fetch | @smithy/signature-v4 | aws-sig | @wdl-dev/aws-sigv4 | minio |
|---|--:|--:|--:|--:|--:|--:|--:|
| DynamoDB POST, JSON body | **1.57** | wrong signature | 215.44 (136.9×) | 9.79 (6.2×) | 37.15 (23.6×) | wrong signature | wrong signature |
| API Gateway GET, session token | **1.46** | 4.27 (2.9×) | 210.64 (144.7×) | 8.62 (5.9×) | wrong signature | 578.48 (397.3×) | wrong signature |
| SQS, query parameters | **1.89** | 5.53 (2.9×) | 217.00 (114.6×) | 10.14 (5.4×) | 36.82 (19.4×) | 570.12 (301.2×) | wrong signature |
| presigned URL, API Gateway | **4.39** | 11.15 (2.5×, no clear change) | 234.22 (53.4×) | 11.92 (2.7×, no clear change) | wrong signature | wrong signature | wrong signature |
| presigned URL, S3 | **4.77** | 10.85 (2.3×, no clear change) | 231.05 (48.4×) | 12.85 (2.7×, no clear change) | wrong signature | wrong signature | 8.81 (1.8×, no clear change) |

“Wrong signature” means the result differed from botocore's for that request, so it was not timed; for `aws4` that is the headers it adds and signs itself (see above), and `minio` signs S3 only. Reporting band (the larger of 3% and twice the spread of the two sigflint arms): Node 6% to 10%, Bun 25% to 176%, so the Bun ratios are much less precise than the Node ones. On Node every gap shown is far outside its band. On Bun the gaps against `aws4fetch`, `aws-sig` and `@wdl-dev/aws-sigv4` are far outside theirs. Five Bun presigned-URL comparisons are not clear after 5 rounds: the ranges of the two arms overlap or the gap is within twice the band, namely `aws4` and `@smithy/signature-v4` on both presigned-URL requests and `minio` on the S3 one. They are shown as no clear change, and their multipliers are not a claim.

Only sigflint offers SigV4a (`@smithy/signature-v4` also offers chunked uploads and event streams, which were not timed here). Microseconds per call, Node / Bun: SigV4a headers 15.0 / 12.6, SigV4a presigned URL 16.9 / 15.1, one 64 KiB chunk 32.8 / 30.5, the last chunk with a trailer 3.1 / 1.7, a 4 KiB event 11.2 / 11.3. SigV4a is dominated by the ECDSA signature.

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
| **sigflint** | **2.6 KiB** | **6** | **1.2 ms** | **106.2 MiB** | **2.5 ms** |
| aws4 | 9.8 KiB (3.8×) | 24 (4.0×) | 6.7 ms (5.7×) | 106.5 MiB (no clear change) | 3.3 ms (no clear change) |
| minio | 8.3 KiB (3.2×) | 19 (3.2×) | 21.1 ms (18×) | 107.5 MiB (no clear change) | 15.8 ms (6.4×) |
| aws4fetch | 29.2 KiB (11×) | 90 (15×) | 32.1 ms (28×) | 116.5 MiB (1.1×) | 18.7 ms (7.5×) |
| @smithy/signature-v4 | 17.9 KiB (7.0×) | 44 (7.3×) | 20.8 ms (18×) | 104.6 MiB (no clear change) | 13.0 ms (5.2×) |
| aws-sig | 69.4 KiB (27×) | 46 (7.7×) | 34.1 ms (29×) | 158.6 MiB (1.5×) | 8.8 ms (3.5×) |
| @wdl-dev/aws-sigv4 | 58.0 KiB (23×) | 174 (29×) | 75.3 ms (65×) | 117.6 MiB (1.1×) | 17.7 ms (7.1×) |

**Bun 1.4.3**, plain GET of one key:

| Library | Heap allocated per call | Collections per 10,000 calls | GC pause per 10,000 calls | Peak memory of the process | Import + first signature |
|---|--:|--:|--:|--:|--:|
| **sigflint** | **1.4 KiB** | **3** | **4.9 ms** | **64.7 MiB** | **2.4 ms** |
| aws4 | 6.4 KiB (4.6×) | 14 (4.7×) | 26.8 ms (5.4×) | 71.8 MiB (1.1×) | 2.9 ms (no clear change) |
| minio | 7.0 KiB (5.1×) | 16 (5.3×) | 31.5 ms (6.4×) | 70.9 MiB (1.1×) | 19.4 ms (8.1×) |
| aws4fetch | 15.1 KiB (11×) | 27 (9.0×) | 54.9 ms (11×) | 69.4 MiB (1.1×) | 2.9 ms (no clear change) |
| @smithy/signature-v4 | 13.2 KiB (9.5×) | 24 (8.0×) | 49.7 ms (10×) | 74.2 MiB (1.1×) | 10.7 ms (4.5×) |
| aws-sig | 47.9 KiB (34×) | 80 (27×) | 144 ms (29×) | 79.8 MiB (1.2×) | 4.2 ms (1.8×) |
| @wdl-dev/aws-sigv4 | 30.5 KiB (22×) | 51 (17×) | 118 ms (24×) | 74.6 MiB (1.2×) | 4.4 ms (1.9×) |

Median of 5 rounds, one fresh process per library, runtime and round (for import, each round is the median of 7 fresh processes). “(×)” is the library's value divided by sigflint's; “no clear change” means the gap is inside the reporting band. Across all four workloads, the libraries that sign them correctly allocate 2.0 to 34 times as much heap per call as sigflint. Reporting bands (the larger of the metric's floor and twice the larger spread of the two sigflint control arms): heap per call 6%; GC pause 20% to 101%; peak memory 3%; import + first signature 11% to 36%. Every gap shown with a multiplier is outside its band.
<!-- END memory -->

What is counted: the JavaScript heap that one `getAuthHeaders` call allocates (native memory, such as hash state, is not in it), the stop-the-world garbage-collection time over 10,000 calls, the peak resident memory of a process that loaded only that library, and the time to import the library and sign once in a fresh process. Importing alone takes 1.2 ms on Node and 1.8 ms on Bun, with no clear difference from `aws4fetch`, `aws4` and `@wdl-dev/aws-sigv4` on either runtime (and from `aws-sig` on Bun, where `aws4fetch` and `@wdl-dev/aws-sigv4` are, if anything, a little lower). Importing plus the first signature takes 2.5 ms on Node, faster than `aws4fetch`, `@smithy/signature-v4`, `aws-sig`, `@wdl-dev/aws-sigv4` and `minio` (3.5 to 7.5 times as fast) and inside the noise band of `aws4`; on Bun it takes 2.4 ms, faster than `@smithy/signature-v4`, `aws-sig`, `@wdl-dev/aws-sigv4` and `minio` (1.8 to 8.1 times) and inside the noise band of `aws4` and `aws4fetch`. Across 20,000 calls no library showed a clear growth in retained heap: 33 of 36 comparisons with sigflint are no clear change after 5 rounds, which does not show that they are equal; 12 of the 36 were still unsettled at the 5-round cap. Two of the three clear ones are `aws4fetch` and `@wdl-dev/aws-sigv4` on Node for the plain GET, which kept about 110 to 190 KiB per 10,000 calls against sigflint's 30 KiB; that is not shown to be a leak. The third is `aws4` on Node for the part upload, which kept less than sigflint. Peak memory of a process that loaded sigflint was not clearly different from `aws4`, `@smithy/signature-v4` and `minio` on Node. sigflint keeps up to 1,000 signing keys, about 340 bytes each on Node and 360 on Bun, so a full cache is about 340 KB; the other libraries' caches were not measured.

All figures in this section were measured again on the single built file that Node and Bun load (`dist/`, from the same source tree as the package), in one fresh process per library, runtime and round, with the import part taking the median of 7 fresh processes per round: 3 rounds, then rounds 4 and 5 because some comparisons were unsettled. 0 processes were rejected. Some comparisons were still unsettled at the 5-round cap (retained heap 12 of 36, peak memory 3 of 12, import 6 of 12, import plus first signature 1 of 12); they are shown as no clear change. The numbers for the other three workloads, the per-round values and the calibration of the allocation counters are in [`bench/results/memory-report.md`](../bench/results/memory-report.md) and [`bench/memory-protocol.md`](../bench/memory-protocol.md); the shortened plan and the extension decisions are in [`bench/protocol-rerun-2.md`](../bench/protocol-rerun-2.md), [`bench/protocol-rerun.md`](../bench/protocol-rerun.md) and [`bench/results/rerun-2-notes.md`](../bench/results/rerun-2-notes.md).

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

- Speed: one process per library, runtime and round; 3 rounds (5 for the other-services part) with the library order reversed on every other round; 8 arms, so sigflint ran twice (A and B) as a noise control. Each process validates its signature against botocore first, then times batches of about 50 ms for one second and reports the median. The reporting band is the larger of 3% and twice the larger spread of the two sigflint arms; every gap in the tables above is far outside it. The protocol was written before the runs ([`bench/protocol.md`](../bench/protocol.md), shortened by [`bench/protocol-rerun.md`](../bench/protocol-rerun.md) and [`bench/protocol-rerun-2.md`](../bench/protocol-rerun-2.md)) and the raw results are in `bench/results/`.
- Memory: 5 rounds (3, then 2 more because comparisons were unsettled), each process under a 2 GB cgroup cap; allocation is counted differently on Node (heap growth between collections) and Bun (the engine's collector log), checked against a known allocator to within 10%, so Node and Bun numbers are not compared with each other. The protocol was written before the run ([`bench/memory-protocol.md`](../bench/memory-protocol.md)).
- The requests are synthetic and the signing date is fixed, so each library's signing-key cache behaves as it would within one day. Nothing here measures a network request, and a single signature is microseconds beside it.
- Machine: one shared Linux host, normal priority, no CPU pinning. Versions of everything are in `bench/frozen/versions.txt`, except Node: the runtime grid and the speed, memory and import figures ran on Node 26.12.0 (that file lists 26.11.1). The correctness comparison did not record a Node version.
- Other services, presigned URLs and the check against the pre-split build: a second protocol, written before the runs ([`bench/protocol-more.md`](../bench/protocol-more.md)), run on the final code; raw results in `bench/results/speed-regression.jsonl` and `speed-more.jsonl`.
- Not timed: `Bun.S3Client.presign` (a different request) and `@aws-lite/client` (wraps `aws4`).
- Not tested: real Cloudflare and real AWS. The signatures are checked against botocore, the AWS CRT and the AWS SDK's signer; the only live server tried is a local `s3s-fs` 0.17.0 on loopback, once, with header-signed requests (see [the guide on a raw `+`](guide.md#how-it-reads-the-url)). SigV4a, presigned URLs, chunked uploads and event streams have not been sent to any service.
- Reproduce: `cd bench && npm ci && node screen.mjs ../src/node.js && ./run-matrix.sh "$PWD/frozen" "$PWD/results/speed-raw.jsonl" && node analyze.mjs && node sizes.mjs && node make-assets.mjs`.
