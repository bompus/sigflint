// Counts the comparisons of memory-summary.json (made by analyze-memory.mjs, which decides which are unsettled under protocol-rerun.md: the min-max ranges overlap, or the median gap is at most
// twice the reporting band, the larger of the band in percent of the baseline median and the metric's absolute floor). Comparisons are sigflint-A against each other library; sigflint-B is the noise control.
// Usage: node unsettled-memory.mjs <memory-summary.json> [metric ...]
import { readFileSync } from 'node:fs';
const [, , file, ...only] = process.argv;
const s = JSON.parse(readFileSync(file, 'utf8')),
  t = {};
for (const c of s.cells) {
  if (only.length && !only.includes(c.metric)) continue;
  for (const [arm, a] of Object.entries(c.arms)) {
    if (arm === 'sigflint-A' || arm === 'sigflint-B' || a.median === undefined) continue;
    const m = (t[c.metric] ??= { comparisons: 0, unsettled: 0, cells: [] });
    m.comparisons++;
    if (a.unsettled) {
      m.unsettled++;
      m.cells.push(`${c.runtime} ${c.workload ?? '-'} ${arm}`);
    }
  }
}
for (const [m, v] of Object.entries(t))
  console.log(
    `${m}: ${v.unsettled} of ${v.comparisons} unsettled${v.unsettled ? ` (${v.cells.join('; ')})` : ''}`,
  );
