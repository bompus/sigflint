# Changelog

## Unreleased

- The code is formatted with oxfmt, linted with oxlint and type-checked by `tsc` in strict mode, and `npm run check` runs all three. Signing does not change: built without whitespace, the Bun build and the WebCrypto entry are the same code as before, and the Node build differs in the two statements of the HMAC key XOR, written as `a[i] = a[i] ^ b[i]` instead of `a[i] ^= b[i]`, which makes a minified bundle of the Node entry 8 bytes larger (`getAuthHeaders` alone: 5,675 bytes, 2,777 gzipped, up from 5,667 and 2,774). The published files in `src/` and `dist/` differ in formatting and braces, and `src/` has more JSDoc type comments. The public types (`index.d.ts` and `sigflint/web`) are unchanged; the generated declarations of internal helpers in `types/` have parameter types instead of `any`.

## 1.0.1 - 2026-10-18

- A lowercase `method` (`get`) is signed as upper case (`GET`), as botocore does. `fetch` sends `get`, `put`, `post`, `delete`, `head` and `options` in upper case, so before this the signature did not match and the service answered `SignatureDoesNotMatch`. Node's `fetch` sends `patch` as written, so pass `PATCH` in upper case to both sigflint and `fetch`.
- `end(trailers)` on a chunk signer throws a `TypeError` when a trailer name or value holds a line break. Before, the break was signed as another trailer line.
- Correction to the 1.0.0 entry: a raw `+` in an S3 path is signed as a space, but "as S3 reads it" was not verified. Nothing has been tried against AWS S3, and a local `s3s-fs` 0.17.0 server reads a raw `+` as a plus sign and rejected the signature. Write `%2B` in the URL to mean a plus: that server accepted it from sigflint and from botocore. The signing is unchanged (`docs/guide.md`).
- Correction to the 1.0.0 entry: a bundler that picks the `node` or `bun` condition gets the built file (`dist/`) and drops unused signers just as well; the per-signer modules (`src/`) go to the `workerd`, `worker` and `browser` conditions and to bundlers that match none of them.

## 1.0.0 - 2026-10-16

First version: AWS Signature Version 4 signing for every AWS service.

- `getAuthHeaders(request, credentials)` returns the headers to send, for S3 and, with `request.service`, any other service. It never modifies the request or its URL.
- `presign(request, credentials)` returns a presigned URL.
- `getAuthHeadersV4a` and `presignV4a` sign with SigV4a (ECDSA P-256) for the regions in `request.regionSet`.
- `chunkSigner(authHeaders, credentials)` signs aws-chunked uploads, with signed trailing headers; `eventSigner(authHeaders, credentials)` signs event-stream messages.
- Session tokens (`credentials.sessionToken`) and unsigned payloads (`request.unsignedPayload`).
- Path and query encoding, query sorting and header trimming follow the specification; a raw `+` in an S3 path is a space, as S3 reads it. Other services normalise the path and encode it twice.
- Input that cannot be signed correctly throws: `signHeaders` that name `x-amz-date`, `authorization` or `__proto__` or hold a line break, a presigned URL that is not http or https or is already presigned, an `expires` outside 1 to 604800 seconds, and the headers of a SigV4a signature given to `chunkSigner` or `eventSigner`. An empty chunk is not signed, because it would end the upload.
- No dependencies. Node.js 22.12 and later, Bun, Deno and Cloudflare Workers; the signing-key cache is shared by an entry's signers.
- Each signer is its own module and export, so a bundle holds only what it imports. Node and Bun load one built file (`dist/`) instead of six modules; the `workerd`, `worker` and `browser` conditions and bundlers keep the per-signer modules.
- Cloudflare Workers and browsers get a WebCrypto implementation through the `workerd`, `worker` and `browser` export conditions, with or without `nodejs_compat`. There every signer returns a promise (the chunk and event signers' methods do); the types are `x | Promise<x>`, so always `await`. `sigflint/web` imports that implementation directly.
- Speed, memory and size are measured against six other libraries (`docs/benchmarks.md`, `bench/`).
