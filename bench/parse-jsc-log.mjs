// Reads the stderr of a Bun process run with BUN_JSC_logGC=1 and memory.mjs markers (@@BEGIN <workload> <kind> <calls> ... @@END).
// Usage: node parse-jsc-log.mjs <stderr file> <arm> <round>
// Prints one JSON line per marked region:
//   alloc-real / alloc-control: heapBytesPerCall = sum over the collections in the region of (heap size at collection start - heap size
//     after the previous collection) / calls. The region starts right after an eden collection and ends with one, so every byte
//     allocated in it is counted.
//   run-pass1: collections and stop-the-world pause time inside the region.
import { readFileSync } from 'node:fs';

const [, , file, arm = '', round = ''] = process.argv;
const lines = readFileSync(file, 'utf8').split('\n');
let region = null,
  cur = null,
  lastAfter = null;
const out = [];
const finish = () => {
  if (!region) return;
  const r = region;
  region = null;
  if (r.kind.startsWith('alloc')) {
    out.push({
      arm,
      round: Number(round),
      workload: r.workload,
      region: r.kind,
      calls: r.calls,
      collections: r.gcs.length,
      heapBytes: r.alloc,
      heapBytesPerCall: r.alloc / r.calls,
    });
  } else {
    out.push({
      arm,
      round: Number(round),
      workload: r.workload,
      region: r.kind,
      calls: r.calls,
      gcCount: r.gcs.length,
      gcMajor: r.gcs.filter((g) => g.full).length,
      gcMs: r.gcs.reduce((s, g) => s + (g.p ?? 0), 0),
    });
  }
};
for (const l of lines) {
  let m;
  if ((m = l.match(/^@@BEGIN (\S+) (\S+) (\d+)/))) {
    region = { workload: m[1], kind: m[2], calls: Number(m[3]), gcs: [], alloc: 0 };
    continue;
  }
  if (l.startsWith('@@END')) {
    finish();
    continue;
  }
  if ((m = l.match(/START M (\d+)kb => (Eden|Full)Collection/)))
    cur = { before: Number(m[1]) * 1024, full: m[2] === 'Full' };
  if (cur && (m = l.match(/=> (\d+)kb, p=([\d.]+)ms/))) {
    cur.after = Number(m[1]) * 1024;
    cur.p = Number(m[2]);
    continue;
  }
  if (cur && l.startsWith('GC END!')) {
    if (cur.after === undefined) throw new Error('collection without an after size');
    if (region) {
      region.gcs.push(cur);
      if (lastAfter !== null) region.alloc += cur.before - lastAfter;
    }
    lastAfter = cur.after;
    cur = null;
  }
}
for (const o of out) console.log(JSON.stringify(o));
