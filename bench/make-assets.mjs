// Draws the README charts as static SVG (a dark and a light file for each) and writes the Markdown tables, all from the
// files in results/. Usage: node make-assets.mjs  ->  ../docs/*.svg and ../docs/tables.md
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { compareLibraries, sortComparisonTables } from './comparison-order.mjs';
import {
  completeClientComparison,
  clientGroups,
  clientIds,
  clientCorrectnessRow,
} from './client-correctness-data.mjs';

const here = new URL('.', import.meta.url).pathname;
const docs = `${here}../docs/`;
mkdirSync(docs, { recursive: true });
/** @param {string} f */
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
/** @typedef {typeof THEMES.dark} Theme */
/** @typedef {{ size?: number, fill?: string, anchor?: string, weight?: number, halo?: string }} TextStyle */
/** @typedef {{ label: string, value: number, ours?: boolean, valueLabel: string }} BarRow */
/** @typedef {{ pass: number, fail: number, na: number }} Tally */
/** @param {unknown} s */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const FONT = `font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif"`;
/** @type {Record<string, string>} */
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
/** @param {string} id */
const name = (id) => NAMES[id] ?? id;
/** @param {number} n */
const fmtInt = (n) => Math.round(n).toLocaleString('en-US');
/**
 * @param {number} x
 * @param {number} y
 * @param {unknown} s
 * @param {TextStyle} [style]
 */
