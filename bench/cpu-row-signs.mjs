// Classifies CPU-per-call rows measured with Node and Bun side by side in every round (RUNTIMES of run-admitted.sh), per Bun label, with the per-round signs
// (protocol-bun144-cpu.md): confirmed Node ahead = Node's range is disjoint below Bun's and Node is lower in every round; shown to be noise = Bun's median is
// lower or Node is lower in at most 2 rounds; otherwise unsettled. Rounds measured under only some runtimes are left out.
// Usage: node cpu-row-signs.mjs <raw.jsonl> <arm:workload>...   prints a markdown table (rows in the order given)
import { readFileSync } from 'node:fs';

const [rawPath, ...wanted] = process.argv.slice(2);
if (!rawPath || wanted.length === 0) {
  throw new Error('usage: node cpu-row-signs.mjs <raw.jsonl> <arm:workload>...');
}
/** @type {{ rt: string, armTag: string, workload: string, round: number, mode: string, status: string, cpuUsPerCall: number }[]} */
const rows = readFileSync(rawPath, 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((l) => JSON.parse(l))
  .filter((r) => r.mode === 'run' && r.status === 'ok' && r.cpuUsPerCall !== undefined);
const labels = [...new Set(rows.map((r) => r.rt))].filter((rt) => rt.startsWith('bun')).sort();
/** @param {number[]} a */
const med = (a) => {
  const s = [...a].sort((x, y) => x - y);
  const h = s.length >> 1;
  return s.length % 2
    ? /** @type {number} */ (s[h])
    : (/** @type {number} */ (s[h - 1]) + /** @type {number} */ (s[h])) / 2;
};
/** @param {number} x */
const f = (x) => x.toFixed(2);
/** @param {number[]} v */
const cell = (v) => `${f(med(v))} (${f(Math.min(...v))}-${f(Math.max(...v))})`;
const out = [
  '| row | Bun | rounds | Node median (min-max) µs | Bun median (min-max) µs | Node lower in | verdict |',
  '|---|---|--:|---|---|--:|---|',
];
for (const w of wanted) {
  const [arm, workload] = /** @type {[string, string]} */ (w.split(':'));
  /** @param {string} rt @returns {Map<number, number>} */
  const byRound = (rt) =>
    new Map(
      rows
        .filter((r) => r.rt === rt && r.armTag === arm && r.workload === workload)
        .map((r) => [r.round, r.cpuUsPerCall]),
    );
  const node = byRound('node');
  for (const label of labels) {
    const bun = byRound(label);
    const rounds = [...node.keys()].filter((r) => bun.has(r)).sort((a, b) => a - b);
    const n = rounds.map((r) => /** @type {number} */ (node.get(r)));
    const b = rounds.map((r) => /** @type {number} */ (bun.get(r)));
    if (rounds.length === 0) {
      out.push(
        `| ${arm} ${workload} | ${label} | 0 | - | - | - | no paired rounds: inconclusive |`,
      );
      continue;
    }
    const lower = n.filter((x, i) => x < /** @type {number} */ (b[i])).length;
    let verdict = 'unsettled';
    if (Math.max(...n) < Math.min(...b) && lower === n.length) {
      verdict = 'confirmed Node ahead';
    } else if (med(b) < med(n) || lower <= 2) {
      verdict = 'shown to be noise (not Node ahead)';
    }
    out.push(
      `| ${arm} ${workload} | ${label} | ${rounds.length} | ${cell(n)} | ${cell(b)} | ${lower} of ${rounds.length} | ${verdict} |`,
    );
  }
}
console.log(out.join('\n'));
