# Changelog

## 0.1.0 (unreleased)

First version: header-based AWS Signature Version 4 signing for S3.

- `getAuthHeaders(request, credentials)` returns the headers to send. It never modifies the request or its URL.
- Path and query encoding, query sorting and header trimming follow the specification; a raw `+` in a path is a space, as S3 reads it.
- Session tokens (`credentials.sessionToken`) and unsigned payloads (`request.unsignedPayload`).
- No dependencies. Node.js 22.12 and later, Bun, Deno, and Cloudflare Workers with the `nodejs_compat` flag.
