// Cold start of one candidate in a fresh process: <bun|node> import-time.mjs <candidateId|none> <sigflint entry path (absolute)>
// Prints one JSON line:
//   importMs     loading the candidate's library (dynamic import of it and everything it imports, plus building its client object, as the adapter does)
//   firstSignMs  the first signature, with the clock frozen as in speed.mjs
//   startMs      process start to the moment before the import (runtime startup; identical work for every candidate)
//   totalMs      process start to the first signature
//   ok           the first signature equals the reference
// Candidate `none` imports nothing and signs nothing: the process-start control.
import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { loadAdapters, freezeClock } from './adapters.mjs';

const [, , candidate, oursPath] = process.argv;
const corpus = JSON.parse(readFileSync(new URL('../test/corpus.json', import.meta.url)));
const c = corpus.find((x) => x.id === 'bench-download');
const runtime = typeof Bun !== 'undefined' ? `bun ${Bun.version}` : `node ${process.versions.node}`;
const arm = process.env.ARM ?? candidate;
const startMs = performance.now();
if (candidate === 'none') {
  const t1 = performance.now();
  console.log(
    JSON.stringify({
      arm,
      candidate,
      runtime,
      status: 'ok',
      startMs,
      importMs: t1 - startMs,
      firstSignMs: 0,
      totalMs: t1,
      ok: true,
    }),
  );
} else {
  freezeClock();
  const adapters = await loadAdapters(oursPath, null, [candidate]);
  const t1 = performance.now();
  const a = adapters.find((x) => x.id === candidate);
  const got = a.kind === 'sync' ? a.sign(c) : await a.sign(c);
  const t2 = performance.now();
  console.log(
    JSON.stringify({
      arm,
      candidate,
      runtime,
      status: 'ok',
      startMs,
      importMs: t1 - startMs,
      firstSignMs: t2 - t1,
      totalMs: t2,
      ok: got === c.sig,
    }),
  );
}
