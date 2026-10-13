// Regenerates test/corpus.json: the conformance cases plus the reference signatures from botocore (conformance/oracle.py).
// Needs python3 with the packages in requirements.txt (a virtual environment is fine: PYTHON=/path/to/python).
// Usage: node conformance/build.mjs
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const here = new URL('.', import.meta.url).pathname;
const python = process.env.PYTHON ?? 'python3';
const tmp = mkdtempSync(join(tmpdir(), 'sigflint-'));
try {
  execFileSync(process.execPath, [`${here}cases.mjs`, join(tmp, 'cases.json')], { stdio: 'inherit' });
  execFileSync(python, ['-I', `${here}oracle.py`, join(tmp, 'cases.json'), join(tmp, 'expected.json')], { stdio: 'inherit' });
  const cases = JSON.parse(readFileSync(join(tmp, 'cases.json'), 'utf8'));
  const expected = JSON.parse(readFileSync(join(tmp, 'expected.json'), 'utf8'));
  const corpus = cases.map((c) => ({ ...c, sig: expected[c.id].sig, canonical: expected[c.id].canonical }));
  writeFileSync(`${here}../test/corpus.json`, JSON.stringify(corpus));
  console.log(`test/corpus.json: ${corpus.length} cases`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
