// Draws the README charts as static SVG (a dark and a light file for each) and writes the Markdown tables, all from the
// files in results/. Usage: node make-assets.mjs  ->  ../docs/*.svg and ../docs/tables.md
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const here = new URL('.', import.meta.url).pathname;
const docs = `${here}../docs/`;
mkdirSync(docs, { recursive: true });
const read = (f) => JSON.parse(readFileSync(`${here}results/${f}`, 'utf8'));

const THEMES = {
  dark: {
    bg: '#0d1117',
    text: '#e6edf3',
    muted: '#9198a1',
    grid: '#30363d',
    ours: '#f0883e',
    other: '#6e7681',
    pass: '#3fb950',
    fail: '#f85149',
    na: '#484f58',
  },
  light: {
    bg: '#ffffff',
    text: '#1f2328',
    muted: '#59636e',
    grid: '#d1d9e0',
    ours: '#bc4c00',
    other: '#8c959f',
    pass: '#116329',
    fail: '#a40e26',
    na: '#afb8c1',
  },
};
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const FONT = `font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif"`;
const NAMES = {
  sigflint: 'sigflint',
  'sigflint-web': 'sigflint/web',
  aws4fetch: 'aws4fetch',
  aws4: 'aws4',
  smithy: '@smithy/signature-v4',
  'smithy-web': '@smithy/signature-v4 (web hash)',
  'aws-sig': 'aws-sig',
  wdl: '@wdl-dev/aws-sigv4',
  minio: 'minio',
};
const name = (id) => NAMES[id] ?? id;
const fmtInt = (n) => Math.round(n).toLocaleString('en-US');
const text = (x, y, s, { size = 13, fill, anchor = 'start', weight = 400, halo } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" font-weight="${weight}"${halo ? ` stroke="${halo}" stroke-width="4" stroke-linejoin="round" paint-order="stroke"` : ''}>${esc(s)}</text>`;
const times = (v) => (v >= 10 ? v.toFixed(0) : v.toFixed(1));
// sub is one line or an array of lines
const header = (t, title, sub) =>
  text(20, 28, title, { size: 16, fill: t.text, weight: 600 }) +
  []
    .concat(sub ?? [])
    .map((s, i) => text(20, 48 + 17 * i, s, { size: 12, fill: t.muted }))
    .join('');

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
  const rowH = 28,
    span = Math.log10(hi / lo);
  const gx = (v) => x0 + (plotW * Math.log10(v / lo)) / span;
  let out = '';
  for (let d = Math.log10(lo); d <= Math.log10(hi) + 1e-9; d++) {
    const x = gx(10 ** d);
    out +=
      `<line x1="${x}" y1="${top - 6}" x2="${x}" y2="${top + rows.length * rowH - 4}" stroke="${t.grid}"/>` +
      text(
        x,
        top + rows.length * rowH + 12,
        (10 ** d).toLocaleString('en-US', { maximumFractionDigits: 1 }),
        { size: 11, fill: t.muted, anchor: 'middle' },
      );
  }
  let y = top;
  for (const r of rows) {
    const w = Math.max(2, gx(r.value) - x0);
    out += text(x0 - 10, y + 14, r.label, {
      size: 12,
      fill: r.ours ? t.text : t.muted,
      anchor: 'end',
      weight: r.ours ? 700 : 400,
    });
    out += `<rect x="${x0}" y="${y}" width="${w}" height="19" rx="3" fill="${r.ours ? t.ours : t.other}"/>`;
    out += text(x0 + w + 6, y + 14, r.valueLabel, {
      size: 12,
      fill: t.text,
      weight: r.ours ? 700 : 400,
      halo: t.bg,
    });
    y += rowH;
  }
  out += text(x0 + plotW / 2, top + rows.length * rowH + 30, unit, {
    size: 11,
    fill: t.muted,
    anchor: 'middle',
  });
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
  {
    key: 'edge',
    title: 'Edge cases',
    tags: ['malformed', 'plus-in-path', 'empty-query-name', 'unsigned-header'],
  },
];
const ids = ['sigflint', 'aws4fetch', 'aws4', 'smithy', 'wdl', 'minio', 'aws-sig'];
for (const g of groups) {
  g.total = g.tags.reduce((n, tg) => n + screen.tagCounts[tg], 0);
  g.rows = ids.map((id) => {
    const c = screen.candidates[id];
    const sum = (k) => g.tags.reduce((n, tg) => n + (c.byTag[tg]?.[k] ?? 0), 0);
    const pass = sum('pass'),
      fail = sum('fail') + sum('error');
    return { id, version: c.version, pass, fail, na: g.total - pass - fail };
  });
}
const order = groups[0].rows
  .map((r, i) => ({ id: r.id, k: groups[0].rows[i].pass + groups[1].rows[i].pass }))
  .sort((a, b) => b.k - a.k)
  .map((r) => r.id);
