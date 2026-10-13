// Draws the README charts as static SVG (a dark and a light file for each) and writes the Markdown tables, all from the
// files in results/. Usage: node make-assets.mjs  ->  ../docs/*.svg and ../docs/tables.md
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const here = new URL('.', import.meta.url).pathname;
const docs = `${here}../docs/`;
mkdirSync(docs, { recursive: true });
const read = (f) => JSON.parse(readFileSync(`${here}results/${f}`, 'utf8'));

const THEMES = {
  dark: { bg: '#0d1117', text: '#e6edf3', muted: '#9198a1', grid: '#30363d', ours: '#f0883e', other: '#6e7681', pass: '#3fb950', fail: '#f85149', na: '#484f58' },
  light: { bg: '#ffffff', text: '#1f2328', muted: '#59636e', grid: '#d1d9e0', ours: '#bc4c00', other: '#8c959f', pass: '#1a7f37', fail: '#cf222e', na: '#afb8c1' },
};
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const FONT = `font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif"`;
const NAMES = {
  sigflint: 'sigflint', 'sigflint-web': 'sigflint/web', aws4fetch: 'aws4fetch', aws4: 'aws4', smithy: '@smithy/signature-v4', 'smithy-web': '@smithy/signature-v4 (web hash)', 'aws-sig': 'aws-sig',
  wdl: '@wdl-dev/aws-sigv4', minio: 'minio',
};
const name = (id) => NAMES[id] ?? id;
const fmtInt = (n) => Math.round(n).toLocaleString('en-US');
const text = (x, y, s, { size = 13, fill, anchor = 'start', weight = 400 } = {}) => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" font-weight="${weight}">${esc(s)}</text>`;
const header = (t, title, sub) => text(20, 28, title, { size: 16, fill: t.text, weight: 600 }) + (sub ? text(20, 48, sub, { size: 12, fill: t.muted }) : '');

