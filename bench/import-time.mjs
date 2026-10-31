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
import { freezeClock } from './adapters.mjs';
import { loadCandidate } from './adapters-clients.mjs';
/** @typedef {import('./adapters.mjs').Case & { sig: string }} CorpusCase */

const [candidate, oursPath] = process.argv.slice(2);
// JSON.parse reads the Buffer as UTF-8 text (the casts are for the type checker only)
/** @type {CorpusCase[]} */
const corpus = JSON.parse(
  /** @type {string} */ (
    /** @type {unknown} */ (readFileSync(new URL('../test/corpus.json', import.meta.url)))
  ),
);
const c = /** @type {CorpusCase} */ (corpus.find((x) => x.id === 'bench-download'));
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
  const adapters = await loadCandidate(
    /** @type {string} */ (oursPath),
    /** @type {string} */ (candidate),
  );
  const t1 = performance.now();
  // the candidate was loaded by name above (an unknown name throws in the next line, as before)
  const a = /** @type {import('./adapters.mjs').Adapter} */ (
    adapters.find((x) => x.id === candidate)
  );
  // s3mini signs only unsigned-payload requests: it signs the unsigned part upload instead, and the row names the case
  const sc = a.unsupported(c)
    ? /** @type {CorpusCase} */ (corpus.find((x) => x.id === 'bench-part-put'))
    : c;
  const got = a.kind === 'sync' ? a.sign(sc) : await a.sign(sc);
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
      workload: sc.id,
      ok: got === sc.sig,
    }),
  );
}
