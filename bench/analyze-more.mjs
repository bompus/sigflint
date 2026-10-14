// node analyze-more.mjs : summarizes results/speed-regression.jsonl (part A) and results/speed-more.jsonl (part B) as protocol-more.md describes;
// writes results/speed-more-summary.json and prints Markdown tables.
import { readFileSync, writeFileSync } from 'node:fs';

const here = new URL('.', import.meta.url).pathname;
const load = (name) => readFileSync(`${here}results/${name}`, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
const median = (values) => { const sorted = [...values].sort((a, b) => a - b); return sorted[Math.floor(sorted.length / 2)]; };
const runtimeOf = (row) => row.runtime.split(' ')[0];
const versionOf = (row) => row.runtime;

/** Median ns per call for each (runtime, workload, arm), the rows that were not ok, and the A/A band of each (runtime, workload). */
function summarize(rows, controls) {
  const groups = {};
  const notOk = {};
  const versions = {};
  for (const row of rows) {
    if (row.runtime) versions[runtimeOf(row)] = versionOf(row);
    if (row.status === 'ok') ((groups[`${runtimeOf(row)}|${row.workload}`] ??= {})[row.arm] ??= []).push(row.nsPerOp);
    else if (row.workload) notOk[`${runtimeOf(row)}|${row.workload}|${row.arm}`] = row.status;
  }
  const cells = {};
  for (const [key, arms] of Object.entries(groups)) {
    const [a, b] = controls.map((arm) => arms[arm]);
    const pooled = median([...a, ...b]);
    const spread = Math.max(Math.max(...a) - Math.min(...a), Math.max(...b) - Math.min(...b), Math.abs(median(a) - median(b)));
    cells[key] = { band: Math.max(3, (200 * spread) / pooled), pooled, arms: Object.fromEntries(Object.entries(arms).map(([arm, values]) => [arm, { ns: median(values), min: Math.min(...values), max: Math.max(...values), n: values.length }])) };
  }
  return { cells, notOk, versions, rejected: rows.filter((r) => r.status === 'rejected-load').length, errors: rows.filter((r) => r.status === 'error').length, maxBusy: Math.max(...rows.map((r) => r.preBusyPct ?? 0)) };
}

const A = summarize(load('speed-regression.jsonl'), ['final-1', 'final-2']);
const B = summarize(load('speed-more.jsonl'), ['final-1', 'final-2']);
const summary = { regression: [], more: [], versions: { ...A.versions, ...B.versions }, rejected: A.rejected + B.rejected, errors: A.errors + B.errors, maxBusy: Math.max(A.maxBusy, B.maxBusy) };

console.log(`rejected ${summary.rejected}, errors ${summary.errors}, max busy before a process ${summary.maxBusy}%\n`);
console.log('A. S3 header signing, frozen build vs src/ (ns per call; change = src/ against frozen, positive is slower)\n');
console.log('| Runtime | Workload | frozen | src/ (A/A pair) | change | band | |\n|---|---|--:|--:|--:|--:|---|');
for (const [key, cell] of Object.entries(A.cells)) {
  const [runtime, workload] = key.split('|');
  const frozen = cell.arms.frozen.ns;
  const change = (100 * (cell.pooled - frozen)) / frozen;
  const verdict = Math.abs(change) <= cell.band ? 'no clear change' : change > 0 ? 'slower' : 'faster';
  summary.regression.push({ runtime, workload, frozenNs: frozen, finalNs: Math.round(cell.pooled), changePct: +change.toFixed(1), bandPct: +cell.band.toFixed(1), verdict });
  console.log(`| ${runtime} | ${workload} | ${frozen} | ${Math.round(cell.pooled)} (${cell.arms['final-1'].ns}, ${cell.arms['final-2'].ns}) | ${change.toFixed(1)}% | ${cell.band.toFixed(1)}% | ${verdict} |`);
}

const libraries = ['aws4', 'aws4fetch', 'smithy', 'aws-sig', 'wdl', 'minio'];
console.log('\nB. Other services and presigned URLs (microseconds per call; "x" = library time / sigflint time; a library that signed wrongly or cannot sign is not timed)\n');
for (const runtime of ['node', 'bun']) {
  console.log(`**${A.versions[runtime] ?? B.versions[runtime]}**\n`);
  console.log(`| Workload | sigflint | ${libraries.join(' | ')} | band |\n|---|--:|${libraries.map(() => '--:').join('|')}|--:|`);
  for (const workload of ['any-post-json', 'any-token', 'any-query', 'presign-any', 'presign-s3']) {
    const cell = B.cells[`${runtime}|${workload}`];
    const mine = cell.pooled;
    const row = { runtime, workload, sigflintNs: Math.round(mine), bandPct: +cell.band.toFixed(1), libraries: {} };
    const text = libraries.map((lib) => {
      const timed = cell.arms[lib];
      if (!timed) { row.libraries[lib] = B.notOk[`${runtime}|${workload}|${lib}`] ?? 'missing'; return B.notOk[`${runtime}|${workload}|${lib}`] === 'wrong-result' ? 'wrong signature' : 'not offered'; }
      row.libraries[lib] = { ns: timed.ns, times: +(timed.ns / mine).toFixed(1) };
      return `${(timed.ns / 1000).toFixed(2)} (${(timed.ns / mine).toFixed(1)}x)`;
    });
    summary.more.push(row);
    console.log(`| ${workload} | ${(mine / 1000).toFixed(2)} | ${text.join(' | ')} | ${cell.band.toFixed(0)}% |`);
  }
  console.log('');
}
console.log('sigflint only (microseconds per call):\n');
console.log('| Workload | node | bun |\n|---|--:|--:|');
summary.alone = {};
for (const workload of ['sigv4a-header', 'sigv4a-presign', 'chunk-64k', 'chunk-end-trailer', 'event-4k']) {
  const values = ['node', 'bun'].map((runtime) => B.cells[`${runtime}|${workload}`]?.pooled);
  summary.alone[workload] = { nodeNs: Math.round(values[0]), bunNs: Math.round(values[1]) };
  console.log(`| ${workload} | ${(values[0] / 1000).toFixed(2)} | ${(values[1] / 1000).toFixed(2)} |`);
}
writeFileSync(`${here}results/speed-more-summary.json`, JSON.stringify(summary, null, 1));
