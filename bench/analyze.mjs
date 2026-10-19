// Summarizes results/speed-raw.jsonl against the preset criterion in protocol.md -> results/speed-summary.json + printed table.
import { readFileSync, writeFileSync } from 'node:fs';
const rows = readFileSync(new URL('results/speed-raw.jsonl', import.meta.url), 'utf8')
  .trim()
  .split('\n')
  .map((l) => JSON.parse(l));
const rejected = rows.filter((r) => r.status === 'rejected-load' || r.status === 'error');
/** @param {number[]} a */
const med = (a) => {
  const s = [...a].sort((x, y) => x - y);
  return /** @type {number} */ (s[Math.floor(s.length / 2)]);
};
const workloads = ['bench-download', 'bench-part-put', 'bench-encode', 'bench-body-1k'];
const runtimes = [...new Set(rows.map((r) => r.runtime).filter(Boolean))];
const arms = [...new Set(rows.map((r) => r.arm))];
/**
 * An arm of one (runtime, workload): an arm that ran has the timing fields, any other only its status.
 * @typedef {{ arms: Record<string, any>, bandPct: number, aaGapPct: number | null }} Cell
 */
/** @type {{ rejected: number, rejectedRows: any[], cells: Record<string, Cell> }} */
const out = { rejected: rejected.length, rejectedRows: rejected, cells: {} };
/**
 * @param {string} rt
 * @param {string} w
 */
const cellOf = (rt, w) => {
  const cell = /** @type {Cell} */ ({ arms: {} });
  for (const arm of arms) {
    const rs = rows.filter((r) => r.arm === arm && r.runtime === rt && r.workload === w);
    if (!rs.length) {
      continue;
    }
    const ok = rs.filter((r) => r.status === 'ok');
    if (!ok.length) {
      cell.arms[arm] = { status: rs[0].status };
      continue;
    }
    const v = ok.map((r) => r.nsPerOp);
    cell.arms[arm] = {
      status: 'ok',
      n: ok.length,
      medianNs: med(v),
      minNs: Math.min(...v),
      maxNs: Math.max(...v),
      rangePct: (100 * (Math.max(...v) - Math.min(...v))) / med(v),
      values: v,
    };
  }
  const A = cell.arms['sigflint-A'],
    B = cell.arms['sigflint-B'];
  cell.bandPct = Math.max(3, 2 * Math.max(A?.rangePct ?? 0, B?.rangePct ?? 0));
  cell.aaGapPct =
    A && B ? (100 * Math.abs(A.medianNs - B.medianNs)) / Math.min(A.medianNs, B.medianNs) : null;
  const ref = cell.arms['sigflint-A'];
  for (const [arm, s] of Object.entries(cell.arms)) {
    if (s.status !== 'ok') {
      continue;
    }
    for (const [name, base] of /** @type {[string, any][]} */ ([['vsSigflint', ref]])) {
      if (base?.status !== 'ok' || arm === 'sigflint-A') {
        continue;
      }
      const overlap = !(s.maxNs < base.minNs || s.minNs > base.maxNs);
      s[name] = {
        timesFasterThanBaseline: base.medianNs / s.medianNs,
        clear:
          Math.abs((100 * (s.medianNs - base.medianNs)) / base.medianNs) > cell.bandPct && !overlap,
      };
    }
  }
  return cell;
};
for (const rt of runtimes) {
  for (const w of workloads) {
    out.cells[`${rt}|${w}`] = cellOf(rt, w);
  }
}
writeFileSync(new URL('results/speed-summary.json', import.meta.url), JSON.stringify(out, null, 1));
for (const [k, c] of Object.entries(out.cells)) {
  console.log(`\n== ${k}   band ${c.bandPct.toFixed(1)}%   A/A gap ${c.aaGapPct?.toFixed(1)}%`);
  for (const [arm, s] of Object.entries(c.arms)) {
    console.log(
      `  ${arm.padEnd(12)} ${s.status === 'ok' ? `${(s.medianNs / 1000).toFixed(2).padStart(9)} us/op  range ${s.rangePct.toFixed(1)}%  n=${s.n}   this arm takes ${(s.medianNs / c.arms['sigflint-A'].medianNs).toFixed(2)}x the time of ours-new` : s.status}`,
    );
  }
}
console.log(`\nrejected or errored processes: ${rejected.length}`);
