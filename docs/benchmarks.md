# Benchmarks, tests and limits

How sigflint compares with the other libraries, and how it is checked. The summary is in the [README](../README.md).

The speed, memory, import and size figures were measured on the code that ships: the built file that Node and Bun load, from the same source as `src/`. The benchmarks are re-run on the code of each release before it is published. The re-run used a shorter plan ([`bench/protocol-rerun.md`](../bench/protocol-rerun.md)): 3 rounds per library, and 2 more only for parts where a comparison was unsettled; every range and round count is given with the figures, and [`bench/results/rerun-extension.md`](../bench/results/rerun-extension.md) records which parts were extended and why.

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

Runtimes: node 26.11.1, bun 1.4.3, deno 2.9.6; Workers run in local workerd through wrangler (see bench/frozen/versions.txt). ✗ cells: smithy on Workers + nodejs_compat: Hash.bind is not a function; aws4 on Workers, no flag: does not load (bundle error); smithy on Workers, no flag: Hash.bind is not a function; minio on Workers, no flag: does not load (bundle error).
<!-- END runtimes -->

Each library signed one S3 GET on each runtime and was checked against botocore's signature. “Workers” ran in a local workerd through wrangler, not on Cloudflare's network. `smithy` needs a SHA-256 class you supply; the “web hash” row passes it `@aws-crypto/sha256-js`, and its default Node one does not run in workerd. sigflint has three code paths so that each runtime gets the fastest primitive it has: Bun uses its own hasher, Node and Deno use `node:crypto`, and Workers and browsers use WebCrypto. A plain `import 'sigflint'` selects the right one; `sigflint/web` forces the WebCrypto one on any runtime.

## Correctness

<!-- BEGIN correctness -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="correctness-dark.svg">
  <img alt="Bar chart: how many requests each library signs the same as botocore" src="correctness-light.svg">
</picture>

Requests whose signature equals botocore’s (same key, same clock).

| Library | Version | Ordinary requests (1,520) | Edge cases (1,522) |
|---|---|--:|--:|
| **sigflint** | 0.1.0 | 1,520 (100.0%) | 1,522 (100.0%) |
| aws4fetch | 1.0.20 | 1,408 (92.6%) | 595 (39.1%) |
| aws4 | 1.13.2 | 1,264 (83.2%) | 268 (17.6%) |
| @smithy/signature-v4 | 5.7.4 | 904 (59.5%) | 236 (15.5%) |
| @wdl-dev/aws-sigv4 | 3.0.4 | 666 (43.8%) | 44 (2.9%) |
| minio | 8.0.7 | 526 (34.6%) | 3 (0.2%) |
| aws-sig | 2.1.0 | 226 (14.9%) | 12 (0.8%) |
<!-- END correctness -->

The reference is botocore's S3 signer (`S3SigV4Auth`), run with a fixed clock on the same requests after `conformance/oracle.py` has normalized each path and query, plus the four example signatures printed in the S3 documentation. “Ordinary requests” are valid S3 requests: keys and queries with spaces, unicode, reserved characters, repeated and unsorted parameters. “Edge cases” are requests a strict reading of the specification covers but most libraries do not: a stray `%` or invalid UTF-8 in the URL, a raw `+` in the path, a query pair with an empty name, and headers some libraries never sign (`date`, `range`). sigflint also passes all 316 requests with a session token; the others were not run on those. The sigflint row shows version 0.1.0 because that is the version recorded when this comparison ran; the signer has changed since, and `npm test` checks the shipped code against the same corpus (`test/corpus.json`, 3,360 requests).

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
| **sigflint** | **1.33** | **1.66** | **2.22** | **2.39** |
| aws4fetch | 219.56 | 238.28 | 236.88 | 226.96 |
| aws4 | 5.66 | 6.75 | 8.33 | 6.30 |
| @smithy/signature-v4 | 9.75 | 10.05 | wrong signature | 11.15 |
| aws-sig | 59.45 | wrong signature | wrong signature | wrong signature |
| @wdl-dev/aws-sigv4 | 675.36 | 582.30 | 667.53 | wrong signature |
| minio | 11.40 | 10.84 | wrong signature | 12.17 |

**Bun 1.4.3**