const text = (x, y, s, { size = 13, fill, anchor = 'start', weight = 400, halo } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" font-weight="${weight}"${halo ? ` stroke="${halo}" stroke-width="4" stroke-linejoin="round" paint-order="stroke"` : ''}>${esc(s)}</text>`;
/** @param {number} v */
const times = (v) => (v >= 10 ? v.toFixed(0) : v.toFixed(1));
// sub is one line or an array of lines
/**
 * @param {Theme} t
 * @param {string} title
 * @param {string | string[]} [sub]
 */
const header = (t, title, sub) =>
  text(20, 28, title, { size: 16, fill: t.text, weight: 600 }) +
  /** @type {string[]} */ ([])
    .concat(sub ?? [])
    .map((s, i) => text(20, 48 + 17 * i, s, { size: 12, fill: t.muted }))
    .join('');

/**
 * @param {Theme} t
 * @param {{ w: number, h: number, title: string, desc: string, body: string, note?: string }} parts
 */
function doc(t, { w, h, title, desc, body, note }) {
  if (note) {
    h += 28;
    body += text(20, h - 12, note, { size: 11, fill: t.muted });
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="t d" ${FONT}>
<title id="t">${esc(title)}</title><desc id="d">${esc(desc)}</desc>
<rect width="${w}" height="${h}" rx="8" fill="${t.bg}"/>
${body}
</svg>
`;
}

// Horizontal bars on a log axis (decades); rows: [{ label, value, ours, note }]. Returns { body, height }.
/**
 * @param {Theme} t
 * @param {BarRow[]} rows
 * @param {{ x0: number, plotW: number, top: number, lo: number, hi: number, unit: string }} axis
 */
function logBars(t, rows, { x0, plotW, top, lo, hi, unit }) {
  const rowH = 28,
    span = Math.log10(hi / lo);
  /** @param {number} v */
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

/** @type {Record<string, (t: Theme) => string>} */
const out = {}; // chart name -> (theme) => svg
/** @type {string[]} */
const tables = [];

// ---- correctness --------------------------------------------------------------------------------------------------
// Two groups: ordinary requests, and the edge cases (stray %, a raw + in the path, empty query names, headers some
// libraries never sign). Session-token cases are left out: only sigflint is run on them (316 of 316 pass).
const screen = read('screen-node.json');
const currentVersion = JSON.parse(readFileSync(`${here}../package.json`, 'utf8')).version;
if (screen.candidates.sigflint.version !== currentVersion) {
  throw new Error('Re-run the Node correctness screen for the current sigflint version');
}
const unmeasured = `Not measured: ${clientIds.join(', ')}.`;
/** @typedef {{ id: string, version: string } & Tally} ScreenRow */
/** @typedef {{ key: string, title: string, tags: string[], total: number, rows: ScreenRow[] }} Group */
const groups = /** @type {[Group, Group]} */ ([
  { key: 'ordinary', title: 'Serialized URL input: ordinary requests', tags: ['well-formed'] },
  {
    key: 'edge',
    title: 'Serialized URL input: edge cases',
    tags: ['malformed', 'plus-in-path', 'empty-query-name', 'unsigned-header'],
  },
]);
const ids = ['sigflint', 'aws4fetch', 'aws4', 'smithy', 'wdl', 'minio', 'aws-sig'];
for (const g of groups) {
  g.total = g.tags.reduce((n, tg) => n + screen.tagCounts[tg], 0);
  g.rows = ids.map((id) => {
    const c = screen.candidates[id];
    /** @param {string} k */
    const sum = (k) => g.tags.reduce((n, tg) => n + (c.byTag[tg]?.[k] ?? 0), 0);
    const pass = sum('pass'),
      fail = sum('fail') + sum('error');
    return { id, version: c.version, pass, fail, na: g.total - pass - fail };
  });
}
const order = ids.toSorted((a, b) => compareLibraries(name(a), name(b)));
out.correctness = (t) => {
  const x0 = 190,
    plotW = 520,
    rowH = 28;
  let o = header(
    t,
    'Same signature as botocore (higher is better)',
    'Compare rows within each input group. Different signatures are not necessarily rejected requests.',
  );
  let y = 74;
  for (const g of [...groups, ...clientGroups]) {
    o += text(20, y, `${g.title}: ${fmtInt(g.total)} requests`, {
      size: 13,
      fill: t.text,
      weight: 600,
    });
    y += 14;
    for (const id of g.key.startsWith('client-') ? g.rows.map((r) => r.id) : order) {
      const r = /** @type {ScreenRow} */ (g.rows.find((x) => x.id === id)),
        ours = id === 'sigflint';
      o += text(x0 - 10, y + 14, name(id), {
        size: 12,
        fill: ours ? t.text : t.muted,
        anchor: 'end',
        weight: ours ? 700 : 400,
      });
      let x = x0;
      for (const [n, col] of /** @type {[number, string][]} */ ([
        [r.pass, t.pass],
        [r.fail, t.fail],
        [r.na, t.na],
      ])) {
        const w = (plotW * n) / g.total;
        if (n) {
          o += `<rect x="${x}" y="${y}" width="${w}" height="19" fill="${col}"/>`;
        }
        x += w;
      }
      o += text(x0 + plotW + 10, y + 14, `${fmtInt(r.pass)}/${fmtInt(g.total - r.na)}`, {
        size: 12,
        fill: t.text,
        weight: ours ? 700 : 400,
      });
      y += rowH;
    }
    y += 22;
  }
  for (const [dx, col, label] of /** @type {[number, string, string][]} */ ([
    [0, t.pass, 'same signature'],
    [130, t.fail, 'different signature or error'],
    [350, t.na, 'unsupported'],
  ])) {
    o +=
      `<rect x="${x0 + dx}" y="${y - 10}" width="12" height="12" fill="${col}"/>` +
      text(x0 + dx + 18, y, label, { size: 12, fill: t.muted });
  }
  return doc(t, {
    w: 840,
    h: y + 20,
    title: 'Correctness against botocore',
    desc: [...groups, ...clientGroups]
      .map(
        (g) =>
          `${g.title}: ` +
          g.rows
            .map((r) => r.id)
            .map(
              (id) =>
                `${name(id)} ${/** @type {ScreenRow} */ (g.rows.find((r) => r.id === id)).pass}/${g.total}`,
            )
            .join(', '),
      )
      .join('. '),
    body: o,
  });
};
tables.push(
  '### Correctness\n\nMatches against botocore with the same key and clock. Compare libraries within an input method. Counts show matches / supported requests. The common decoded-key column does not apply to serialized-URL inputs. Versions identify the recorded runs.\n\n| Library | Input method | Version | Ordinary matches / supported | Unsupported ordinary | Edge matches / tested | Common decoded-key matches / 578 |\n|---|---|---|--:|--:|--:|--:|\n' +
    order
      .map((id) => {
        const ordinary = /** @type {ScreenRow} */ (groups[0].rows.find((r) => r.id === id));
        const edge = /** @type {ScreenRow} */ (groups[1].rows.find((r) => r.id === id));
        return `| ${id === 'sigflint' ? '**sigflint**' : name(id)} | Serialized URL | ${ordinary.version} | ${fmtInt(ordinary.pass)} / ${fmtInt(groups[0].total)} | ${ordinary.na} | ${fmtInt(edge.pass)} / ${fmtInt(groups[1].total)} | Not applicable |`;
      })
      .join('\n') +
    '\n' +
    clientGroups[0].rows.map((r) => clientCorrectnessRow(r, name, fmtInt)).join('\n'),
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
/** @type {Record<string, string>} */
const arm = {
  sigflint: 'sigflint-A',
  aws4fetch: 'aws4fetch',
  aws4: 'aws4',
  smithy: 'smithy',
  'aws-sig': 'aws-sig',
  wdl: 'wdl',
  minio: 'minio',
};
/** @type {[string, string][]} */
const workloads = [
  ['bench-download', 'GET, plain key'],
  ['bench-part-put', 'part upload (query, headers)'],
  ['bench-encode', 'GET, key and query to encode'],
  ['bench-body-1k', 'PUT, 1 KiB body'],
];
const runtimes = [
  ...new Set(Object.keys(speed.cells).map((k) => /** @type {string} */ (k.split('|')[0]))),
].sort((a, b) => (a.startsWith('node') ? -1 : 1) - (b.startsWith('node') ? -1 : 1));
/**
 * @param {string} rt
 * @param {string} w
 * @param {string} lib
 */
const cell = (rt, w, lib) => speed.cells[`${rt}|${w}`].arms[/** @type {string} */ (arm[lib])];
const libs = Object.keys(arm).sort((a, b) => compareLibraries(name(a), name(b)));
out.speed = (t) => {
  const panelW = 700,
    x0 = 190,
    plotW = 400;
  let o = header(t, 'Time to sign one request, plain GET (lower is better)', [
    `Median of ${speedRounds} separate processes per library and runtime; log scale. A plain GET, which every library here signs correctly.`,
    'Measured on the shipped build; each process checks its signature before timing.',
  ]);
  let y = 98;
  for (const rt of runtimes) {
    o += text(
      20,
      y,
      rt.replace(
        /^(\w+) /,
        (m, a) => /** @type {Record<string, string>} */ ({ node: 'Node.js', bun: 'Bun' })[a] + ' ',
      ),
      { size: 13, fill: t.text, weight: 600 },
    );
    const rows = libs
      .map((l) => ({ l, ns: cell(rt, 'bench-download', l)?.medianNs }))
      .filter((r) => r.ns)
      .sort((a, b) => compareLibraries(name(a.l), name(b.l)))
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
  return doc(t, {
    w: panelW + 60,
    h: y,
    title: 'Signing time per request',
    note: unmeasured,
    desc: libs
      .map(
        (l) =>
          `${name(l)} ${runtimes.map((rt) => ((cell(rt, 'bench-download', l)?.medianNs ?? NaN) / 1000).toFixed(1)).join('/')} µs`,
      )
      .join(', '),
    body: o,
  });
};
{
  /** @param {string} rt */
  const hdr = (rt) => `${rt.split(' ')[0] === 'node' ? 'Node' : 'Bun'} ${rt.split(' ')[1]}`;
  /**
   * @param {string} rt
   * @param {string} w
   * @param {string} lib
   */
  const cellText = (rt, w, lib) => {
    const s = cell(rt, w, lib);
    if (!s) {
      return 'Not measured';
    }
    if (s.status === 'wrong-result') {
      return 'wrong signature';
    }
    if (s.status === 'unsupported') {
      return 'cannot sign';
    }
    return `${(s.medianNs / 1000).toFixed(2)}`;
  };
  let md = `### Speed\n\nMicroseconds per signature, median of ${speedRounds} processes. “wrong signature” means the library’s result differed from botocore’s for that request, so it was not timed; a blank means the library does not offer that API.\n`;
  for (const rt of runtimes) {
    md += `\n**${hdr(rt)}**\n\n| Library | ${workloads.map((w) => w[1]).join(' | ')} |\n|---|${workloads.map(() => '--:').join('|')}|\n`;
    md +=
      [...libs, ...clientIds]
        .sort((a, b) => compareLibraries(name(a), name(b)))
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
/** @type {[string, string][]} */
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
    .sort((a, b) => compareLibraries(name(a.lib), name(b.lib)))
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
  return doc(t, {
    w: 760,
    h: g.height,
    title: 'Size of the code you ship',
    note: unmeasured,
    desc: sizeRows.map(([id, lib]) => `${lib} ${sizes[id].gzipBytes} B`).join(', '),
    body:
      header(
        t,
        'Size once bundled (lower is better)',
        'The signer and everything it imports, minified, then gzip. Node and Bun built-ins are not counted.',
      ) + g.body,
  });
};
tables.push(
  '### Size\n\n| Library | Source, all signers (bytes) | Bundled + minified (bytes) | + gzip | + brotli | Direct dependencies | Installed on disk (bytes) |\n|---|--:|--:|--:|--:|--:|--:|\n' +
    sizeRows
      .map(([id, lib]) => {
        const s = sizes[id];
        return `| ${lib === 'sigflint' ? '**sigflint**' : name(lib)} | ${s.source ? fmtInt(s.source.bytes) : ''} | ${fmtInt(s.minifiedBytes)} | ${fmtInt(s.gzipBytes)} | ${fmtInt(s.brotliBytes)} | ${s.directDependencies} | ${s.unpackedBytes ? fmtInt(s.unpackedBytes) : ''} |`;
      })
      .join('\n') +
    '\n' +
    clientIds
      .map((id) => `| ${name(id)} | ${Array(6).fill('Not measured').join(' | ')} |`)
      .join('\n'),
);

// ---- runtimes -----------------------------------------------------------------------------------------------------
const compat = readFileSync(`${here}results/compat.jsonl`, 'utf8')
  .trim()
  .split('\n')
  .map((l) => JSON.parse(l));
/** @type {[string, string][]} */
const rtCols = [
  ['node', 'Node.js'],
  ['bun', 'Bun'],
  ['deno', 'Deno'],
  ['workerd (nodejs_compat)', 'Workers + nodejs_compat'],
  ['workerd (no-flag)', 'Workers, no flag'],
];
/** @param {{ runtime: string }} r */
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
  ...clientIds,
].sort((a, b) => compareLibraries(name(a), name(b)));
/**
 * @param {string} lib
 * @param {string} col
 */
const status = (lib, col) => {
  const result = compat.find((r) => r.lib === lib && rtOf(r)?.[0] === col);
  if (!result) {
    throw new Error(`Missing runtime probe: ${lib} / ${col}`);
  }
  return result.status;
};
const compatEnvironment = read('compat-environment.json');
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
    'One S3 GET per runtime: tick = reference signature; cross = failed or did not load. Signing paths, not full client tests.',
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
  return doc(t, {
    w: x0 + cw * rtCols.length + 20,
    h: h,
    title: 'Runtime support',
    desc: cLibs
      .map(
        (l) =>
          `${name(l)}: ${rtCols.map(([c]) => (status(l, c) === 'ok' ? 'yes' : 'no')).join('/')}`,
      )
      .join('; '),
    body: o,
  });
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
    `\n\nRuntimes: ${compatVersions.join(', ')}; Workers run in local workerd through wrangler ${compatEnvironment.wrangler}, workerd ${compatEnvironment.workerd} (run ${compatEnvironment.date}; see bench/results/compat-environment.json). ✗ cells: ` +
    compat
      .filter((r) => r.status !== 'ok')
      .map(
        (r) =>
          `${r.lib} on ${/** @type {[string, string]} */ (rtOf(r))[1]}: ${r.status === 'error' ? r.detail : 'does not load (' + (/node:crypto|node:/.test(r.detail ?? '') ? 'needs a node: module' : 'bundle error') + ')'}`,
      )
      .join('; ') +
    '.',
);

// ---- other services and presigned URLs: correctness (bench/compat-more.mjs output) ---------------------------------------
/** @type {{ title: string, total: number, rows: Record<string, Tally> }[]} */
const parsedMore = [];
for (const line of readFileSync(`${here}results/compat-more.txt`, 'utf8').split('\n')) {
  const head = line.match(/^(.*): (\d+) cases$/);
  if (head) {
    parsedMore.push({
      title: /** @type {string} */ (head[1]),
      total: +(/** @type {string} */ (head[2])),
      rows: {},
    });
    continue;
  }
  const row = line.match(/│ \d+\s+│ '([\w-]+)'\s+│ (\d+)\s+│ (\d+)\s+│ (\d+)\s+│/);
  if (row) {
    /** @type {(typeof parsedMore)[number]} */ (parsedMore.at(-1)).rows[
      /** @type {string} */ (row[1])
    ] = {
      pass: +(/** @type {string} */ (row[2])),
      fail: +(/** @type {string} */ (row[3])),
      na: +(/** @type {string} */ (row[4])),
    };
  }
}
const moreGroups = [
  ['any service, header signing', 'Header signing, 15 other services'],
  ['presigned URLs, any service but S3, payload signed', 'Presigned URLs, other services'],
  ['presigned URLs, any service but S3, caller opts', 'Presigned URLs, other services, opt-out'],
  ['presigned URLs, S3', 'Presigned URLs, S3'],
].map(([key, title]) => {
  const g = parsedMore.find((p) => p.title.startsWith(/** @type {string} */ (key)));
  if (!g) {
    throw new Error(`compat-more.txt has no section "${key}"`);
  }
  // sigflint is not in that file: the same cases are in test/corpus-general.json and test/corpus-presign.json, which npm test passes in full
  return {
    title,
    total: g.total,
    rows: /** @type {Record<string, Tally>} */ ({
      sigflint: { pass: g.total, fail: 0, na: 0 },
      smithy: g.rows.smithy,
      aws4fetch: g.rows.aws4fetch,
      aws4: g.rows.aws4,
      'aws-sig': g.rows['aws-sig'],
      wdl: g.rows.wdl,
      minio: g.rows.minio,
    }),
  };
});
const moreTable = completeClientComparison(moreGroups, name, fmtInt);
tables.push('### Other services and presigned URLs\n\n' + moreTable);
out['compat-more'] = (t) => {
  const x0 = 190,
    plotW = 520,
    rowH = 28;
  const idsMore = Object.keys(/** @type {(typeof moreGroups)[number]} */ (moreGroups[0]).rows).sort(
    (a, b) => compareLibraries(name(a), name(b)),
  );
  let o = header(
    t,
    'Same signature as botocore: other services and presigned URLs (higher is better)',
    'S3 clients use decoded keys; tiny-oss other-service headers use a caller-prepared canonical path.',
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
      const r = /** @type {Tally} */ (g.rows[id]),
        ours = id === 'sigflint';
      o += text(x0 - 10, y + 14, name(id), {
        size: 12,
        fill: ours ? t.text : t.muted,
        anchor: 'end',
        weight: ours ? 700 : 400,
      });
      let x = x0;
      for (const [n, col] of /** @type {[number, string][]} */ ([
        [r.pass, t.pass],
        [r.fail, t.fail],
        [r.na, t.na],
      ])) {
        const w = (plotW * n) / g.total;
        if (n) {
          o += `<rect x="${x}" y="${y}" width="${w}" height="19" fill="${col}"/>`;
        }
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
  for (const [dx, col, label] of /** @type {[number, string, string][]} */ ([
    [0, t.pass, 'same signature'],
    [130, t.fail, 'different signature'],
    [280, t.na, 'cannot express the request, or does not offer it'],
  ])) {
    o +=
      `<rect x="${x0 + dx}" y="${y - 10}" width="12" height="12" fill="${col}"/>` +
      text(x0 + dx + 18, y, label, { size: 12, fill: t.muted });
  }
  y += 24;
  for (const line of [
    'aws4’s differences are headers it adds and signs itself (content-length, a default content-type), so its signature is valid for what it sends.',
    'sigflint is not in the comparison run: it signs all of the same cases in its own test suite (npm test).',
    'Payload opt-out outside S3: aws4fetch signs the opt-out header too; aws-sig has no opt-out, so it is counted as unsupported.',
  ]) {
    o += text(20, y, line, { size: 11, fill: t.muted });
    y += 16;
  }
  return doc(t, {
    w: 780,
    h: y + 6,
    title: 'Correctness against botocore: other services and presigned URLs',
    note: 'S3 clients use decoded keys; gray cells reflect their S3 APIs. A different signature does not establish rejection.',
    desc: moreGroups
      .map(
        (g) =>
          `${g.title}: ` +
          idsMore
            .map((id) => `${name(id)} ${/** @type {Tally} */ (g.rows[id]).pass}/${g.total}`)
            .join(', '),
      )
      .join('. '),
    body: o,
  });
};

// ---- other services and presigned URLs: speed (results/speed-more-summary.json) -------------------------------------------
/** @typedef {{ ns: number, times: number }} MoreTiming */
/** @typedef {{ runtime: string, workload: string, sigflintNs: number, bandPct: number, libraries: Record<string, MoreTiming | string> }} MoreRow */
/** @type {{ versions: Record<string, string>, more: MoreRow[] }} */
const more = read('speed-more-summary.json');
/** @type {[string, string][]} */
const moreWorkloads = [
  ['any-post-json', 'DynamoDB POST, JSON body'],
  ['any-token', 'API Gateway GET, session token'],
  ['any-query', 'SQS, query parameters'],
  ['presign-any', 'Presigned URL, API Gateway'],
  ['presign-s3', 'Presigned URL, S3'],
];
const moreLibs = ['aws4', 'aws4fetch', 'smithy', 'aws-sig', 'wdl', 'minio'];
/**
 * The summary row of one runtime and workload.
 * @param {string} runtime
 * @param {string} w
 */
const findMore = (runtime, w) =>
  /** @type {MoreRow} */ (more.more.find((x) => x.runtime === runtime && x.workload === w));
/**
 * The timed bars of one workload (sigflint first, then sorted by time) and the libraries that were not timed.
 * @param {MoreRow} r
 */
const moreRows = (r) => {
  /** @type {{ label: string, value: number, ours?: boolean, vl: string }[]} */
  const rows = [
    {
      label: 'sigflint',
      value: r.sigflintNs / 1000,
      ours: true,
      vl: `${(r.sigflintNs / 1000).toFixed(2)} µs`,
    },
  ];
  /** @type {string[]} */
  const wrong = [],
    /** @type {string[]} */
    cannot = [];
  for (const l of moreLibs) {
    const v = /** @type {MoreTiming | string} */ (r.libraries[l]);
    if (typeof v === 'string') {
      (v === 'wrong-result' ? wrong : cannot).push(name(l));
    } else {
      rows.push({
        label: name(l),
        value: v.ns / 1000,
        vl: `${(v.ns / 1000).toFixed(v.ns < 10000 ? 2 : v.ns < 100000 ? 1 : 0)} µs  (${times(v.times)}×${Math.abs(v.times - 1) * 100 > r.bandPct ? '' : ', no clear change'})`,
      });
    }
  }
  rows.sort((a, b) => compareLibraries(a.label, b.label));
  return { rows, wrong, cannot };
};
/** @param {string} runtime */
const speedMore = (runtime) => (/** @type {Theme} */ t) => {
  const x0 = 190,
    plotW = 470,
    rowH = 22,
    lo = 1,
    hi = 1000;
  /** @param {number} v */
  const gx = (v) => x0 + (plotW * Math.log10(v / lo)) / Math.log10(hi / lo);
  const runtimeName = `${runtime === 'node' ? 'Node.js' : 'Bun'} ${/** @type {string} */ (more.versions[runtime]).split(' ')[1]}`;
  const bands = moreWorkloads.map(([w]) => findMore(runtime, w).bandPct);
  let o = '',
    y = 82;
  const top = y;
  for (const [w, label] of moreWorkloads) {
    const { rows, wrong, cannot } = moreRows(findMore(runtime, w));
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
  for (let d = 0; d <= 3; d++) {
    grid +=
      `<line x1="${gx(10 ** d)}" y1="${top - 12}" x2="${gx(10 ** d)}" y2="${y - 14}" stroke="${t.grid}"/>` +
      text(gx(10 ** d), y - 2, (10 ** d).toLocaleString('en-US'), {
        size: 11,
        fill: t.muted,
        anchor: 'middle',
      });
  }
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
  return doc(t, {
    w: 800,
    h: y,
    title: `Signing time, other services and presigned URLs, ${runtimeName}`,
    note: unmeasured,
    desc: moreWorkloads
      .map(([w, label]) => {
        const r = findMore(runtime, w);
        return `${label}: sigflint ${(r.sigflintNs / 1000).toFixed(2)} µs`;
      })
      .join('; '),
    body:
      header(
        t,
        'Other services and presigned URLs: time to sign one request (lower is better)',
        `${runtimeName}, log scale. Only libraries that sign the request correctly are timed.`,
      ) +
      grid +
      o,
  });
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
  /** @param {number} kb */
  const gx = (kb) => x0 + (plotW * kb) / maxKb;
  let o = header(
    t,
    'What you ship depends on what you import (lower is better)',
    'sigflint’s Node entry bundled with only the named signers, minified, then gzip.',
  );
  for (let kb = 0; kb <= maxKb; kb++) {
    o +=
      `<line x1="${gx(kb)}" y1="${top - 8}" x2="${gx(kb)}" y2="${top + rows.length * rowH - 6}" stroke="${t.grid}"/>` +
      text(gx(kb), top + rows.length * rowH + 8, `${kb} kB`, {
        size: 11,
        fill: t.muted,
        anchor: 'middle',
      });
  }
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
  return doc(t, {
    w: 780,
    h: h,
    title: 'Size of sigflint by signer',
    desc: rows.map(([label, s]) => `${label} ${s.gzipBytes} B gzip`).join(', '),
    body: o,
  });
};

for (const [id, draw] of Object.entries(out)) {
  for (const [mode, t] of Object.entries(THEMES)) {
    writeFileSync(`${docs}${id}-${mode}.svg`, draw(t));
  }
}
writeFileSync(`${docs}tables.md`, sortComparisonTables(tables.join('\n\n') + '\n'));

// fill the marked blocks in the README: the chart (dark and light) and the table under it
const sections = [
  ['correctness', 'Bar chart: how many requests each library signs the same as botocore'],
  ['speed', 'Bar chart: time to sign one request on Node.js and Bun'],
  ['size', 'Bar chart: bundled, minified and gzipped size of each library'],
  ['runtimes', 'Grid: which runtimes each library runs on'],
];
let readme = readFileSync(`${here}../docs/benchmarks.md`, 'utf8');
readme = readme.replace(
  /(<!-- BEGIN compat-table -->)[\s\S]*?(<!-- END compat-table -->)/,
  (_, a, b) => `${a}\n${moreTable}\n${b}`,
);
sections.forEach(([key, alt], i) => {
  const picture = `<picture>\n  <source media="(prefers-color-scheme: dark)" srcset="${key}-dark.svg">\n  <img alt="${alt}" src="${key}-light.svg">\n</picture>`;
  const body = /** @type {string} */ (tables[i]).replace(/^### [^\n]*\n\n/, '');
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
  if (!block.test(readme)) {
    throw new Error(`docs/benchmarks.md has no pic-${key} block`);
  }
  readme = readme.replace(block, (_, a, b) => `${a}\n${picture}\n${b}`);
}
writeFileSync(`${here}../docs/benchmarks.md`, sortComparisonTables(readme));
console.log(
  'wrote',
  Object.keys(out)
    .map((id) => `${id}-{dark,light}.svg`)
    .join(', '),
  'and tables.md',
);
