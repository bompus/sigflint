### Correctness

Requests whose signature equals botocore’s (same key, same clock).

| Library | Version | Ordinary requests (1,211) | Edge cases (1,522) |
|---|---|--:|--:|
| **sigflint** | 0.1.0 | 1,211 (100.0%) | 1,522 (100.0%) |
| aws4fetch | 1.0.20 | 1,208 (99.8%) | 595 (39.1%) |
| aws4 | 1.13.2 | 1,063 (87.8%) | 268 (17.6%) |
| @smithy/signature-v4 | 5.7.4 | 596 (49.2%) | 236 (15.5%) |
| @wdl-dev/aws-sigv4 | 3.0.4 | 358 (29.6%) | 44 (2.9%) |
| minio | 8.0.7 | 255 (21.1%) | 3 (0.2%) |
| aws-sig | 2.1.0 | 78 (6.4%) | 12 (0.8%) |

### Speed

Microseconds per signature, median of 5 processes. “wrong signature” means the library’s result differed from botocore’s for that request, so it was not timed.

**Node 26.11.1**

| Library | GET, plain key | part upload (query, headers) | GET, key and query to encode | PUT, 1 KiB body |
|---|--:|--:|--:|--:|
| **sigflint** | **1.91** | **2.68** | **2.88** | **3.18** |
| aws4fetch | 232.98 | 234.47 | 239.51 | 230.76 |
| aws4 | 6.03 | 6.90 | 8.32 | 6.31 |
| @smithy/signature-v4 | 10.51 | 10.74 | wrong signature | 11.68 |
| aws-sig | 59.09 | wrong signature | wrong signature | wrong signature |
| @wdl-dev/aws-sigv4 | 726.24 | 640.23 | 725.76 | wrong signature |
| minio | 11.86 | 11.64 | wrong signature | 12.71 |

**Bun 1.4.3**

| Library | GET, plain key | part upload (query, headers) | GET, key and query to encode | PUT, 1 KiB body |
|---|--:|--:|--:|--:|
| **sigflint** | **1.59** | **2.49** | **3.95** | **3.21** |
| aws4fetch | 213.13 | 213.46 | 221.21 | 211.75 |
| aws4 | 7.65 | 8.86 | 12.47 | 9.36 |
| @smithy/signature-v4 | 9.82 | 12.27 | wrong signature | 13.72 |
| aws-sig | 44.27 | wrong signature | wrong signature | wrong signature |
| @wdl-dev/aws-sigv4 | 584.37 | 603.80 | 587.12 | wrong signature |
| minio | 8.21 | 9.70 | wrong signature | 10.33 |

Reporting band (the larger of 3% and twice the larger run-to-run range of the two sigflint control arms): bun 1.4.3 bench-download: 31%; bun 1.4.3 bench-part-put: 32%; bun 1.4.3 bench-encode: 54%; bun 1.4.3 bench-body-1k: 15%; node 26.11.1 bench-download: 17%; node 26.11.1 bench-part-put: 54%; node 26.11.1 bench-encode: 28%; node 26.11.1 bench-body-1k: 39%. Every gap between sigflint and another library is far outside its band.


### Size

| Library | Source (bytes) | Bundled + minified (bytes) | + gzip | + brotli | Direct dependencies | Installed on disk (bytes) |
|---|--:|--:|--:|--:|--:|--:|
| **sigflint** | 11,435 | 3,357 | 1,763 | 1,608 | 0 |  |
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