| Library | GET, plain key | part upload (query, headers) | GET, key and query to encode | PUT, 1 KiB body |
|---|--:|--:|--:|--:|
| **sigflint** | **1.61** | **1.81** | **2.80** | **2.61** |
| aws4fetch | 196.86 | 199.48 | 206.36 | 208.22 |
| aws4 | 5.91 | 7.46 | 10.37 | 7.26 |
| @smithy/signature-v4 | 9.29 | 10.90 | wrong signature | 14.23 |
| aws-sig | 45.45 | wrong signature | wrong signature | wrong signature |
| @wdl-dev/aws-sigv4 | 591.84 | 564.71 | 653.07 | wrong signature |
| minio | 6.78 | 6.52 | wrong signature | 8.16 |

Reporting band (the larger of 3% and twice the larger run-to-run range of the two sigflint control arms): bun 1.4.3 bench-download: 64%; bun 1.4.3 bench-part-put: 31%; bun 1.4.3 bench-encode: 51%; bun 1.4.3 bench-body-1k: 35%; node 26.12.0 bench-download: 13%; node 26.12.0 bench-part-put: 9%; node 26.12.0 bench-encode: 15%; node 26.12.0 bench-body-1k: 10%. Every gap between sigflint and another library is far outside its band.

<!-- END speed -->

### Other services, presigned URLs, and the 1.0 layout

These were measured under [`bench/protocol-more.md`](../bench/protocol-more.md): the same fresh-process method as above, 5 rounds (3 rounds were not enough to settle the check against the older code, so rounds 4 and 5 were added), a second copy of sigflint as the noise control. The older code is the S3 header code from before it was split into modules and hardened; part A re-times it against the shipped build.

**S3 header signing, older code and shipped build** (nanoseconds per call; positive change is slower):

| Runtime | Workload | Before | After | Change | Reporting band | |
|---|---|--:|--:|--:|--:|---|
| node 26.12.0 | bench-download | 1,272 | 1,337 | +5.1% | 8.8% | no clear change |
| node 26.12.0 | bench-part-put | 1,592 | 1,681 | +5.6% | 14.3% | no clear change |
| node 26.12.0 | bench-encode | 2,122 | 2,235 | +5.3% | 13.2% | no clear change |
| node 26.12.0 | bench-body-1k | 2,244 | 2,332 | +3.9% | 22% | no clear change |
| bun 1.4.3 | bench-download | 1,472 | 1,488 | +1.1% | 51.7% | no clear change |
| bun 1.4.3 | bench-part-put | 1,868 | 1,906 | +2% | 37.1% | no clear change |
| bun 1.4.3 | bench-encode | 2,780 | 2,922 | +5.1% | 47% | no clear change |
| bun 1.4.3 | bench-body-1k | 2,703 | 2,710 | +0.3% | 31.5% | no clear change |

No workload changed outside its band, but the Node differences (+3.9% to +5.6%) all point the same way, so the shipped build may be a few percent slower on Node than the older code; those gaps are inside the bands (9% to 22%) and 5 rounds cannot separate them. On Bun the differences are +0.3% to +5.1% inside bands of 31% to 52%. Restoring the fixed-string path for a request with no extra signed headers and no session token (the usual request) removed a larger slowdown that an earlier version of the split had.

**node 26.12.0**, microseconds per call (times as long as sigflint in brackets):

<!-- BEGIN pic-speed-more-node -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="speed-more-node-dark.svg">
  <img alt="Bar chart: time to sign other-service and presigned-URL requests on Node.js" src="speed-more-node-light.svg">
</picture>
<!-- END pic-speed-more-node -->

| Request | sigflint | aws4 | aws4fetch | @smithy/signature-v4 | aws-sig | @wdl-dev/aws-sigv4 | minio |
|---|--:|--:|--:|--:|--:|--:|--:|
| DynamoDB POST, JSON body | **1.75** | wrong signature | 296.72 (169.7×) | 11.28 (6.5×) | 56.37 (32.2×) | wrong signature | wrong signature |
| API Gateway GET, session token | **1.56** | 5.05 (3.2×) | 282.16 (180.4×) | 9.61 (6.1×) | wrong signature | 667.25 (426.6×) | wrong signature |
| SQS, query parameters | **1.84** | 6.33 (3.4×) | 285.17 (154.7×) | 10.86 (5.9×) | 55.47 (30.1×) | 663.25 (359.9×) | wrong signature |
| presigned URL, API Gateway | **3.45** | 10.73 (3.1×) | 305.55 (88.7×) | 12.02 (3.5×) | wrong signature | wrong signature | wrong signature |
| presigned URL, S3 | **3.70** | 10.95 (3.0×) | 230.51 (62.3×) | 12.34 (3.3×) | wrong signature | wrong signature | 13.60 (3.7×) |

**bun 1.4.3**, microseconds per call (times as long as sigflint in brackets):