out.correctness = (t) => {
  const x0 = 190,
    plotW = 520,
    rowH = 28;
  let o = header(
    t,
    'Same signature as botocore (higher is better)',
    'Every library signs the same request with the same key and clock. A signature that differs by one character fails.',
  );
  let y = 74;
  for (const g of groups) {
    o += text(20, y, `${g.title}: ${fmtInt(g.total)} requests`, {
      size: 13,
      fill: t.text,
      weight: 600,
    });
    y += 14;
    for (const id of order) {
      const r = g.rows.find((x) => x.id === id),
        ours = id === 'sigflint';
      o += text(x0 - 10, y + 14, name(id), {
        size: 12,
        fill: ours ? t.text : t.muted,
        anchor: 'end',
        weight: ours ? 700 : 400,
      });
      let x = x0;
      for (const [n, col] of [
        [r.pass, t.pass],
        [r.fail, t.fail],
        [r.na, t.na],
      ]) {
        const w = (plotW * n) / g.total;
        if (n) o += `<rect x="${x}" y="${y}" width="${w}" height="19" fill="${col}"/>`;
        x += w;
      }
      o += text(x0 + plotW + 10, y + 14, `${((100 * r.pass) / g.total).toFixed(1)}%`, {
        size: 12,
        fill: t.text,
        weight: ours ? 700 : 400,
      });
      y += rowH;
    }
    y += 22;
  }
  for (const [dx, col, label] of [
    [0, t.pass, 'same signature'],
    [130, t.fail, 'different signature or error'],
  ]) {
    o +=
      `<rect x="${x0 + dx}" y="${y - 10}" width="12" height="12" fill="${col}"/>` +
      text(x0 + dx + 18, y, label, { size: 12, fill: t.muted });
  }
  return doc(
    t,
    780,
    y + 20,
    'Correctness against botocore',
    groups
      .map(
        (g) =>
          `${g.title}: ` +
          order
            .map((id) => `${name(id)} ${g.rows.find((r) => r.id === id).pass}/${g.total}`)
            .join(', '),
      )
      .join('. '),
    o,
  );
};
tables.push(
  "### Correctness\n\nRequests whose signature equals botocore’s (same key, same clock). The version in the table is the one `package.json` said when the corpus ran: sigflint's row is the source of 1.0.1 (tree `712d1eb2`), before the version was changed.\n\n| Library | Version | Ordinary requests (" +
    fmtInt(groups[0].total) +
    ') | Edge cases (' +
    fmtInt(groups[1].total) +
    ') |\n|---|---|--:|--:|\n' +
    order
      .map((id) => {
        const cell = (g) => {
          const r = g.rows.find((x) => x.id === id);
          return `${fmtInt(r.pass)} (${((100 * r.pass) / g.total).toFixed(1)}%)`;
        };
        return `| ${id === 'sigflint' ? '**sigflint**' : name(id)} | ${groups[0].rows.find((r) => r.id === id).version} | ${cell(groups[0])} | ${cell(groups[1])} |`;
      })
      .join('\n'),
);

