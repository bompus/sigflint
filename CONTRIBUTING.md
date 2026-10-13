# Contributing

Bug reports and pull requests are welcome. For a larger change, open an issue first so we can agree on the scope.

## Setup

```sh
npm ci
npm test            # Node: the corpus test and the behavior tests
npm run types       # generated .d.ts and the consumer type test
npm run check:package
```

The tests also run on Bun (`bun test test/`) and Deno (`deno test -A test/`). Please run the runtimes you have.

## The conformance corpus

`test/corpus.json` holds 3,000+ requests with the signature and canonical request that botocore's S3 signer produces for each. The corpus is generated; do not edit it by hand.

```sh
python3 -m venv .venv && .venv/bin/pip install -r conformance/requirements.txt
PYTHON=.venv/bin/python npm run conformance      # rewrites test/corpus.json from conformance/cases.mjs
```

A change to the signing code must keep every case passing. A bug fix needs a case that fails before the fix: add it to `conformance/cases.mjs` and regenerate.

## Scope

sigflint signs S3 requests with header-based SigV4. Other services, presigned URLs and streaming payloads are not in 1.0; an issue describing the use case is the place to start.

The package has no dependencies and uses only what the runtime provides. A change that adds a dependency, or that makes any workload slower, needs a measurement (`bench/`) that shows why it is worth it.
