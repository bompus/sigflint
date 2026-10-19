// Summarizes results/rerun-3-admission.jsonl (the receipt of every host check and the outcome of every unit written by run-admitted.sh), per part.
// Usage: node admission-summary.mjs [receipts file]   -> prints Markdown
import { readFileSync } from 'node:fs';

const file =
  process.argv[2] ?? new URL('results/rerun-3-admission.jsonl', import.meta.url).pathname;
const rows = readFileSync(file, 'utf8')
  .trim()
  .split('\n')
  .map((l) => JSON.parse(l));
/** @param {number[]} a */
const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const parts = [...new Set(rows.map((r) => r.part))];
const line = [
  '| part | units admitted | units refused | checks | checks refused | refusal reasons | combined busy cores of admitting checks (min, median, max) | worst memory / I/O pressure of admitting checks (ms) |',
  '|---|--:|--:|--:|--:|---|---|---|',
];
for (const p of parts) {
  const checks = rows.filter((r) => r.part === p && r.kind === 'admit');
  const units = rows.filter((r) => r.part === p && r.kind === 'unit');
  const ok = checks.filter((c) => c.receipt.admit),
    bad = checks.filter((c) => !c.receipt.admit);
  /** @type {Record<string, number>} */
  const reasons = {};
  for (const c of bad) {
    for (const x of c.receipt.reasons ?? []) {
      const k = x.replace(/ per interval$/, '');
      reasons[k] = (reasons[k] ?? 0) + 1;
    }
  }
  const cores = ok.map((c) => c.receipt.combined_busy_cores);
  const mem = Math.max(...ok.map((c) => c.receipt.mem_full_psi_ms_max)),
    io = Math.max(...ok.map((c) => c.receipt.io_full_psi_ms_max));
  line.push(
    `| ${p} | ${units.filter((u) => u.admitted).length} | ${units.filter((u) => !u.admitted).length} | ${checks.length} | ${bad.length} | ${
      Object.entries(reasons)
        .map(([k, v]) => `${k} (${v})`)
        .join('; ') || 'none'
    } | ${Math.min(...cores)}, ${med(cores)}, ${Math.max(...cores)} | ${mem.toFixed(1)} / ${io.toFixed(1)} |`,
  );
}
console.log(line.join('\n'));
