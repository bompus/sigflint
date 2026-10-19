// Summarizes results/rerun-2-alternating.jsonl (Node and Bun alternated within every round, order flipped on even rounds) -> results/rerun-2-alternating.md.
// Rounds 1-6 had only the per-process Linux CPU gate; rounds 7-10 add a host admission check before and after every Node/Bun pair, and only admitted pairs count.
import { readFileSync, writeFileSync } from 'node:fs';
const rows = readFileSync(new URL('results/rerun-2-alternating.jsonl', import.meta.url), 'utf8')
  .trim()
  .split('\n')
  .map((l) => JSON.parse(l));
const LIST = [
  ['A speed ns', 'bench-download', 'aws4', 'a-aws4', 'nsPerOp'],
  ['A speed ns', 'bench-download', 'sigflint-B', 'a-sigflint', 'nsPerOp'],
  ['B speed ns', 'any-query', 'sigflint', 'm-sigflint', 'nsPerOp'],
  ['B speed ns', 'event-4k', 'sigflint', 'm-sigflint', 'nsPerOp'],
  ['B speed ns', 'presign-any', 'aws4', 'm-aws4', 'nsPerOp'],
  ['B speed ns', 'presign-any', 'smithy', 'm-smithy', 'nsPerOp'],
  ['B speed ns', 'presign-s3', 'smithy', 'm-smithy', 'nsPerOp'],
  ['C/D cpuUs µs', 'bench-body-1k', 'aws4', 'c-aws4', 'cpuUsPerCall'],
  ['C/D cpuUs µs', 'bench-body-1k', 'smithy', 'c-smithy', 'cpuUsPerCall'],
];
const pre = new Map(),
  post = new Map();
for (const r of rows)
  if (r.kind === 'admit')
    (r.phase === 'pre' ? pre : post).set(`${r.proc}|${r.round}`, !!r.receipt.admit); // the last try of a phase wins
const admitted = (proc, round) => !!(pre.get(`${proc}|${round}`) && post.get(`${proc}|${round}`));
const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const f = (x) => (x >= 100 ? Math.round(x).toLocaleString('en-US') : x.toFixed(2));
const verdict = (n, b) => {
  const mn = med(n),
    mb = med(b),
    rn = (100 * (Math.max(...n) - Math.min(...n))) / mn,
    rb = (100 * (Math.max(...b) - Math.min(...b))) / mb;
  const band = Math.max(3, 2 * Math.max(rn, rb)),
    gap = (100 * (mb - mn)) / mn;
  let v;
  if (Math.max(...n) < Math.min(...b)) v = 'Node ahead, ranges disjoint';
  else if (Math.max(...b) < Math.min(...n)) v = 'Bun ahead, ranges disjoint';
  else if (mb <= mn) v = 'Bun ahead in median, ranges overlap';
  else if (Math.abs(gap) <= band) v = 'Node ahead in median, within the band (noise)';
  else v = 'open';
  return {
    mn,
    mb,
    lo: [Math.min(...n), Math.max(...n)],
    lb: [Math.min(...b), Math.max(...b)],
    gap,
    band,
    v,
  };
};
let md = `# Node and Bun alternating samples for the nine in-band rows\n\nEach round runs the same hashed build and the same harness scripts as the re-run, Node and Bun back to back for each candidate (Node first in odd rounds, Bun first in even rounds). Rounds 1-6: per-process Linux CPU gate only. Rounds 7-10: a host admission check (Linux and Windows CPU, memory and I/O pressure, swap) before and after every pair; only pairs admitted both times count. Units: ns per call, CPU time in µs per call.\n\n`;
md +=
  '| row | admitted pairs (rounds 7-10) | Node median (min-max) | Bun median (min-max) | Bun over Node | verdict |\n|---|--:|---|---|--:|---|\n';
const detail = [];
for (const [part, wl, lib, proc, fld] of LIST) {
  const pick = (rt, from, ok) =>
    rows.filter(
      (r) =>
        r.proc === proc &&
        r.rt === rt &&
        r.workload === wl &&
        r.status === 'ok' &&
        fld in r &&
        r.round >= from &&
        ok(r.round),
    );
  const byRound = (rt, from, ok) =>
    Object.fromEntries(pick(rt, from, ok).map((r) => [r.round, r[fld]]));
  const nA = byRound('node', 7, (k) => admitted(proc, k)),
    bA = byRound('bun', 7, (k) => admitted(proc, k));
  const ks = Object.keys(nA).filter((k) => k in bA);
  const n = ks.map((k) => nA[k]),
    b = ks.map((k) => bA[k]);
  const v = verdict(n, b);
  const few =
    ks.length < 4 ? `; only ${ks.length} admitted pairs, not settled at the 10-round cap` : '';
  md += `| ${part} ${wl} ${lib} | ${ks.length} (rounds ${ks.join(', ')}) | ${f(v.mn)} (${f(v.lo[0])}-${f(v.lo[1])}) | ${f(v.mb)} (${f(v.lb[0])}-${f(v.lb[1])}) | ${v.gap >= 0 ? '+' : ''}${v.gap.toFixed(1)}% | ${v.v}${few} |\n`;
  const all = (rt) => Object.fromEntries(pick(rt, 1, () => true).map((r) => [r.round, r[fld]]));
  const an = all('node'),
    ab = all('bun');
  detail.push(
    `| ${part} ${wl} ${lib} | ${Object.keys(an)
      .map(
        (k) => `${k}${k >= 7 && !admitted(proc, +k) ? '*' : ''}: ${f(an[k])} / ${f(ab[k] ?? NaN)}`,
      )
      .join('; ')} |`,
  );
}
md += `\n## Every round, Node / Bun\n\nRounds 1-6 were not checked per pair. A * marks a round 7-10 pair that failed its admission check and is not counted.\n\n| row | round: Node / Bun |\n|---|---|\n${detail.join('\n')}\n`;
const rec = rows
  .filter((r) => r.kind === 'admit' && r.receipt.admit && r.round >= 7)
  .map((r) => r.receipt.combined_busy_cores)
  .sort((a, b) => a - b);
md += `\nAdmission receipts of rounds 7-10 that admitted (${rec.length}): combined Linux and Windows busy cores ${rec[0]} to ${rec.at(-1)}, median ${rec[Math.floor(rec.length / 2)]}.\n`;
const bad = rows.filter((r) => r.status === 'rejected-load');
md += `Processes rejected by the busy gate: ${bad.length}${bad.length ? ' (' + bad.map((r) => `${r.proc} ${r.rt} round ${r.round}, ${r.preBusyPct}% busy`).join('; ') + ')' : ''}. Swap change around any process: ${Math.max(...rows.map((r) => Math.abs(r.swapFreeDeltaKb ?? 0)))} kB at most.\n`;
writeFileSync(new URL('results/rerun-2-alternating.md', import.meta.url), md);
console.log(md.split('\n').slice(4, 16).join('\n'));
