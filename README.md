# sigflint

Fast AWS Signature Version 4 request signing for every AWS service, with no dependencies. It runs on Node.js, Bun, Deno, Cloudflare Workers and browsers.

```js
import { getAuthHeaders } from 'sigflint';

const url = new URL('https://my-bucket.s3.us-east-1.amazonaws.com/photos/cat.jpg');
const headers = await getAuthHeaders(
  { method: 'GET', url, region: 'us-east-1' },
  { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY },
);
const response = await fetch(url, { headers });
```

It signs requests with the `Authorization` header or as a presigned URL, for S3 and for any other service (`service: 'dynamodb'`, `'sqs'`, `'execute-api'`, ...), and it also does multi-region signatures (SigV4a), chunked uploads and event streams.

- **Correct.** It returns the same signature as botocore for all 3,360 S3 requests in its test corpus, and for 1,622 requests to other services and 1,600 presigned URLs. SigV4a signatures verify against the AWS CRT's, and chunk and event signatures match the AWS SDK's. See [how it is tested](#how-it-is-tested).
- **Fast.** 1.3 to 3.7 µs per header or presigned-URL signature on Node and 1.7 to 6.4 µs on Bun. The other libraries take 1.8 to 550 times as long on the requests they sign correctly. See [speed](#speed).
- **Small, and you pay only for what you import.** Signing headers is 5.7 kB minified, 2.8 kB gzipped; presigned URLs, SigV4a, chunked uploads and event streams each add to a bundle only when imported. Nothing to install with it. See [size](#size).
- **Everywhere.** One import on Node, Bun, Deno and Cloudflare Workers, with or without `nodejs_compat`. See [runtimes](#runtimes).

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

### Other services

Pass `service` (the default is `s3`). Other services send `x-amz-content-sha256` only when you ask for an unsigned payload, and normalise the path the way their canonical request requires.

```js
const url = new URL('https://dynamodb.us-west-2.amazonaws.com/');
const body = JSON.stringify({ TableName: 'cats', Key: { id: { S: '1' } } });
const headers = await getAuthHeaders(
  { method: 'POST', url, service: 'dynamodb', region: 'us-west-2', body, signHeaders: { 'content-type': 'application/x-amz-json-1.0', 'x-amz-target': 'DynamoDB_20120810.GetItem' } },
  credentials,
);
await fetch(url, { method: 'POST', headers, body });
```

### Presigned URLs

```js
import { presign } from 'sigflint';

const link = await presign(
  { method: 'GET', url: new URL('https://my-bucket.s3.us-east-1.amazonaws.com/photos/cat.jpg'), region: 'us-east-1', expires: 900 },
  credentials,
);
```

`expires` is the lifetime in seconds (default 3600). Only the host and `signHeaders` are signed. S3 links use `UNSIGNED-PAYLOAD`; other services sign the body hash. The URL's own query parameters are kept.

### SigV4a (multi-region)

```js
import { getAuthHeadersV4a, presignV4a } from 'sigflint';

const headers = await getAuthHeadersV4a({ method: 'GET', url, region: 'us-east-1', regionSet: '*' }, credentials); // or 'us-east-1,us-west-2'
const link = await presignV4a({ method: 'GET', url, regionSet: 'us-east-1,us-west-2' }, credentials);
```

The signature is ECDSA P-256 and the credential scope has no region; `regionSet` is signed as `x-amz-region-set` (a query parameter in a presigned URL) and is required. It is a separate export so a bundle that does not import it does not contain it.

### Chunked uploads

Send an upload with `x-amz-content-sha256: STREAMING-AWS4-HMAC-SHA256-PAYLOAD` (or `...-PAYLOAD-TRAILER`) in `signHeaders`, then sign the body piece by piece. Every chunk is signed with the signature before it, so sign them in order.

```js
import { getAuthHeaders, chunkSigner } from 'sigflint';

const headers = await getAuthHeaders({ method: 'PUT', url, region, signHeaders: { 'x-amz-content-sha256': 'STREAMING-AWS4-HMAC-SHA256-PAYLOAD', 'content-encoding': 'aws-chunked', 'x-amz-decoded-content-length': String(total) } }, credentials);
const signer = chunkSigner(headers, credentials);
const frames = [await signer.chunk(part1), await signer.chunk(part2), await signer.end()]; // the bytes to send, in order
```

`end(trailers)` takes trailing headers such as `{ 'x-amz-checksum-crc32c': '...' }` and signs them (use the `-PAYLOAD-TRAILER` form).

### Event streams

```js
import { eventSigner } from 'sigflint';

const signer = eventSigner(headers, credentials); // headers from the request that opened the stream
const frame = await signer.sign(encodedMessage);  // the signed event to send
```

### Always `await`

On Node.js, Bun and Deno `getAuthHeaders` and `presign` return their result directly, and the chunk and event signers' methods return bytes. In Cloudflare Workers and browsers they return promises, because the only SHA-256 and HMAC there is WebCrypto, which has only promises. The package picks the right one when you import it (the `workerd`, `worker` and `browser` export conditions select the WebCrypto code, with or without `nodejs_compat`), so `await` the result and the same code runs everywhere. The TypeScript type is `headers | Promise<headers>` (and likewise for the others), so forgetting the `await` is a compile error rather than a request with no signature.

On Node and Bun, the `await` adds well under a microsecond to a 1.1 to 1.3 µs call (`bench/await-cost.mjs` measures it). `sigflint/web` selects the WebCrypto code on any runtime. On Node and Bun it takes about 0.2 ms per signature, 50 to 150 times as long as the default, so import it only where you need it.

## API

### `getAuthHeaders(request, credentials)`

Returns an object of headers to send with the request (or, in Workers and browsers, a promise of it): `authorization`, `x-amz-date`, `x-amz-content-sha256` (S3, or when `unsignedPayload` is set), `x-amz-security-token` when you passed a session token, and any extra headers you asked it to sign (names lowercased). The request, including the `URL`, is not modified.

`request`

| Field | Type | |
|---|---|---|
| `method` | `string` | `GET`, `HEAD`, `PUT`, `POST`, `DELETE` |
| `url` | `URL` | the full request URL, host included |
| `service` | `string` | for example `s3` (the default), `dynamodb`, `sqs`, `execute-api` |
| `region` | `string` | for example `us-west-2`. Pass it: the default is an empty string, which no region matches |
| `body` | `string` | hashed into `x-amz-content-sha256`. Missing or empty means the hash of an empty body |
| `unsignedPayload` | `boolean` | send `UNSIGNED-PAYLOAD` instead of hashing the body |
| `signHeaders` | `Record<string, string>` | extra headers to sign and return, such as `x-amz-acl` or `content-type` |
| `now` | `number` | signing time in milliseconds since the epoch. Default: the current time |
| `expires` | `number` | `presign` and `presignV4a` only: lifetime in seconds. Default 3600 |
| `regionSet` | `string` | `getAuthHeadersV4a` and `presignV4a` only, required: `us-east-1,us-west-2` or `*` |

`credentials`

| Field | Type | |
|---|---|---|
| `accessKeyId` | `string` | |
| `secretAccessKey` | `string` | |
| `sessionToken` | `string` (optional) | temporary credentials; signed and returned as `x-amz-security-token` |

### The other exports

| Export | Returns |
|---|---|
| `presign(request, credentials)` | the presigned URL, as a string |
| `getAuthHeadersV4a(request, credentials)` | the headers, signed with SigV4a |
| `presignV4a(request, credentials)` | the SigV4a presigned URL |
| `chunkSigner(authHeaders, credentials)` | `{ chunk(data), end(trailers?) }`: the bytes to send for each chunk, then the last chunk. `authHeaders` is what `getAuthHeaders` returned for the upload |
| `eventSigner(authHeaders, credentials)` | `{ sign(message, now?) }`: the signed event for each encoded message, in order |

Types are included (`.d.ts`, generated from the source).

### How it reads the URL

- **Paths.** For S3, percent-escapes are decoded and every byte except `A-Z a-z 0-9 - . _ ~ /` is encoded again, once. A raw `+` in the path is a space, which is how S3 reads it; `%2B` is a plus. An escape that is not valid (`%zz`, a lone `%`) is signed as a literal `%`. For every other service the path is normalised (empty segments dropped, `.` and `..` resolved) and encoded a second time, as the specification says.
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

The reference is botocore's S3 signer (`S3SigV4Auth`), run with a fixed clock on the same requests after `conformance/oracle.py` has normalized each path and query, plus the four example signatures printed in the S3 documentation. “Ordinary requests” are valid S3 requests: keys and queries with spaces, unicode, reserved characters, repeated and unsorted parameters. “Edge cases” are requests a strict reading of the specification covers but most libraries do not: a stray `%` or invalid UTF-8 in the URL, a raw `+` in the path, a query pair with an empty name, and headers some libraries never sign (`date`, `range`). sigflint also passes all 316 requests with a session token; the others were not run on those.

Some of the other libraries expect the caller to canonicalize the path and query first. When the harness hands `@smithy/signature-v4` botocore's canonical path and query, it matches 1,519 of the 1,520 ordinary requests; `minio` matches 1,320 of them (`bench/results/screen-node.json`). The table above is what each library produces when given the URL as an application has it.

### Other services and presigned URLs

Requests whose signature equals botocore's, from `bench/compat-more.mjs` (each library called through its normal public API; same fixed clock). The sigflint row is `npm test` on the same corpora:

<!-- BEGIN pic-compat-more -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/compat-more-dark.svg">
  <img alt="Bar chart: how many header and presigned-URL requests for other services each library signs the same as botocore" src="docs/compat-more-light.svg">
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
  <source media="(prefers-color-scheme: dark)" srcset="docs/speed-dark.svg">
  <img alt="Bar chart: time to sign one request on Node.js and Bun" src="docs/speed-light.svg">
</picture>

Microseconds per signature, median of 5 processes. “wrong signature” means the library’s result differed from botocore’s for that request, so it was not timed; a blank means the library does not offer that API.

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

### Other services, presigned URLs, and the 1.0 layout

These were measured on the final code under [`bench/protocol-more.md`](bench/protocol-more.md): the same fresh-process method as above, 5 rounds, a second copy of sigflint as the noise control. The tables above were measured on the S3 header code before it was split into modules, so part A re-times that code against the final one.

**S3 header signing, before and after the split** (nanoseconds per call; positive change is slower):

| Runtime | Workload | Before | After | Change | Reporting band | |
|---|---|--:|--:|--:|--:|---|
| node 26.12.0 | bench-download | 1,308 | 1,335 | +2.1% | 8.8% | no clear change |
| node 26.12.0 | bench-part-put | 1,618 | 1,652 | +2.1% | 6.8% | no clear change |
| node 26.12.0 | bench-encode | 2,137 | 2,220 | +3.9% | 8% | no clear change |
| node 26.12.0 | bench-body-1k | 2,304 | 2,361 | +2.5% | 11.2% | no clear change |
| bun 1.4.3 | bench-download | 1,691 | 1,709 | +1.1% | 53.5% | no clear change |
| bun 1.4.3 | bench-part-put | 2,182 | 2,226 | +2% | 30.7% | no clear change |
| bun 1.4.3 | bench-encode | 3,469 | 3,511 | +1.2% | 29% | no clear change |
| bun 1.4.3 | bench-body-1k | 3,092 | 3,136 | +1.4% | 14.9% | no clear change |

No workload changed outside its band: S3 header signing is 1.1% to 3.9% slower than before the split, with Node bands of 7% to 11% and Bun bands of 15% to 54%. A first version of the split was slower on Node; restoring the fixed-string path for a request with no extra signed headers and no session token (the usual request) removed that.

**node 26.12.0**, microseconds per call (times as long as sigflint in brackets):

<!-- BEGIN pic-speed-more-node -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/speed-more-node-dark.svg">
  <img alt="Bar chart: time to sign other-service and presigned-URL requests on Node.js" src="docs/speed-more-node-light.svg">
</picture>
<!-- END pic-speed-more-node -->

| Request | sigflint | aws4 | aws4fetch | @smithy/signature-v4 | aws-sig | @wdl-dev/aws-sigv4 | minio |
|---|--:|--:|--:|--:|--:|--:|--:|
| DynamoDB POST, JSON body | **1.75** | wrong signature | 313.13 (178.6×) | 11.70 (6.7×) | 58.67 (33.5×) | wrong signature | wrong signature |
| API Gateway GET, session token | **1.59** | 5.27 (3.3×) | 300.20 (188.4×) | 9.86 (6.2×) | wrong signature | 706.61 (443.6×) | wrong signature |
| SQS, query parameters | **1.88** | 6.71 (3.6×) | 301.21 (160.5×) | 11.22 (6×) | 57.17 (30.5×) | 701.30 (373.6×) | wrong signature |
| presigned URL, API Gateway | **3.43** | 11.51 (3.4×) | 321.25 (93.7×) | 12.29 (3.6×) | wrong signature | wrong signature | wrong signature |
| presigned URL, S3 | **3.72** | 11.52 (3.1×) | 242.41 (65.2×) | 13.03 (3.5×) | wrong signature | wrong signature | 14.07 (3.8×) |

**bun 1.4.3**, microseconds per call (times as long as sigflint in brackets):

<!-- BEGIN pic-speed-more-bun -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/speed-more-bun-dark.svg">
  <img alt="Bar chart: time to sign other-service and presigned-URL requests on Bun" src="docs/speed-more-bun-light.svg">
</picture>
<!-- END pic-speed-more-bun -->

| Request | sigflint | aws4 | aws4fetch | @smithy/signature-v4 | aws-sig | @wdl-dev/aws-sigv4 | minio |
|---|--:|--:|--:|--:|--:|--:|--:|
| DynamoDB POST, JSON body | **1.91** | wrong signature | 214.56 (112.2×) | 12.73 (6.7×) | 49.26 (25.8×) | wrong signature | wrong signature |
| API Gateway GET, session token | **1.93** | 5.76 (3×) | 211.31 (109.7×) | 10.92 (5.7×) | wrong signature | 571.41 (296.5×) | wrong signature |
| SQS, query parameters | **2.58** | 8.15 (3.2×) | 213.64 (82.8×) | 13.88 (5.4×) | 48.16 (18.7×) | 571.00 (221.2×) | wrong signature |
| presigned URL, API Gateway | **5.86** | 17.17 (2.9×) | 227.62 (38.8×) | 16.86 (2.9×) | wrong signature | wrong signature | wrong signature |
| presigned URL, S3 | **6.37** | 16.99 (2.7×) | 230.23 (36.1×) | 16.35 (2.6×) | wrong signature | wrong signature | 11.31 (1.8×) |

“Wrong signature” means the result differed from botocore's for that request, so it was not timed; for `aws4` that is the headers it adds and signs itself (see above), and `minio` signs S3 only. Reporting band (the larger of 3% and twice the spread of the two sigflint arms): Node 5% to 10%, Bun 34% to 68%, so the Bun ratios are less precise than the Node ones; every gap shown is far outside its band.

Only sigflint offers SigV4a (`@smithy/signature-v4` also offers chunked uploads and event streams, which were not timed here). Microseconds per call, Node / Bun: SigV4a headers 15.6 / 14.6, SigV4a presigned URL 17.5 / 18.2, one 64 KiB chunk 33.6 / 33.0, the last chunk with a trailer 3.0 / 2.3, a 4 KiB event 12.1 / 13.1. SigV4a is dominated by the ECDSA signature.

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

**Node 26.12.0**, plain GET of one key:

| Library | Heap allocated per call | Collections per 10,000 calls | GC pause per 10,000 calls | Peak memory of the process | Import + first signature |
|---|--:|--:|--:|--:|--:|
| **sigflint** | **2.6 KiB** | **6** | **1.2 ms** | **116.9 MiB** | **2.7 ms** |
| aws4 | 9.8 KiB (3.8×) | 24 (4.0×) | 7.1 ms (5.9×) | 116.6 MiB (no clear change) | 3.9 ms (1.5×) |
| minio | 8.2 KiB (3.2×) | 19 (3.2×) | 23.3 ms (19×) | 118.2 MiB (no clear change) | 17.1 ms (6.4×) |
| aws4fetch | 29.3 KiB (11×) | 90 (15×) | 42.3 ms (35×) | 128.4 MiB (1.1×) | 18.4 ms (6.9×) |
| @smithy/signature-v4 | 17.8 KiB (7.0×) | 44 (7.3×) | 21.5 ms (18×) | 115.7 MiB (no clear change) | 13.2 ms (5.0×) |
| aws-sig | 69.4 KiB (27×) | 46 (7.7×) | 41.4 ms (34×) | 170.1 MiB (1.5×) | 8.8 ms (3.3×) |
| @wdl-dev/aws-sigv4 | 58.0 KiB (23×) | 174 (29×) | 96.1 ms (80×) | 125.9 MiB (1.1×) | 18.6 ms (7.0×) |

**Bun 1.4.3**, plain GET of one key:

| Library | Heap allocated per call | Collections per 10,000 calls | GC pause per 10,000 calls | Peak memory of the process | Import + first signature |
|---|--:|--:|--:|--:|--:|
| **sigflint** | **1.4 KiB** | **3** | **5.2 ms** | **65.9 MiB** | **2.5 ms** |
| aws4 | 6.4 KiB (4.5×) | 14 (4.7×) | 27.1 ms (5.2×) | 71.1 MiB (1.1×) | 3.4 ms (no clear change) |
| minio | 7.0 KiB (5.0×) | 16 (5.3×) | 31.0 ms (5.9×) | 70.7 MiB (1.1×) | 20.2 ms (8.3×) |
| aws4fetch | 15.1 KiB (11×) | 28 (9.3×) | 58.9 ms (11×) | 69.4 MiB (1.1×) | 3.2 ms (no clear change) |
| @smithy/signature-v4 | 13.2 KiB (9.3×) | 24 (8.0×) | 50.4 ms (9.7×) | 73.3 MiB (1.1×) | 11.2 ms (4.6×) |
| aws-sig | 47.9 KiB (34×) | 80 (27×) | 150 ms (29×) | 79.8 MiB (1.2×) | 4.7 ms (1.9×) |
| @wdl-dev/aws-sigv4 | 29.9 KiB (21×) | 49 (16×) | 119 ms (23×) | 74.6 MiB (1.1×) | 4.8 ms (2.0×) |

Median of 5 processes, one fresh process per library, runtime and round. “(×)” is the library's value divided by sigflint's; “no clear change” means the gap is inside the reporting band. Across all four workloads, the libraries that sign them correctly allocate 2.0 to 34 times as much heap per call as sigflint. Reporting bands (the larger of the metric's floor and twice the larger spread of the two sigflint control arms): heap per call 6%; GC pause 30% to 77%; peak memory 3% to 5%; import + first signature 19% to 22%. Every gap shown with a multiplier is outside its band.
<!-- END memory -->

What is counted: the JavaScript heap that one `getAuthHeaders` call allocates (native memory, such as hash state, is not in it), the stop-the-world garbage-collection time over 10,000 calls, the peak resident memory of a process that loaded only that library, and the time to import the library and sign once in a fresh process. Importing alone takes 1.3 ms on Node and 1.9 ms on Bun, with no clear difference from `aws4fetch`, `aws4` and `@wdl-dev/aws-sigv4`. Importing plus the first signature takes 2.7 ms on Node, faster than every other library (1.5 to 7 times as fast), and on Bun it is inside the noise band of `aws4` and `aws4fetch`. Across 20,000 calls no library showed a clear growth in retained heap, with one small exception: `aws4fetch` and `@wdl-dev/aws-sigv4` kept about 100 to 190 KiB more per 10,000 calls on Node for the plain GET, which is not shown to be a leak. sigflint keeps up to 1,000 signing keys, about 340 bytes each on Node and 360 on Bun, so a full cache is about 340 KB; the other libraries' caches were not measured.

The allocation, collection, GC, CPU and peak-memory figures were measured on the six-module `src/` code (all eight arms (seven libraries, sigflint twice) in one run of 810 processes, 0 rejected; a first attempt with a mistake in the setup was discarded and is described in `bench/memory-protocol.md`). The import figures were measured again, in 630 processes with 0 rejected, on the single built file that Node and Bun load, because that is the layout the package ships; the peak memory of that file was not re-measured. The signers have shared one signing-key cache since the allocation and memory runs, so those figures describe the code before that change. The numbers for the other three workloads, the per-round values and the calibration of the allocation counters are in [`bench/results/memory-report.md`](bench/results/memory-report.md) and [`bench/memory-protocol.md`](bench/memory-protocol.md).

## Size

<!-- BEGIN size -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/size-dark.svg">
  <img alt="Bar chart: bundled, minified and gzipped size of each library" src="docs/size-light.svg">
</picture>

| Library | Source, all signers (bytes) | Bundled + minified (bytes) | + gzip | + brotli | Direct dependencies | Installed on disk (bytes) |
|---|--:|--:|--:|--:|--:|--:|
| **sigflint** | 34,358 | 5,651 | 2,769 | 2,550 | 0 |  |
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
  <source media="(prefers-color-scheme: dark)" srcset="docs/size-tiers-dark.svg">
  <img alt="Bar chart: gzipped and minified size of sigflint for each combination of signers" src="docs/size-tiers-light.svg">
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

Each runs against the synchronous entry and the WebCrypto entry. The corpora are generated by `conformance/` (`npm run conformance` rebuilds them with the pinned botocore and awscrt; `node conformance/build.mjs` is the S3 one alone). The generators, the cases and the reference scripts are in the repository. The same tests run on Node 22, 24 and 26, Bun and Deno in CI.

## Methodology and limits

- Speed: one process per library, runtime and round; 5 rounds with the library order reversed on every other round; 8 arms, so sigflint ran twice (A and B) as a noise control. Each process validates its signature against botocore first, then times batches of about 50 ms for one second and reports the median. The reporting band is the larger of 3% and twice the larger spread of the two sigflint arms; every gap in the tables above is far outside it. The protocol was written before the runs ([`bench/protocol.md`](bench/protocol.md)) and the raw results are in `bench/results/`.
- Memory: 5 rounds, 810 processes, each under a 2 GB cgroup cap; allocation is counted differently on Node (heap growth between collections) and Bun (the engine's collector log), checked against a known allocator to within 10%, so Node and Bun numbers are not compared with each other. The protocol was written before the run ([`bench/memory-protocol.md`](bench/memory-protocol.md)).
- The requests are synthetic and the signing date is fixed, so each library's signing-key cache behaves as it would within one day. Nothing here measures a network request, and a single signature is microseconds beside it.
- Machine: one shared Linux host, normal priority, no CPU pinning. Versions of everything are in `bench/frozen/versions.txt`.
- Other services, presigned URLs and the check against the pre-split build: a second protocol, written before the runs ([`bench/protocol-more.md`](bench/protocol-more.md)), run on the final code; raw results in `bench/results/speed-regression.jsonl` and `speed-more.jsonl`.
- Not timed: `Bun.S3Client.presign` (a different request) and `@aws-lite/client` (wraps `aws4`).
- Not tested: real Cloudflare, real AWS (the signatures are checked against botocore, the AWS CRT and the AWS SDK's signer, not against a live server). SigV4a, chunked uploads and event streams have not been sent to a service.
- Reproduce: `cd bench && npm ci && node screen.mjs ../src/node.js && ./run-matrix.sh "$PWD/frozen" "$PWD/results/speed-raw.jsonl" && node analyze.mjs && node sizes.mjs && node make-assets.mjs`.

## Scope

1.0 signs requests for every AWS service in header form and as presigned URLs, plus SigV4a, chunked uploads and event streams. Not included, and not promised:

- hashing binary request bodies for you: hash them yourself, or use `unsignedPayload`
- an HTTP client, retries, credential providers or region lookup
- anything that is not SigV4 or SigV4a

Open an issue describing the use case if you need one of them.

## Security

See [SECURITY.md](SECURITY.md). sigflint never logs credentials or writes them anywhere; it keeps the last secret key in memory as the key of its signing-key cache.

## License

[MIT](LICENSE)