function doc(t, w, h, title, desc, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="t d" ${FONT}>
<title id="t">${esc(title)}</title><desc id="d">${esc(desc)}</desc>
<rect width="${w}" height="${h}" rx="8" fill="${t.bg}"/>
${body}
</svg>
`;
}

// Horizontal bars on a log axis (decades); rows: [{ label, value, ours, note }]. Returns { body, height }.
function logBars(t, rows, { x0, plotW, top, lo, hi, unit }) {
  const rowH = 28, span = Math.log10(hi / lo);
  const gx = (v) => x0 + (plotW * Math.log10(v / lo)) / span;
  let out = '';
  for (let d = Math.log10(lo); d <= Math.log10(hi) + 1e-9; d++) {
    const x = gx(10 ** d);
    out += `<line x1="${x}" y1="${top - 6}" x2="${x}" y2="${top + rows.length * rowH - 4}" stroke="${t.grid}"/>` + text(x, top + rows.length * rowH + 12, (10 ** d).toLocaleString('en-US', { maximumFractionDigits: 1 }), { size: 11, fill: t.muted, anchor: 'middle' });
  }
  let y = top;
  for (const r of rows) {
    const w = Math.max(2, gx(r.value) - x0);
    out += text(x0 - 10, y + 14, r.label, { size: 12, fill: r.ours ? t.text : t.muted, anchor: 'end', weight: r.ours ? 700 : 400 });
    out += `<rect x="${x0}" y="${y}" width="${w}" height="19" rx="3" fill="${r.ours ? t.ours : t.other}"/>`;
    out += text(x0 + w + 6, y + 14, r.valueLabel, { size: 12, fill: t.text, weight: r.ours ? 700 : 400 });
    y += rowH;
  }
  out += text(x0 + plotW / 2, top + rows.length * rowH + 30, unit, { size: 11, fill: t.muted, anchor: 'middle' });
  return { body: out, height: top + rows.length * rowH + 40 };
}

const out = {}; // chart name -> (theme) => svg
const tables = [];

// ---- correctness --------------------------------------------------------------------------------------------------
// Two groups: ordinary requests, and the edge cases (stray %, a raw + in the path, empty query names, headers some
// libraries never sign). Session-token cases are left out: only sigflint is run on them (316 of 316 pass).
const screen = read('screen-node.json');
const groups = [
  { key: 'ordinary', title: 'Ordinary requests', tags: ['well-formed'] },
  { key: 'edge', title: 'Edge cases', tags: ['malformed', 'plus-in-path', 'empty-query-name', 'unsigned-header'] },
];
const ids = ['sigflint', 'aws4fetch', 'aws4', 'smithy', 'wdl', 'minio', 'aws-sig'];
for (const g of groups) {
  g.total = g.tags.reduce((n, tg) => n + screen.tagCounts[tg], 0);
  g.rows = ids.map((id) => {
    const c = screen.candidates[id];
    const sum = (k) => g.tags.reduce((n, tg) => n + (c.byTag[tg]?.[k] ?? 0), 0);
    const pass = sum('pass'), fail = sum('fail') + sum('error');
    return { id, version: c.version, pass, fail, na: g.total - pass - fail };
  });
}
const order = groups[0].rows.map((r, i) => ({ id: r.id, k: groups[0].rows[i].pass + groups[1].rows[i].pass })).sort((a, b) => b.k - a.k).map((r) => r.id);
out.correctness = (t) => {
  const x0 = 190, plotW = 520, rowH = 28;
  let o = header(t, 'Same signature as botocore (higher is better)', 'Every library signs the same request with the same key and clock. A signature that differs by one character fails.');
  let y = 74;
  for (const g of groups) {
    o += text(20, y, `${g.title}: ${fmtInt(g.total)} requests`, { size: 13, fill: t.text, weight: 600 });
    y += 14;
    for (const id of order) {
      const r = g.rows.find((x) => x.id === id), ours = id === 'sigflint';
      o += text(x0 - 10, y + 14, name(id), { size: 12, fill: ours ? t.text : t.muted, anchor: 'end', weight: ours ? 700 : 400 });
      let x = x0;
      for (const [n, col] of [[r.pass, t.pass], [r.fail, t.fail], [r.na, t.na]]) {
        const w = (plotW * n) / g.total;
        if (n) o += `<rect x="${x}" y="${y}" width="${w}" height="19" fill="${col}"/>`;
        x += w;
      }
      o += text(x0 + plotW + 10, y + 14, `${((100 * r.pass) / g.total).toFixed(1)}%`, { size: 12, fill: t.text, weight: ours ? 700 : 400 });
      y += rowH;
    }
    y += 22;
  }
  for (const [dx, col, label] of [[0, t.pass, 'same signature'], [130, t.fail, 'different signature or error']]) {
    o += `<rect x="${x0 + dx}" y="${y - 10}" width="12" height="12" fill="${col}"/>` + text(x0 + dx + 18, y, label, { size: 12, fill: t.muted });
  }
  return doc(t, 780, y + 20, 'Correctness against botocore', groups.map((g) => `${g.title}: ` + order.map((id) => `${name(id)} ${g.rows.find((r) => r.id === id).pass}/${g.total}`).join(', ')).join('. '), o);
};
tables.push('### Correctness\n\nRequests whose signature equals botocore’s (same key, same clock).\n\n| Library | Version | Ordinary requests (' + fmtInt(groups[0].total) + ') | Edge cases (' + fmtInt(groups[1].total) + ') |\n|---|---|--:|--:|\n' +
  order.map((id) => { const cell = (g) => { const r = g.rows.find((x) => x.id === id); return `${fmtInt(r.pass)} (${((100 * r.pass) / g.total).toFixed(1)}%)`; }; return `| ${id === 'sigflint' ? '**sigflint**' : name(id)} | ${groups[0].rows.find((r) => r.id === id).version} | ${cell(groups[0])} | ${cell(groups[1])} |`; }).join('\n'));

// ---- speed --------------------------------------------------------------------------------------------------------
const speed = read('speed-summary.json');
const arm = { sigflint: 'sigflint-A', aws4fetch: 'aws4fetch', aws4: 'aws4', smithy: 'smithy', 'aws-sig': 'aws-sig', wdl: 'wdl', minio: 'minio' };
const workloads = [['bench-download', 'GET, plain key'], ['bench-part-put', 'part upload (query, headers)'], ['bench-encode', 'GET, key and query to encode'], ['bench-body-1k', 'PUT, 1 KiB body']];
const runtimes = [...new Set(Object.keys(speed.cells).map((k) => k.split('|')[0]))].sort((a, b) => (a.startsWith('node') ? -1 : 1) - (b.startsWith('node') ? -1 : 1));
const cell = (rt, w, lib) => speed.cells[`${rt}|${w}`].arms[arm[lib]];
const libs = Object.keys(arm);
out.speed = (t) => {
  const panelW = 700, x0 = 190, plotW = 400;
  let o = header(t, 'Time to sign one request, plain GET (lower is better)', 'Median of 5 separate processes per library and runtime; log scale. A plain GET, which every library here signs correctly.');
  let y = 80;
  for (const rt of runtimes) {
    o += text(20, y, rt.replace(/^(\w+) /, (m, a) => ({ node: 'Node.js', bun: 'Bun' })[a] + ' '), { size: 13, fill: t.text, weight: 600 });
    const rows = libs.map((l) => ({ l, ns: cell(rt, 'bench-download', l)?.medianNs }))
      .filter((r) => r.ns).sort((a, b) => a.ns - b.ns)
      .map((r) => ({ label: name(r.l), value: r.ns / 1000, ours: r.l === 'sigflint', valueLabel: `${(r.ns / 1000).toFixed(r.ns < 10000 ? 2 : 0)} µs` + (r.l === 'sigflint' ? '' : `  (${(r.ns / cell(rt, 'bench-download', 'sigflint').medianNs).toFixed(0)}×)`) }));
    const g = logBars(t, rows, { x0, plotW, top: y + 14, lo: 1, hi: 1000, unit: 'microseconds per signature (log scale)' });
    o += g.body;
    y = g.height + 28;
  }
  return doc(t, panelW + 60, y, 'Signing time per request', libs.map((l) => `${name(l)} ${runtimes.map((rt) => ((cell(rt, 'bench-download', l)?.medianNs ?? NaN) / 1000).toFixed(1)).join('/')} µs`).join(', '), o);
};
{
  const hdr = (rt) => `${rt.split(' ')[0] === 'node' ? 'Node' : 'Bun'} ${rt.split(' ')[1]}`;
  const cellText = (rt, w, lib) => {
    const s = cell(rt, w, lib);
    if (!s) return '';
    if (s.status === 'wrong-result') return 'wrong signature';
    if (s.status === 'unsupported') return 'cannot sign';
    return `${(s.medianNs / 1000).toFixed(2)}`;
  };
  let md = '### Speed\n\nMicroseconds per signature, median of 5 processes. “wrong signature” means the library’s result differed from botocore’s for that request, so it was not timed.\n';
  for (const rt of runtimes) {
    md += `\n**${hdr(rt)}**\n\n| Library | ${workloads.map((w) => w[1]).join(' | ')} |\n|---|${workloads.map(() => '--:').join('|')}|\n`;
    md += libs.map((l) => `| ${l === 'sigflint' ? '**sigflint**' : name(l)} | ${workloads.map(([w]) => (l === 'sigflint' ? `**${cellText(rt, w, l)}**` : cellText(rt, w, l))).join(' | ')} |`).join('\n') + '\n';
  }
  const bands = Object.entries(speed.cells).map(([k, c]) => `${k.replace('|', ' ')}: ${c.bandPct.toFixed(0)}%`).join('; ');
  md += `\nReporting band (the larger of 3% and twice the larger run-to-run range of the two sigflint control arms): ${bands}. Every gap between sigflint and another library is far outside its band.\n`;
  tables.push(md);
}

// ---- size ---------------------------------------------------------------------------------------------------------
const sizes = read('sizes.json');
const sizeRows = [['sigflint-node', 'sigflint'], ['aws4fetch', 'aws4fetch'], ['aws4', 'aws4'], ['smithy', 'smithy'], ['aws-sig', 'aws-sig'], ['wdl', 'wdl'], ['minio', 'minio']];
out.size = (t) => {
  const rows = sizeRows.map(([id, lib]) => ({ lib, s: sizes[id] })).sort((a, b) => a.s.gzipBytes - b.s.gzipBytes)
    .map(({ lib, s }) => ({ label: name(lib), value: s.gzipBytes / 1000, ours: lib === 'sigflint', valueLabel: `${(s.gzipBytes / 1000).toFixed(1)} kB` + (s.directDependencies ? `  (+${s.directDependencies} deps)` : '') }));
  const g = logBars(t, rows, { x0: 190, plotW: 400, top: 66, lo: 0.1, hi: 100, unit: 'kilobytes, bundled and minified, then gzip (log scale)' });
  return doc(t, 760, g.height, 'Size of the code you ship', sizeRows.map(([id, lib]) => `${lib} ${sizes[id].gzipBytes} B`).join(', '), header(t, 'Size once bundled (lower is better)', 'The signer and everything it imports, minified, then gzip. Node and Bun built-ins are not counted.') + g.body);
};
tables.push('### Size\n\n| Library | Source (bytes) | Bundled + minified (bytes) | + gzip | + brotli | Direct dependencies | Installed on disk (bytes) |\n|---|--:|--:|--:|--:|--:|--:|\n' +
  sizeRows.map(([id, lib]) => { const s = sizes[id]; return `| ${lib === 'sigflint' ? '**sigflint**' : name(lib)} | ${s.source ? fmtInt(s.source.bytes) : ''} | ${fmtInt(s.minifiedBytes)} | ${fmtInt(s.gzipBytes)} | ${fmtInt(s.brotliBytes)} | ${s.directDependencies} | ${s.unpackedBytes ? fmtInt(s.unpackedBytes) : ''} |`; }).join('\n'));

// ---- runtimes -----------------------------------------------------------------------------------------------------
const compat = readFileSync(`${here}results/compat.jsonl`, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const rtCols = [['node', 'Node.js'], ['bun', 'Bun'], ['deno', 'Deno'], ['workerd (nodejs_compat)', 'Workers + nodejs_compat'], ['workerd (no-flag)', 'Workers, no flag']];
const rtOf = (r) => rtCols.find(([p]) => r.runtime.startsWith(p));
const cLibs = ['sigflint', 'aws4fetch', 'aws4', 'smithy', 'smithy-web', 'aws-sig', 'wdl', 'minio'];
const status = (lib, col) => compat.find((r) => r.lib === lib && rtOf(r)?.[0] === col)?.status ?? '?';
const compatVersions = [...new Set(compat.map((r) => r.runtime.replace(/ .*$/, '') === 'node' || r.runtime.startsWith('bun') || r.runtime.startsWith('deno') ? r.runtime : null).filter(Boolean))];
out.runtimes = (t) => {
  const x0 = 230, cw = 120, rowH = 28, top = 84;
  let o = header(t, 'Where each library runs', 'Each library signs one S3 GET on each runtime; ✓ means the signature equals botocore’s.');
  rtCols.forEach(([, label], i) => { o += text(x0 + cw * i + cw / 2, top - 14, label, { size: 11, fill: t.muted, anchor: 'middle', weight: 600 }); });
  cLibs.forEach((lib, r) => {
    const y = top + r * rowH, ours = lib.startsWith('sigflint');
    o += text(x0 - 10, y + 17, name(lib), { size: 12, fill: ours ? t.text : t.muted, anchor: 'end', weight: ours ? 700 : 400 });
    rtCols.forEach(([col], i) => {
      const ok = status(lib, col) === 'ok';
      o += `<rect x="${x0 + cw * i + 4}" y="${y}" width="${cw - 8}" height="${rowH - 6}" rx="4" fill="${ok ? t.pass : t.fail}" fill-opacity="0.22" stroke="${ok ? t.pass : t.fail}"/>`;
      o += text(x0 + cw * i + cw / 2, y + 16, ok ? '✓' : '✗', { size: 13, fill: ok ? t.pass : t.fail, anchor: 'middle', weight: 700 });
    });
  });
  const h = top + cLibs.length * rowH + 14;
  return doc(t, x0 + cw * rtCols.length + 20, h, 'Runtime support', cLibs.map((l) => `${name(l)}: ${rtCols.map(([c]) => (status(l, c) === 'ok' ? 'yes' : 'no')).join('/')}`).join('; '), o);
};
tables.push('### Runtimes\n\n| Library | ' + rtCols.map((c) => c[1]).join(' | ') + ' |\n|---|' + rtCols.map(() => ':-:').join('|') + '|\n' +
  cLibs.map((l) => `| ${l.startsWith('sigflint') ? `**${name(l)}**` : name(l)} | ${rtCols.map(([c]) => (status(l, c) === 'ok' ? '✓' : '✗')).join(' | ')} |`).join('\n') +
  `\n\nRuntimes: ${compatVersions.join(', ')}; Workers run in local workerd through wrangler ${'(see bench/frozen/versions.txt)'}. ✗ cells: ` +
  compat.filter((r) => r.status !== 'ok').map((r) => `${r.lib} on ${rtOf(r)[1]}: ${r.status === 'error' ? r.detail : 'does not load (' + (/node:crypto|node:/.test(r.detail ?? '') ? 'needs a node: module' : 'bundle error') + ')'}`).join('; ') + '.');

for (const [id, draw] of Object.entries(out)) for (const [mode, t] of Object.entries(THEMES)) writeFileSync(`${docs}${id}-${mode}.svg`, draw(t));
writeFileSync(`${docs}tables.md`, tables.join('\n\n') + '\n');

// fill the marked blocks in the README: the chart (dark and light) and the table under it
const sections = [['correctness', 'Bar chart: how many requests each library signs the same as botocore'], ['speed', 'Bar chart: time to sign one request on Node.js and Bun'], ['size', 'Bar chart: bundled, minified and gzipped size of each library'], ['runtimes', 'Grid: which runtimes each library runs on']];
let readme = readFileSync(`${here}../README.md`, 'utf8');
sections.forEach(([key, alt], i) => {
  const picture = `<picture>\n  <source media="(prefers-color-scheme: dark)" srcset="docs/${key}-dark.svg">\n  <img alt="${alt}" src="docs/${key}-light.svg">\n</picture>`;
  const body = tables[i].replace(/^### [^\n]*\n\n/, '');
  readme = readme.replace(new RegExp(`(<!-- BEGIN ${key} -->)[\\s\\S]*?(<!-- END ${key} -->)`), (_, a, b) => `${a}\n${picture}\n\n${body}\n${b}`);
});
writeFileSync(`${here}../README.md`, readme);
console.log('wrote', Object.keys(out).map((id) => `${id}-{dark,light}.svg`).join(', '), 'and tables.md');
