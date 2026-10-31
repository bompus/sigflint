// Summarizes bench/results/memory-raw.jsonl under the criteria in memory-protocol.md.
// Usage: node analyze-memory.mjs <raw.jsonl> <summary.json>   (prints a markdown report)
import { readFileSync, writeFileSync } from 'node:fs';

const [rawPath, outPath] = process.argv.slice(2);
const rows = readFileSync(/** @type {string} */ (rawPath), 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((l) => JSON.parse(l));
const ARMS = [
  'sigflint-A',
  'aws4fetch',
  'aws4',
  'smithy',
  'aws-sig',
  'wdl',
  'minio',
  's3mini',
  'tiny-oss',
  'lean-s3',
  's3-lite-client',
  'sigflint-B',
];
const BASE = 'sigflint-A',
  CONTROL = 'sigflint-B';

// reporting band: relative floor (percent of the baseline median) and an absolute floor in the metric's unit
/** @typedef {{ label: string, unit: string, rel: number, abs: number }} Metric */
/** @type {Record<string, Metric>} */
const METRICS = {
  allocBytes: { label: 'heap bytes allocated per call', unit: 'B', rel: 6, abs: 64 },
  retained: {
    label: 'heap retained per 10,000 calls, second pass (forced GC)',
    unit: 'B',
    rel: 3,
    abs: 65536,
  },
  gcCount: { label: 'collections per 10,000 calls', unit: '', rel: 3, abs: 2 },
  gcMs: { label: 'GC pause per 10,000 calls', unit: 'ms', rel: 3, abs: 1 },
  cpuUs: { label: 'CPU time per call (user+system, whole process)', unit: 'µs', rel: 3, abs: 0.1 },
  maxRss: { label: 'peak RSS of the whole process', unit: 'B', rel: 3, abs: 2 * 1048576 },
  importMs: { label: 'import + client build', unit: 'ms', rel: 3, abs: 1 },
  firstMs: { label: 'import + first signature', unit: 'ms', rel: 3, abs: 1 },
  cacheEntry: {
    label: 'heap per cached signing key (slope 0 to 1,000 entries)',
    unit: 'B',
    rel: 3,
    abs: 5,
  },
};
/** @param {number[]} a */
const med = (a) => {
  const s = [...a].sort((x, y) => x - y);
  return s.length ? /** @type {number} */ (s[Math.floor(s.length / 2)]) : NaN;
};
/** @param {number[]} a */
const range = (a) => Math.max(...a) - Math.min(...a);

const rejected = rows.filter(
  (r) => String(r.status).startsWith('rejected') || r.status === 'error',
);
const ok = rows.filter((r) => r.status === 'ok' || r.src === 'jsc-log');
// samples[metric][rt][workload|'-'][arm] = [value per round]
/** @type {Record<string, Record<string, Record<string, Record<string, Record<string, number>>>>>} */
const S = {};
/**
 * @param {{ m: string, rt: string, wl: string, arm: string, round: number | string }} key
 * @param {number} v
 */
const put = ({ m, rt, wl, arm, round }, v) => {
  if (!Number.isFinite(v)) {
    return;
  }
  ((((S[m] ??= {})[rt] ??= {})[wl] ??= {})[arm] ??= {})[round] = v;
};

// Node allocation and run rows come from memory.mjs; Bun's from the parsed collector log
/** @type {Record<string, Record<string, number>>} */
const bunAlloc = {};
for (const r of ok) {
  const rt = r.rt,
    arm = r.armTag,
    round = r.round;
  if (r.src === 'jsc-log') {
    if (r.procKind === 'alloc') {
      (bunAlloc[`${arm}|${round}|${r.workload}`] ??= {})[r.region] = r.heapBytesPerCall;
    }
    if (r.procKind === 'run' && r.region === 'run-pass1') {
      put({ m: 'gcCount', rt, wl: r.workload, arm, round }, r.gcCount);
      put({ m: 'gcMs', rt, wl: r.workload, arm, round }, r.gcMs);
    }
    continue;
  }
  if (
    r.mode === 'alloc' &&
    rt === 'node' &&
    r.workload?.startsWith('bench-') &&
    r.heapBytesPerCall !== undefined
  ) {
    put({ m: 'allocBytes', rt, wl: r.workload, arm, round }, r.heapBytesPerCall);
  }
  if (r.mode === 'run' && r.workload?.startsWith('bench-')) {
    put({ m: 'retained', rt, wl: r.workload, arm, round }, r.heapAfter2 - r.heapAfter1);
    put({ m: 'cpuUs', rt, wl: r.workload, arm, round }, r.cpuUsPerCall);
    if (rt === 'node') {
      put({ m: 'gcCount', rt, wl: r.workload, arm, round }, r.gcCount);
      put({ m: 'gcMs', rt, wl: r.workload, arm, round }, r.gcMs);
    }
  }
  if (r.mode === 'run' && r.workload === '(process)') {
    put({ m: 'maxRss', rt, wl: '-', arm, round }, r.maxRssBytes);
  }
  if (r.kind === 'cache') {
    put({ m: 'cacheEntry', rt, wl: '-', arm, round }, r.bytesPerEntry1000);
  }
}
for (const [k, v] of Object.entries(bunAlloc)) {
  const [arm, round, wl] = /** @type {[string, string, string]} */ (k.split('|'));
  if (v['alloc-real'] !== undefined && v['alloc-control'] !== undefined) {
    put(
      { m: 'allocBytes', rt: 'bun', wl, arm, round: Number(round) },
      v['alloc-real'] - v['alloc-control'],
    );
  }
}
// import time: median of the REPS processes of a round
/** @type {Record<string, any[]>} */
const imp = {};
for (const r of ok.filter((x) => x.kind === 'import' && x.ok)) {
  (imp[`${r.rt}|${r.armTag}|${r.round}`] ??= []).push(r);
}
for (const [k, list] of Object.entries(imp)) {
  const [rt, arm, round] = /** @type {[string, string, string]} */ (k.split('|'));
  put({ m: 'importMs', rt, wl: '-', arm, round: Number(round) }, med(list.map((x) => x.importMs)));
  put(
    { m: 'firstMs', rt, wl: '-', arm, round: Number(round) },
    med(list.map((x) => x.importMs + x.firstSignMs)),
  );
}

/**
 * One arm of a comparison; ratio is null when the baseline median is 0.
 * @typedef {{ n: number, median: number, min: number, max: number, ratio: number | null, gap: number, unsettled: boolean, verdict: string }} ArmStats
 */
/**
 * @typedef {object} Cell
 * @property {string} metric
 * @property {string} runtime
 * @property {string} workload
 * @property {string} unit
 * @property {number} baseMedian
 * @property {number[]} baseRange
 * @property {number} aaRangePct
 * @property {number} bandPct
 * @property {number} absFloor
 * @property {Record<string, ArmStats>} arms
 */
/**
 * The summary of one metric, runtime and workload, or null when the baseline arm has no samples.
 * @param {string} m
 * @param {string} rt
 * @param {string} wl
 * @param {Record<string, Record<string, number>>} byArm
 * @returns {Cell | null}
 */
const cellOf = (m, rt, wl, byArm) => {
  const cfg = /** @type {Metric} */ (METRICS[m]);
  /** @param {string} arm */
  const vals = (arm) => Object.values(byArm[arm] ?? {});
  const a = vals(BASE),
    b = vals(CONTROL);
  if (!a.length) {
    return null;
  }
  const mA = med(a);
  const spread =
    Math.max(range(a) / Math.abs(mA || 1), b.length ? range(b) / Math.abs(med(b) || 1) : 0) * 100;
  const bandPct = Math.max(cfg.rel, 2 * spread);
  /** @type {Cell} */
  const out = {
    metric: m,
    runtime: rt,
    workload: wl,
    unit: cfg.unit,
    baseMedian: mA,
    baseRange: [Math.min(...a), Math.max(...a)],
    aaRangePct: spread,
    bandPct,
    absFloor: cfg.abs,
    arms: {},
  };
  for (const arm of ARMS) {
    const v = vals(arm);
    if (!v.length) {
      continue;
    }
    const mv = med(v),
      gap = mv - mA;
    const overlap = !(Math.min(...v) > Math.max(...a) || Math.max(...v) < Math.min(...a));
    const band = Math.max((Math.abs(mA) * bandPct) / 100, cfg.abs);
    // unsettled (protocol-rerun.md): the ranges overlap, or the median gap is at most twice the band; an unsettled comparison is reported as no clear change
    const unsettled = arm !== BASE && (overlap || Math.abs(gap) <= 2 * band);
    const clear = arm !== BASE && Math.abs(gap) > band && !overlap && !unsettled;
    out.arms[arm] = {
      n: v.length,
      median: mv,
      min: Math.min(...v),
      max: Math.max(...v),
      ratio: mA ? mv / mA : null,
      gap,
      unsettled,
      verdict:
        arm === BASE
          ? 'baseline'
          : !clear
            ? 'no clear change'
            : gap > 0
              ? 'more than sigflint'
              : 'less than sigflint',
    };
  }
  return out;
};
/** @type {Cell[]} */
const cells = [];
for (const [m, byRt] of Object.entries(S)) {
  for (const [rt, byWl] of Object.entries(byRt)) {
    for (const [wl, byArm] of Object.entries(byWl)) {
      const out = cellOf(m, rt, wl, byArm);
      if (out) {
        cells.push(out);
      }
    }
  }
}
const summary = {
  rejectedRows: rejected,
  counts: { rows: rows.length, accepted: ok.length, rejectedOrError: rejected.length },
  cells,
};
writeFileSync(/** @type {string} */ (outPath), JSON.stringify(summary, null, 1));

/**
 * @param {number} v
 * @param {string} unit
 */
const fmt = (v, unit) =>
  unit === 'B'
    ? Math.abs(v) >= 1048576
      ? `${(v / 1048576).toFixed(1)} MiB`
      : Math.abs(v) >= 1024
        ? `${(v / 1024).toFixed(1)} KiB`
        : `${Math.round(v)} B`
    : `${Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(2)} ${unit}`.trim();
const md = [`Rows ${rows.length}, accepted ${ok.length}, rejected or error ${rejected.length}`];
for (const m of Object.keys(METRICS)) {
  const cs = cells.filter((c) => c.metric === m);
  if (!cs.length) {
    continue;
  }
  const cfg = /** @type {Metric} */ (METRICS[m]);
  md.push(`\n### ${cfg.label}`);
  for (const rt of ['node', 'bun']) {
    const rc = cs.filter((c) => c.runtime === rt);
    if (!rc.length) {
      continue;
    }
    md.push(
      `\n${rt}: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(${cfg.rel}%, 2 x A/A range), absolute floor ${fmt(cfg.abs, cfg.unit)}\n`,
    );
    md.push(`| workload | ${ARMS.join(' | ')} |`, `|---|${ARMS.map(() => '---').join('|')}|`);
    for (const c of rc) {
      md.push(
        `| ${c.workload} (band ${c.bandPct.toFixed(1)}%) | ${ARMS.map((arm) => {
          const x = c.arms[arm];
          return x
            ? `${fmt(x.median, c.unit)}${arm === BASE ? '' : ` (${/** @type {number} */ (x.ratio) > 0 && c.baseMedian > 0 ? /** @type {number} */ (x.ratio).toFixed(2) + 'x; ' : ''}${x.verdict === 'no clear change' ? 'ncc' : x.verdict === 'more than sigflint' ? 'more' : 'less'})`}`
            : '-';
        }).join(' | ')} |`,
      );
    }
  }
}
if (rejected.length) {
  md.push(
    '\n### Rejected or errored',
    ...rejected.map((r) => `- ${JSON.stringify(r).slice(0, 200)}`),
  );
}
console.log(md.join('\n'));
