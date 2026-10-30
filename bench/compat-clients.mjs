// Bun only: pinned source adapters import TypeScript. No timing or network requests.
// Run: bun bench/compat-clients.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { freezeClock, loadAdapters } from './adapters.mjs';
import { loadClientAdapters } from './adapters-clients.mjs';
import { tagOf } from './tags.mjs';
/** @typedef {import('./adapters.mjs').Case & { kind: string, sig: string, canonical: string }} CorpusCase */
/** @type {CorpusCase[]} */
const corpus = JSON.parse(readFileSync(new URL('../test/corpus.json', import.meta.url), 'utf8'));
const cases = corpus.filter((c) => c.kind !== 'extra' && tagOf(c) === null);
const [ours] = await loadAdapters(new URL('../src/bun.js', import.meta.url).href, null, [
  'sigflint',
]);
const lock = JSON.parse(readFileSync(new URL('package-lock.json', import.meta.url), 'utf8'));
const restore = freezeClock();
try {
  const candidates = [];
  const adapters = await loadClientAdapters();
  const commonIds = new Set(
    cases.filter((c) => adapters.every((a) => !a.unsupported(c))).map((c) => c.id),
  );
  for (const adapter of adapters) {
    const result = {
      id: adapter.id,
      label: adapter.label,
      version: adapter.version,
      source:
        lock.packages[
          `node_modules/${adapter.id === 's3-lite-client' ? '@bradenmacdonald/s3-lite-client' : adapter.id}`
        ].resolved,
      tested: 0,
      pass: 0,
      fail: 0,
      errors: 0,
      baselinePass: 0,
      common: { tested: commonIds.size, pass: 0 },
      unsupported: /** @type {Record<string, number>} */ ({}),
      failIds: /** @type {string[]} */ ([]),
      errorIds: /** @type {string[]} */ ([]),
    };
    for (const c of cases) {
      const reason = adapter.unsupported(c);
      if (reason) {
        result.unsupported[reason] = (result.unsupported[reason] ?? 0) + 1;
        continue;
      }
      result.tested++;
      if ((await /** @type {import('./adapters.mjs').Adapter} */ (ours).sign(c)) === c.sig) {
        result.baselinePass++;
      }
      try {
        if ((await adapter.sign(c)) === c.sig) {
          result.pass++;
          if (commonIds.has(c.id)) {
            result.common.pass++;
          }
        } else {
          result.fail++;
          result.failIds.push(c.id);
        }
      } catch (error) {
        result.errors++;
        result.errorIds.push(`${c.id}: ${error}`);
      }
    }
    candidates.push(result);
    console.log(
      `${result.label} ${result.version}: ${result.pass}/${result.tested}, ${result.fail} differ, ${result.errors} errors; sigflint ${result.baselinePass}/${result.tested}; unsupported ${JSON.stringify(result.unsupported)}`,
    );
  }
  writeFileSync(
    new URL('results/client-correctness.json', import.meta.url),
    JSON.stringify(
      {
        runtime: `Bun ${Bun.version}`,
        corpusSha256: createHash('sha256')
          .update(readFileSync(new URL('../test/corpus.json', import.meta.url)))
          .digest('hex'),
        dependencyLockSha256: createHash('sha256')
          .update(readFileSync(new URL('package-lock.json', import.meta.url)))
          .digest('hex'),
        corpusCases: corpus.length,
        ordinaryCases: cases.length,
        excluded: corpus.length - cases.length,
        input:
          'Decoded normalized keys and queries from corpus canonical requests; signing cores, not end-to-end clients.',
        candidates,
      },
      null,
      2,
    ) + '\n',
  );
  if (candidates.some((c) => c.errors || c.baselinePass !== c.tested)) {
    process.exitCode = 1;
  }
} finally {
  restore();
}
