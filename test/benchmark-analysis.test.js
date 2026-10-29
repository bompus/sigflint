import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const skip = 'Deno' in globalThis ? 'The analysis child uses the Node/Bun CLI' : false;

/**
 * @param {string} raw
 * @param {string | undefined} more
 */
function analyze(raw, more) {
  const dir = mkdtempSync(join(tmpdir(), 'sigflint-analysis-'));
  try {
    writeFileSync(`${dir}/speed-regression.jsonl`, raw);
    if (more !== undefined) {
      writeFileSync(`${dir}/speed-more.jsonl`, more);
    }
    execFileSync(process.execPath, [fileURLToPath(new URL('bench/analyze-more.mjs', root))], {
      env: { ...process.env, RESULTS: dir },
      stdio: 'pipe',
    });
    return JSON.parse(readFileSync(`${dir}/speed-more-summary.json`, 'utf8'));
  } finally {
    rmSync(dir, { recursive: true });
  }
}

test('regression claims require disjoint ranges and more than twice the band', { skip }, () => {
  const cases = [
    { frozen: [1000, 1000, 1000], final: 1043, verdict: 'no clear change' },
    { frozen: [1000, 1000, 1000], final: 1060, verdict: 'no clear change' },
    { frozen: [900, 1000, 1100], final: 1080, verdict: 'no clear change' },
    { frozen: [1000, 1000, 1000], final: 1100, verdict: 'slower' },
    { frozen: [1000, 1000, 1000], final: 900, verdict: 'faster' },
  ];
  for (const c of cases) {
    const rows = ['frozen', 'final-1', 'final-2'].flatMap((arm) =>
      c.frozen.map((ns, i) => ({
        runtime: 'node test',
        arm,
        round: i + 1,
        workload: 'bench-download',
        status: 'ok',
        nsPerOp: arm === 'frozen' ? ns : c.final,
      })),
    );
    const summary = analyze(rows.map((r) => JSON.stringify(r)).join('\n'), undefined);
    assert.equal(summary.regression[0].verdict, c.verdict, JSON.stringify(c));
  }
});

test('each retained regression baseline regenerates its own saved summary', { skip }, () => {
  for (const relative of [
    'bench/results/',
    'bench/results/release-1.0.2/',
    'bench/results/release-1.0.2/published-regression/',
  ]) {
    const dir = new URL(relative, root);
    const raw = readFileSync(new URL('speed-regression.jsonl', dir), 'utf8');
    const more = relative.endsWith('/published-regression/')
      ? undefined
      : readFileSync(new URL('speed-more.jsonl', dir), 'utf8');
    const saved = JSON.parse(readFileSync(new URL('speed-more-summary.json', dir), 'utf8'));
    assert.deepEqual(analyze(raw, more), saved, relative);
  }
});

test('admission reports accept native and combined receipts without losing zero', { skip }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'sigflint-admission-'));
  try {
    const rows = [
      { part: 'historical', combined_busy_cores: 1.5 },
      { part: 'native', busy_cores: 0.5 },
      { part: 'combined-zero', combined_busy_cores: 0, busy_cores: 2 },
    ].map(({ part, ...cores }) => ({
      kind: 'admit',
      part,
      receipt: { admit: true, mem_full_psi_ms_max: 0, io_full_psi_ms_max: 0, ...cores },
    }));
    const file = join(dir, 'admission.jsonl');
    writeFileSync(file, rows.map((row) => JSON.stringify(row)).join('\n'));
    const output = execFileSync(
      process.execPath,
      [fileURLToPath(new URL('bench/admission-summary.mjs', root)), file],
      { encoding: 'utf8' },
    );
    for (const [part, value] of [
      ['historical', 1.5],
      ['native', 0.5],
      ['combined-zero', 0],
    ]) {
      assert.ok(
        output.includes(`| ${part} | 0 | 0 | 1 | 0 | none | ${value}, ${value}, ${value} |`),
      );
    }
  } finally {
    rmSync(dir, { recursive: true });
  }
});
