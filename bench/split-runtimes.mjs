// Splits a raw result file measured under several runtime labels (RUNTIMES of run-admitted.sh) into one file per Bun label:
// the Node rows plus that label's rows with "rt" set to "bun", so analyze-memory.mjs and pair-node-bun.mjs read each pairing as a Node and Bun run.
// Usage: node split-runtimes.mjs <raw.jsonl> <out dir>   writes <out dir>/<label>/memory-raw.jsonl for every label starting with "bun"
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const [rawPath, outDir] = process.argv.slice(2);
if (!rawPath || !outDir) {
  throw new Error('usage: node split-runtimes.mjs <raw.jsonl> <out dir>');
}
/** @type {{ rt?: string }[]} */
const rows = readFileSync(rawPath, 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((l) => JSON.parse(l));
const labels = [...new Set(rows.map((r) => r.rt ?? ''))]
  .filter((rt) => rt.startsWith('bun'))
  .sort();
for (const label of labels) {
  const lines = rows
    .filter((r) => r.rt === 'node' || r.rt === label)
    .map((r) => JSON.stringify(r.rt === label ? { ...r, rt: 'bun' } : r));
  mkdirSync(`${outDir}/${label}`, { recursive: true });
  writeFileSync(`${outDir}/${label}/memory-raw.jsonl`, `${lines.join('\n')}\n`);
  console.log(`${label}: ${lines.length} rows`);
}
