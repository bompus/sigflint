// Drops raw rows whose unit has no admitted receipt: bun tidy-results.mjs <result dir>
// An attempt interrupted between writing a unit's rows and recording its admission leaves rows no receipt vouches for. run-admitted.sh drops them
// when the unit runs again; run-campaign.sh runs this at the end for units that never did, so the analyzers only see admitted units.
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';

const dir = process.argv[2];
if (!dir) {
  throw new Error('usage: tidy-results.mjs <result dir>');
}
const receipts = `${dir}/rerun-3-admission.jsonl`;
const admitted = new Set(
  existsSync(receipts)
    ? readFileSync(receipts, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((l) => JSON.parse(l))
        .filter((r) => r.kind === 'unit' && r.admitted === true)
        .map((r) => r.id)
    : [],
);
for (const name of [
  'speed-raw.jsonl',
  'speed-more.jsonl',
  'speed-regression.jsonl',
  'memory-raw.jsonl',
]) {
  const file = `${dir}/${name}`;
  if (!existsSync(file)) {
    continue;
  }
  const lines = readFileSync(file, 'utf8').split('\n').filter(Boolean);
  const kept = lines.filter((l) => {
    const unit = /"unit":"([^"]+)"/.exec(l)?.[1];
    return unit === undefined || admitted.has(unit);
  });
  if (kept.length !== lines.length) {
    // write the whole copy first, then replace the raw file in one step, so an interrupted write cannot leave it truncated
    writeFileSync(`${file}.tmp`, kept.join('\n') + '\n');
    renameSync(`${file}.tmp`, file);
    console.log(
      `${name}: dropped ${lines.length - kept.length} rows of units without an admitted receipt`,
    );
  }
}
