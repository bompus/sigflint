// node analyze-more.mjs : summarizes results/speed-regression.jsonl (part A) and results/speed-more.jsonl (part B) as protocol-more.md describes;
// writes results/speed-more-summary.json and prints Markdown tables. RESULTS=<dir> reads and writes that directory instead; a directory with no
// speed-more.jsonl gets part A only (protocol-minified.md).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const here = new URL('.', import.meta.url).pathname;
const dir = process.env.RESULTS ?? `${here}results`;
const hasB = existsSync(`${dir}/speed-more.jsonl`);
/** @param {string} name */
const load = (name) =>
  readFileSync(`${dir}/${name}`, 'utf8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
/** @param {number[]} values */
const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return /** @type {number} */ (sorted[Math.floor(sorted.length / 2)]);
};
/** @param {{ runtime: string }} row */
const runtimeOf = (row) => /** @type {string} */ (row.runtime.split(' ')[0]);
/** @param {{ runtime: string }} row */
const versionOf = (row) => row.runtime;

/** @typedef {{ band: number, pooled: number, arms: Record<string, { ns: number, min: number, max: number, n: number }> }} SCell */
/**
 * Median ns per call for each (runtime, workload, arm), the rows that were not ok, and the A/A band of each (runtime, workload).
 * @param {any[]} rows the JSON lines of one run
 * @param {string[]} controls
 */
function summarize(rows, controls) {
  /** @type {Record<string, Record<string, number[]>>} */
  const groups = {};
  /** @type {Record<string, string>} */
  const notOk = {};
  /** @type {Record<string, string>} */
  const versions = {};
  for (const row of rows) {
    if (row.runtime) {
      versions[runtimeOf(row)] = versionOf(row);
    }
    if (row.status === 'ok') {
      ((groups[`${runtimeOf(row)}|${row.workload}`] ??= {})[row.arm] ??= []).push(row.nsPerOp);
    } else if (row.workload) {
      notOk[`${runtimeOf(row)}|${row.workload}|${row.arm}`] = row.status;
    }
  }
  /** @type {Record<string, SCell>} */
  const cells = {};
  for (const [key, arms] of Object.entries(groups)) {
    const [a, b] = /** @type {[number[], number[]]} */ (controls.map((arm) => arms[arm]));
    const pooled = median([...a, ...b]);
    const spread = Math.max(
      Math.max(...a) - Math.min(...a),
      Math.max(...b) - Math.min(...b),
      Math.abs(median(a) - median(b)),
    );
    cells[key] = {
      band: Math.max(3, (200 * spread) / pooled),
      pooled,
      arms: Object.fromEntries(
        Object.entries(arms).map(([arm, values]) => [
          arm,
          {
            ns: median(values),
            min: Math.min(...values),
            max: Math.max(...values),
            n: values.length,
          },
        ]),
      ),
    };
  }
  return {
    cells,
    notOk,
    versions,
    rejected: rows.filter((r) => r.status === 'rejected-load').length,
    errors: rows.filter((r) => r.status === 'error').length,
    maxBusy: Math.max(...rows.map((r) => r.preBusyPct ?? 0)),
  };
}

const A = summarize(load('speed-regression.jsonl'), ['final-1', 'final-2']);
const B = summarize(hasB ? load('speed-more.jsonl') : [], ['final-1', 'final-2']);
/**
 * @type {{ regression: Record<string, unknown>[], more: Record<string, unknown>[], versions: Record<string, string>, rejected: number, errors: number, maxBusy: number, alone?: Record<string, { nodeNs: number, bunNs: number }> }}
 */
const summary = {
  regression: [],
  more: [],
  versions: { ...A.versions, ...B.versions },
  rejected: A.rejected + B.rejected,
  errors: A.errors + B.errors,
  maxBusy: Math.max(A.maxBusy, B.maxBusy),
};

