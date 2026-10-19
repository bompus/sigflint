// Memory of one candidate in one process: <bun|node> memory.mjs <alloc|run> <candidateId> <sigflint entry path (absolute)>
// Same adapters, workloads and per-workload correctness gate as speed.mjs; only the candidate's own library is loaded.
//
// mode alloc, Node (run with a large fixed young generation so a scavenge is rare): heap bytes allocated per call. Calls run in chunks of
//   CHUNK; the managed-heap growth over a chunk divided by CHUNK is one sample; a chunk during which a collection was seen is discarded.
//   A control (a no-op with the same await shape) is measured the same way and subtracted. Node also reports external + ArrayBuffer growth.
// mode alloc, Bun: JavaScriptCore's heap size only moves at a collection, so Bun runs with BUN_JSC_logGC=1: one pass of NA calls is
//   bracketed by two eden collections and by marker lines on stderr; parse-jsc-log.mjs adds up the heap bytes allocated between collections.
//   Native memory (the hash state) is outside both numbers.
// candidate calib: not a signer; allocates a known amount per call (arrays of 512 and 2048 elements) to check both methods.
// mode run: warm-up, forced full GC, baseline; pass 1 of N1 calls (GC count and time on Node, CPU time, wall time, peak RSS);
//   forced GC; pass 2 of N2 calls; forced GC. Retained growth = managed heap after a forced GC minus the previous forced-GC reading.
//   Forced collections are never inside a timed or counted pass.
import { readFileSync } from 'node:fs';
import { performance, PerformanceObserver } from 'node:perf_hooks';
import v8 from 'node:v8';
import { loadAdapters, freezeClock } from './adapters.mjs';

const [, , mode, candidate, oursPath] = process.argv;
const isBun = typeof Bun !== 'undefined';
const jsc = isBun ? await import('bun:jsc') : null;
const runtime = isBun ? `bun ${Bun.version}` : `node ${process.versions.node}`;
const corpus = JSON.parse(readFileSync(new URL('../test/corpus.json', import.meta.url)));
const expected = Object.fromEntries(corpus.map((c) => [c.id, { sig: c.sig }]));
const workloads =
  candidate === 'calib'
    ? ['calib-512', 'calib-2048']
    : ['bench-download', 'bench-part-put', 'bench-encode', 'bench-body-1k'];
const arm = process.env.ARM ?? candidate;

const WARM = 2000,
  CHUNK = 200,
  CHUNKS = 40,
  NA = 10000,
  N1 = 10000,
  N2 = 10000;
const mark = (t) => isBun && console.error(`@@${t}`);
let keep; // the calibrator's arrays are consumed here so they are not optimized away
const forceGC = () => (isBun ? Bun.gc(true) : globalThis.gc());
const heap = () => (isBun ? jsc.heapSize() : v8.getHeapStatistics().used_heap_size);
const external = () => {
  if (isBun) return jsc.memoryUsage().current;
  const m = process.memoryUsage();
  return m.external + m.arrayBuffers;
};
const rss = () => process.memoryUsage.rss();
const maxRss = () => process.resourceUsage().maxRSS * 1024;
const tick = () => new Promise((r) => setImmediate(r));
const median = (a) => {
  const s = [...a].sort((x, y) => x - y);
  return s.length ? s[Math.floor(s.length / 2)] : null;
};

// collections seen by Node's own GC observer (flushed after a tick)
let gcEntries = [];
if (!isBun)
  new PerformanceObserver((l) => {
    gcEntries.push(...l.getEntries());
  }).observe({ entryTypes: ['gc'] });
const takeGc = async () => {
  await tick();
  await tick();
  const e = gcEntries;
  gcEntries = [];
  return e;
};

forceGC();
const h0 = heap(),
  r0 = rss(),
  e0 = external();
const CALIB = candidate === 'calib';
const adapters = CALIB
  ? [{ id: 'calib', kind: 'sync', unsupported: () => null }]
  : await loadAdapters(oursPath, null, [candidate]);
const a = adapters.find((x) => x.id === candidate);
if (!a) throw new Error(`unknown candidate ${candidate}`);
forceGC();
const load = { heapBytes: heap() - h0, externalBytes: external() - e0, rssBytes: rss() - r0 };
console.log(
  JSON.stringify({
    arm,
    candidate,
    runtime,
    mode,
    workload: '(load)',
    status: 'ok',
    ...load,
    rssAfterLoad: rss(),
  }),
);

const callOf = (c) => {
  if (CALIB) {
    const n = c.id === 'calib-512' ? 512 : 2048;
    return () => {
      keep = new Array(n).fill(1);
      return 'x';
    };
  }
  return a.kind === 'sync' ? () => a.sign(c) : async () => a.sign(c);
};
const noop = a.kind === 'sync' ? () => 'x'.repeat(64) : async () => 'x'.repeat(64);

async function calls(fn, n) {
  let sink = 0;
  if (a.kind === 'sync') for (let i = 0; i < n; i++) sink += fn().length;
  else for (let i = 0; i < n; i++) sink += (await fn()).length;
  return sink;
}