<!-- BEGIN pic-speed-more-bun -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="speed-more-bun-dark.svg">
  <img alt="Bar chart: time to sign other-service and presigned-URL requests on Bun" src="speed-more-bun-light.svg">
</picture>
<!-- END pic-speed-more-bun -->

| Request | sigflint | aws4 | aws4fetch | @smithy/signature-v4 | aws-sig | @wdl-dev/aws-sigv4 | minio |
|---|--:|--:|--:|--:|--:|--:|--:|
| DynamoDB POST, JSON body | **1.66** | wrong signature | 198.35 (119.3×) | 10.00 (6.0×) | 41.13 (24.7×) | wrong signature | wrong signature |
| API Gateway GET, session token | **1.48** | 4.50 (3.0×) | 198.17 (134.1×) | 9.19 (6.2×) | wrong signature | 530.75 (359.1×) | wrong signature |
| SQS, query parameters | **1.99** | 5.73 (2.9×) | 201.88 (101.6×) | 10.95 (5.5×) | 39.19 (19.7×) | 537.51 (270.6×) | wrong signature |
| presigned URL, API Gateway | **4.63** | 12.31 (2.7×) | 215.25 (46.5×) | 13.49 (2.9×) | wrong signature | wrong signature | wrong signature |
| presigned URL, S3 | **5.09** | 12.05 (2.4×) | 218.40 (42.9×) | 13.85 (2.7×) | wrong signature | wrong signature | 9.25 (1.8×, no clear change) |

“Wrong signature” means the result differed from botocore's for that request, so it was not timed; for `aws4` that is the headers it adds and signs itself (see above), and `minio` signs S3 only. Reporting band (the larger of 3% and twice the spread of the two sigflint arms): Node 7% to 10%, Bun 16% to 101%, so the Bun ratios are much less precise than the Node ones. On Node every gap shown is far outside its band. On Bun the three presigned-URL gaps against `aws4` and `@smithy/signature-v4` are outside their bands (85% to 101%) with disjoint ranges but close to them, and the one against `minio` (9.25 against 5.09 microseconds, 82% against a band of 85%) is not clear after 5 rounds: it is shown as no clear change.

Only sigflint offers SigV4a (`@smithy/signature-v4` also offers chunked uploads and event streams, which were not timed here). Microseconds per call, Node / Bun: SigV4a headers 15.4 / 13.5, SigV4a presigned URL 16.9 / 16.8, one 64 KiB chunk 32.6 / 30.9, the last chunk with a trailer 3.0 / 1.7, a 4 KiB event 11.5 / 11.6. SigV4a is dominated by the ECDSA signature.

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
| **sigflint** | **2.6 KiB** | **6** | **1.1 ms** | **116.1 MiB** | **2.2 ms** |
| aws4 | 9.8 KiB (3.8×) | 24 (4.0×) | 6.3 ms (5.5×) | 116.3 MiB (no clear change) | 3.3 ms (1.5×) |
| minio | 8.3 KiB (3.2×) | 19 (3.2×) | 20.8 ms (18×) | 117.7 MiB (no clear change) | 16.0 ms (7.3×) |
| aws4fetch | 29.3 KiB (11×) | 90 (15×) | 32.4 ms (28×) | 128.3 MiB (1.1×) | 17.3 ms (7.9×) |
| @smithy/signature-v4 | 17.9 KiB (7.0×) | 44 (7.3×) | 20.5 ms (18×) | 115.7 MiB (no clear change) | 12.2 ms (5.6×) |
| aws-sig | 69.4 KiB (27×) | 46 (7.7×) | 34.6 ms (30×) | 169.3 MiB (1.5×) | 8.1 ms (3.7×) |
| @wdl-dev/aws-sigv4 | 58.0 KiB (23×) | 175 (29×) | 74.9 ms (66×) | 125.3 MiB (1.1×) | 16.8 ms (7.7×) |

**Bun 1.4.3**, plain GET of one key:

| Library | Heap allocated per call | Collections per 10,000 calls | GC pause per 10,000 calls | Peak memory of the process | Import + first signature |
|---|--:|--:|--:|--:|--:|
| **sigflint** | **1.4 KiB** | **3** | **5.1 ms** | **64.6 MiB** | **2.2 ms** |
| aws4 | 6.4 KiB (4.6×) | 14 (4.7×) | 27.3 ms (5.4×) | 71.9 MiB (1.1×) | 3.0 ms (no clear change) |
| minio | 7.0 KiB (5.1×) | 16 (5.3×) | 31.4 ms (6.2×) | 70.3 MiB (1.1×) | 18.5 ms (8.3×) |
| aws4fetch | 15.1 KiB (11×) | 27 (9.0×) | 56.6 ms (11×) | 69.6 MiB (1.1×) | 2.9 ms (no clear change) |
| @smithy/signature-v4 | 13.2 KiB (9.5×) | 24 (8.0×) | 45.6 ms (9.0×) | 77.2 MiB (1.2×) | 10.5 ms (4.7×) |
| aws-sig | 47.8 KiB (34×) | 80 (27×) | 149 ms (29×) | 80.3 MiB (1.2×) | 4.2 ms (1.9×) |
| @wdl-dev/aws-sigv4 | 29.4 KiB (21×) | 49 (16×) | 110 ms (22×) | 75.1 MiB (1.2×) | 4.5 ms (2.0×) |

