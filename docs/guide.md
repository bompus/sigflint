# Guide

More than the basics in the [README](../README.md): other services, presigned URLs, SigV4a, chunked uploads, event streams, and the full API.

## Usage

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

`sigflint/web` selects the WebCrypto code on any runtime. On Node and Bun it is slower than the default, which uses the runtime's synchronous hash and HMAC, so import it only where you need it. (`bench/await-cost.mjs` measures the cost of the `await` itself; the result is not part of the committed benchmarks.)

## API

### `getAuthHeaders(request, credentials)`

Returns an object of headers to send with the request (or, in Workers and browsers, a promise of it): `authorization`, `x-amz-date`, `x-amz-content-sha256` (S3, or when `unsignedPayload` is set), `x-amz-security-token` when you passed a session token, and any extra headers you asked it to sign (names lowercased). The request, including the `URL`, is not modified.

`request`

| Field | Type | |
|---|---|---|
| `method` | `string` | `GET`, `HEAD`, `PUT`, `POST`, `DELETE`; any case, it is signed in upper case |
| `url` | `URL` | the full request URL, host included |
| `service` | `string` | for example `s3` (the default), `dynamodb`, `sqs`, `execute-api` |
| `region` | `string` | for example `us-west-2`. Pass it: the default is an empty string, which no region matches |
| `body` | `string` | hashed into `x-amz-content-sha256`. Missing or empty means the hash of an empty body |
| `unsignedPayload` | `boolean` | send `UNSIGNED-PAYLOAD` instead of hashing the body |
| `signHeaders` | `Record<string, string>` | extra headers to sign and return, such as `x-amz-acl` or `content-type`. `x-amz-date` and `authorization` are set by the signer and are refused here |
| `now` | `number` | signing time in milliseconds since the epoch. Default: the current time |
| `expires` | `number` | `presign` and `presignV4a` only: lifetime in whole seconds, 1 to 604800 (7 days). Default 3600 |
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

### Input it refuses

A request that cannot be signed correctly throws instead of returning a signature the service would reject:

- `signHeaders` that name `x-amz-date`, `authorization` or `__proto__`, or whose value holds a line break (`TypeError`).
- `end(trailers)` with a trailer whose name or value holds a line break (`TypeError`).
- `presign` and `presignV4a` with a URL that is not `http:` or `https:`, or that already carries `X-Amz-Signature` or `X-Amz-Algorithm` (`TypeError`), or an `expires` outside 1 to 604800 (`RangeError`).
- `chunkSigner` and `eventSigner` given the headers of a SigV4a signature (`TypeError`): chunks and events are signed with SigV4 only.
- `getAuthHeadersV4a` and `presignV4a` without `regionSet` (`TypeError`).

`chunk(data)` with an empty `data` returns it unchanged (zero bytes) and signs nothing, because a zero-length chunk ends the upload; call `end()` for that. Trailer names are lowercased before they are signed.

### How it reads the URL

- **Paths.** For S3, percent-escapes are decoded and every byte except `A-Z a-z 0-9 - . _ ~ /` is encoded again, once. A raw `+` in the path is a space, which is how S3 reads it; `%2B` is a plus. An escape that is not valid (`%zz`, a lone `%`) is signed as a literal `%`. For every other service the path is normalised (empty segments dropped, `.` and `..` resolved) and encoded a second time, as the specification says.
- **Queries.** Names and values are decoded and encoded the same way, sorted by name and then value, and a name with no value is written as `name=`. Repeated names keep every value.
- **Headers.** Names are lowercased, values trimmed with runs of spaces collapsed, and the list sorted.

The signing key for each secret, date and region is derived once and kept (up to 1,000 of them), so a repeated call costs one hash and one HMAC over short strings (plus a hash of the body, when there is one).