for (const id of workloads) {
  const c = CALIB ? { id } : corpus.find((x) => x.id === id);
  const base = { arm, candidate, runtime, mode, workload: id };
  if (a.unsupported(c)) {
    console.log(JSON.stringify({ ...base, status: 'unsupported' }));
    continue;
  }
  const restore = freezeClock();
  let got;
  try {
    got = await callOf(c)();
  } catch (e) {
    got = `error: ${e.message}`;
  }
  restore();
  if (!CALIB && got !== expected[id].sig) {
    console.log(JSON.stringify({ ...base, status: 'wrong-result' }));
    continue;
  }
  const fn = callOf(c);
  await calls(fn, WARM);
  await calls(noop, WARM);

  if (mode === 'alloc' && isBun) {
    for (const [kind, f] of [
      ['real', fn],
      ['control', noop],
    ]) {
      forceGC();
      jsc.edenGC();
      mark(`BEGIN ${id} alloc-${kind} ${NA}`);
      await calls(f, NA);
      jsc.edenGC();
      mark('END');
    }
    console.log(JSON.stringify({ ...base, status: 'pending-log', na: NA }));
    continue;
  }
  if (mode === 'alloc') {
    const sample = async (f) => {
      const heapB = [],
        extB = [];
      let kept = 0,
        dropped = 0;
      forceGC();
      await takeGc();
      for (let k = 0; k < CHUNKS; k++) {
        if (k % 10 === 0) {
          forceGC();
          await takeGc();
        }
        const hb = heap(),
          eb = external();
        await calls(f, CHUNK);
        const ha = heap(),
          ea = external();
        const gcs = isBun ? [] : await takeGc();
        if (gcs.length || ha < hb) {
          dropped++;
          continue;
        }
        kept++;
        heapB.push((ha - hb) / CHUNK);
        extB.push((ea - eb) / CHUNK);
      }
      return { heap: median(heapB), ext: median(extB), kept, dropped };
    };
    const real = await sample(fn),
      ctl = await sample(noop);
    console.log(
      JSON.stringify({
        ...base,
        status: real.kept >= 10 ? 'ok' : 'too-few-chunks',
        heapBytesPerCall: real.heap == null ? null : Math.round(real.heap - (ctl.heap ?? 0)),
        extBytesPerCall: real.ext == null ? null : Math.round(real.ext - (ctl.ext ?? 0)),
        rawHeapBytesPerCall: real.heap,
        controlHeapBytesPerCall: ctl.heap,
        keptChunks: real.kept,
        droppedChunks: real.dropped,
        controlKept: ctl.kept,
      }),
    );
    continue;
  }

  // mode run
  forceGC();
  await takeGc();
  const b = { heap: heap(), ext: external(), rss: rss() };
  await takeGc();
  // pass 1: heap-size drops are counted in chunks of CHUNK on both runtimes (a lower bound on collections); Node's GC observer gives the exact count and time
  mark(`BEGIN ${id} run-pass1 ${N1}`);
  const cpu0 = process.cpuUsage();
  const t0 = performance.now();
  let drops = 0,
    prev = heap(),
    peakHeap = prev,
    done = 0;
  while (done < N1) {
    await calls(fn, CHUNK);
    done += CHUNK;
    const h = heap();
    if (h < prev) drops++;
    if (h > peakHeap) peakHeap = h;
    prev = h;
  }
  const wallMs = performance.now() - t0;
  const cpu = process.cpuUsage(cpu0);
  mark('END');
  const gcs = isBun ? null : await takeGc();
  const rssAfter1 = rss(),
    maxRssAfter1 = maxRss();
  forceGC();
  const h1 = heap(),
    e1 = external(),
    rs1 = rss();
  await calls(fn, N2);
  forceGC();
  const h2 = heap(),
    e2 = external(),
    rs2 = rss();
  console.log(
    JSON.stringify({
      ...base,
      status: 'ok',
      n1: N1,
      n2: N2,
      baseHeap: b.heap,
      heapAfter1: h1,
      heapAfter2: h2,
      retained1: h1 - b.heap,
      retained2: h2 - h1,
      retainedExt1: e1 - b.ext,
      retainedExt2: e2 - e1,
      peakHeapDuringPass1: peakHeap,
      rssBase: b.rss,
      rssAfterPass1: rssAfter1,
      rssAfterGc1: rs1,
      rssAfterGc2: rs2,
      maxRssAfterPass1: maxRssAfter1,
      gcCount: gcs ? gcs.length : null,
      gcMs: gcs ? gcs.reduce((s, e) => s + e.duration, 0) : null,
      gcMajor: gcs ? gcs.filter((e) => (e.detail?.kind ?? e.kind) !== 1).length : null,
      heapDrops: drops,
      cpuUserMs: cpu.user / 1000,
      cpuSysMs: cpu.system / 1000,
      wallMs,
      cpuUsPerCall: (cpu.user + cpu.system) / N1,
      wallUsPerCall: (wallMs * 1000) / N1,
    }),
  );
}
console.log(
  JSON.stringify({
    arm,
    candidate,
    runtime,
    mode,
    workload: '(process)',
    status: 'ok',
    maxRssBytes: maxRss(),
  }),
);
