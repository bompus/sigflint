// Analyses the raw rows of run-hash-encode.sh by the preset rules of protocol-hash-encode.md and writes summary.json and report.md next to them.
// Usage: <node|bun> analyze-hash-encode.mjs [results dir = results/hash-encode]
import { readFileSync, writeFileSync } from 'node:fs';

const here = new URL('.', import.meta.url).pathname;
const dir = process.argv[2] ?? `${here}results/hash-encode`;
/**
 * @typedef {object} Row
 * @property {string} kind
 * @property {string} rt
 * @property {string} runtime
 * @property {number} round
 * @property {string} case
 * @property {string} arm
 * @property {string} pass
 * @property {number} ns
 * @property {string} inputSha256
 * @property {string} outputSha256
 */
/** @type {Row[]} */
const rows = readFileSync(`${dir}/raw.jsonl`, 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((l) => JSON.parse(l));
const data = rows.filter((r) => r.kind === 'row');
const runtimes = [
  ...new Set(rows.filter((r) => r.kind === 'header').map((r) => `${r.rt}: ${r.runtime}`)),
];

/** @param {number[]} a */
const med = (a) => {
  const s = [...a].sort((x, y) => x - y);
  const h = s.length >> 1;
  return s.length % 2
    ? /** @type {number} */ (s[h])
    : (/** @type {number} */ (s[h - 1]) + /** @type {number} */ (s[h])) / 2;
};
/** @param {number} x @param {number} [d] */
const f = (x, d = 1) => x.toFixed(d);
/** @param {number[]} a @param {number} [d] */
const range = (a, d = 1) => `${f(med(a), d)} (${f(Math.min(...a), d)}-${f(Math.max(...a), d)})`;

/** @typedef {{ vals: number[], spreads: number[] }} Series values per round (mean of the A and B passes) and the relative A/A spread per round */
/** @type {Map<string, { A: Map<number, number>, B: Map<number, number> }>} */
const raw = new Map();
for (const r of data) {
  const k = `${r.rt}|${r.case}|${r.arm}`;
  const e = raw.get(k) ?? { A: new Map(), B: new Map() };
  e[r.pass === 'A' ? 'A' : 'B'].set(r.round, r.ns);
  raw.set(k, e);
}
const roundsOf = [...new Set(data.map((r) => r.round))].sort((a, b) => a - b);
/**
 * @param {string} rt
 * @param {string} c
 * @param {string} arm
 * @returns {Series | undefined}
 */
function series(rt, c, arm) {
  const e = raw.get(`${rt}|${c}|${arm}`);
  if (!e) {
    return undefined;
  }
  /** @type {number[]} */
  const vals = [];
  /** @type {number[]} */
  const spreads = [];
  for (const r of roundsOf) {
    const a = e.A.get(r);
    const b = e.B.get(r);
    if (a === undefined || b === undefined) {
      throw new Error(`missing pass for ${rt} ${c} ${arm} round ${r}`);
    }
    const m = (a + b) / 2;
    vals.push(m);
    spreads.push(Math.abs(a - b) / m);
  }
  return { vals, spreads };
}

const FLOOR_REL = 0.03;
const FLOOR_ABS_NS = 2;
/**
 * The preset rule: base against other. The band is max(3%, 2 x the largest A/A spread of either arm in any round) of the base median.
 * @param {Series} base
 * @param {Series} other
 */
function compare(base, other) {
  const mb = med(base.vals);
  const mo = med(other.vals);
  const noise = Math.max(...base.spreads, ...other.spreads);
  const band = Math.max(FLOOR_REL, 2 * noise);
  const diff = mo - mb;
  const disjoint =
    Math.max(...base.vals) < Math.min(...other.vals) ||
    Math.max(...other.vals) < Math.min(...base.vals);
  const signs = base.vals.map((v, i) => Math.sign(/** @type {number} */ (other.vals[i]) - v));
  const sameSign = signs.every((s) => s === signs[0]);
  const beyond = Math.abs(diff) > Math.max(band * mb, FLOOR_ABS_NS);
  const klass = !beyond ? 'no clear change' : disjoint && sameSign ? 'clear' : 'unsettled';
  return { mb, mo, diff, rel: diff / mb, band, noise, klass, lower: diff < 0 ? 'other' : 'base' };
}
/** @param {ReturnType<typeof compare>} c @param {string} baseName @param {string} otherName */
const verdict = (c, baseName, otherName) =>
  c.klass === 'clear'
    ? `${c.lower === 'other' ? otherName : baseName} faster, clear`
    : c.klass === 'unsettled'
      ? 'unsettled'
      : 'no clear change';
/** @param {string} rt @param {string} c @param {string} arm */
const need = (rt, c, arm) => {
  const s = series(rt, c, arm);
  if (!s) {
    throw new Error(`no series ${rt} ${c} ${arm}`);
  }
  return s;
};

const out = [];
/** @type {Record<string, unknown>} */
const summary = { rounds: roundsOf, runtimes };
const unsettled = [];
const hashCases = [...new Set(data.filter((r) => r.case.startsWith('hash-')).map((r) => r.case))];
const encodeCases = [
  ...new Set(data.filter((r) => r.case.startsWith('encode-')).map((r) => r.case)),
];
const presignCases = [
  ...new Set(data.filter((r) => r.case.startsWith('presign-')).map((r) => r.case)),
];

// identity of inputs and outputs, from every row, across runtimes
/** @type {Map<string, Set<string>>} */
const ids = new Map();
for (const r of data) {
  const k = `${r.case}|${r.arm === 'bun-sha256' ? 'crypto-hash' : r.arm}`;
  const s = ids.get(k) ?? new Set();
  s.add(`${r.inputSha256}|${r.outputSha256}`);
  ids.set(k, s);
}
const mismatched = [...ids].filter(([, s]) => s.size > 1).map(([k]) => k);
// a hash case's two arms must give the same output as well
for (const c of hashCases) {
  const outs = new Set(data.filter((r) => r.case === c).map((r) => r.outputSha256));
  if (outs.size > 1) {
    mismatched.push(`${c} (arms differ)`);
  }
}
summary.identityMismatches = mismatched;

out.push(
  `# Hash and encode measurements`,
  '',
  `Rounds counted: ${roundsOf.length} (${roundsOf.join(', ')}). Runtimes: ${runtimes.join('; ')}.`,
  `Every input and output digest agrees across the rows and runtimes of a case: ${mismatched.length === 0 ? 'yes' : `NO: ${mismatched.join(', ')}`}.`,
  `Round value = mean of the A and B passes of an arm in one process. Band = max(3%, 2 x the largest relative A/A spread of either arm in any round); a difference is clear only when the medians differ by more than the band (and 2 ns), the ranges over the rounds are disjoint and the sign is the same in every round. Cells are median (min-max over rounds) in ns per call.`,
  '',
  '## 1. Which SHA-256 is faster on Bun',
  '',
  'Bun build: `Bun.SHA256.hash(data, "hex")`. Node build: `crypto.hash("sha256", data, "hex")`, which Bun also provides.',
  '',
  '| Input | Bun: crypto.hash | Bun: Bun.SHA256.hash | Benefit of Bun.SHA256.hash | Result | Node: crypto.hash (reference) |',
  '|---|--:|--:|--:|---|--:|',
);
/** @type {Record<string, unknown>} */
const hashSummary = {};
for (const c of hashCases) {
  const base = need('bun', c, 'crypto-hash');
  const other = need('bun', c, 'bun-sha256');
  const cmp = compare(base, other);
  const nodeS = need('node', c, 'crypto-hash');
  if (cmp.klass === 'unsettled') {
    unsettled.push(`bun ${c}: crypto.hash against Bun.SHA256.hash`);
  }
  const benefit = `${f(-cmp.rel * 100)}% less time (${f(cmp.mb / cmp.mo, 2)}x)`;
  hashSummary[c] = { bunCryptoHash: med(base.vals), bunSha256: med(other.vals), ...cmp };
  out.push(
    `| ${c.replace('hash-', '')} | ${range(base.vals)} | ${range(other.vals)} | ${cmp.klass === 'no clear change' ? 'no clear change' : benefit} | ${verdict(cmp, 'crypto.hash', 'Bun.SHA256.hash')} (band ${f(cmp.band * 100)}%) | ${range(nodeS.vals)} |`,
  );
}
summary.hash = hashSummary;
out.push(
  '',
  'Across runtimes (reference): Node `crypto.hash` against each Bun call.',
  '',
  '| Input | Node vs Bun crypto.hash | Node vs Bun.SHA256.hash |',
  '|---|---|---|',
);
for (const c of hashCases) {
  const n = need('node', c, 'crypto-hash');
  const a = compare(n, need('bun', c, 'crypto-hash'));
  const b = compare(n, need('bun', c, 'bun-sha256'));
  out.push(
    `| ${c.replace('hash-', '')} | ${verdict(a, 'Node', 'Bun')} (${a.rel >= 0 ? '+' : ''}${f(a.rel * 100)}%) | ${verdict(b, 'Node', 'Bun')} (${b.rel >= 0 ? '+' : ''}${f(b.rel * 100)}%) |`,
  );
}

out.push(
  '',
  '## 2. encodeURIComponent in the presigner',
  '',
  "`encodeQueryPart` is the exported function the presigner calls: `encodeURIComponent` plus a replace of `!'()*`. The second column is `encodeURIComponent` alone on the same string.",
  '',
  '| String | Runtime | encodeURIComponent | encodeQueryPart | Replace step |',
  '|---|---|--:|--:|--:|',
);
for (const c of encodeCases) {
  for (const rt of ['node', 'bun']) {
    const a = need(rt, c, 'encodeURIComponent');
    const b = need(rt, c, 'encodeQueryPart');
    out.push(
      `| ${c.replace('encode-', '')} | ${rt} | ${range(a.vals)} | ${range(b.vals)} | ${f(med(b.vals) - med(a.vals))} |`,
    );
  }
}
out.push(
  '',
  'Node against Bun on the same call:',
  '',
  '| String | encodeURIComponent | encodeQueryPart |',
  '|---|---|---|',
);
for (const c of encodeCases) {
  const a = compare(need('node', c, 'encodeURIComponent'), need('bun', c, 'encodeURIComponent'));
  const b = compare(need('node', c, 'encodeQueryPart'), need('bun', c, 'encodeQueryPart'));
  out.push(
    `| ${c.replace('encode-', '')} | ${verdict(a, 'Node', 'Bun')} (${a.rel >= 0 ? '+' : ''}${f(a.rel * 100)}%) | ${verdict(b, 'Node', 'Bun')} (${b.rel >= 0 ? '+' : ''}${f(b.rel * 100)}%) |`,
  );
}

// the encoders one presign calls: the credential string, the signed-headers string and, with a session token, the token
/** @type {Record<string, string[]>} */
const parts = {
  'presign-any': ['encode-credential-execute-api', 'encode-signed-headers'],
  'presign-s3': ['encode-credential-s3', 'encode-signed-headers'],
  'presign-s3-token': ['encode-credential-s3', 'encode-signed-headers', 'encode-token-12'],
};
out.push(
  '',
  '## 3. Share of the presign call spent encoding',
  '',
  'Share = the isolated time of the encoder calls one presign makes (credential, signed headers, and the token when the request has one), divided by the presign time measured in the same process and round. It is an estimate from separate timings, not a measurement inside the presigner.',
  '',
  '| Workload | Runtime | presign | encodeQueryPart calls | Share, encodeQueryPart | Share, encodeURIComponent alone |',
  '|---|---|--:|--:|--:|--:|',
);
/** @type {Record<string, unknown>} */
const presignSummary = {};
for (const c of presignCases) {
  for (const rt of ['node', 'bun']) {
    const p = need(rt, c, 'presign');
    const names = /** @type {string[]} */ (parts[c]);
    const qp = roundsOf.map((_, i) =>
      names.reduce((t, n) => t + /** @type {number} */ (need(rt, n, 'encodeQueryPart').vals[i]), 0),
    );
    const euc = roundsOf.map((_, i) =>
      names.reduce(
        (t, n) => t + /** @type {number} */ (need(rt, n, 'encodeURIComponent').vals[i]),
        0,
      ),
    );
    const shareQp = qp.map((v, i) => (v / /** @type {number} */ (p.vals[i])) * 100);
    const shareEuc = euc.map((v, i) => (v / /** @type {number} */ (p.vals[i])) * 100);
    presignSummary[`${c}|${rt}`] = {
      presignNs: med(p.vals),
      encodeQueryPartNs: med(qp),
      shareQueryPartPct: med(shareQp),
      shareEncodeURIComponentPct: med(shareEuc),
    };
    out.push(
      `| ${c.replace('presign-', '')} | ${rt} | ${range(p.vals, 0)} | ${range(qp)} | ${range(shareQp)}% | ${range(shareEuc)}% |`,
    );
  }
}
summary.presign = presignSummary;
out.push(
  '',
  'Node against Bun on the presign call, and what the encoders contribute to the difference:',
  '',
  '| Workload | Presign, Node | Presign, Bun | Result | Encoder time, Bun minus Node |',
  '|---|--:|--:|---|--:|',
);
for (const c of presignCases) {
  const n = need('node', c, 'presign');
  const b = need('bun', c, 'presign');
  const cmp = compare(n, b);
  const names = /** @type {string[]} */ (parts[c]);
  const qpMed = (/** @type {string} */ rt) =>
    names.reduce((t, x) => t + med(need(rt, x, 'encodeQueryPart').vals), 0);
  const encDiff = qpMed('bun') - qpMed('node');
  const gap =
    cmp.klass === 'clear' && cmp.lower === 'base'
      ? `Bun slower by ${f(cmp.diff)} ns; the encoders account for ${f(encDiff)} ns (${f((encDiff / cmp.diff) * 100, 0)}%)`
      : `${f(encDiff)} ns (no Bun slowdown to attribute)`;
  if (cmp.klass === 'unsettled') {
    unsettled.push(`${c}: presign, Node against Bun`);
  }
  out.push(
    `| ${c.replace('presign-', '')} | ${range(n.vals, 0)} | ${range(b.vals, 0)} | ${verdict(cmp, 'Node', 'Bun')} (${cmp.rel >= 0 ? '+' : ''}${f(cmp.rel * 100)}%, band ${f(cmp.band * 100)}%) | ${gap} |`,
  );
}
summary.unsettled = unsettled;
out.push(
  '',
  unsettled.length === 0
    ? 'Unsettled comparisons: none.'
    : `Unsettled comparisons: ${unsettled.join('; ')}.`,
);
writeFileSync(`${dir}/summary.json`, `${JSON.stringify(summary, null, 2)}\n`);
writeFileSync(`${dir}/report.md`, `${out.join('\n')}\n`);
console.log(out.join('\n'));
