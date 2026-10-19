// Speed of one candidate in one process: <bun|node> speed.mjs <candidateId> <sigflint entry path> [secs=1] [--only=id]
// For each workload: (1) validate the candidate's signature against the reference with a frozen clock, outside the timed
// region; a wrong result is reported and not timed. (2) warm up, then time batches with the real clock.
// Timed region: one call that returns the signature (the adapter builds the library's input from the case and parses
// the Authorization value; the same adapter work is in every candidate). Prints one JSON line per workload.
import { readFileSync } from 'node:fs';
import { loadAdapters, freezeClock } from './adapters.mjs';

const [, , candidate, oursPath, secsArg = '1'] = process.argv;
const secs = Number(secsArg);
const corpus = JSON.parse(readFileSync(new URL('../test/corpus.json', import.meta.url)));
const cases = corpus;
const expected = Object.fromEntries(
  corpus.map((c) => [c.id, { sig: c.sig, canonical: c.canonical }]),
);
const adapters = await loadAdapters(oursPath, expected);
const a = adapters.find((x) => x.id === candidate);
if (!a) throw new Error(`unknown candidate ${candidate}`);
const workloads = ['bench-download', 'bench-part-put', 'bench-encode', 'bench-body-1k'];
const arm = process.env.ARM ?? candidate;
const runtime = typeof Bun !== 'undefined' ? `bun ${Bun.version}` : `node ${process.versions.node}`;

async function once(c) {
  return a.kind === 'sync' ? a.sign(c) : await a.sign(c);
}

for (const id of workloads) {
  const c = cases.find((x) => x.id === id);
  if (a.unsupported(c)) {
    console.log(JSON.stringify({ arm, candidate, runtime, workload: id, status: 'unsupported' }));
    continue;
  }
  const restore = freezeClock();
  let got;
  try {
    got = await once(c);
  } catch (e) {
    got = `error: ${e.message}`;
  }
  restore();
  if (got !== expected[id].sig) {
    console.log(JSON.stringify({ arm, candidate, runtime, workload: id, status: 'wrong-result' }));
    continue;
  }

  let sink = 0;
  const batch = async (n) => {
    const t0 = performance.now();
    if (a.kind === 'sync') for (let i = 0; i < n; i++) sink += a.sign(c).length;
    else for (let i = 0; i < n; i++) sink += (await a.sign(c)).length;
    return performance.now() - t0;
  };
  // warm up ~0.3 s, learn a batch size of about 50 ms
  let n = 100,
    ms = 0;
  const warmEnd = performance.now() + 300;
  while (performance.now() < warmEnd) {
    ms = await batch(n);
    if (ms < 25) n *= 2;
  }
  n = Math.max(10, Math.round((n * 50) / Math.max(ms, 1)));
  const samples = [];
  const end = performance.now() + secs * 1000;
  while (performance.now() < end) samples.push((await batch(n)) / n);
  samples.sort((x, y) => x - y);
  const nsPerOp = samples[Math.floor(samples.length / 2)] * 1e6;
  console.log(
    JSON.stringify({
      arm,
      candidate,
      runtime,
      workload: id,
      status: 'ok',
      nsPerOp: Math.round(nsPerOp),
      opsPerSec: Math.round(1e9 / nsPerOp),
      batches: samples.length,
      batchSize: n,
      sink,
    }),
  );
}