// ---- speed --------------------------------------------------------------------------------------------------------
const speed = read('speed-summary.json');
const speedRounds = Math.max(
  ...Object.values(speed.cells).flatMap((c) => Object.values(c.arms).map((a) => a.n ?? 0)),
); // processes per library and runtime in the matrix
const moreRounds = new Set(
  readFileSync(`${here}results/speed-more.jsonl`, 'utf8')
    .trim()
    .split('\n')
    .map((l) => JSON.parse(l).round),
).size; // rounds of the other-services run
const arm = {
  sigflint: 'sigflint-A',
  aws4fetch: 'aws4fetch',
  aws4: 'aws4',
  smithy: 'smithy',
  'aws-sig': 'aws-sig',
  wdl: 'wdl',
  minio: 'minio',
};
const workloads = [
  ['bench-download', 'GET, plain key'],
  ['bench-part-put', 'part upload (query, headers)'],
  ['bench-encode', 'GET, key and query to encode'],
  ['bench-body-1k', 'PUT, 1 KiB body'],
];
const runtimes = [...new Set(Object.keys(speed.cells).map((k) => k.split('|')[0]))].sort(
  (a, b) => (a.startsWith('node') ? -1 : 1) - (b.startsWith('node') ? -1 : 1),
);
const cell = (rt, w, lib) => speed.cells[`${rt}|${w}`].arms[arm[lib]];
const libs = Object.keys(arm);
out.speed = (t) => {
  const panelW = 700,
    x0 = 190,
    plotW = 400;
  let o = header(t, 'Time to sign one request, plain GET (lower is better)', [
    `Median of ${speedRounds} separate processes per library and runtime; log scale. A plain GET, which every library here signs correctly.`,
    'Measured before the S3 code was split into modules; the shipped code is within 4% of it (no clear change).',
  ]);
  let y = 98;
  for (const rt of runtimes) {
    o += text(
      20,
      y,
      rt.replace(/^(\w+) /, (m, a) => ({ node: 'Node.js', bun: 'Bun' })[a] + ' '),
      { size: 13, fill: t.text, weight: 600 },
    );
    const rows = libs
      .map((l) => ({ l, ns: cell(rt, 'bench-download', l)?.medianNs }))
      .filter((r) => r.ns)
      .sort((a, b) => a.ns - b.ns)
      .map((r) => ({
        label: name(r.l),
        value: r.ns / 1000,
        ours: r.l === 'sigflint',
        valueLabel:
          `${(r.ns / 1000).toFixed(r.ns < 10000 ? 2 : r.ns < 100000 ? 1 : 0)} µs` +
          (r.l === 'sigflint'
            ? ''
            : `  (${times(r.ns / cell(rt, 'bench-download', 'sigflint').medianNs)}×)`),
      }));
    const g = logBars(t, rows, {
      x0,
      plotW,
      top: y + 14,
      lo: 1,
      hi: 1000,
      unit: 'microseconds per signature (log scale)',
    });
    o += g.body;
    y = g.height + 28;
  }
  return doc(
    t,
    panelW + 60,
    y,
    'Signing time per request',
    libs
      .map(
        (l) =>
          `${name(l)} ${runtimes.map((rt) => ((cell(rt, 'bench-download', l)?.medianNs ?? NaN) / 1000).toFixed(1)).join('/')} µs`,
      )
      .join(', '),
    o,
  );
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
  let md = `### Speed\n\nMicroseconds per signature, median of ${speedRounds} processes. “wrong signature” means the library’s result differed from botocore’s for that request, so it was not timed; a blank means the library does not offer that API.\n`;
  for (const rt of runtimes) {
    md += `\n**${hdr(rt)}**\n\n| Library | ${workloads.map((w) => w[1]).join(' | ')} |\n|---|${workloads.map(() => '--:').join('|')}|\n`;
    md +=
      libs
        .map(
          (l) =>
            `| ${l === 'sigflint' ? '**sigflint**' : name(l)} | ${workloads.map(([w]) => (l === 'sigflint' ? `**${cellText(rt, w, l)}**` : cellText(rt, w, l))).join(' | ')} |`,
        )
        .join('\n') + '\n';
  }
  const bands = Object.entries(speed.cells)
    .map(([k, c]) => `${k.replace('|', ' ')}: ${c.bandPct.toFixed(0)}%`)
    .join('; ');
  md += `\nReporting band (the larger of 3% and twice the larger run-to-run range of the two sigflint control arms): ${bands}. Every gap between sigflint and another library is far outside its band.\n`;
  tables.push(md);
}

