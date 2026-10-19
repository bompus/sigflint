// Draws the memory charts as static SVG (a dark and a light file each) from results/memory-summary.json.
// Usage: node make-memory-assets.mjs [summary.json] [out dir]   (defaults: results/memory-summary.json, ../docs/)
// One chart per resource (bars per signer, one panel per runtime, start at zero, median with the min-max range of the rounds as a whisker).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const here = new URL('.', import.meta.url).pathname;
const [, , summaryPath = `${here}results/memory-summary.json`, outDir = `${here}../docs/`] = process.argv;
mkdirSync(outDir, { recursive: true });
const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
/** The rounds behind a metric: one number, or a range when workloads differ. */
const roundsOf = (...metrics) => { const n = summary.cells.filter((c) => metrics.includes(c.metric)).map((c) => c.arms['sigflint-A'].n); return Math.min(...n) === Math.max(...n) ? `${n[0]}` : `${Math.min(...n)} to ${Math.max(...n)}`; };
const THEMES = {
  dark: { bg: '#0d1117', text: '#e6edf3', muted: '#9198a1', grid: '#30363d', ours: '#f0883e', other: '#6e7681' },
  light: { bg: '#ffffff', text: '#1f2328', muted: '#59636e', grid: '#d1d9e0', ours: '#bc4c00', other: '#8c959f' },
};
const NAMES = { 'sigflint-A': 'sigflint', aws4fetch: 'aws4fetch', aws4: 'aws4', smithy: '@smithy/signature-v4', 'aws-sig': 'aws-sig', wdl: '@wdl-dev/aws-sigv4', minio: 'minio' };
const ORDER = ['sigflint-A', 'aws4', 'minio', 'aws4fetch', 'smithy', 'aws-sig', 'wdl'];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const FONT = `font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif"`;
const text = (x, y, s, { size = 12, fill, anchor = 'start', weight = 400 } = {}) => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" font-weight="${weight}">${esc(s)}</text>`;
const unitFmt = {
  B: (v) => (v >= 1048576 ? `${(v / 1048576).toFixed(1)} MiB` : v >= 1024 ? `${(v / 1024).toFixed(1)} KiB` : `${Math.round(v)} B`),
  ms: (v) => `${v >= 100 ? v.toFixed(0) : v.toFixed(1)} ms`,
  '': (v) => `${Math.round(v)}`,
  'µs': (v) => `${v >= 100 ? v.toFixed(0) : v.toFixed(1)} µs`,
};

// charts: metric id, workload ('-' for process-level), title, subtitle
const CHARTS = [
  { file: 'memory-alloc', metric: 'allocBytes', workload: 'bench-download', title: 'Heap allocated per signature', sub: 'Plain GET, managed heap only, lower is better' },
  { file: 'memory-gc', metric: 'gcMs', workload: 'bench-download', title: 'Garbage-collection pause per 10,000 signatures', sub: 'Plain GET, stop-the-world time, lower is better' },
  { file: 'memory-rss', metric: 'maxRss', workload: '-', title: 'Peak memory of the whole process', sub: 'Peak RSS with only that library loaded, includes the runtime itself, lower is better' },
  { file: 'memory-start', metric: 'firstMs', workload: '-', title: 'Start-up: import and first signature', sub: 'Fresh process, runtime start-up excluded, lower is better' },
];

// Round tick positions: a step of 1, 2 or 5 times a power of ten in the unit shown on the axis (KiB and MiB for bytes).
function axis(max, unit) {
  const div = unit === 'B' ? (max >= 1048576 ? 1048576 : max >= 1024 ? 1024 : 1) : 1;
  const raw = (max * 1.08) / div / 4, pow = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 5, 10].find((m) => m * pow >= raw) * pow) * div;
  const ticks = [];
  for (let v = 0; v < max * 1.08 + step; v += step) { ticks.push(v); if (v >= max * 1.08) break; }
  const suffix = unit === 'B' ? { 1: 'B', 1024: 'KiB', 1048576: 'MiB' }[div] : unit;
  const label = (v) => `${+(v / div).toFixed(2)}${unit === 'B' || unit === 'ms' || unit === 'µs' ? ' ' + suffix : ''}`;
  return { ticks, top: ticks[ticks.length - 1], label };
}

