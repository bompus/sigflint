// One cold start, timed from outside by Hyperfine: <bun|node> import-once.mjs <candidateId|none> <sigflint entry path (absolute)>
// Loads the candidate's library and builds its client as the adapter does, signs the first request with the clock frozen as in
// speed.mjs, and exits 1 when the signature differs from the reference. Candidate `none` runs the same harness without loading a
// library: the control, whose command time is runtime start-up plus the harness.
import { readFileSync } from 'node:fs';
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
if (candidate !== 'none') {
  freezeClock();
  const adapters = await loadCandidate(
    /** @type {string} */ (oursPath),
    /** @type {string} */ (candidate),
  );
  const a = adapters.find((x) => x.id === candidate);
  if (!a) {
    throw new Error(`unknown candidate ${candidate}`);
  }
  // s3mini signs only unsigned-payload requests: it signs the unsigned part upload instead
  const sc = a.unsupported(c)
    ? /** @type {CorpusCase} */ (corpus.find((x) => x.id === 'bench-part-put'))
    : c;
  const got = a.kind === 'sync' ? a.sign(sc) : await a.sign(sc);
  if (got !== sc.sig) {
    console.error(`${candidate}: first signature differs from the reference`);
    process.exit(1);
  }
}
