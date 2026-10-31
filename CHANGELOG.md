# Changelog

## Unreleased

- Complete the signing-path runtime grid for all comparison libraries on Node, Bun, Deno and local Workers; show current-version benchmark figures without historical release comparisons.

- Integrate the four S3 clients into the comparison tables and correctness/runtime graphics, distinguishing decoded-key inputs, unsupported requests and missing measurements. Use sigflint first and alphabetical alternatives consistently across tables and charts. Existing benchmark figures are unchanged.

- Compare the signing cores of s3mini, tiny-oss, lean-s3 and s3-lite-client against the botocore corpus, with supported subsets and a shared-request comparison. This adds correctness evidence only.

- Documentation only: Cloudflare R2 agrees with signing a raw `+` in an S3 path as a space. Four read-only `GET` requests: R2 accepted the signature for `+` signed as `%20` and rejected the same URL signed as `%2B`. Which object it then names was not tested. `docs/guide.md` and the README say so.

## 1.0.3 - 2026-10-29

- Document installing with Bun (`bun add sigflint`) and running a script with `bun run`, alongside npm. Documentation only; no code or benchmark change.

## 1.0.2 - 2026-10-29

- Node and Bun load unminified files bundled with Bun instead of esbuild. The files are 24,690 and 23,518 bytes, compared with 24,374 and 23,200 bytes in the published 1.0.1 package. Builds, checks and publishing use Bun 1.4.4.
- Speed, memory, import and size measurements were repeated on the shipped build with Node 26.12.1 and Bun 1.4.4. The five-round comparison against published 1.0.1 found no clear S3 signing-speed change. Charts and tables in `docs/benchmarks.md` show the new figures and limits. Header signing alone is 5,677 bytes minified and 2,769 bytes gzipped for the Node entry.
- Formatting, lint and strict type checks now cover the library, tests, conformance generators and benchmark tools. Bun formats and checks types; TypeScript emits declarations. Public signing APIs and types are unchanged. Generated declarations for internal helpers now have parameter types instead of `any`.

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
