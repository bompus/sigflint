# sigflint

Fast AWS Signature Version 4 request signing for S3, with no dependencies. It runs on Node.js, Bun, Deno and Cloudflare Workers.

```js
import { getAuthHeaders } from 'sigflint';

const url = new URL('https://my-bucket.s3.us-east-1.amazonaws.com/photos/cat.jpg');
const headers = await getAuthHeaders(
  { method: 'GET', url, region: 'us-east-1' },
  { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY },
);
const response = await fetch(url, { headers });
```

- **Correct.** It returns the same signature as botocore for all 3,360 requests in its test corpus, including keys with spaces, `+`, `%`, unicode and sorted, repeated and empty query parameters. See [how it is tested](#how-it-is-tested).
- **Fast.** 1.3 to 3.4 µs per signature on Node and Bun. The other libraries take 2.7 to 550 times as long on the requests they sign correctly. See [speed](#speed).
- **Small.** 4.5 kB minified, 2.3 kB gzipped, nothing to install with it. See [size](#size).
- **Everywhere.** One import on Node, Bun, Deno and Cloudflare Workers, with or without `nodejs_compat`. See [runtimes](#runtimes).

It signs S3 requests with the `Authorization` header. Presigned URLs, other AWS services and streaming uploads are not in 1.0 ([scope](#scope)).

## Install

```sh
npm install sigflint
```

Node.js 22.12 or newer (it is an ES module; Node 22.12 can also `require()` it). Bun and Deno need no setup.

## Usage

Sign a request and send the returned headers with it. The `host` header is signed but not returned; your HTTP client sets it from the URL.

```js
import { getAuthHeaders } from 'sigflint';

const credentials = { accessKeyId, secretAccessKey, sessionToken }; // sessionToken is optional

// upload an object: the body is hashed into x-amz-content-sha256
const url = new URL('https://my-bucket.s3.us-east-1.amazonaws.com/notes/today.json');
const body = JSON.stringify({ done: true });
const headers = await getAuthHeaders(
  { method: 'PUT', url, region: 'us-east-1', body, signHeaders: { 'content-type': 'application/json' } },
  credentials,
);
await fetch(url, { method: 'PUT', headers, body });
```

For a large or binary body, skip hashing and send `unsignedPayload: true`. S3 accepts that over HTTPS.

```js
const headers = await getAuthHeaders({ method: 'PUT', url, region, unsignedPayload: true }, credentials);
```

Any S3-compatible service works the same way; pass its region name and URL (`https://us-sea-1.linodeobjects.com/bucket/key`, `http://127.0.0.1:9000/bucket/key`).

### Always `await`

On Node.js, Bun and Deno `getAuthHeaders` returns the headers directly. In Cloudflare Workers and browsers it returns a promise, because the only SHA-256 and HMAC there is WebCrypto, which has only promises. The package picks the right one when you import it (the `workerd`, `worker` and `browser` export conditions select the WebCrypto code, with or without `nodejs_compat`), so `await` the result and the same code runs everywhere. The TypeScript type is `headers | Promise<headers>`, so forgetting the `await` is a compile error rather than a request with no signature.

On Node and Bun, the `await` adds 0 to 0.1 µs to a 1.1 to 1.3 µs call (`bench/await-cost.mjs`). `sigflint/web` selects the WebCrypto code on any runtime. On Node and Bun it takes about 170 µs per signature, more than 100 times as long as the default, so import it only where you need it.

## API

### `getAuthHeaders(request, credentials)`

Returns an object of headers to send with the request (or, in Workers and browsers, a promise of it): `authorization`, `x-amz-date`, `x-amz-content-sha256`, `x-amz-security-token` when you passed a session token, and any extra headers you asked it to sign (names lowercased). The request, including the `URL`, is not modified.

`request`

| Field | Type | |
|---|---|---|
| `method` | `string` | `GET`, `HEAD`, `PUT`, `POST`, `DELETE` |
| `url` | `URL` | the full request URL, host included |
| `region` | `string` | for example `us-west-2`. Pass it: the default is an empty string, which no S3 region matches |
| `body` | `string` | hashed into `x-amz-content-sha256`. Missing or empty means the hash of an empty body |
| `unsignedPayload` | `boolean` | send `UNSIGNED-PAYLOAD` instead of hashing the body |
| `signHeaders` | `Record<string, string>` | extra headers to sign and return, such as `x-amz-acl` or `content-type` |
| `now` | `number` | signing time in milliseconds since the epoch. Default: the current time |

`credentials`

| Field | Type | |
|---|---|---|
| `accessKeyId` | `string` | |
| `secretAccessKey` | `string` | |
| `sessionToken` | `string` (optional) | temporary credentials; signed and returned as `x-amz-security-token` |

Types are included (`.d.ts`, generated from the source).

### How it reads the URL

- **Paths.** Percent-escapes are decoded and every byte except `A-Z a-z 0-9 - . _ ~ /` is encoded again, once. A raw `+` in the path is a space, which is how S3 reads it; `%2B` is a plus. An escape that is not valid (`%zz`, a lone `%`) is signed as a literal `%`.
- **Queries.** Names and values are decoded and encoded the same way, sorted by name and then value, and a name with no value is written as `name=`. Repeated names keep every value.
- **Headers.** Names are lowercased, values trimmed with runs of spaces collapsed, and the list sorted.

The signing key for each secret, date and region is derived once and kept (up to 1,000 of them), so a repeated call costs one hash and one HMAC over short strings (plus a hash of the body, when there is one).

## Runtimes

<!-- BEGIN runtimes -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/runtimes-dark.svg">
  <img alt="Grid: which runtimes each library runs on" src="docs/runtimes-light.svg">
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
  <source media="(prefers-color-scheme: dark)" srcset="docs/correctness-dark.svg">
  <img alt="Bar chart: how many requests each library signs the same as botocore" src="docs/correctness-light.svg">
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

The reference is botocore's S3 signer (`S3SigV4Auth`), run on the same requests with a fixed clock, plus the four example signatures printed in the S3 documentation. “Ordinary requests” are valid S3 requests: keys and queries with spaces, unicode, reserved characters, repeated and unsorted parameters. “Edge cases” are requests a strict reading of the specification covers but most libraries do not: a stray `%` or invalid UTF-8 in the URL, a raw `+` in the path, a query pair with an empty name, and headers some libraries never sign (`date`, `range`). sigflint also passes all 316 requests with a session token; the others were not run on those.

Some of the other libraries expect the caller to canonicalize the path and query first. When the harness hands `@smithy/signature-v4` botocore's canonical path and query, it matches on all 1,211 ordinary requests; `minio` matches on 1,066 of them. The table above is what each library produces when given the URL as an application has it.

## Speed

<!-- BEGIN speed -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/speed-dark.svg">
  <img alt="Bar chart: time to sign one request on Node.js and Bun" src="docs/speed-light.svg">
</picture>

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

<!-- END speed -->

## Memory

<!-- BEGIN memory -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/memory-alloc-dark.svg">
  <img alt="Bar chart: heap allocated per signature on Node.js and Bun" src="docs/memory-alloc-light.svg">
</picture>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/memory-gc-dark.svg">
  <img alt="Bar chart: garbage-collection pause per 10,000 signatures on Node.js and Bun" src="docs/memory-gc-light.svg">
</picture>

**Node 26.11.1**, plain GET of one key:

| Library | Heap allocated per call | Collections per 10,000 calls | GC pause per 10,000 calls | Peak memory of the process | Import + first signature |
|---|--:|--:|--:|--:|--:|
| **sigflint** | **2.4 KiB** | **6** | **1.2 ms** | **112.0 MiB** | **2.8 ms** |
| aws4 | 9.8 KiB (4.0×) | 24 (4.0×) | 7.6 ms (6.2×) | 113.5 MiB (no clear change) | 3.7 ms (no clear change) |
| minio | 8.3 KiB (3.4×) | 19 (3.2×) | 24.1 ms (20×) | 114.4 MiB (no clear change) | 17.5 ms (6.4×) |
| aws4fetch | 29.3 KiB (12×) | 90 (15×) | 45.6 ms (37×) | 124.5 MiB (1.1×) | 18.3 ms (6.6×) |
| @smithy/signature-v4 | 17.8 KiB (7.4×) | 44 (7.3×) | 21.4 ms (18×) | 112.2 MiB (no clear change) | 13.5 ms (4.9×) |
| aws-sig | 69.4 KiB (29×) | 46 (7.7×) | 42.7 ms (35×) | 165.6 MiB (1.5×) | 8.8 ms (3.2×) |
| @wdl-dev/aws-sigv4 | 58.0 KiB (24×) | 174 (29×) | 106 ms (87×) | 125.2 MiB (1.1×) | 18.8 ms (6.8×) |

**Bun 1.4.3**, plain GET of one key:

| Library | Heap allocated per call | Collections per 10,000 calls | GC pause per 10,000 calls | Peak memory of the process | Import + first signature |
|---|--:|--:|--:|--:|--:|
| **sigflint** | **1.4 KiB** | **3** | **6.0 ms** | **62.3 MiB** | **2.2 ms** |
| aws4 | 6.4 KiB (4.7×) | 14 (4.7×) | 27.9 ms (4.6×) | 70.7 MiB (1.1×) | 3.3 ms (1.5×) |
| minio | 7.0 KiB (5.2×) | 16 (5.3×) | 35.1 ms (5.8×) | 71.3 MiB (1.1×) | 22.0 ms (9.8×) |
| aws4fetch | 15.1 KiB (11×) | 28 (9.3×) | 65.8 ms (11×) | 69.6 MiB (1.1×) | 3.1 ms (no clear change) |
| @smithy/signature-v4 | 13.2 KiB (9.7×) | 24 (8.0×) | 50.1 ms (8.3×) | 73.7 MiB (1.2×) | 12.0 ms (5.3×) |
| aws-sig | 47.8 KiB (35×) | 80 (27×) | 153 ms (25×) | 79.9 MiB (1.3×) | 4.7 ms (2.1×) |
| @wdl-dev/aws-sigv4 | 29.9 KiB (22×) | 50 (17×) | 144 ms (24×) | 75.2 MiB (1.2×) | 5.1 ms (2.3×) |

Median of 5 processes, one fresh process per library, runtime and round. “(×)” is the library's value divided by sigflint's; “no clear change” means the gap is inside the reporting band. Across all four workloads, the libraries that sign them correctly allocate 2.0 to 35 times as much heap per call as sigflint. Reporting bands (the larger of the metric's floor and twice the larger spread of the two sigflint control arms): heap per call 6%; GC pause 50% to 86%; peak memory 5% to 6%; import + first signature 40% to 95%. Every gap shown with a multiplier is outside its band.
<!-- END memory -->

What is counted: the JavaScript heap that one `getAuthHeaders` call allocates (native memory, such as hash state, is not in it), the stop-the-world garbage-collection time over 10,000 calls, the peak resident memory of a process that loaded only that library, and the time to import the library and sign once in a fresh process. Importing alone is not clearly faster than `aws4fetch` or `aws4` on either runtime; the gap is inside the noise band. Across 20,000 calls no library showed a clear growth in retained heap, with one small exception: `aws4fetch` and `@wdl-dev/aws-sigv4` kept about 100 to 190 KiB more per 10,000 calls on Node for the plain GET, which is not shown to be a leak. sigflint keeps up to 1,000 signing keys, about 340 bytes each on Node and 355 on Bun, so a full cache is about 340 KB; the other libraries' caches were not measured.

The numbers for the other three workloads, the per-round values and the calibration of the allocation counters are in [`bench/results/memory-report.md`](bench/results/memory-report.md) and [`bench/memory-protocol.md`](bench/memory-protocol.md).

## Size

<!-- BEGIN size -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/size-dark.svg">
  <img alt="Bar chart: bundled, minified and gzipped size of each library" src="docs/size-light.svg">
</picture>

| Library | Source (bytes) | Bundled + minified (bytes) | + gzip | + brotli | Direct dependencies | Installed on disk (bytes) |
|---|--:|--:|--:|--:|--:|--:|
| **sigflint** | 15,248 | 4,499 | 2,324 | 2,155 | 0 |  |
| aws4fetch |  | 7,428 | 2,915 | 2,626 | 0 | 65,541 |
| aws4 |  | 9,026 | 3,251 | 2,971 | 0 | 23,399 |
| @smithy/signature-v4 |  | 140,787 | 45,924 | 39,907 | 3 | 106,103 |
| aws-sig |  | 9,942 | 4,167 | 3,787 | 0 | 270,403 |
| @wdl-dev/aws-sigv4 |  | 15,979 | 5,484 | 4,986 | 0 | 82,832 |
| minio |  | 330,170 | 85,329 | 74,103 | 13 | 2,092,892 |
<!-- END size -->

## How it is tested

`test/corpus.json` holds 3,360 requests and the signature botocore computes for each: the four S3 documentation examples, hand-picked edge cases, and 3,300 seeded random requests. `npm test` signs every one and compares. The corpus is generated by `conformance/` (run `npm run conformance` to rebuild it with the pinned botocore); the generator, the cases and the reference script are in the repository. The same tests run on Node 22, 24 and 26, Bun and Deno in CI.

## Methodology and limits

- Speed: one process per library, runtime and round; 5 rounds with the library order reversed on every other round; 8 arms, so sigflint ran twice (A and B) as a noise control. Each process validates its signature against botocore first, then times batches of about 50 ms for one second and reports the median. The reporting band is the larger of 3% and twice the larger spread of the two sigflint arms; every gap in the tables above is far outside it. The protocol was written before the runs ([`bench/protocol.md`](bench/protocol.md)) and the raw results are in `bench/results/`.
- Memory: 5 rounds, 810 processes, each under a 2 GB cgroup cap; allocation is counted differently on Node (heap growth between collections) and Bun (the engine's collector log), checked against a known allocator to within 10%, so Node and Bun numbers are not compared with each other. The protocol was written before the run ([`bench/memory-protocol.md`](bench/memory-protocol.md)).
- The requests are synthetic and the signing date is fixed, so each library's signing-key cache behaves as it would within one day. Nothing here measures a network request, and a single signature is microseconds beside it.
- Machine: one shared Linux host, normal priority, no CPU pinning. Versions of everything are in `bench/frozen/versions.txt`.
- Not timed: `Bun.S3Client.presign` (query-string signing, a different request) and `@aws-lite/client` (wraps `aws4`).
- Not tested: real Cloudflare, real AWS S3 (the signatures are checked against botocore, not against a live server).
- Reproduce: `cd bench && npm ci && node screen.mjs ../src/node.js && ./run-matrix.sh "$PWD/frozen" "$PWD/results/speed-raw.jsonl" && node analyze.mjs && node sizes.mjs && node make-assets.mjs`.

## Scope

1.0 signs S3 requests in header form. It is not a general AWS signer. Not included, and not promised:

- presigned URLs (query-string signing)
- other AWS services (they canonicalize the path differently)
- chunked or streaming payloads and SigV4a
- binary bodies hashed for you; hash them yourself, or use `unsignedPayload`

Open an issue describing the use case if you need one of them.

## Security

See [SECURITY.md](SECURITY.md). sigflint never logs or stores credentials.

## License

[MIT](LICENSE)
