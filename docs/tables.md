### Correctness

Matches against botocore with the same key and clock. Compare libraries within an input method. Counts show matches / supported requests. The common decoded-key column does not apply to serialized-URL inputs. Versions identify the recorded runs.

| Library | Input method | Version | Ordinary matches / supported | Unsupported ordinary | Edge matches / tested | Common decoded-key matches / 578 |
|---|---|---|--:|--:|--:|--:|
| **sigflint** | Serialized URL | 1.0.3 | 1,520 / 1,520 | 0 | 1,522 / 1,522 | Not applicable |
| aws4 | Serialized URL | 1.13.2 | 1,264 / 1,520 | 0 | 268 / 1,522 | Not applicable |
| aws4fetch | Serialized URL | 1.0.20 | 1,408 / 1,520 | 0 | 595 / 1,522 | Not applicable |
| aws-sig | Serialized URL | 2.1.0 | 226 / 1,520 | 0 | 12 / 1,522 | Not applicable |
| minio | Serialized URL | 8.0.7 | 526 / 1,520 | 0 | 3 / 1,522 | Not applicable |
| @smithy/signature-v4 | Serialized URL | 5.7.5 | 904 / 1,520 | 0 | 236 / 1,522 | Not applicable |
| @wdl-dev/aws-sigv4 | Serialized URL | 3.0.4 | 666 / 1,520 | 0 | 44 / 1,522 | Not applicable |
| **sigflint** | Decoded key | 1.0.3 | 1,520 / 1,520 | 0 | 1,252 / 1,252 (588 unsupported) | 578 / 578 |
| lean-s3 | Decoded key | 0.11.2 source | 1,293 / 1,520 | 0 | 1,013 / 1,252 (588 unsupported) | 458 / 578 |
| s3-lite-client | Decoded key | 1.0.1 | 1,519 / 1,520 | 0 | 1,252 / 1,252 (588 unsupported) | 578 / 578 |
| s3mini | Decoded key | 1.0.3 | 494 / 578 | 942 | 567 / 645 (1,195 unsupported) | 494 / 578 |
| tiny-oss | Decoded key | 1.2.0 source | 993 / 1,519 | 1 | 513 / 1,252 (588 unsupported) | 316 / 578 |

### Speed

Microseconds per signature, median of 3 processes. “wrong signature” means the library’s result differed from botocore’s for that request, so it was not timed; a blank means the library does not offer that API.

**Node 26.12.1**

| Library | GET, plain key | part upload (query, headers) | GET, key and query to encode | PUT, 1 KiB body |
|---|--:|--:|--:|--:|
| **sigflint** | **0.97** | **1.25** | **1.69** | **1.66** |
| aws4 | 5.11 | 6.06 | 7.28 | 5.38 |
| aws4fetch | 24.67 | 27.12 | 26.94 | 26.94 |
| aws-sig | 47.18 | wrong signature | wrong signature | wrong signature |
| lean-s3 | Not measured | Not measured | Not measured | Not measured |
| minio | 10.29 | 10.05 | wrong signature | 11.31 |
| s3-lite-client | Not measured | Not measured | Not measured | Not measured |
| s3mini | Not measured | Not measured | Not measured | Not measured |
| @smithy/signature-v4 | 8.79 | 9.10 | wrong signature | 9.80 |
| tiny-oss | Not measured | Not measured | Not measured | Not measured |
| @wdl-dev/aws-sigv4 | 72.43 | 65.97 | 72.84 | wrong signature |

**Bun 1.4.4**

| Library | GET, plain key | part upload (query, headers) | GET, key and query to encode | PUT, 1 KiB body |
|---|--:|--:|--:|--:|
| **sigflint** | **0.66** | **0.96** | **1.51** | **1.25** |
| aws4 | 3.39 | 4.28 | 5.51 | 3.71 |
| aws4fetch | 19.13 | 19.27 | 20.86 | 20.04 |
| aws-sig | 30.21 | wrong signature | wrong signature | wrong signature |
| lean-s3 | Not measured | Not measured | Not measured | Not measured |
| minio | 3.51 | 3.80 | wrong signature | 4.14 |
| s3-lite-client | Not measured | Not measured | Not measured | Not measured |
| s3mini | Not measured | Not measured | Not measured | Not measured |
| @smithy/signature-v4 | 5.05 | 6.01 | wrong signature | 6.11 |
| tiny-oss | Not measured | Not measured | Not measured | Not measured |
| @wdl-dev/aws-sigv4 | 45.78 | 49.80 | 55.57 | wrong signature |

Reporting band (the larger of 3% and twice the larger run-to-run range of the two sigflint control arms): node 26.12.1 bench-download: 5%; node 26.12.1 bench-part-put: 5%; node 26.12.1 bench-encode: 6%; node 26.12.1 bench-body-1k: 6%; bun 1.4.4 bench-download: 3%; bun 1.4.4 bench-part-put: 3%; bun 1.4.4 bench-encode: 6%; bun 1.4.4 bench-body-1k: 13%. Every gap between sigflint and another library is far outside its band.


### Size

