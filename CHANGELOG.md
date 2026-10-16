# Changelog

## Unreleased

- A lowercase `method` (`get`) is signed as upper case (`GET`), the same signature botocore produces and what `fetch` sends. Before, it signed the lowercase word, and the service answered `SignatureDoesNotMatch`.
- `end(trailers)` on a chunk signer throws a `TypeError` when a trailer name or value holds a line break. Before, the break was signed as another trailer line.
- The publish workflow stops unless the tagged commit is on `main`.

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