function panel(t, rt, cells, { x0, plotW, top, unit, linear }) {
  const rows = ORDER.filter((a) => cells.arms[a]).map((a) => ({ arm: a, ...cells.arms[a] }));
  const max = Math.max(...rows.map((r) => r.max));
  const rowH = 26;
  const ax = axis(max, unit);
  const gx = (v) => x0 + (plotW * v) / ax.top;
  let out = text(x0 - 10, top - 14, rt === 'node' ? `Node.js` : `Bun`, { size: 13, fill: t.text, weight: 700, anchor: 'end' });
  for (const v of ax.ticks) out += `<line x1="${gx(v)}" y1="${top - 6}" x2="${gx(v)}" y2="${top + rows.length * rowH - 4}" stroke="${t.grid}"/>` + text(gx(v), top + rows.length * rowH + 10, ax.label(v), { size: 10, fill: t.muted, anchor: 'middle' });
  let y = top;
  for (const r of rows) {
    const ours = r.arm === 'sigflint-A';
    out += text(x0 - 10, y + 14, NAMES[r.arm], { fill: ours ? t.text : t.muted, anchor: 'end', weight: ours ? 700 : 400 });
    out += `<rect x="${x0}" y="${y}" width="${Math.max(2, gx(r.median) - x0)}" height="18" rx="3" fill="${ours ? t.ours : t.other}"/>`;
    out += `<line x1="${gx(r.min)}" y1="${y + 9}" x2="${gx(r.max)}" y2="${y + 9}" stroke="${t.text}" stroke-width="1.5"/><line x1="${gx(r.min)}" y1="${y + 4}" x2="${gx(r.min)}" y2="${y + 14}" stroke="${t.text}"/><line x1="${gx(r.max)}" y1="${y + 4}" x2="${gx(r.max)}" y2="${y + 14}" stroke="${t.text}"/>`;
    const ratio = r.ratio >= 10 ? r.ratio.toFixed(0) : r.ratio?.toFixed(1);
    const note = ours ? '' : r.verdict === 'no clear change' ? `  (${ratio}×, no clear change)` : r.ratio > 0 && cells.baseMedian > 0 ? `  (${ratio}×)` : '';
    out += text(gx(r.max) + 6, y + 13, `${unitFmt[unit](r.median)}${note}`, { fill: t.text, weight: ours ? 700 : 400 });
    y += rowH;
  }
  return { body: out, height: top + rows.length * rowH + 24 };
}

for (const ch of CHARTS) {
  for (const [name, t] of Object.entries(THEMES)) {
    const w = 900;
    let body = text(20, 28, ch.title, { size: 16, fill: t.text, weight: 600 }) + text(20, 48, ch.sub, { size: 12, fill: t.muted });
    let y = 92;
    for (const rt of ['node', 'bun']) {
      const cells = summary.cells.find((c) => c.metric === ch.metric && c.runtime === rt && c.workload === ch.workload);
      if (!cells) continue;
      const p = panel(t, rt, cells, { x0: 190, plotW: 430, top: y, unit: cells.unit });
      body += p.body; y = p.height + 36;
    }
    body += text(20, y, `Bars: median of ${roundsOf(ch.metric)} rounds; whisker: lowest to highest round; (N×): times sigflint, or no clear change when inside the noise band. Each round is a fresh process.`, { size: 11, fill: t.muted });
    y += 20;
    writeFileSync(`${outDir}${ch.file}-${name}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${y}" viewBox="0 0 ${w} ${y}" role="img" aria-labelledby="t" ${FONT}>\n<title id="t">${esc(ch.title)}</title>\n<rect width="${w}" height="${y}" rx="8" fill="${t.bg}"/>\n${body}\n</svg>\n`);
  }
}
console.log(`wrote ${CHARTS.length * 2} charts to ${outDir}`);

