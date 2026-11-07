# Release 1.0.5: benchmark gate, 2026-11-06

The speed, memory and import measurements were not run again for 1.0.5. The release 1.0.4 cohort (`protocol-release-1.0.4.md`, `release-1.0.4/`) stands for the Node and Bun builds.

## Why that cohort still applies

Between v1.0.4 and 1.0.5, `src/` changed only in `src/web.js`, the WebCrypto entry used on Cloudflare Workers and in browsers (`chunkSigner` and `eventSigner`). The files Node and Bun load, built from `src/` with `bun build` 1.4.4, are byte-identical to the artifacts measured for 1.0.4:

```
7153026dd6ac0cd8bd7875b665c23beca078aeb968aaefe9fd0fd2ae2d34c2ff  dist/node.js
69009b478cae42d0d920df1b20aaa4f6b2a1e77230ea836dde3c7f790a2d62fd  dist/bun.js
```

Both hashes equal `release-1.0.4-artifacts.sha256`. The speed, memory and import runs time those two files, so a new run would measure the same bytes again.

The repository's release rule asks for all four measurements on the code being released. This release departs from it on purpose, because the built files did not change; the maintainer chose that on 2026-11-06. `benchmarked.json` is recorded for 1.0.5 on that basis.

## What was measured again

- Size by signer and entry (`bun bench/tiers.mjs`, `results/tiers.json`). The Node and Bun rows are unchanged. The web rows grew: `getAuthHeaders` 5,235 to 5,257 bytes minified (2,593 to 2,605 gzipped), chunked uploads 2,532 to 2,863 (1,329 to 1,484), event streams 2,719 to 2,878 (1,432 to 1,506), everything 11,816 to 12,197 (4,916 to 5,094). `docs/benchmarks.md` cites the `getAuthHeaders` figure.
- The Node and Bun correctness screens and the client correctness screen, so their records carry 1.0.5. Signature counts are unchanged.

## Not measured

The speed and memory of the WebCrypto entry's `chunkSigner` and `eventSigner` before and after the change. No published figure covers them.