// ---- size ---------------------------------------------------------------------------------------------------------
const sizes = read('sizes.json');
const sizeRows = [
  ['sigflint-node', 'sigflint'],
  ['aws4fetch', 'aws4fetch'],
  ['aws4', 'aws4'],
  ['smithy', 'smithy'],
  ['aws-sig', 'aws-sig'],
  ['wdl', 'wdl'],
  ['minio', 'minio'],
];
out.size = (t) => {
  const rows = sizeRows
    .map(([id, lib]) => ({ lib, s: sizes[id] }))
    .sort((a, b) => a.s.gzipBytes - b.s.gzipBytes)
    .map(({ lib, s }) => ({
      label: name(lib),
      value: s.gzipBytes / 1000,
      ours: lib === 'sigflint',
      valueLabel:
        `${(s.gzipBytes / 1000).toFixed(1)} kB` +
        (s.directDependencies ? `  (+${s.directDependencies} deps)` : ''),
    }));
  const g = logBars(t, rows, {
    x0: 190,
    plotW: 400,
    top: 66,
    lo: 0.1,
    hi: 100,
    unit: 'kilobytes, bundled and minified, then gzip (log scale)',
  });
  return doc(
    t,
    760,
    g.height,
    'Size of the code you ship',
    sizeRows.map(([id, lib]) => `${lib} ${sizes[id].gzipBytes} B`).join(', '),
    header(
      t,
      'Size once bundled (lower is better)',
      'The signer and everything it imports, minified, then gzip. Node and Bun built-ins are not counted.',
    ) + g.body,
  );
};
tables.push(
  '### Size\n\n| Library | Source, all signers (bytes) | Bundled + minified (bytes) | + gzip | + brotli | Direct dependencies | Installed on disk (bytes) |\n|---|--:|--:|--:|--:|--:|--:|\n' +
    sizeRows
      .map(([id, lib]) => {
        const s = sizes[id];
        return `| ${lib === 'sigflint' ? '**sigflint**' : name(lib)} | ${s.source ? fmtInt(s.source.bytes) : ''} | ${fmtInt(s.minifiedBytes)} | ${fmtInt(s.gzipBytes)} | ${fmtInt(s.brotliBytes)} | ${s.directDependencies} | ${s.unpackedBytes ? fmtInt(s.unpackedBytes) : ''} |`;
      })
      .join('\n'),
);

// ---- runtimes -----------------------------------------------------------------------------------------------------
const compat = readFileSync(`${here}results/compat.jsonl`, 'utf8')
  .trim()
  .split('\n')
  .map((l) => JSON.parse(l));
const rtCols = [
  ['node', 'Node.js'],
  ['bun', 'Bun'],
  ['deno', 'Deno'],
  ['workerd (nodejs_compat)', 'Workers + nodejs_compat'],
  ['workerd (no-flag)', 'Workers, no flag'],
];
const rtOf = (r) => rtCols.find(([p]) => r.runtime.startsWith(p));
const cLibs = [
  'sigflint',
  'sigflint-web',
  'aws4fetch',
  'aws4',
  'smithy',
  'smithy-web',
  'aws-sig',
  'wdl',
  'minio',
];
const status = (lib, col) =>
  compat.find((r) => r.lib === lib && rtOf(r)?.[0] === col)?.status ?? '?';
