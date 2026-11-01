### Correctness

Matches against botocore with the same key and clock. Compare libraries within an input method. Counts show matches / supported requests. The common decoded-key column does not apply to serialized-URL inputs. Versions identify the recorded runs.

| Library | Input method | Version | Ordinary matches / supported | Unsupported ordinary | Edge matches / tested | Common decoded-key matches / 578 |
|---|---|---|--:|--:|--:|--:|
| **sigflint** | Serialized URL | 1.0.4 | 1,520 / 1,520 | 0 | 1,838 / 1,838 | Not applicable |
| aws4 | Serialized URL | 1.13.2 | 1,264 / 1,520 | 0 | 424 / 1,838 | Not applicable |
| aws4fetch | Serialized URL | 1.0.20 | 1,408 / 1,520 | 0 | 790 / 1,838 | Not applicable |
| aws-sig | Serialized URL | 2.1.0 | 379 / 1,520 | 0 | 65 / 1,838 | Not applicable |
| minio | Serialized URL | 8.0.7 | 526 / 1,520 | 0 | 40 / 1,838 | Not applicable |
| @smithy/signature-v4 | Serialized URL | 5.7.5 | 904 / 1,520 | 0 | 333 / 1,838 | Not applicable |
| @wdl-dev/aws-sigv4 | Serialized URL | 3.0.4 | 1,174 / 1,520 | 0 | 234 / 1,838 | Not applicable |
| **sigflint** | Decoded key | 1.0.4 | 1,520 / 1,520 | 0 | 1,252 / 1,252 (588 unsupported) | 578 / 578 |
| lean-s3 | Decoded key | 0.11.2 source | 1,293 / 1,520 | 0 | 1,013 / 1,252 (588 unsupported) | 458 / 578 |
| s3-lite-client | Decoded key | 1.0.1 | 1,519 / 1,520 | 0 | 1,252 / 1,252 (588 unsupported) | 578 / 578 |
| s3mini | Decoded key | 1.0.3 | 494 / 578 | 942 | 567 / 645 (1,195 unsupported) | 494 / 578 |
| tiny-oss | Decoded key | 1.2.0 source | 993 / 1,519 | 1 | 513 / 1,252 (588 unsupported) | 316 / 578 |

### Speed

Microseconds per signature, median of 2 processes. “wrong signature” means the library’s result differed from botocore’s for that request, so it was not timed; a blank means the library does not offer that API.

**Node 26.13.0**

| Library | GET, plain key | part upload (query, headers) | GET, key and query to encode | PUT, 1 KiB body |
|---|--:|--:|--:|--:|
| **sigflint** | **0.99** | **1.27** | **1.71** | **1.68** |
| aws4 | 4.88 | 5.80 | 7.08 | 5.19 |
| aws4fetch | 26.03 | 27.49 | 26.69 | 27.28 |
| aws-sig | 49.27 | wrong signature | wrong signature | 58.05 |
| lean-s3 | 3.44 | 3.32 | 4.44 | wrong signature |
| minio | 10.64 | 10.00 | wrong signature | 11.06 |
| s3-lite-client | 65.81 | 67.06 | 73.56 | 63.25 |
| s3mini | cannot sign | 26.93 | cannot sign | cannot sign |
| @smithy/signature-v4 | 8.73 | 8.88 | wrong signature | 9.22 |
| tiny-oss | 51.77 | 46.72 | wrong signature | 49.78 |
| @wdl-dev/aws-sigv4 | 72.98 | 64.14 | 81.84 | 73.95 |

**Bun 1.4.4**

| Library | GET, plain key | part upload (query, headers) | GET, key and query to encode | PUT, 1 KiB body |
|---|--:|--:|--:|--:|
| **sigflint** | **0.65** | **0.92** | **1.51** | **1.33** |
| aws4 | 3.43 | 4.31 | 5.42 | 3.68 |
| aws4fetch | 17.18 | 18.74 | 19.52 | 19.38 |
| aws-sig | 30.22 | wrong signature | wrong signature | 42.07 |
| lean-s3 | 1.92 | 2.04 | 2.98 | wrong signature |
| minio | 3.62 | 3.74 | wrong signature | 4.35 |
| s3-lite-client | 50.28 | 54.34 | 55.74 | 54.30 |
| s3mini | cannot sign | 19.14 | cannot sign | cannot sign |
| @smithy/signature-v4 | 5.17 | 6.09 | wrong signature | 6.24 |
| tiny-oss | 22.93 | 22.08 | wrong signature | 22.94 |
| @wdl-dev/aws-sigv4 | 56.41 | 58.55 | 60.83 | 65.38 |

Reporting band (the larger of 3% and twice the larger run-to-run range of the two sigflint control arms): node 26.13.0 bench-download: 6%; node 26.13.0 bench-part-put: 3%; node 26.13.0 bench-encode: 5%; node 26.13.0 bench-body-1k: 3%; bun 1.4.4 bench-download: 5%; bun 1.4.4 bench-part-put: 6%; bun 1.4.4 bench-encode: 8%; bun 1.4.4 bench-body-1k: 11%. Every gap between sigflint and another library is far outside its band.


### Size

| Library | Source, all signers (bytes) | Bundled + minified (bytes) | + gzip | + brotli | Direct dependencies | Installed on disk (bytes) |
|---|--:|--:|--:|--:|--:|--:|
| **sigflint** | 42,043 | 5,677 | 2,769 | 2,560 | 0 |  |
| aws4 |  | 9,026 | 3,249 | 2,971 | 0 | 23,399 |
| aws4fetch |  | 7,428 | 2,927 | 2,626 | 0 | 65,541 |
| aws-sig |  | 9,942 | 4,173 | 3,787 | 0 | 270,403 |
| lean-s3 |  | 2,366 | 1,173 | 1,061 |  |  |
| minio |  | 330,170 | 84,973 | 74,103 | 13 | 2,092,892 |
| s3-lite-client |  | 2,442 | 1,174 | 1,046 | 0 | 308,520 |
| s3mini |  | 32,929 | 10,281 | 9,220 | 0 | 276,956 |
| @smithy/signature-v4 |  | 166,314 | 53,316 | 45,657 | 3 | 106,908 |
| tiny-oss |  | 6,685 | 3,042 | 2,663 |  |  |
| @wdl-dev/aws-sigv4 |  | 15,979 | 5,504 | 4,986 | 0 | 82,832 |


lean-s3: signing core from the pinned source, as compiled by compat/build-clients.mjs. s3-lite-client: signing function only, as compiled by compat/build-clients.mjs. s3mini: the whole client class: its signer is not exported. tiny-oss: signing core from the pinned source, as compiled by compat/build-clients.mjs.

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
| @wdl-dev/aws-sigv4 | 906 / 1,399 (223 unsupported) | 0 / 0 (696 unsupported) | 0 / 0 (127 unsupported) | 0 / 0 (777 unsupported) |
