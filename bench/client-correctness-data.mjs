import { readFileSync } from 'node:fs';
import { compareLibraries } from './comparison-order.mjs';

/** @typedef {{ id: string, version: string, pass: number, tested: number, errors: number, baselinePass: number, common: { tested: number, pass: number } }} ClientRow */
/** @type {{ sigflintVersion: string, ordinaryCases: number, candidates: ClientRow[] }} */
const clientScreen = JSON.parse(
  readFileSync(new URL('results/client-correctness.json', import.meta.url), 'utf8'),
);
const currentVersion = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
).version;
if (clientScreen.sigflintVersion !== currentVersion) {
  throw new Error('Re-run the client correctness screen for the current sigflint version');
}
clientScreen.candidates.sort((a, b) => compareLibraries(a.id, b.id));
export const clientIds = clientScreen.candidates.map((c) => c.id);

/** @typedef {{ id: string, version: string, pass: number, fail: number, na: number }} ClientTally */
/** @typedef {{ key: string, title: string, total: number, rows: ClientTally[] }} ClientGroup */
/** @type {[ClientGroup, ClientGroup]} */
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
];
for (const c of clientScreen.candidates) {
  if (c.errors || c.baselinePass !== c.tested || c.common.tested !== clientGroups[1].total) {
    throw new Error(`Invalid client comparison coverage for ${c.id}`);
  }
}

export const ordinaryClientTotal = clientScreen.ordinaryCases;