// ---- README: fill the marked memory block (charts, one table per runtime) -------------------------------------------------
const fmtCell = (c, arm, unit) => {
  const a = c?.arms[arm];
  if (!a) return '';
  const v = unitFmt[unit](a.median);
  if (arm === 'sigflint-A') return `**${v}**`;
  const r = a.ratio >= 10 ? a.ratio.toFixed(0) : a.ratio?.toFixed(1);
  return a.verdict === 'no clear change' ? `${v} (no clear change)` : `${v} (${r}×)`;
};
const COLS = [
  ['Heap allocated per call', 'allocBytes', 'bench-download'],
  ['Collections per 10,000 calls', 'gcCount', 'bench-download'],
  ['GC pause per 10,000 calls', 'gcMs', 'bench-download'],
  ['Peak memory of the process', 'maxRss', '-'],
  ['Import + first signature', 'firstMs', '-'],
];
const cell = (m, rt, wl) => summary.cells.find((c) => c.metric === m && c.runtime === rt && c.workload === wl);
const FULL = { aws4: 'aws4', minio: 'minio', aws4fetch: 'aws4fetch', smithy: '@smithy/signature-v4', 'aws-sig': 'aws-sig', wdl: '@wdl-dev/aws-sigv4', 'sigflint-A': '**sigflint**' };
let md = '';
for (const rt of ['node', 'bun']) {
  md += `\n**${rt === 'node' ? 'Node 26.12.0' : 'Bun 1.4.3'}**, plain GET of one key:\n\n| Library | ${COLS.map((c) => c[0]).join(' | ')} |\n|---|${COLS.map(() => '--:').join('|')}|\n`;
  for (const arm of ORDER) md += `| ${FULL[arm]} | ${COLS.map(([, m, wl]) => fmtCell(cell(m, rt, wl), arm, cell(m, rt, wl)?.unit ?? '')).join(' | ')} |\n`;
}
// the spread of the allocation ratio over every workload the library signs correctly
const ratios = summary.cells.filter((c) => c.metric === 'allocBytes').flatMap((c) => Object.entries(c.arms).filter(([a, x]) => a !== 'sigflint-A' && a !== 'sigflint-B' && x.verdict === 'more than sigflint').map(([, x]) => x.ratio));
const bandOf = (m) => { const b = summary.cells.filter((c) => c.metric === m).map((c) => Math.round(c.bandPct)); return Math.min(...b) === Math.max(...b) ? `${b[0]}%` : `${Math.min(...b)}% to ${Math.max(...b)}%`; };
const bands = [['heap per call', 'allocBytes'], ['GC pause', 'gcMs'], ['peak memory', 'maxRss'], ['import + first signature', 'firstMs']].map(([n, m]) => `${n} ${bandOf(m)}`).join('; ');
const block = `<picture>
  <source media="(prefers-color-scheme: dark)" srcset="memory-alloc-dark.svg">
  <img alt="Bar chart: heap allocated per signature on Node.js and Bun" src="memory-alloc-light.svg">
</picture>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="memory-gc-dark.svg">
  <img alt="Bar chart: garbage-collection pause per 10,000 signatures on Node.js and Bun" src="memory-gc-light.svg">
</picture>
${md}
Median of ${roundsOf('allocBytes', 'gcMs', 'maxRss')} rounds, one fresh process per library, runtime and round (for import, each round is the median of 7 fresh processes). “(×)” is the library's value divided by sigflint's; “no clear change” means the gap is inside the reporting band, the ranges over the rounds overlap, or the gap is within twice the band (a comparison still unsettled at the cap is shown this way even where its median gap is outside the band, as with most retained-heap comparisons). Across all four workloads, the libraries that sign them correctly allocate ${Math.min(...ratios).toFixed(1)} to ${Math.max(...ratios).toFixed(0)} times as much heap per call as sigflint. Reporting bands (the larger of the metric's floor and twice the larger spread of the two sigflint control arms): ${bands}. Every gap shown with a multiplier is more than twice its band, with ranges that do not overlap.`;
const readmePath = `${here}../docs/benchmarks.md`;
const readme = readFileSync(readmePath, 'utf8');
if (!readme.includes('<!-- BEGIN memory -->')) throw new Error('docs/benchmarks.md has no memory block');
writeFileSync(readmePath, readme.replace(/(<!-- BEGIN memory -->)[\s\S]*?(<!-- END memory -->)/, (_, a, b) => `${a}\n${block}\n${b}`));
console.log(`benchmarks.md memory block written; allocation ratios ${Math.min(...ratios).toFixed(2)} to ${Math.max(...ratios).toFixed(2)}`);