| Library | Source, all signers (bytes) | Bundled + minified (bytes) | + gzip | + brotli | Direct dependencies | Installed on disk (bytes) |
|---|--:|--:|--:|--:|--:|--:|
| **sigflint** | 42,043 | 5,677 | 2,769 | 2,560 | 0 |  |
| aws4 |  | 9,026 | 3,249 | 2,971 | 0 | 23,399 |
| aws4fetch |  | 7,428 | 2,927 | 2,626 | 0 | 65,541 |
| aws-sig |  | 9,942 | 4,173 | 3,787 | 0 | 270,403 |
| lean-s3 | Not measured | Not measured | Not measured | Not measured | Not measured | Not measured |
| minio |  | 330,170 | 84,973 | 74,103 | 13 | 2,092,892 |
| s3-lite-client | Not measured | Not measured | Not measured | Not measured | Not measured | Not measured |
| s3mini | Not measured | Not measured | Not measured | Not measured | Not measured | Not measured |
| @smithy/signature-v4 |  | 140,787 | 45,963 | 39,907 | 3 | 106,103 |
| tiny-oss | Not measured | Not measured | Not measured | Not measured | Not measured | Not measured |
| @wdl-dev/aws-sigv4 |  | 15,979 | 5,504 | 4,986 | 0 | 82,832 |

### Runtimes

| Library | Node.js | Bun | Deno | Workers + nodejs_compat | Workers, no flag |
|---|:-:|:-:|:-:|:-:|:-:|
| **sigflint** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **sigflint/web** | ✓ | ✓ | ✓ | ✓ | ✓ |
| aws4 | ✓ | ✓ | ✓ | ✓ | ✗ |
| aws4fetch | ✓ | ✓ | ✓ | ✓ | ✓ |
| aws-sig | ✓ | ✓ | ✓ | ✓ | ✓ |
| lean-s3 | ✓ | ✓ | ✓ | ✓ | ✗ |
| minio | ✓ | ✓ | ✓ | ✓ | ✗ |
| s3-lite-client | ✓ | ✓ | ✓ | ✓ | ✓ |
| s3mini | ✓ | ✓ | ✓ | ✓ | ✓ |
| @smithy/signature-v4 | ✓ | ✓ | ✓ | ✗ | ✗ |
| @smithy/signature-v4 (web hash) | ✓ | ✓ | ✓ | ✓ | ✓ |
| tiny-oss | ✓ | ✓ | ✓ | ✓ | ✓ |
| @wdl-dev/aws-sigv4 | ✓ | ✓ | ✓ | ✓ | ✓ |

Runtimes: node 26.13.0, bun 1.4.4, deno 2.9.6; Workers run in local workerd through wrangler 4.156.0, workerd 1.20261023.1 (run 2026-10-31; see bench/results/compat-environment.json). ✗ cells: smithy on Workers + nodejs_compat: Hash.bind is not a function; aws4 on Workers, no flag: does not load (bundle error); smithy on Workers, no flag: Hash.bind is not a function; minio on Workers, no flag: does not load (bundle error); lean-s3 on Workers, no flag: does not load (needs a node: module).

### Other services and presigned URLs

| Library | Header signing, other services (1,622) | Presigned URLs, other services (696) | Presigned URLs, other services, payload opt-out (127) | Presigned URLs, S3 (777) |
|---|--:|--:|--:|--:|
| **sigflint** | 1,622 / 1,622 | 696 / 696 | 127 / 127 | 777 / 777 |
| aws4 | 930 / 1,622 | 696 / 696 | 127 / 127 | 777 / 777 |
| aws4fetch | 1,371 / 1,371 (251 unsupported) | 696 / 696 | 0 / 127 | 777 / 777 |
| aws-sig | 776 / 1,622 | 183 / 696 | 0 / 0 (127 unsupported) | 0 / 777 |
| lean-s3 | 0 / 0 (1,622 unsupported) | 0 / 0 (696 unsupported) | 0 / 0 (127 unsupported) | 0 / 128 (649 unsupported) |
| minio | 0 / 0 (1,622 unsupported) | 0 / 0 (696 unsupported) | 0 / 0 (127 unsupported) | 598 / 777 |
| s3-lite-client | 0 / 0 (1,622 unsupported) | 0 / 0 (696 unsupported) | 0 / 0 (127 unsupported) | 673 / 673 (104 unsupported) |
| s3mini | 0 / 0 (1,622 unsupported) | 0 / 0 (696 unsupported) | 0 / 0 (127 unsupported) | 263 / 337 (440 unsupported) |
| @smithy/signature-v4 | 1,622 / 1,622 | 696 / 696 | 127 / 127 | 777 / 777 |
| tiny-oss | 1,190 / 1,301 (321 unsupported) | 0 / 0 (696 unsupported) | 0 / 0 (127 unsupported) | 224 / 453 (324 unsupported) |
| @wdl-dev/aws-sigv4 | 826 / 1,399 (223 unsupported) | 0 / 0 (696 unsupported) | 0 / 0 (127 unsupported) | 0 / 0 (777 unsupported) |