Median of 5 rounds, one fresh process per library, runtime and round (for import, each round is the median of 7 fresh processes). “(×)” is the library's value divided by sigflint's; “no clear change” means the gap is inside the reporting band. Across all four workloads, the libraries that sign them correctly allocate 2.0 to 34 times as much heap per call as sigflint. Reporting bands (the larger of the metric's floor and twice the larger spread of the two sigflint control arms): heap per call 6%; GC pause 33% to 66%; peak memory 3% to 4%; import + first signature 20% to 27%. Every gap shown with a multiplier is outside its band.
<!-- END memory -->

What is counted: the JavaScript heap that one `getAuthHeaders` call allocates (native memory, such as hash state, is not in it), the stop-the-world garbage-collection time over 10,000 calls, the peak resident memory of a process that loaded only that library, and the time to import the library and sign once in a fresh process. Importing alone takes 1.0 ms on Node and 1.7 ms on Bun, with no clear difference from `aws4fetch`, `aws4` and `@wdl-dev/aws-sigv4` on either runtime (and from `aws-sig` on Bun, where `aws4fetch` and `@wdl-dev/aws-sigv4` are, if anything, a little lower). Importing plus the first signature takes 2.2 ms on Node, faster than every other library (1.5 to 7.9 times as fast); on Bun it takes 2.2 ms, faster than `@smithy/signature-v4`, `aws-sig`, `@wdl-dev/aws-sigv4` and `minio` (1.9 to 8.3 times) and inside the noise band of `aws4` and `aws4fetch`. Across 20,000 calls no library showed a clear growth in retained heap: 34 of 36 comparisons with sigflint are no clear change after 5 rounds, which does not show that they are equal. The two clear ones are `aws4fetch` and `@wdl-dev/aws-sigv4` on Node for the plain GET, which kept about 110 to 190 KiB per 10,000 calls against sigflint's 30 KiB; that is not shown to be a leak. Peak memory of a process that loaded sigflint was not clearly different from `aws4`, `@smithy/signature-v4` and `minio` on Node. sigflint keeps up to 1,000 signing keys, about 340 bytes each on Node and 360 on Bun, so a full cache is about 340 KB; the other libraries' caches were not measured.

All figures in this section were measured again on the single built file that Node and Bun load (`dist/`, from the same source tree as the package), in one fresh process per library, runtime and round, with the import part taking the median of 7 fresh processes per round: 3 rounds, then rounds 4 and 5 because some comparisons were unsettled. 0 processes were rejected. The numbers for the other three workloads, the per-round values and the calibration of the allocation counters are in [`bench/results/memory-report.md`](../bench/results/memory-report.md) and [`bench/memory-protocol.md`](../bench/memory-protocol.md); the shortened plan and the extension decisions are in [`bench/protocol-rerun.md`](../bench/protocol-rerun.md) and [`bench/results/rerun-extension.md`](../bench/results/rerun-extension.md).

## Size

<!-- BEGIN size -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="size-dark.svg">
  <img alt="Bar chart: bundled, minified and gzipped size of each library" src="size-light.svg">
</picture>

| Library | Source, all signers (bytes) | Bundled + minified (bytes) | + gzip | + brotli | Direct dependencies | Installed on disk (bytes) |
|---|--:|--:|--:|--:|--:|--:|
| **sigflint** | 34,486 | 5,651 | 2,769 | 2,550 | 0 |  |
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
| `getAuthHeaders` | 5,651 | 2,769 |
| `getAuthHeaders`, `presign` | 7,259 | 3,346 |
| `getAuthHeadersV4a` | 6,102 | 2,976 |
| `presignV4a` | 6,126 | 3,023 |
| `chunkSigner` | 2,766 | 1,457 |
| `eventSigner` | 3,117 | 1,613 |
| all six | 12,081 | 5,078 |

The Bun and web entries are 5,018 / 2,530 and 5,217 / 2,603 bytes for `getAuthHeaders`. Node and Bun load one built file (`dist/`, made by `npm run build`) rather than six modules: on Node that imports in about 1.3 ms (`bench/results/memory-import-dist.jsonl`). The `workerd`, `worker` and `browser` conditions and bundlers that do not pick the `node` or `bun` condition get the per-signer modules in `src/`; a bundler that does pick `node` gets the built file and drops unused signers just as well. The package sets `"sideEffects": false`; nothing runs at import, and the lookup tables and the one-shot HMAC check are built on first use. Tree shaking was checked with `bun build` and `esbuild`; other bundlers were not.

## How it is tested

`npm test` signs every request in these files and compares:

| File | Cases | Reference |
|---|--:|---|
| `test/corpus.json` | 3,360 | botocore's S3 signer: the four S3 documentation examples, hand-picked edge cases and 3,300 seeded random requests |
| `test/corpus-general.json` | 1,622 | botocore's `SigV4Auth` for 15 other services: hand-written request shapes and 1,500 seeded random requests |
| `test/corpus-presign.json` | 1,600 | botocore's `SigV4QueryAuth` and `S3SigV4QueryAuth`, half of them S3 |
| `test/corpus-v4a.json` | 662 | the AWS CRT's SigV4a signers (headers and presigned URLs). ECDSA signatures differ on every run, so the test verifies the reference's signature under the public key derived here and checks that ours verifies too and that the other parameters are equal |
| `test/corpus-stream.json` | 60 chunk chains, 60 event chains | the AWS SDK's smithy signer; the two chunked-upload examples in the S3 documentation; event frames are also checked for lengths and checksums |

Each runs against the synchronous source, the built file that Node and Bun load, and the WebCrypto entry. The corpora are generated by `conformance/` (`npm run conformance` rebuilds them with the pinned botocore and awscrt; `node conformance/build.mjs` is the S3 one alone). The generators, the cases and the reference scripts are in the repository. The same tests run on Node 22, 24 and 26, Bun and Deno in CI.

## Methodology and limits

- Speed: one process per library, runtime and round; 3 rounds (5 for the other-services part) with the library order reversed on every other round; 8 arms, so sigflint ran twice (A and B) as a noise control. Each process validates its signature against botocore first, then times batches of about 50 ms for one second and reports the median. The reporting band is the larger of 3% and twice the larger spread of the two sigflint arms; every gap in the tables above is far outside it. The protocol was written before the runs ([`bench/protocol.md`](../bench/protocol.md), shortened by [`bench/protocol-rerun.md`](../bench/protocol-rerun.md)) and the raw results are in `bench/results/`.
- Memory: 5 rounds (3, then 2 more because comparisons were unsettled), each process under a 2 GB cgroup cap; allocation is counted differently on Node (heap growth between collections) and Bun (the engine's collector log), checked against a known allocator to within 10%, so Node and Bun numbers are not compared with each other. The protocol was written before the run ([`bench/memory-protocol.md`](../bench/memory-protocol.md)).
- The requests are synthetic and the signing date is fixed, so each library's signing-key cache behaves as it would within one day. Nothing here measures a network request, and a single signature is microseconds beside it.
- Machine: one shared Linux host, normal priority, no CPU pinning. Versions of everything are in `bench/frozen/versions.txt`, except Node: the runtime grid ran on Node 26.11.1 (the version in that file), and the speed, memory and import figures on Node 26.12.0. The correctness comparison did not record a Node version.
- Other services, presigned URLs and the check against the pre-split build: a second protocol, written before the runs ([`bench/protocol-more.md`](../bench/protocol-more.md)), run on the final code; raw results in `bench/results/speed-regression.jsonl` and `speed-more.jsonl`.
- Not timed: `Bun.S3Client.presign` (a different request) and `@aws-lite/client` (wraps `aws4`).
- Not tested: real Cloudflare and real AWS. The signatures are checked against botocore, the AWS CRT and the AWS SDK's signer; the only live server tried is a local `s3s-fs` 0.17.0 on loopback, once, with header-signed requests (see the guide on a raw `+`). SigV4a, presigned URLs, chunked uploads and event streams have not been sent to any service.
- Reproduce: `cd bench && npm ci && node screen.mjs ../src/node.js && ./run-matrix.sh "$PWD/frozen" "$PWD/results/speed-raw.jsonl" && node analyze.mjs && node sizes.mjs && node make-assets.mjs`.
