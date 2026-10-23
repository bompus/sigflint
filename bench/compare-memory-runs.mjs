// Compares two memory-summary.json files (made by analyze-memory.mjs) cell by cell: the same library, runtime, workload and metric in an earlier and a later run.
// A figure moved only when the medians differ by more than the larger of the two runs' reporting bands (percent of the earlier median) and the metric's absolute floor,
// and the min-max ranges over the rounds do not overlap; anything else is "no clear change". Prints a markdown report.
// Usage: node compare-memory-runs.mjs <earlier summary.json> <later summary.json> <earlier label> <later label>
import { readFileSync } from 'node:fs';

const [earlierFile, laterFile, earlierLabel, laterLabel] = process.argv.slice(2);
/** @param {string | undefined} f */
const load = (f) => JSON.parse(readFileSync(/** @type {string} */ (f), 'utf8'));
const before = load(earlierFile);
const after = load(laterFile);
/** @typedef {{ median: number, min: number, max: number }} Stat */
/** @type {Record<string, any>} */
const index = {};
for (const c of before.cells) {
  index[`${c.metric}|${c.runtime}|${c.workload}`] = c;
}
/** @type {Record<string, { compared: number, moved: string[] }>} */
const byMetric = {};
const lines = [];
lines.push(`# ${laterLabel} against ${earlierLabel}`, '');
lines.push(
  `Each figure is the median of the rounds. A figure moved only when the medians differ by more than the larger of the two runs' reporting bands and the metric's absolute floor, and the min-max ranges do not overlap. Otherwise: no clear change.`,
  '',
);
lines.push(
  `| metric | runtime | workload | library | ${earlierLabel} | ${laterLabel} | change | verdict |`,
  '|---|---|---|---|---|---|---|---|',
);
for (const c of after.cells) {
  const e = index[`${c.metric}|${c.runtime}|${c.workload}`];
  if (!e) {
    continue;
  }
  const m = (byMetric[c.metric] ??= { compared: 0, moved: [] });
  for (const [arm, a] of Object.entries(c.arms)) {
    const b = e.arms[arm];
    if (a?.median == null || b?.median == null) {
      continue;
    }
    const band = Math.max(e.bandPct, c.bandPct) / 100;
    const floor = Math.max(e.absFloor, c.absFloor);
    const gap = Math.abs(a.median - b.median);
    const disjoint = a.min > b.max || b.min > a.max;
    const moved = gap > Math.max(band * Math.abs(b.median), floor) && disjoint;
    m.compared++;
    const pct =
      b.median === 0
        ? 'n/a'
        : `${(((a.median - b.median) / Math.abs(b.median)) * 100).toFixed(1)}%`;
    const label = moved ? (a.median > b.median ? 'moved up' : 'moved down') : 'no clear change';
    if (moved) {
      m.moved.push(`${c.runtime} ${c.workload} ${arm}: ${b.median} -> ${a.median} ${c.unit}`);
    }
    if (arm === 'sigflint-A' || moved) {
      lines.push(
        `| ${c.metric} | ${c.runtime} | ${c.workload} | ${arm} | ${b.median} | ${a.median} | ${pct} | ${label} |`,
      );
    }
  }
}
lines.push('', '## Counts', '');
for (const [metric, m] of Object.entries(byMetric)) {
  lines.push(
    `- ${metric}: ${m.moved.length} of ${m.compared} figures moved${m.moved.length ? ` (${m.moved.join('; ')})` : ''}`,
  );
}
console.log(lines.join('\n'));
