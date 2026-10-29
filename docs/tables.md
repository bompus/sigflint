### Correctness

Requests whose signature equals botocore’s (same key, same clock). The version in the table is the one `package.json` said when the corpus ran: the screen records the candidate's package version before the release version bump.

| Library | Version | Ordinary requests (1,520) | Edge cases (1,522) |
|---|---|--:|--:|
| **sigflint** | 1.0.1 | 1,520 (100.0%) | 1,522 (100.0%) |
| aws4fetch | 1.0.20 | 1,408 (92.6%) | 595 (39.1%) |
| aws4 | 1.13.2 | 1,264 (83.2%) | 268 (17.6%) |
| @smithy/signature-v4 | 5.7.4 | 904 (59.5%) | 236 (15.5%) |
| @wdl-dev/aws-sigv4 | 3.0.4 | 666 (43.8%) | 44 (2.9%) |
| minio | 8.0.7 | 526 (34.6%) | 3 (0.2%) |
| aws-sig | 2.1.0 | 226 (14.9%) | 12 (0.8%) |

### Speed

Microseconds per signature, median of 3 processes. “wrong signature” means the library’s result differed from botocore’s for that request, so it was not timed; a blank means the library does not offer that API.

**Node 26.12.1**

| Library | GET, plain key | part upload (query, headers) | GET, key and query to encode | PUT, 1 KiB body |
|---|--:|--:|--:|--:|
| **sigflint** | **0.97** | **1.25** | **1.69** | **1.66** |
| aws4fetch | 24.67 | 27.12 | 26.94 | 26.94 |
| aws4 | 5.11 | 6.06 | 7.28 | 5.38 |
| @smithy/signature-v4 | 8.79 | 9.10 | wrong signature | 9.80 |
| aws-sig | 47.18 | wrong signature | wrong signature | wrong signature |
| @wdl-dev/aws-sigv4 | 72.43 | 65.97 | 72.84 | wrong signature |
| minio | 10.29 | 10.05 | wrong signature | 11.31 |

**Bun 1.4.4**

| Library | GET, plain key | part upload (query, headers) | GET, key and query to encode | PUT, 1 KiB body |
|---|--:|--:|--:|--:|
| **sigflint** | **0.66** | **0.96** | **1.51** | **1.25** |
| aws4fetch | 19.13 | 19.27 | 20.86 | 20.04 |
| aws4 | 3.39 | 4.28 | 5.51 | 3.71 |
| @smithy/signature-v4 | 5.05 | 6.01 | wrong signature | 6.11 |
| aws-sig | 30.21 | wrong signature | wrong signature | wrong signature |
| @wdl-dev/aws-sigv4 | 45.78 | 49.80 | 55.57 | wrong signature |
| minio | 3.51 | 3.80 | wrong signature | 4.14 |

Reporting band (the larger of 3% and twice the larger run-to-run range of the two sigflint control arms): node 26.12.1 bench-download: 5%; node 26.12.1 bench-part-put: 5%; node 26.12.1 bench-encode: 6%; node 26.12.1 bench-body-1k: 6%; bun 1.4.4 bench-download: 3%; bun 1.4.4 bench-part-put: 3%; bun 1.4.4 bench-encode: 6%; bun 1.4.4 bench-body-1k: 13%. Every gap between sigflint and another library is far outside its band.


### Size

| Library | Source, all signers (bytes) | Bundled + minified (bytes) | + gzip | + brotli | Direct dependencies | Installed on disk (bytes) |
|---|--:|--:|--:|--:|--:|--:|
| **sigflint** | 42,043 | 5,677 | 2,769 | 2,560 | 0 |  |
| aws4fetch |  | 7,428 | 2,927 | 2,626 | 0 | 65,541 |
| aws4 |  | 9,026 | 3,249 | 2,971 | 0 | 23,399 |
| @smithy/signature-v4 |  | 140,787 | 45,963 | 39,907 | 3 | 106,103 |
| aws-sig |  | 9,942 | 4,173 | 3,787 | 0 | 270,403 |
| @wdl-dev/aws-sigv4 |  | 15,979 | 5,504 | 4,986 | 0 | 82,832 |
| minio |  | 330,170 | 84,973 | 74,103 | 13 | 2,092,892 |

### Runtimes

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
