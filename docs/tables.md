### Correctness

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

### Speed

Microseconds per signature, median of 5 processes. “wrong signature” means the library’s result differed from botocore’s for that request, so it was not timed.

**Node 26.11.1**

| Library | GET, plain key | part upload (query, headers) | GET, key and query to encode | PUT, 1 KiB body |
|---|--:|--:|--:|--:|
| **sigflint** | **1.31** | **1.68** | **2.17** | **2.36** |
| aws4fetch | 235.41 | 237.08 | 254.07 | 230.90 |
| aws4 | 6.04 | 6.98 | 8.30 | 6.33 |
| @smithy/signature-v4 | 10.38 | 10.83 | wrong signature | 11.57 |
| aws-sig | 64.78 | wrong signature | wrong signature | wrong signature |
| @wdl-dev/aws-sigv4 | 716.20 | 631.51 | 734.79 | wrong signature |
| minio | 11.67 | 11.66 | wrong signature | 12.61 |

**Bun 1.4.3**

| Library | GET, plain key | part upload (query, headers) | GET, key and query to encode | PUT, 1 KiB body |
|---|--:|--:|--:|--:|
| **sigflint** | **1.66** | **2.19** | **3.39** | **3.10** |
| aws4fetch | 221.66 | 221.74 | 229.05 | 228.30 |
| aws4 | 9.73 | 11.29 | 14.10 | 11.70 |
| @smithy/signature-v4 | 12.88 | 13.12 | wrong signature | 14.14 |
| aws-sig | 48.71 | wrong signature | wrong signature | wrong signature |
| @wdl-dev/aws-sigv4 | 580.71 | 579.84 | 632.34 | wrong signature |
| minio | 8.98 | 8.51 | wrong signature | 11.59 |

Reporting band (the larger of 3% and twice the larger run-to-run range of the two sigflint control arms): bun 1.4.3 bench-download: 51%; bun 1.4.3 bench-part-put: 65%; bun 1.4.3 bench-encode: 41%; bun 1.4.3 bench-body-1k: 31%; node 26.11.1 bench-download: 34%; node 26.11.1 bench-part-put: 38%; node 26.11.1 bench-encode: 64%; node 26.11.1 bench-body-1k: 32%. Every gap between sigflint and another library is far outside its band.


### Size

| Library | Source (bytes) | Bundled + minified (bytes) | + gzip | + brotli | Direct dependencies | Installed on disk (bytes) |
|---|--:|--:|--:|--:|--:|--:|
| **sigflint** | 15,248 | 4,499 | 2,324 | 2,155 | 0 |  |
| aws4fetch |  | 7,428 | 2,915 | 2,626 | 0 | 65,541 |
| aws4 |  | 9,026 | 3,251 | 2,971 | 0 | 23,399 |
| @smithy/signature-v4 |  | 140,787 | 45,924 | 39,907 | 3 | 106,103 |
| aws-sig |  | 9,942 | 4,167 | 3,787 | 0 | 270,403 |
| @wdl-dev/aws-sigv4 |  | 15,979 | 5,484 | 4,986 | 0 | 82,832 |
| minio |  | 330,170 | 85,329 | 74,103 | 13 | 2,092,892 |

### Runtimes

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
