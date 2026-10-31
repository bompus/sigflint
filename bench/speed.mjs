// Speed of one candidate in one process: <bun|node> speed.mjs <candidateId> <sigflint entry path> [secs=1] [--only=id]
// For each workload: (1) validate the candidate's signature against the reference with a frozen clock, outside the timed
// region; a wrong result is reported and not timed. (2) warm up, then time batches with the real clock.
// Timed region: one call that returns the signature (the adapter builds the library's input from the case and parses
// the Authorization value; the same adapter work is in every candidate). Prints one JSON line per workload.
import { readFileSync } from 'node:fs';
import { loadAdapters, freezeClock } from './adapters.mjs';
import { timeOperation } from './timing.mjs';
import { CLIENT_IDS, loadClientAdapters } from './adapters-clients.mjs';
/** @typedef {import('./adapters.mjs').Case & { sig: string, canonical: string }} CorpusCase */

const [candidateArg, oursPath, secsArg = '1'] = process.argv.slice(2);
const candidate = /** @type {string} */ (candidateArg);
const secs = Number(secsArg);
// JSON.parse reads the Buffer as UTF-8 text (the casts are for the type checker only)
/** @type {CorpusCase[]} */
const corpus = JSON.parse(
  /** @type {string} */ (
    /** @type {unknown} */ (readFileSync(new URL('../test/corpus.json', import.meta.url)))
  ),
);
const cases = corpus;
const expected = Object.fromEntries(
  corpus.map((c) => [c.id, { sig: c.sig, canonical: c.canonical }]),
);
// the four S3 clients' signing cores load only for their own arm: they are TypeScript sources the other arms do not import
const adapters = [
  ...(await loadAdapters(/** @type {string} */ (oursPath), expected)),
  ...(CLIENT_IDS.has(candidate) ? await loadClientAdapters([candidate]) : []),
];
const a = adapters.find((x) => x.id === candidate);
if (!a) {
  throw new Error(`unknown candidate ${candidate}`);
}
const workloads = ['bench-download', 'bench-part-put', 'bench-encode', 'bench-body-1k'];
const arm = process.env.ARM ?? candidate;
// Deno defines its own global and reports its Node compatibility version in process.versions.node, so it is
// checked before the Node fallback.
const deno = /** @type {any} */ (globalThis).Deno;
const runtime =
  typeof Bun !== 'undefined'
    ? `bun ${Bun.version}`
    : deno
      ? `deno ${deno.version.deno}`
      : `node ${process.versions.node}`;

/** @param {CorpusCase} c */
async function once(c) {
  // a was checked above; a function declaration does not see that check
  return /** @type {import('./adapters.mjs').Adapter} */ (a).kind === 'sync'
    ? /** @type {import('./adapters.mjs').Adapter} */ (a).sign(c)
    : await /** @type {import('./adapters.mjs').Adapter} */ (a).sign(c);
}

for (const id of workloads) {
  const c = /** @type {CorpusCase} */ (cases.find((x) => x.id === id));
  if (a.unsupported(c)) {
    console.log(JSON.stringify({ arm, candidate, runtime, workload: id, status: 'unsupported' }));
    continue;
  }
  const restore = freezeClock();
  let got;
  try {
    got = await once(c);
  } catch (e) {
    got = `error: ${/** @type {Error} */ (e).message}`;
  }
  restore();
  if (got !== /** @type {{ sig: string }} */ (expected[id]).sig) {
    console.log(JSON.stringify({ arm, candidate, runtime, workload: id, status: 'wrong-result' }));
    continue;
  }

  const adapter = /** @type {import('./adapters.mjs').Adapter} */ (a);
  const t = await timeOperation(() => adapter.sign(c), adapter.kind === 'sync', secs);
  console.log(
    JSON.stringify({
      arm,
      candidate,
      runtime,
      workload: id,
      status: 'ok',
      nsPerOp: t.nsPerOp,
      opsPerSec: Math.round(1e9 / t.nsPerOp),
      batches: t.batches,
      batchSize: t.batchSize,
      rmePct: t.rmePct,
      sink: t.sink,
    }),
  );
}
