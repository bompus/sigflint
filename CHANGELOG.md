# Changelog

## 1.0.0 (unreleased)

First version: AWS Signature Version 4 signing for every AWS service.

- `getAuthHeaders(request, credentials)` returns the headers to send, for S3 and, with `request.service`, any other service. It never modifies the request or its URL.
- `presign(request, credentials)` returns a presigned URL.
- `getAuthHeadersV4a` and `presignV4a` sign with SigV4a (ECDSA P-256) for the regions in `request.regionSet`.
- `chunkSigner(authHeaders, credentials)` signs aws-chunked uploads, with signed trailing headers; `eventSigner(authHeaders, credentials)` signs event-stream messages.
- Each signer is its own module and export, so a bundle holds only what it imports: headers alone are 5.4 kB minified, 2.7 kB gzipped; all six are 11.0 kB, 4.6 kB.
- Path and query encoding, query sorting and header trimming follow the specification; a raw `+` in an S3 path is a space, as S3 reads it. Other services normalise the path and encode it twice.
- Session tokens (`credentials.sessionToken`) and unsigned payloads (`request.unsignedPayload`).
- Memory use is documented and measured against the other libraries: heap allocated per call, garbage-collection time, peak memory, import time and the size of the signing-key cache (README, `bench/memory-protocol.md`).
- No dependencies. Node.js 22.12 and later, Bun, Deno and Cloudflare Workers.
- Cloudflare Workers and browsers get a WebCrypto implementation through the `workerd`, `worker` and `browser` export conditions, with or without `nodejs_compat`. There every signer returns a promise (the chunk and event signers' methods do); the types are `x | Promise<x>`, so always `await`. `sigflint/web` imports that implementation directly.
