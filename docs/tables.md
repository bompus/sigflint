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


### Size

| Library | Source, all signers (bytes) | Bundled + minified (bytes) | + gzip | + brotli | Direct dependencies | Installed on disk (bytes) |
|---|--:|--:|--:|--:|--:|--:|
| **sigflint** | 34,486 | 5,651 | 2,769 | 2,550 | 0 |  |
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
