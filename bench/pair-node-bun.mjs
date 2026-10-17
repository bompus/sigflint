// Pairs Node and Bun for every workload, metric and library measured on both, from the raw results of one run, and writes the table of
// results/<out>. A runtime is ahead when its min-max range over the rounds is disjoint from the other's; otherwise the direction of the medians is given
// and the ranges overlap. Dispositions are carried from an earlier table when a row's verdict class is unchanged; any other row is marked as needing one.
// Usage: node pair-node-bun.mjs [results dir=results] [out file=rerun-3-node-bun.md] [earlier table=results/rerun-2-node-bun.md]
//   needs speed-raw.jsonl, speed-more.jsonl and memory-summary.json (node analyze-memory.mjs results/memory-raw.jsonl results/memory-summary.json) in the results dir.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const here = new URL('.', import.meta.url).pathname;
const dir = process.argv[2] ?? `${here}results`;
const outFile = process.argv[3] ?? 'rerun-3-node-bun.md';
const prevFile = process.argv[4] ?? `${here}results/rerun-2-node-bun.md`;
const jl = (f) => readFileSync(`${dir}/${f}`, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const fmt = (x) => Math.round(x).toLocaleString('en-US');
const stat = (v) => ({ med: med(v), min: Math.min(...v), max: Math.max(...v) });
const cell = (s) => `${fmt(s.med)} (${fmt(s.min)}-${fmt(s.max)})`;

const rows = []; // { part, metric, workload, lib, node: { med, min, max }, bun: { med, min, max } }, over the rounds
const add = (part, metric, workload, lib, node, bun) => { if (node?.length && bun?.length) rows.push({ part, metric, workload, lib, node: stat(node), bun: stat(bun) }); };

// speed: one value per round and runtime
function speed(file, part, libOf, order) {
  const g = {};
  for (const r of jl(file)) if (r.status === 'ok' && r.workload) ((g[`${r.workload}|${libOf(r.arm)}`] ??= {})[r.runtime.split(' ')[0]] ??= []).push(r.nsPerOp);
  for (const key of order(Object.keys(g))) { const [w, lib] = key.split('|'); add(part, 'speed ns', w, lib, g[key].node, g[key].bun); }
}
const A_ARMS = ['sigflint-A', 'aws4fetch', 'aws4', 'smithy', 'aws-sig', 'wdl', 'minio', 'sigflint-B'];
speed('speed-raw.jsonl', 'A', (a) => a, (keys) => keys.sort((a, b) => a.split('|')[0].localeCompare(b.split('|')[0]) || A_ARMS.indexOf(a.split('|')[1]) - A_ARMS.indexOf(b.split('|')[1])));
// part B: sigflint's two copies are pooled as one library (the control pair of the noise band)
speed('speed-more.jsonl', 'B', (a) => (a.startsWith('final-') ? 'sigflint' : a), (keys) => keys.sort((a, b) => (a.endsWith('|sigflint') ? 0 : 1) - (b.endsWith('|sigflint') ? 0 : 1) || a.split('|')[1].localeCompare(b.split('|')[1]) || a.split('|')[0].localeCompare(b.split('|')[0])));

// memory and import: from the summary of analyze-memory.mjs (one value per round)
const mem = JSON.parse(readFileSync(`${dir}/memory-summary.json`, 'utf8'));
const byKey = {};
// retained heap is not paired across runtimes
for (const c of mem.cells) for (const [arm, s] of Object.entries(c.arms)) { if (arm === 'sigflint-B' || s.median === undefined || c.metric === 'retained') continue; (byKey[`${c.metric}|${c.workload ?? '-'}|${arm}`] ??= {})[c.runtime] = s; }
for (const [key, v] of Object.entries(byKey)) { const [metric, workload, lib] = key.split('|'); if (v.node && v.bun) rows.push({ part: 'C/D', metric, workload, lib, node: { med: v.node.median, min: v.node.min, max: v.node.max }, bun: { med: v.bun.median, min: v.bun.min, max: v.bun.max } }); }

const verdict = (n, b) => {
  if (n.max < b.min) return 'Node ahead, ranges disjoint';
  if (b.max < n.min) return 'Bun ahead, ranges disjoint';
  return n.med < b.med ? 'Node ahead in median, ranges overlap' : 'Bun ahead in median, ranges overlap'; // equal medians count as Bun not behind
};
const klass = (v) => (v.startsWith('Node ahead, ') ? 'node-disjoint' : v.startsWith('Node ahead') ? 'node-overlap' : v.startsWith('Bun ahead, ') ? 'bun-disjoint' : 'bun-overlap');

// dispositions of the earlier table
const prev = {};
if (existsSync(prevFile)) for (const l of readFileSync(prevFile, 'utf8').split('\n')) {
  const c = l.split(' | ').map((x) => x.replace(/^\| /, '').replace(/ \|$/, ''));
  if (c.length >= 8 && (c[0] === 'A' || c[0] === 'B' || c[0] === 'C/D')) prev[`${c[0]}|${c[1]}|${c[2]}|${c[3]}`] = { verdict: c[6], klass: klass(c[6]), disposition: c.slice(7).join(' | ') };
}
const DIFFERENT_INSTRUMENT = new Set(['gcMs', 'gcCount', 'allocBytes']); // Node counts heap growth between collections, Bun reads the collector log
const NOT_AHEAD = 'none needed (Node not ahead)';
const ENC = '; its presigner also calls `encodeURIComponent`, reported separately in [oven-sh/bun#45700](https://github.com/oven-sh/bun/issues/45700) (not shown to explain any gap)';
const out = [], changes = [];
for (const r of rows) {
  r.verdict = verdict(r.node, r.bun); r.klass = klass(r.verdict);
  const key = `${r.part}|${r.metric}|${r.workload}|${r.lib}`, old = prev[key];
  let disp;
  const was = old ? `was ${old.verdict}${/confirmed by alternating/.test(old.disposition) ? ', confirmed by alternating samples' : ''}` : 'not in the earlier table';
  const flipped = !old || old.klass !== r.klass || /confirmed by alternating/.test(old?.disposition ?? '');
  if (r.klass.startsWith('bun')) {
    disp = NOT_AHEAD + (key === 'B|speed ns|sigv4a-presign|sigflint' ? ENC : '');
    if (old && old.klass.startsWith('node')) changes.push(`${key}: ${was}, now ${r.verdict}`);
  } else if (r.klass === 'node-overlap') {
    disp = `no disposition yet: Node ahead in the median, ranges overlap (in band), so not a reproduced gap and not yet confirmed or shown to be noise; it needs alternating samples first; ${old ? was + ' in the earlier run; ' : ''}nothing filed with oven-sh/bun${r.part === 'B' && r.lib === 'sigflint' ? '; the URL property reads of [oven-sh/bun#45627](https://github.com/oven-sh/bun/issues/45627) are among the calls it makes, not shown to explain any difference' : ''}`;
    if (flipped) changes.push(`${key}: ${was}, now ${r.verdict}`);
  } else if (flipped) {
    disp = `no disposition yet: ${was} in the earlier run; nothing filed with oven-sh/bun`;
    changes.push(`${key}: ${was}, now ${r.verdict}`);
  } else disp = old.disposition;
  if (r.klass.startsWith('node') && DIFFERENT_INSTRUMENT.has(r.metric) && !/no disposition yet/.test(disp) && !/different instruments/.test(disp)) disp = 'suspected only: the two runtimes use different instruments';
  out.push(`| ${r.part} | ${r.metric} | ${r.workload} | ${r.lib} | ${cell(r.node)} | ${cell(r.bun)} | ${r.verdict} | ${disp} |`);
}
const intro = `# Node and Bun pairing for the admitted-pair re-run

Every workload, metric and library measured on both runtimes, from the raw results in this directory (median, then min-max over the rounds; units are those of the metric: ns, bytes, ms or µs). Verdict: a runtime is ahead when its range is disjoint from the other's; otherwise the direction of the medians is given and the ranges overlap. Disposition (for rows where Node is ahead): see the pairing section of \`rerun-3-notes.md\`. Nothing has been filed, edited or commented on at oven-sh/bun from this run. The Node-against-Bun comparison is not closed: every row marked "no disposition yet" is open, and a row with overlapping ranges needs alternating samples before it is called a gap or noise. Earlier reports, which this run does not change: [oven-sh/bun#45627](https://github.com/oven-sh/bun/issues/45627) (reading properties of a parsed URL) covers part of a sigflint speed gap; [oven-sh/bun#45699](https://github.com/oven-sh/bun/issues/45699) (\`crypto.hash\`) and [oven-sh/bun#45700](https://github.com/oven-sh/bun/issues/45700) (\`encodeURIComponent\`) are single calls compared on their own and not shown to explain any sigflint gap.

`;
const head = `| part | metric | workload | library | Node | Bun | verdict | disposition |\n|---|---|---|---|---|---|---|---|`;
writeFileSync(outFile.startsWith('/') ? outFile : `${dir}/${outFile}`, `${intro}${head}\n${out.join('\n')}\n`);
const count = (k) => rows.filter((r) => r.klass === k).length;
console.log(`${rows.length} rows: Node ahead disjoint ${count('node-disjoint')}, Node ahead overlap ${count('node-overlap')}, Bun ahead disjoint ${count('bun-disjoint')}, Bun ahead overlap ${count('bun-overlap')}`);
console.log(changes.length ? `rows needing a disposition or flipped (${changes.length}):\n${changes.join('\n')}` : 'no row flipped or is new');