console.log(
  `rejected ${summary.rejected}, errors ${summary.errors}, max busy before a process ${summary.maxBusy}%\n`,
);
console.log(
  'A. S3 header signing, frozen build vs src/ (ns per call; change = src/ against frozen, positive is slower)\n',
);
console.log(
  '| Runtime | Workload | frozen | src/ (A/A pair) | change | band | |\n|---|---|--:|--:|--:|--:|---|',
);
for (const [key, cell] of Object.entries(A.cells)) {
  const [runtime, workload] = key.split('|');
  const baseline = /** @type {SCell['arms'][string]} */ (cell.arms.frozen);
  const frozen = baseline.ns;
  const change = (100 * (cell.pooled - frozen)) / frozen;
  const controls = ['final-1', 'final-2'].map(
    (arm) => /** @type {SCell['arms'][string]} */ (cell.arms[arm]),
  );
  const overlap =
    Math.min(...controls.map((arm) => arm.min)) <= baseline.max &&
    Math.max(...controls.map((arm) => arm.max)) >= baseline.min;
  // The declared cap leaves overlapping ranges or a gap within twice the band inconclusive.
  const unsettled =
    overlap || Math.abs(cell.pooled - frozen) <= (2 * cell.band * cell.pooled) / 100;
  const verdict = unsettled ? 'no clear change' : change > 0 ? 'slower' : 'faster';
  summary.regression.push({
    runtime,
    workload,
    frozenNs: frozen,
    finalNs: Math.round(cell.pooled),
    changePct: +change.toFixed(1),
    bandPct: +cell.band.toFixed(1),
    verdict,
  });
  console.log(
    `| ${runtime} | ${workload} | ${frozen} | ${Math.round(cell.pooled)} (${/** @type {{ ns: number }} */ (cell.arms['final-1']).ns}, ${/** @type {{ ns: number }} */ (cell.arms['final-2']).ns}) | ${change.toFixed(1)}% | ${cell.band.toFixed(1)}% | ${verdict} |`,
  );
}
if (!hasB) {
  writeFileSync(`${dir}/speed-more-summary.json`, JSON.stringify(summary, null, 1));
  process.exit(0);
}

const libraries = ['aws4', 'aws4fetch', 'smithy', 'aws-sig', 'wdl', 'minio'];
console.log(
  '\nB. Other services and presigned URLs (microseconds per call; "x" = library time / sigflint time; a library that signed wrongly or cannot sign is not timed)\n',
);
for (const runtime of ['node', 'bun']) {
  console.log(`**${A.versions[runtime] ?? B.versions[runtime]}**\n`);
  console.log(
    `| Workload | sigflint | ${libraries.join(' | ')} | band |\n|---|--:|${libraries.map(() => '--:').join('|')}|--:|`,
  );
  for (const workload of ['any-post-json', 'any-token', 'any-query', 'presign-any', 'presign-s3']) {
    const cell = /** @type {SCell} */ (B.cells[`${runtime}|${workload}`]);
    const mine = cell.pooled;
    /** @type {{ runtime: string, workload: string, sigflintNs: number, bandPct: number, libraries: Record<string, unknown> }} */
    const row = {
      runtime,
      workload,
      sigflintNs: Math.round(mine),
      bandPct: +cell.band.toFixed(1),
      libraries: {},
    };
    const text = libraries.map((lib) => {
      const timed = cell.arms[lib];
      if (!timed) {
        row.libraries[lib] = B.notOk[`${runtime}|${workload}|${lib}`] ?? 'missing';
        return B.notOk[`${runtime}|${workload}|${lib}`] === 'wrong-result'
          ? 'wrong signature'
          : 'not offered';
      }
      row.libraries[lib] = { ns: timed.ns, times: +(timed.ns / mine).toFixed(1) };
      return `${(timed.ns / 1000).toFixed(2)} (${(timed.ns / mine).toFixed(1)}x)`;
    });
    summary.more.push(row);
    console.log(
      `| ${workload} | ${(mine / 1000).toFixed(2)} | ${text.join(' | ')} | ${cell.band.toFixed(0)}% |`,
    );
  }
  console.log('');
}
console.log('sigflint only (microseconds per call):\n');
console.log('| Workload | node | bun |\n|---|--:|--:|');
summary.alone = {};
for (const workload of [
  'sigv4a-header',
  'sigv4a-presign',
  'chunk-64k',
  'chunk-end-trailer',
  'event-4k',
]) {
  const values = ['node', 'bun'].map((runtime) => B.cells[`${runtime}|${workload}`]?.pooled);
  // a missing cell gives NaN here (the casts are for the type checker only)
  summary.alone[workload] = {
    nodeNs: Math.round(/** @type {number} */ (values[0])),
    bunNs: Math.round(/** @type {number} */ (values[1])),
  };
  console.log(
    `| ${workload} | ${(/** @type {number} */ (values[0]) / 1000).toFixed(2)} | ${(/** @type {number} */ (values[1]) / 1000).toFixed(2)} |`,
  );
}
writeFileSync(`${dir}/speed-more-summary.json`, JSON.stringify(summary, null, 1));
