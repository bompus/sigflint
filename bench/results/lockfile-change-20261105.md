# Lockfile change, 2026-11-05

The repository, `bench/` and `conformance/streams/` moved from npm's `package-lock.json` to Bun's `bun.lock`, and `bench/` now depends on this repository as `link:..` instead of `file:..`. No recorded result, freeze file or protocol in this folder was edited, and no recorded hash was rewritten. This note says what changed, what the old locks were, and why the recorded measurements stay valid.

## Why

The repository installs, builds and checks through Bun (`bun install --frozen-lockfile`, `bun run check`). Keeping three npm lockfiles beside it would have meant a second package manager for `bench/` and `conformance/streams/` only.

## The old locks

All three stay in git history: `git show 224a5c1:<path>` prints the file as it was just before the move.

| File | sha256 | git blob | Last changed |
| --- | --- | --- | --- |
| `package-lock.json` | `615305ebfd2103b2e5b8b28385ff884a5436ee7933a9052d531a140e9ad914d0` | `1332c74a27a66423cfd40f57e10d501beab26035` | b854c46, 2026-11-02 |
| `bench/package-lock.json` | `d07ad4d0d6ac9702c7e05b93a4d0f0419b11e4249a4748612a8496c5a2436952` | `603f1413d4e6388771e5013ceeb2ff061bb5e5d1` | c662f0e, 2026-10-31 |
| `conformance/streams/package-lock.json` | `6777ab8dcd358af6ed93c77a5111ac1231037a465a40a40397295e23f1b88d12` | `053e1f6cc6b791a5c27c1bb9b5f1cccc9ad4af19` | 77c7674, 2026-10-14 |

The `bench/package-lock.json` digest is the one `release-1.0.4-freeze.json` records under `inputs` and `client-correctness.json` records as `dependencyLockSha256`. The root `package-lock.json` digest in the freeze file (`d6ef82ec…`) is the root lock at v1.0.3 (the 1.0.4 protocol says to verify it with `git show v1.0.3:package-lock.json`); Dependabot updates changed the root lock afterwards.

The new locks:

| File | sha256 |
| --- | --- |
| `bun.lock` | `9d88fc11c43d2114f3d6c1ff97c9b565592d7d197ec8b48b8ef79cc6b164f7e8` |
| `bench/bun.lock` | `565dc9f1128fd55ca868e8254c0fdc3d14b2a5c7c84d0f673608316db07dde24` |
| `conformance/streams/bun.lock` | `ccd1b89d5dbe5fa40848567dda16214e90730f6b97680922d58865e4f4f62f83` |

## What was checked

- **Same packages.** `bun install` migrated each lock. Compared package by package: the root has 137 packages and `conformance/streams` has 12, all with the same version and integrity; `bench/` has 147, the same except for the two points below.
- **Tarball dependencies.** `lean-s3` and `tiny-oss` come from git-host tarballs. Their URLs pin the commit and are unchanged, and `bun.lock` records the same sha512 for each tarball that npm's lock did.
- **Where `undici` sits.** npm put `undici` 7.30.1 at the top of `bench/node_modules` (for `miniflare`) and 8.12.3 under `lean-s3`. Bun puts 8.12.3 at the top and 7.30.1 under `miniflare`. Each package that depends on `undici` resolves the same version as before. Only `adapters-clients-presign.mjs` imports the top-level copy (`undici/index.js`, for a connection pool it hands to `lean-s3`), so the 1.0.4 client screen used 7.30.1 there and a new run uses 8.12.3.
- **Same installed packages.** A clean `bun install --frozen-lockfile` in `bench/` installs the same 92 name and version pairs as `npm ci` did, and in `conformance/streams/` the same 12. With `file:..` Bun copied this repository into `node_modules/sigflint` and also installed its dev dependencies (167 pairs), so `bench/` uses `link:..`, which links the checkout like npm's `file:..` did.
- **Compiled client bundles.** `bun bench/compat/build-clients.mjs` after a clean Bun install gives the five bundles whose hashes `release-1.0.4-freeze.json` records under `compiledClientBundles`, byte for byte.
- **The recorded screen reproduces.** Re-running `bun bench/compat-clients.mjs` on a Bun install gives a `client-correctness.json` identical to the recorded one except `dependencyLockSha256` (every candidate's version, source URL, pass, fail and error counts and failing case ids are equal, including the `undici` change above). The re-run was made in a scratch copy; the recorded file was not touched.

## Code that reads the locks

- `bench/compat-clients.mjs` reads `bench/bun.lock` for each candidate's source URL (the git-host tarball URL, or the registry tarball URL that npm's lock used to record as `resolved`) and writes the hash of `bench/bun.lock`. The URLs it builds match the recorded ones (`s3mini`, `s3-lite-client`, `lean-s3`, `tiny-oss`).
- `bench/client-correctness-data.mjs` still checks the recorded `dependencyLockSha256`. A screen recorded with `bench/bun.lock` is compared with that file's hash directly. The 1.0.4 screen was recorded with the old file (`d07ad4d0…`), so that record is accepted for exactly the converted lock above (`565dc9f1…`) and no other. Any later change to `bench/bun.lock` makes it fail with "Re-run client correctness", as a changed `package-lock.json` did. The check needs no git history.

## What no longer matches

`bun bench/check-freeze.mjs bench/results/release-1.0.4-freeze.json` compares the freeze record with the checkout it runs in. It already differed at 224a5c1 on the root `package-lock.json` (changed by Dependabot after the freeze, see above) and on nothing else. Now it stops with ENOENT on `bench/package-lock.json`, which is gone (the script hashes each named input and does not catch a missing file, so it prints no list of differences), and the bench tree hash would differ as well (this change edits `bench/package.json`, `bench/compat-clients.mjs`, `bench/client-correctness-data.mjs`, `bench/tsconfig.json`). The record is unchanged and still describes the 1.0.4 measurements: to check it, run `check-freeze.mjs` in a checkout of 224a5c1 (the last commit with the npm locks) after `npm ci --prefix bench` and `bun bench/compat/build-clients.mjs` (`bench/compat/compiled` is not tracked, and the script lists it first; the rebuilt bundles equal the recorded ones). Run that way on 2026-11-05 it reported only the root `package-lock.json` mismatch. A later measurement campaign, or a repeat of the 1.0.4 one on a newer checkout, writes its own freeze file (see the protocol's reproduction section). Its `inputs` map names files by path, so it lists `bun.lock` and `bench/bun.lock` where the 1.0.4 record lists `package-lock.json` and `bench/package-lock.json`; `check-freeze.mjs --write` does not rewrite `inputs`, so edit that map in the new file by hand.
