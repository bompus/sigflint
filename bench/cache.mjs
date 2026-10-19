// Signing-key cache retention of sigflint in one process: <bun|node> cache.mjs <sigflint entry path (absolute)>
// The signer keeps up to 1,000 derived signing keys (one per date, region and secret). Each call below uses a new signing day, so
// every call adds one cache entry until the cap, after which the oldest entry is dropped. The managed heap after a forced full
// collection is read at several entry counts (the signer object stays reachable through the whole run).
// Control: the same number of calls on one single day (cache hits), read at the same counts. Output is the heap after a forced
// collection minus the heap at the start of the same phase; the cost of one cache entry is the slope between the readings at 0 and 1,000.
import { readFileSync } from 'node:fs';
import v8 from 'node:v8';

const [oursPath] = process.argv.slice(2);
const isBun = typeof Bun !== 'undefined';
// read only on Bun (the cast drops the null of the Node branch)
const jsc = /** @type {typeof import('bun:jsc')} */ (isBun ? await import('bun:jsc') : null);
// Node runs this with --expose-gc
const forceGC = () => (isBun ? Bun.gc(true) : /** @type {() => void} */ (globalThis.gc)());
const heap = () => (isBun ? jsc.heapSize() : v8.getHeapStatistics().used_heap_size);
const rss = () => process.memoryUsage.rss();
const runtime = isBun ? `bun ${Bun.version}` : `node ${process.versions.node}`;
const arm = process.env.ARM ?? 'sigflint';
// JSON.parse reads the Buffer as UTF-8 text (the casts are for the type checker only)
/** @type {import('./adapters.mjs').Case[]} */
const corpus = JSON.parse(
  /** @type {string} */ (
    /** @type {unknown} */ (readFileSync(new URL('../test/corpus.json', import.meta.url)))
  ),
);
const c = /** @type {import('./adapters.mjs').Case} */ (
  corpus.find((x) => x.id === 'bench-download')
);
const { getAuthHeaders } = await import(/** @type {string} */ (oursPath));
const CREDS = {
  accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
};
const url = new URL(c.href);
const DAY = 86400000,
  T0 = Date.UTC(2013, 4, 24);
/** @param {number} now */
const sign = (now) =>
  getAuthHeaders(
    {
      method: c.method,
      url,
      region: 'us-east-1',
      body: c.body,
      signHeaders: { ...c.headers },
      now,
    },
    CREDS,
  );

for (let i = 0; i < 3000; i++) {
  sign(T0);
} // warm-up on one day, outside both phases
const counts = [0, 250, 500, 1000, 1500, 2000];
/**
 * @param {string} name
 * @param {(i: number) => number} dayOf
 */
const phase = (name, dayOf) => {
  forceGC();
  forceGC();
  const h0 = heap(),
    r0 = rss();
  /** @type {{ entries: number, heapBytes: number, rssBytes: number }[]} */
  const rows = [];
  let done = 0;
  for (const n of counts) {
    for (; done < n; done++) {
      sign(T0 + dayOf(done + 1) * DAY);
    }
    forceGC();
    forceGC();
    rows.push({ entries: n, heapBytes: heap() - h0, rssBytes: rss() - r0 });
  }
  return { name, rows };
};
const distinct = phase('distinct-days', (i) => i);
const same = phase('same-day', () => 0);
/**
 * @param {ReturnType<typeof phase>} p
 * @param {number} n
 */
const at = (p, n) =>
  /** @type {{ heapBytes: number }} */ (p.rows.find((r) => r.entries === n)).heapBytes;
console.log(
  JSON.stringify({
    arm,
    runtime,
    status: 'ok',
    phases: [distinct, same],
    bytesPerEntry1000: (at(distinct, 1000) - at(distinct, 0)) / 1000,
    plateauGrowth1000to2000: at(distinct, 2000) - at(distinct, 1000),
    sameDayGrowth2000: at(same, 2000),
  }),
);
