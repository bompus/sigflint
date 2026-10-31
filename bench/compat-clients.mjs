// Bun only: pinned source adapters import TypeScript. No timing or network requests.
// Run: bun bench/compat-clients.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { CREDS, freezeClock, loadAdapters } from './adapters.mjs';
import { loadClientAdapters } from './adapters-clients.mjs';
import {
  loadClientPresignAdapters,
  loadClientGeneralAdapters,
} from './adapters-clients-presign.mjs';
import { tagOf } from './tags.mjs';
/** @typedef {import('./adapters.mjs').Case & { kind: string, sig: string, canonical: string, stamp?: string }} CorpusCase */
/** @type {CorpusCase[]} */
const corpus = JSON.parse(readFileSync(new URL('../test/corpus.json', import.meta.url), 'utf8'));
const cases = corpus.filter((c) => c.kind !== 'extra' && tagOf(c) === null);
const edgeCases = corpus.filter((c) => c.kind === 'extra' || tagOf(c) !== null);
/** @type {import('./adapters-clients-presign.mjs').PresignCase[]} */
const presignCases = JSON.parse(
  readFileSync(new URL('../test/corpus-presign.json', import.meta.url), 'utf8'),
);
const [ours] = await loadAdapters(new URL('../src/bun.js', import.meta.url).href, null, [
  'sigflint',
]);
const { presign, getAuthHeaders } = await import('../src/bun.js');
/** @type {import('./adapters-clients-presign.mjs').PresignCase[]} */
const generalCases = JSON.parse(
  readFileSync(new URL('../test/corpus-general.json', import.meta.url), 'utf8'),
);
const lock = JSON.parse(readFileSync(new URL('package-lock.json', import.meta.url), 'utf8'));
const restore = freezeClock();
try {
  const edgeBaseline = { total: edgeCases.length, tested: 0, pass: 0 };
  for (const c of edgeCases) {
    try {
      decodeURIComponent(c.canonical.split('\n').slice(1, 3).join('\n'));
    } catch {
      continue;
    }
    edgeBaseline.tested++;
    const reset = freezeClock(
      (c.stamp ?? '20130524T000000Z').replace(
        /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,
        '$1-$2-$3T$4:$5:$6Z',
      ),
    );
    try {
      if ((await /** @type {import('./adapters.mjs').Adapter} */ (ours).sign(c)) === c.sig) {
        edgeBaseline.pass++;
      }
    } finally {
      reset();
    }
  }
  if (edgeBaseline.pass !== edgeBaseline.tested) {
    throw new Error('Decoded-edge baseline differs');
  }
  const candidates = [];
  const adapters = await loadClientAdapters();
  const presignAdapters = await loadClientPresignAdapters();
  const generalAdapters = await loadClientGeneralAdapters();
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
    const presigner = presignAdapters.find((a) => a.id === adapter.id);
    const general = generalAdapters.find((a) => a.id === adapter.id);
    if (!presigner || !general) {
      throw new Error(`Missing comparison adapter: ${adapter.id}`);
    }
    const groups = [];
    for (const { key, cases: groupCases } of [
      { key: 'edge', cases: edgeCases },
      { key: 'header-other', cases: generalCases },
      { key: 'presign-s3', cases: presignCases.filter((c) => c.service === 's3') },
      { key: 'presign-other', cases: presignCases.filter((c) => c.service !== 's3') },
    ]) {
      const tally = {
        key,
        total: groupCases.length,
        tested: 0,
        pass: 0,
        fail: 0,
        errors: 0,
        baselinePass: 0,
        unsupported: /** @type {Record<string, number>} */ ({}),
        failIds: /** @type {string[]} */ ([]),
        errorIds: /** @type {string[]} */ ([]),
      };
      for (const c of groupCases) {
        const isPresign = key.startsWith('presign-');
        const isGeneral = key === 'header-other';
        let reason;
        if (isGeneral) {
          reason = general.unsupported(
            /** @type {import('./adapters-clients-presign.mjs').PresignCase} */ (c),
          );
        } else if (isPresign) {
          reason = presigner.unsupported(
            /** @type {import('./adapters-clients-presign.mjs').PresignCase} */ (c),
          );
        } else {
          try {
            decodeURIComponent(c.canonical.split('\n').slice(1, 3).join('\n'));
          } catch {
            reason = 'not a decoded UTF-8 key or query';
          }
          reason ??= adapter.unsupported(/** @type {CorpusCase} */ (c));
        }
        if (reason) {
          tally.unsupported[reason] = (tally.unsupported[reason] ?? 0) + 1;
          continue;
        }
        tally.tested++;
        const stamp = c.stamp ?? '20130524T000000Z';
        const reset = freezeClock(
          stamp.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/, '$1-$2-$3T$4:$5:$6Z'),
        );
        try {
          const baseline = isGeneral
            ? getAuthHeaders(
                {
                  method: c.method,
                  url: new URL(c.href),
                  service: /** @type {import('./adapters-clients-presign.mjs').PresignCase} */ (c)
                    .service,
                  region: c.region,
                  body: c.body ?? undefined,
                  unsignedPayload: c.unsigned,
                  signHeaders: c.headers,
                },
                { ...CREDS, ...(c.token ? { sessionToken: c.token } : {}) },
              ).authorization?.slice(-64)
            : isPresign
              ? new URL(
                  presign(
                    {
                      method: c.method,
                      url: new URL(c.href),
                      service: /** @type {import('./adapters-clients-presign.mjs').PresignCase} */ (
                        c
                      ).service,
                      region: c.region,
                      expires: /** @type {import('./adapters-clients-presign.mjs').PresignCase} */ (
                        c
                      ).expires,
                      signHeaders: c.headers,
                    },
                    { ...CREDS, ...(c.token ? { sessionToken: c.token } : {}) },
                  ),
                ).searchParams.get('X-Amz-Signature')
              : await /** @type {import('./adapters.mjs').Adapter} */ (ours).sign(
                  /** @type {CorpusCase} */ (c),
                );
          if (baseline !== c.sig) {
            throw new Error(`Reference baseline differs: ${c.id}`);
          }
          tally.baselinePass++;
          const sig = isGeneral
            ? general.sign(/** @type {import('./adapters-clients-presign.mjs').PresignCase} */ (c))
            : isPresign
              ? await presigner.sign(
                  /** @type {import('./adapters-clients-presign.mjs').PresignCase} */ (c),
                )
              : await adapter.sign(/** @type {CorpusCase} */ (c));
          if (sig === c.sig) {
            tally.pass++;
          } else {
            tally.fail++;
            tally.failIds.push(c.id);
          }
        } catch (e) {
          tally.errors++;
          tally.errorIds.push(`${c.id}: ${e}`);
        } finally {
          reset();
        }
      }
      if (
        tally.tested + Object.values(tally.unsupported).reduce((a, b) => a + b, 0) !==
          tally.total ||
        tally.pass + tally.fail + tally.errors !== tally.tested ||
        tally.errors
      ) {
        throw new Error(`Incomplete coverage: ${adapter.id}/${key}: ${tally.errorIds.join('; ')}`);
      }
      groups.push(tally);
      console.log(
        `${adapter.id} ${key}: ${tally.pass}/${tally.tested}, ${tally.fail} differ, ${tally.errors} errors; unsupported ${JSON.stringify(tally.unsupported)}`,
      );
    }
    Object.assign(result, { groups });
    console.log(
      `${result.label} ${result.version}: ${result.pass}/${result.tested}, ${result.fail} differ, ${result.errors} errors; sigflint ${result.baselinePass}/${result.tested}; unsupported ${JSON.stringify(result.unsupported)}`,
    );
  }
  writeFileSync(
    new URL('results/client-correctness.json', import.meta.url),
    JSON.stringify(
      {
        runtime: `Bun ${Bun.version}`,
        sigflintVersion: /** @type {import('./adapters.mjs').Adapter} */ (ours).version,
        corpusSha256: createHash('sha256')
          .update(readFileSync(new URL('../test/corpus.json', import.meta.url)))
          .digest('hex'),
        presignCorpusSha256: createHash('sha256')
          .update(readFileSync(new URL('../test/corpus-presign.json', import.meta.url)))
          .digest('hex'),
        generalCorpusSha256: createHash('sha256')
          .update(readFileSync(new URL('../test/corpus-general.json', import.meta.url)))
          .digest('hex'),
        dependencyLockSha256: createHash('sha256')
          .update(readFileSync(new URL('package-lock.json', import.meta.url)))
          .digest('hex'),
        corpusCases: corpus.length,
        ordinaryCases: cases.length,
        edgeBaseline,
        edgeCases: edgeCases.length,
        input:
          'Decoded normalized keys and queries from corpus canonical requests; signing cores, not end-to-end clients.',
        presignInput:
          'Public S3 presign APIs with decoded canonical keys and original business query pairs; fixed per-case clock. No requests sent.',
        generalInput:
          'tiny-oss core with caller-prepared canonical path, decoded query pairs, service and payload hash; other cores are S3 only.',
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
