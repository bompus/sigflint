### Correctness

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

### Speed

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


### Size

| Library | Source, all signers (bytes) | Bundled + minified (bytes) | + gzip | + brotli | Direct dependencies | Installed on disk (bytes) |
|---|--:|--:|--:|--:|--:|--:|
| **sigflint** | 35,051 | 5,667 | 2,774 | 2,557 | 0 |  |
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
| **sigflint/web** | ✓ | ✓ | ✓ | ✓ | ✓ |
| aws4fetch | ✓ | ✓ | ✓ | ✓ | ✓ |
| aws4 | ✓ | ✓ | ✓ | ✓ | ✗ |
| @smithy/signature-v4 | ✓ | ✓ | ✓ | ✗ | ✗ |
| @smithy/signature-v4 (web hash) | ✓ | ✓ | ✓ | ✓ | ✓ |
| aws-sig | ✓ | ✓ | ✓ | ✓ | ✓ |
| @wdl-dev/aws-sigv4 | ✓ | ✓ | ✓ | ✓ | ✓ |
| minio | ✓ | ✓ | ✓ | ✓ | ✗ |

Runtimes: node 26.12.0, bun 1.4.3, deno 2.9.6; Workers run in local workerd through wrangler (see bench/frozen/versions.txt). ✗ cells: smithy on Workers + nodejs_compat: Hash.bind is not a function; aws4 on Workers, no flag: does not load (bundle error); smithy on Workers, no flag: Hash.bind is not a function; minio on Workers, no flag: does not load (bundle error).
