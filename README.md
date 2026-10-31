<h1 align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/assets/banner-dark.png">
    <img src="docs/assets/banner-light.png" alt="sigflint: Fast SigV4 and SigV4a signing for every AWS service" width="100%">
  </picture>
</h1>

<p align="center">
  <a href="https://github.com/bompus/sigflint/actions/workflows/ci.yml"><img src="https://github.com/bompus/sigflint/actions/workflows/ci.yml/badge.svg" alt="CI status"></a>
  <a href="https://github.com/bompus/sigflint/releases/latest"><img src="https://badgen.net/github/release/bompus/sigflint" alt="Latest GitHub release"></a>
  <a href="https://www.npmjs.com/package/sigflint"><img src="https://badgen.net/npm/v/sigflint" alt="Latest sigflint version on npm"></a>
  <a href="LICENSE"><img src="https://badgen.net/badge/license/MIT/blue" alt="MIT license"></a>
</p>

<p align="center">
  <a href="docs/guide.md#usage">Headers and presigned URLs</a>&nbsp;·
  <a href="docs/guide.md#sigv4a-multi-region">SigV4a</a>&nbsp;·
  <a href="docs/guide.md#chunked-uploads">Chunked uploads and event streams</a>&nbsp;·
  <a href="package.json">No dependencies</a>
</p>

Fast AWS Signature Version 4 request signing for every AWS service, with no dependencies. It runs on Node.js, Bun, Deno, Cloudflare Workers and browsers.

Signs an S3 GET in 0.97 µs on Node, 5.3 times as fast as `aws4`, with the same signatures as botocore on 6,582 test requests.

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

- **Correct.** It returns the same signature as botocore for all 3,360 S3 requests in its test corpus, and for 1,622 requests to other services and 1,600 presigned URLs. For S3, botocore signs the request after this repository's own path and query normalization (`conformance/oracle.py`), so that step is not checked independently by the corpus; the four S3 examples published by AWS, which are in it, are. SigV4a signatures verify against the AWS CRT's, and every chunk and event signature in the test corpus matches the AWS SDK's. See [how it is tested](docs/benchmarks.md#how-it-is-tested).
- **Fast.** 1.0 to 3.2 µs per header or presigned-URL signature on Node, 0.7 to 3.0 µs on Bun and 1.6 to 2.7 µs on Deno. The other libraries take 2.0 to 75 times as long on the requests they sign correctly. Measured on Node 26.12.1, Bun 1.4.4 and Deno 2.9.6; see [speed](docs/benchmarks.md#speed).
- **Small, and you pay only for what you import.** Signing headers is 5.7 kB minified, 2.8 kB gzipped; presigned URLs, SigV4a, chunked uploads and event streams each add to a bundle only when imported. Nothing to install with it. See [size](docs/benchmarks.md#size).
- **Everywhere.** One import on Node, Bun, Deno and Cloudflare Workers, with or without `nodejs_compat`. See [runtimes](#runtimes).

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/speed-dark.svg">
  <img alt="Bar chart: time in microseconds to sign one S3 request on Node.js and Bun, for sigflint and six other libraries" src="docs/speed-light.svg">
</picture>

Microseconds per signature; lower is better. On Node 26.12.1, signing a plain S3 GET takes 0.97 µs with sigflint and 5.11 µs with `aws4`, the fastest of the other libraries.

## Install

With npm:

```sh
npm install sigflint
```

With Bun:

```sh
bun add sigflint
```

Bun loads its own build directly; run your script with `bun run <file>`.

Node.js 22.12 or newer (it is an ES module; Node 22.12 can also `require()` it). Bun and Deno need no build step.

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

For another S3-compatible service, pass its region name and URL (`https://us-sea-1.linodeobjects.com/bucket/key`, `http://127.0.0.1:9000/bucket/key`). These are examples of the form, not endpoints that were tried. Signatures are checked against botocore, the AWS CRT, the AWS SDK's signer and the AWS documentation examples. Nothing has been sent to AWS S3, so a service that canonicalizes requests differently from S3 may reject them. Two live servers were tried. A local `s3s-fs` 0.17.0 test server on loopback, once, with header-signed requests (create a bucket, `PUT`, `GET`, list), accepted them, except that it rejected sigflint's signature for a raw `+` in the path. Cloudflare R2 was sent four read-only `GET` requests, only to see whether its signature check accepts a raw `+` signed as a space; it does. The two servers disagree on that character, so write `%2B` when you mean a plus ([how the path is read](docs/guide.md#how-it-reads-the-url)).

More in the [guide](docs/guide.md): [other services](docs/guide.md#other-services), [presigned URLs](docs/guide.md#presigned-urls), [SigV4a](docs/guide.md#sigv4a-multi-region), [chunked uploads](docs/guide.md#chunked-uploads), [event streams](docs/guide.md#event-streams), why to always `await`, and the [full API](docs/guide.md#api).

## Runtimes

Node.js 22.12 and later, Bun, Deno, and Cloudflare Workers with or without `nodejs_compat`; browsers get the same WebCrypto code. Node, Bun, Deno and local Workers were checked against botocore's signature for one S3 request. The grid, with the other libraries, is in the [benchmarks](docs/benchmarks.md#runtimes).

For hosting services such as Vercel, Netlify, Supabase and AWS Lambda, see [deployment platforms](docs/guide.md#deployment-platforms). That guide distinguishes runtime compatibility from testing on a hosted service.

## Benchmarks

The [correctness comparison](docs/benchmarks.md#correctness) includes s3mini, tiny-oss, lean-s3 and s3-lite-client, alongside the other libraries, with explicit input methods, supported-request counts and missing measurements.

Correctness, [speed](docs/benchmarks.md#speed), [memory](docs/benchmarks.md#memory) and [size](docs/benchmarks.md#size), the [test corpora](docs/benchmarks.md#how-it-is-tested) and the [methodology and limits](docs/benchmarks.md#methodology-and-limits) are in [docs/benchmarks.md](docs/benchmarks.md). Every figure there comes from raw results committed in `bench/results/`. The speed, memory and import figures were measured on the code in this release and are re-run before each release.

## Scope

1.0 signs requests for every AWS service in header form and as presigned URLs, plus SigV4a, chunked uploads and event streams. Not included, and not promised:

- hashing binary request bodies for you: hash them yourself, or use `unsignedPayload`
- an HTTP client, retries, credential providers or region lookup
- anything that is not SigV4 or SigV4a

Open an issue describing the use case if you need one of them.

## Security

See [SECURITY.md](SECURITY.md). sigflint never logs credentials or writes them anywhere. Its signing-key caches keep secret keys in process memory: each cached signing key (up to 1,000 per cache) is stored under a lookup string that contains the secret access key it was derived from.

## Sponsoring

sigflint is built and maintained by one person. If it saves you time, you can
sponsor it monthly or once through
[GitHub Sponsors](https://github.com/sponsors/bompus), or leave a tip on
[Ko-fi](https://ko-fi.com/bompus).

## License

[MIT](LICENSE). `CODE_OF_CONDUCT.md` is the Contributor Covenant under CC BY 4.0; see `THIRD_PARTY_NOTICES.md`.
