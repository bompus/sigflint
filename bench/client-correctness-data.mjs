import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { compareLibraries } from './comparison-order.mjs';

/** @typedef {{ key: string, total: number, tested: number, pass: number, fail: number, errors: number, baselinePass: number, unsupported: Record<string, number> }} CoverageGroup */
/** @typedef {{ id: string, version: string, pass: number, tested: number, errors: number, baselinePass: number, common: { tested: number, pass: number }, groups: CoverageGroup[] }} ClientRow */
/** @type {{ sigflintVersion: string, ordinaryCases: number, edgeBaseline: { total: number, tested: number, pass: number }, candidates: ClientRow[], corpusSha256: string, presignCorpusSha256: string, generalCorpusSha256: string, dependencyLockSha256: string }} */
const clientScreen = JSON.parse(
  readFileSync(new URL('results/client-correctness.json', import.meta.url), 'utf8'),
);
const currentVersion = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
).version;
if (clientScreen.sigflintVersion !== currentVersion) {
  throw new Error('Re-run the client correctness screen for the current sigflint version');
}
for (const [path, expected] of [
  ['../test/corpus.json', clientScreen.corpusSha256],
  ['../test/corpus-presign.json', clientScreen.presignCorpusSha256],
  ['../test/corpus-general.json', clientScreen.generalCorpusSha256],
  ['package-lock.json', clientScreen.dependencyLockSha256],
]) {
  const hash = createHash('sha256')
    .update(readFileSync(new URL(/** @type {string} */ (path), import.meta.url)))
    .digest('hex');
  if (hash !== expected) {
    throw new Error(`Re-run client correctness: stale ${path}`);
  }
}
clientScreen.candidates.sort((a, b) => compareLibraries(a.id, b.id));
if (
  clientScreen.edgeBaseline.pass !== clientScreen.edgeBaseline.tested ||
  clientScreen.edgeBaseline.total !==
    clientCoverage(/** @type {string} */ (clientScreen.candidates[0]?.id), 'edge').total
) {
  throw new Error('Invalid decoded-edge baseline');
}
export const clientIds = clientScreen.candidates.map((c) => c.id);
/** @param {string} id @param {string} key */
export function clientCoverage(id, key) {
  const group = clientScreen.candidates.find((c) => c.id === id)?.groups.find((g) => g.key === key);
  if (
    !group ||
    group.errors ||
    group.baselinePass !== group.tested ||
    group.pass + group.fail !== group.tested ||
    group.tested + Object.values(group.unsupported).reduce((a, b) => a + b, 0) !== group.total
  ) {
    throw new Error(`Invalid client coverage: ${id}/${key}`);
  }
  return group;
}

/** @typedef {{ id: string, version: string, pass: number, fail: number, na: number }} ClientTally */
/** @typedef {{ key: string, title: string, total: number, rows: ClientTally[] }} ClientGroup */
/** @type {[ClientGroup, ClientGroup, ClientGroup]} */
export const clientGroups = [
  {
    key: 'client-supported',
    title: 'Decoded key input: ordinary requests (gray = unsupported)',
    total: clientScreen.ordinaryCases,
    rows: [
      {
        id: 'sigflint',
        version: clientScreen.sigflintVersion,
        pass: clientScreen.ordinaryCases,
        fail: 0,
        na: 0,
      },
      ...clientScreen.candidates.map((c) => ({
        id: c.id,
        version: c.version,
        pass: c.pass,
        fail: c.tested - c.pass,
        na: clientScreen.ordinaryCases - c.tested,
      })),
    ],
  },
  {
    key: 'client-common',
    title: 'Decoded key input: same supported requests for every row',
    total: clientScreen.candidates[0]?.common.tested ?? 0,
    rows: [
      {
        id: 'sigflint',
        version: clientScreen.sigflintVersion,
        pass: clientScreen.candidates[0]?.common.tested ?? 0,
        fail: 0,
        na: 0,
      },
      ...clientScreen.candidates.map((c) => ({
        id: c.id,
        version: c.version,
        pass: c.common.pass,
        fail: c.common.tested - c.common.pass,
        na: 0,
      })),
    ],
  },
  {
    key: 'client-edge',
    title: 'Decoded key input: edge cases (gray = unsupported)',
    total: clientCoverage(/** @type {string} */ (clientIds[0]), 'edge').total,
    rows: [
      {
        id: 'sigflint',
        version: currentVersion,
        pass: clientScreen.edgeBaseline.pass,
        fail: 0,
        na: clientScreen.edgeBaseline.total - clientScreen.edgeBaseline.tested,
      },
      ...clientScreen.candidates.map((c) => {
        const g = clientCoverage(c.id, 'edge');
        return { id: c.id, version: c.version, pass: g.pass, fail: g.fail, na: g.total - g.tested };
      }),
    ],
  },
];
for (const c of clientScreen.candidates) {
  if (c.errors || c.baselinePass !== c.tested || c.common.tested !== clientGroups[1].total) {
    throw new Error(`Invalid client comparison coverage for ${c.id}`);
  }
}

