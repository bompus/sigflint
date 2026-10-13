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

- **Correct.** It returns the same signature as botocore for all 3,049 requests in its test corpus, including keys with spaces, `+`, `%`, unicode and sorted, repeated and empty query parameters. See [how it is tested](#how-it-is-tested).
- **Fast.** 1.6 to 4 µs per signature on Node and Bun. The other libraries take 2 to 380 times as long on the requests they sign correctly. See [speed](#speed).
- **Small.** 3.4 kB minified, 1.8 kB gzipped, nothing to install with it. See [size](#size).
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

On Node and Bun, the `await` adds about 0.1 µs to a 1.2 to 2 µs call (`bench/await-cost.mjs`). On a Worker the WebCrypto version takes about 7 µs where `node:crypto` takes about 5 µs (a local workerd pilot); `sigflint/web` selects the WebCrypto code on any runtime, and on Node, Bun and Deno it is about 100 times slower than the default (about 160 µs), so import it only where you need it.

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

| Library | Version | Ordinary requests (1,211) | Edge cases (1,522) |
|---|---|--:|--:|
| **sigflint** | 0.1.0 | 1,211 (100.0%) | 1,522 (100.0%) |
| aws4fetch | 1.0.20 | 1,208 (99.8%) | 595 (39.1%) |
| aws4 | 1.13.2 | 1,063 (87.8%) | 268 (17.6%) |
| @smithy/signature-v4 | 5.7.4 | 596 (49.2%) | 236 (15.5%) |
| @wdl-dev/aws-sigv4 | 3.0.4 | 358 (29.6%) | 44 (2.9%) |
| minio | 8.0.7 | 255 (21.1%) | 3 (0.2%) |
| aws-sig | 2.1.0 | 78 (6.4%) | 12 (0.8%) |
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

<!-- END speed -->

## Size

<!-- BEGIN size -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/size-dark.svg">
  <img alt="Bar chart: bundled, minified and gzipped size of each library" src="docs/size-light.svg">
</picture>

| Library | Source (bytes) | Bundled + minified (bytes) | + gzip | + brotli | Direct dependencies | Installed on disk (bytes) |
|---|--:|--:|--:|--:|--:|--:|
| **sigflint** | 11,435 | 3,357 | 1,763 | 1,608 | 0 |  |
| aws4fetch |  | 7,428 | 2,915 | 2,626 | 0 | 65,541 |
| aws4 |  | 9,026 | 3,251 | 2,971 | 0 | 23,399 |
| @smithy/signature-v4 |  | 140,787 | 45,924 | 39,907 | 3 | 106,103 |
| aws-sig |  | 9,942 | 4,167 | 3,787 | 0 | 270,403 |
| @wdl-dev/aws-sigv4 |  | 15,979 | 5,484 | 4,986 | 0 | 82,832 |
| minio |  | 330,170 | 85,329 | 74,103 | 13 | 2,092,892 |
<!-- END size -->

## How it is tested

`test/corpus.json` holds 3,049 requests and the signature botocore computes for each: the four S3 documentation examples, hand-picked edge cases, and 3,000 seeded random requests. `npm test` signs every one and compares. The corpus is generated by `conformance/` (run `npm run conformance` to rebuild it with the pinned botocore); the generator, the cases and the reference script are in the repository. The same tests run on Node 22, 24 and 26, Bun and Deno in CI.

## Methodology and limits

- Speed: one process per library, runtime and round; 5 rounds with the library order reversed on every other round; 8 arms, so sigflint ran twice (A and B) as a noise control. Each process validates its signature against botocore first, then times batches of about 50 ms for one second and reports the median. The reporting band is the larger of 3% and twice the larger spread of the two sigflint arms; every gap in the tables above is far outside it. The protocol was written before the runs ([`bench/protocol.md`](bench/protocol.md)) and the raw results are in `bench/results/`.
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