const compatVersions = [
  ...new Set(
    compat
      .map((r) =>
        r.runtime.replace(/ .*$/, '') === 'node' ||
        r.runtime.startsWith('bun') ||
        r.runtime.startsWith('deno')
          ? r.runtime
          : null,
      )
      .filter(Boolean),
  ),
];
out.runtimes = (t) => {
  const x0 = 230,
    cw = 120,
    rowH = 28,
    top = 84;
  let o = header(
    t,
    'Where each library runs',
    'Each library signs one S3 GET on each runtime; a tick means the signature equals botocore’s, a cross that it failed or did not load.',
  );
  rtCols.forEach(([, label], i) => {
    o += text(x0 + cw * i + cw / 2, top - 14, label, {
      size: 11,
      fill: t.muted,
      anchor: 'middle',
      weight: 600,
    });
  });
  cLibs.forEach((lib, r) => {
    const y = top + r * rowH,
      ours = lib.startsWith('sigflint');
    o += text(x0 - 10, y + 17, name(lib), {
      size: 12,
      fill: ours ? t.text : t.muted,
      anchor: 'end',
      weight: ours ? 700 : 400,
    });
    rtCols.forEach(([col], i) => {
      const ok = status(lib, col) === 'ok';
      o += `<rect x="${x0 + cw * i + 4}" y="${y}" width="${cw - 8}" height="${rowH - 6}" rx="4" fill="${ok ? t.pass : t.fail}" fill-opacity="0.22" stroke="${ok ? t.pass : t.fail}"/>`;
      const cx = x0 + cw * i + cw / 2,
        cy = y + (rowH - 6) / 2,
        mark = ok
          ? `M${cx - 5} ${cy}L${cx - 1.5} ${cy + 4}L${cx + 5.5} ${cy - 4}`
          : `M${cx - 4} ${cy - 4}L${cx + 4} ${cy + 4}M${cx + 4} ${cy - 4}L${cx - 4} ${cy + 4}`;
      o += `<path d="${mark}" fill="none" stroke="${ok ? t.pass : t.fail}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
    });
  });
  const h = top + cLibs.length * rowH + 14;
  return doc(
    t,
    x0 + cw * rtCols.length + 20,
    h,
    'Runtime support',
    cLibs
      .map(
        (l) =>
          `${name(l)}: ${rtCols.map(([c]) => (status(l, c) === 'ok' ? 'yes' : 'no')).join('/')}`,
      )
      .join('; '),
    o,
  );
};
tables.push(
  '### Runtimes\n\n| Library | ' +
    rtCols.map((c) => c[1]).join(' | ') +
    ' |\n|---|' +
    rtCols.map(() => ':-:').join('|') +
    '|\n' +
    cLibs
      .map(
        (l) =>
          `| ${l.startsWith('sigflint') ? `**${name(l)}**` : name(l)} | ${rtCols.map(([c]) => (status(l, c) === 'ok' ? '✓' : '✗')).join(' | ')} |`,
      )
      .join('\n') +
    `\n\nRuntimes: ${compatVersions.join(', ')}; Workers run in local workerd through wrangler ${'(see bench/frozen/versions.txt)'}. ✗ cells: ` +
    compat
      .filter((r) => r.status !== 'ok')
      .map(
        (r) =>
          `${r.lib} on ${rtOf(r)[1]}: ${r.status === 'error' ? r.detail : 'does not load (' + (/node:crypto|node:/.test(r.detail ?? '') ? 'needs a node: module' : 'bundle error') + ')'}`,
      )
      .join('; ') +
    '.',
);

// ---- other services and presigned URLs: correctness (bench/compat-more.mjs output) ---------------------------------------
const parsedMore = [];
for (const line of readFileSync(`${here}results/compat-more.txt`, 'utf8').split('\n')) {
  const head = line.match(/^(.*): (\d+) cases$/);
  if (head) {
    parsedMore.push({ title: head[1], total: +head[2], rows: {} });
    continue;
  }
  const row = line.match(/│ \d+\s+│ '([\w-]+)'\s+│ (\d+)\s+│ (\d+)\s+│ (\d+)\s+│/);
  if (row) parsedMore.at(-1).rows[row[1]] = { pass: +row[2], fail: +row[3], na: +row[4] };
}
const moreGroups = [
  ['any service, header signing', 'Header signing, 15 other services'],
  ['presigned URLs, any service but S3, payload signed', 'Presigned URLs, other services'],
  ['presigned URLs, S3', 'Presigned URLs, S3'],
].map(([key, title]) => {
  const g = parsedMore.find((p) => p.title === key);
  if (!g) throw new Error(`compat-more.txt has no section "${key}"`);
  // sigflint is not in that file: the same cases are in test/corpus-general.json and test/corpus-presign.json, which npm test passes in full
  return {
    title,
    total: g.total,
    rows: {
      sigflint: { pass: g.total, fail: 0, na: 0 },
      smithy: g.rows.smithy,
      aws4fetch: g.rows.aws4fetch,
      aws4: g.rows.aws4,
      'aws-sig': g.rows['aws-sig'],
      wdl: g.rows.wdl,
      minio: g.rows.minio,
    },
  };
});
out['compat-more'] = (t) => {
  const x0 = 190,
    plotW = 520,
    rowH = 28;
  const idsMore = Object.keys(moreGroups[0].rows);
  let o = header(
    t,
    'Same signature as botocore: other services and presigned URLs (higher is better)',
    'Each library is called through its normal public API on the same requests, key and clock.',
  );
  let y = 78;
  for (const g of moreGroups) {
    o += text(20, y, `${g.title}: ${fmtInt(g.total)} requests`, {
      size: 13,
      fill: t.text,
      weight: 600,
    });
    y += 14;
    for (const id of idsMore) {
      const r = g.rows[id],
        ours = id === 'sigflint';
      o += text(x0 - 10, y + 14, name(id), {
        size: 12,
        fill: ours ? t.text : t.muted,
        anchor: 'end',
        weight: ours ? 700 : 400,
      });
      let x = x0;
      for (const [n, col] of [
        [r.pass, t.pass],
        [r.fail, t.fail],
        [r.na, t.na],
      ]) {
        const w = (plotW * n) / g.total;
        if (n) o += `<rect x="${x}" y="${y}" width="${w}" height="19" fill="${col}"/>`;
        x += w;
      }
      o += text(x0 + plotW + 10, y + 14, `${((100 * r.pass) / g.total).toFixed(1)}%`, {
        size: 12,
        fill: t.text,
        weight: ours ? 700 : 400,
      });
      y += rowH;
    }
    y += 22;
  }
  for (const [dx, col, label] of [
    [0, t.pass, 'same signature'],
    [130, t.fail, 'different signature'],
    [280, t.na, 'cannot express the request, or does not offer it'],
  ]) {
    o +=
      `<rect x="${x0 + dx}" y="${y - 10}" width="12" height="12" fill="${col}"/>` +
      text(x0 + dx + 18, y, label, { size: 12, fill: t.muted });
  }
  y += 24;
  for (const line of [
    'aws4’s differences are headers it adds and signs itself (content-length, a default content-type), so its signature is valid for what it sends.',
    'sigflint is not in the comparison run: it signs all of the same cases in its own test suite (npm test). 127 presigned URLs without payload signing are left out.',
  ]) {
    o += text(20, y, line, { size: 11, fill: t.muted });
    y += 16;
  }
  return doc(
    t,
    780,
    y + 6,
    'Correctness against botocore: other services and presigned URLs',
    moreGroups
      .map(
        (g) =>
          `${g.title}: ` +
          idsMore.map((id) => `${name(id)} ${g.rows[id].pass}/${g.total}`).join(', '),
      )
      .join('. '),
    o,
  );
};

// ---- other services and presigned URLs: speed (results/speed-more-summary.json) -------------------------------------------
const more = read('speed-more-summary.json');
const moreWorkloads = [
  ['any-post-json', 'DynamoDB POST, JSON body'],
  ['any-token', 'API Gateway GET, session token'],
  ['any-query', 'SQS, query parameters'],
  ['presign-any', 'Presigned URL, API Gateway'],
  ['presign-s3', 'Presigned URL, S3'],
];
const moreLibs = ['aws4', 'aws4fetch', 'smithy', 'aws-sig', 'wdl', 'minio'];
const speedMore = (runtime) => (t) => {
  const x0 = 190,
    plotW = 470,
    rowH = 22,
    lo = 1,
    hi = 1000;
  const gx = (v) => x0 + (plotW * Math.log10(v / lo)) / Math.log10(hi / lo);
  const runtimeName = `${runtime === 'node' ? 'Node.js' : 'Bun'} ${more.versions[runtime].split(' ')[1]}`;
  const bands = moreWorkloads.map(
    ([w]) => more.more.find((r) => r.runtime === runtime && r.workload === w).bandPct,
  );
  let o = '',
    y = 82;
  const top = y;
  for (const [w, label] of moreWorkloads) {
    const r = more.more.find((x) => x.runtime === runtime && x.workload === w);
    const rows = [
      {
        label: 'sigflint',
        value: r.sigflintNs / 1000,
        ours: true,
        vl: `${(r.sigflintNs / 1000).toFixed(2)} µs`,
      },
    ];
    const wrong = [],
      cannot = [];
    for (const l of moreLibs) {
      const v = r.libraries[l];
      if (typeof v === 'string') (v === 'wrong-result' ? wrong : cannot).push(name(l));
      else
        rows.push({
          label: name(l),
          value: v.ns / 1000,
          vl: `${(v.ns / 1000).toFixed(v.ns < 10000 ? 2 : v.ns < 100000 ? 1 : 0)} µs  (${times(v.times)}×${Math.abs(v.times - 1) * 100 > r.bandPct ? '' : ', no clear change'})`,
        });
    }
    rows.sort((a, b) => a.value - b.value);
    o += text(20, y, label, { size: 13, fill: t.text, weight: 600 });
    y += 10;
    for (const row of rows) {
      const wBar = Math.max(2, gx(row.value) - x0);
      o += text(x0 - 10, y + 14, row.label, {
        size: 12,
        fill: row.ours ? t.text : t.muted,
        anchor: 'end',
        weight: row.ours ? 700 : 400,
      });
      o += `<rect x="${x0}" y="${y}" width="${wBar}" height="16" rx="3" fill="${row.ours ? t.ours : t.other}"/>`;
      o += text(x0 + wBar + 6, y + 13, row.vl, {
        size: 12,
        fill: t.text,
        weight: row.ours ? 700 : 400,
        halo: t.bg,
      });
      y += rowH;
    }
    const notes = [
      wrong.length ? `wrong signature: ${wrong.join(', ')}` : '',
      cannot.length ? `cannot sign or not offered: ${cannot.join(', ')}` : '',
    ].filter(Boolean);
    if (notes.length) {
      o += text(x0, y + 12, `Not timed — ${notes.join('; ')}`, { size: 11, fill: t.muted });
      y += 16;
    }
    y += 18;
  }
  let grid = '';
  for (let d = 0; d <= 3; d++)
    grid +=
      `<line x1="${gx(10 ** d)}" y1="${top - 12}" x2="${gx(10 ** d)}" y2="${y - 14}" stroke="${t.grid}"/>` +
      text(gx(10 ** d), y - 2, (10 ** d).toLocaleString('en-US'), {
        size: 11,
        fill: t.muted,
        anchor: 'middle',
      });
  y += 14;
  o += text(x0 + plotW / 2, y, 'microseconds per signature (log scale)', {
    size: 11,
    fill: t.muted,
    anchor: 'middle',
  });
  y += 20;
  const band = `${Math.round(Math.min(...bands))}% to ${Math.round(Math.max(...bands))}%`;
  o += text(
    20,
    y,
    `Median of ${moreRounds} fresh processes per library. (N×): that library’s time divided by sigflint’s. Reporting band on ${runtimeName}: ${band}.`,
    { size: 11, fill: t.muted },
  );
  y += 22;
  return doc(
    t,
    800,
    y,
    `Signing time, other services and presigned URLs, ${runtimeName}`,
    moreWorkloads
      .map(([w, label]) => {
        const r = more.more.find((x) => x.runtime === runtime && x.workload === w);
        return `${label}: sigflint ${(r.sigflintNs / 1000).toFixed(2)} µs`;
      })
      .join('; '),
    header(
      t,
      'Other services and presigned URLs: time to sign one request (lower is better)',
      `${runtimeName}, log scale. Only libraries that sign the request correctly are timed.`,
    ) +
      grid +
      o,
  );
};
out['speed-more-node'] = speedMore('node');
out['speed-more-bun'] = speedMore('bun');

// ---- size by signer (results/tiers.json) -------------------------------------------------------------------------------
const tiers = read('tiers.json');
out['size-tiers'] = (t) => {
  const x0 = 170,
    plotW = 440,
    rowH = 30,
    top = 78,
    maxKb = 5;
  const rows = Object.entries(tiers.node);
  const gx = (kb) => x0 + (plotW * kb) / maxKb;
  let o = header(
    t,
    'What you ship depends on what you import (lower is better)',
    'sigflint’s Node entry bundled with only the named signers, minified, then gzip.',
  );
  for (let kb = 0; kb <= maxKb; kb++)
    o +=
      `<line x1="${gx(kb)}" y1="${top - 8}" x2="${gx(kb)}" y2="${top + rows.length * rowH - 6}" stroke="${t.grid}"/>` +
      text(gx(kb), top + rows.length * rowH + 8, `${kb} kB`, {
        size: 11,
        fill: t.muted,
        anchor: 'middle',
      });
  rows.forEach(([label, s], i) => {
    const y = top + i * rowH;
    o += text(x0 - 10, y + 14, label, { size: 12, fill: t.text, anchor: 'end' });
    o += `<rect x="${x0}" y="${y}" width="${gx(s.gzipBytes / 1000) - x0}" height="20" rx="3" fill="${t.ours}"/>`;
    o += text(
      gx(s.gzipBytes / 1000) + 6,
      y + 14,
      `${(s.gzipBytes / 1000).toFixed(1)} kB gzip · ${(s.minifiedBytes / 1000).toFixed(1)} kB minified`,
      { size: 12, fill: t.text },
    );
  });
  const h = top + rows.length * rowH + 40;
  o += text(
    20,
    h - 12,
    'Bundled with bun build --minify; Node and Bun built-ins are not counted.',
    { size: 11, fill: t.muted },
  );
  return doc(
    t,
    780,
    h,
    'Size of sigflint by signer',
    rows.map(([label, s]) => `${label} ${s.gzipBytes} B gzip`).join(', '),
    o,
  );
};

for (const [id, draw] of Object.entries(out))
  for (const [mode, t] of Object.entries(THEMES))
    writeFileSync(`${docs}${id}-${mode}.svg`, draw(t));
writeFileSync(`${docs}tables.md`, tables.join('\n\n') + '\n');

// fill the marked blocks in the README: the chart (dark and light) and the table under it
const sections = [
  ['correctness', 'Bar chart: how many requests each library signs the same as botocore'],
  ['speed', 'Bar chart: time to sign one request on Node.js and Bun'],
  ['size', 'Bar chart: bundled, minified and gzipped size of each library'],
  ['runtimes', 'Grid: which runtimes each library runs on'],
];
let readme = readFileSync(`${here}../docs/benchmarks.md`, 'utf8');
sections.forEach(([key, alt], i) => {
  const picture = `<picture>\n  <source media="(prefers-color-scheme: dark)" srcset="${key}-dark.svg">\n  <img alt="${alt}" src="${key}-light.svg">\n</picture>`;
  const body = tables[i].replace(/^### [^\n]*\n\n/, '');
  readme = readme.replace(
    new RegExp(`(<!-- BEGIN ${key} -->)[\\s\\S]*?(<!-- END ${key} -->)`),
    (_, a, b) => `${a}\n${picture}\n\n${body}\n${b}`,
  );
});
// charts that stand alone above a table the README writes by hand: <!-- BEGIN pic-<key> --> ... <!-- END pic-<key> -->
for (const [key, alt] of [
  [
    'compat-more',
    'Bar chart: how many header and presigned-URL requests for other services each library signs the same as botocore',
  ],
  [
    'speed-more-node',
    'Bar chart: time to sign other-service and presigned-URL requests on Node.js',
  ],
  ['speed-more-bun', 'Bar chart: time to sign other-service and presigned-URL requests on Bun'],
  [
    'size-tiers',
    'Bar chart: gzipped and minified size of sigflint for each combination of signers',
  ],
]) {
  const picture = `<picture>\n  <source media="(prefers-color-scheme: dark)" srcset="${key}-dark.svg">\n  <img alt="${alt}" src="${key}-light.svg">\n</picture>`;
  const block = new RegExp(`(<!-- BEGIN pic-${key} -->)[\\s\\S]*?(<!-- END pic-${key} -->)`);
  if (!block.test(readme)) throw new Error(`docs/benchmarks.md has no pic-${key} block`);
  readme = readme.replace(block, (_, a, b) => `${a}\n${picture}\n${b}`);
}
writeFileSync(`${here}../docs/benchmarks.md`, readme);
console.log(
  'wrote',
  Object.keys(out)
    .map((id) => `${id}-{dark,light}.svg`)
    .join(', '),
  'and tables.md',
);