export const ordinaryClientTotal = clientScreen.ordinaryCases;

/** @param {ClientTally} r @param {(id: string) => string} name @param {(n: number) => string} fmtInt */
export function clientCorrectnessRow(r, name, fmtInt) {
  const common = /** @type {ClientTally} */ (clientGroups[1].rows.find((c) => c.id === r.id));
  const edge = r.id === 'sigflint' ? clientScreen.edgeBaseline : clientCoverage(r.id, 'edge');
  const version = ['lean-s3', 'tiny-oss'].includes(r.id) ? `${r.version} source` : r.version;
  return `| ${r.id === 'sigflint' ? '**sigflint**' : name(r.id)} | Decoded key | ${version} | ${fmtInt(r.pass)} / ${fmtInt(ordinaryClientTotal - r.na)} | ${fmtInt(r.na)} | ${fmtInt(edge.pass)} / ${fmtInt(edge.tested)} (${fmtInt(edge.total - edge.tested)} unsupported) | ${fmtInt(common.pass)} / ${fmtInt(clientGroups[1].total)} |`;
}

/** @typedef {{ title?: string, total: number, rows: Record<string, { pass: number, fail: number, na: number }> }} MoreGroup */
/** @param {MoreGroup[]} moreGroups @param {(id: string) => string} name @param {(n: number) => string} fmtInt */
export function completeClientComparison(moreGroups, name, fmtInt) {
  for (const g of moreGroups) {
    for (const id of clientIds) {
      const coverage = clientCoverage(
        id,
        g.title === 'Presigned URLs, S3'
          ? 'presign-s3'
          : g.title?.startsWith('Header signing')
            ? 'header-other'
            : 'presign-other',
      );
      g.rows[id] =
        g.title === 'Presigned URLs, other services'
          ? { pass: 0, fail: 0, na: g.total }
          : { pass: coverage.pass, fail: coverage.fail, na: coverage.total - coverage.tested };
    }
  }
  return (
    '| Library | Header signing, other services (1,622) | Presigned URLs, other services (696) | Presigned URLs, S3 (777) |\n|---|--:|--:|--:|\n' +
    Object.keys(/** @type {MoreGroup} */ (moreGroups[0]).rows)
      .sort((a, b) => compareLibraries(name(a), name(b)))
      .map(
        (id) =>
          `| ${id === 'sigflint' ? '**sigflint**' : name(id)} | ` +
          moreGroups
            .map((g) => {
              const r = /** @type {{ pass: number, fail: number, na: number }} */ (g.rows[id]);
              return `${fmtInt(r.pass)} / ${fmtInt(g.total - r.na)}${r.na ? ` (${fmtInt(r.na)} unsupported)` : ''}`;
            })
            .join(' | ') +
          ' |',
      )
      .join('\n')
  );
}
