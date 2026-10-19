// The package exports pick the entry for each runtime: the WebCrypto one (a promise) on Workers and in browsers, the
// others (synchronous) elsewhere. A child process resolves the package by name with the condition set.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const probe = `
import { getAuthHeaders } from 'sigflint';
const out = getAuthHeaders({ method: 'GET', url: new URL('https://bucket.example.com/key'), region: 'us-east-1', now: 0 }, { accessKeyId: 'id', secretAccessKey: 'secret' });
console.log(out instanceof Promise ? 'promise' : 'sync');
`;
/** @param {string | null} condition */
const resolves = (condition) =>
  execFileSync(
    process.execPath,
    [...(condition ? [`--conditions=${condition}`] : []), '--input-type=module', '-e', probe],
    {
      cwd: new URL('..', import.meta.url),
      encoding: 'utf8',
    },
  ).trim();

const skip = 'Deno' in globalThis ? 'Deno takes conditions through a different flag' : false;

test('the default import is synchronous', { skip }, () => assert.equal(resolves(null), 'sync'));

// Node and Bun load one file instead of six modules (import time); bundlers and the WebCrypto conditions keep src/, which they can tree-shake per signer.
/** @param {string | null} condition */
const where = (condition) =>
  execFileSync(
    process.execPath,
    [
      ...(condition ? [`--conditions=${condition}`] : []),
      '--input-type=module',
      '-e',
      "console.log(import.meta.resolve('sigflint'))",
    ],
    {
      cwd: new URL('..', import.meta.url),
      encoding: 'utf8',
    },
  ).trim();
test(
  'Node and Bun resolve the package to the one-file build, the web conditions to src/',
  { skip },
  () => {
    assert.match(
      where(null),
      typeof Bun === 'undefined' ? /\/dist\/node\.js$/ : /\/dist\/bun\.js$/,
    );
    for (const condition of ['workerd', 'worker', 'browser']) {
      assert.match(where(condition), /\/src\/web\.js$/, condition);
    }
  },
);
for (const condition of ['workerd', 'worker', 'browser']) {
  test(`the ${condition} condition selects the WebCrypto entry`, { skip }, () =>
    assert.equal(resolves(condition), 'promise'),
  );
}

test('every signer is exported by the node, bun and web entries', async () => {
  const names = [
    'getAuthHeaders',
    'presign',
    'getAuthHeadersV4a',
    'presignV4a',
    'chunkSigner',
    'eventSigner',
  ];
  for (const entry of ['node', 'bun', 'web']) {
    const exported = Object.keys(await import(`../src/${entry}.js`)).sort();
    assert.deepEqual(exported, [...names].sort(), entry);
    if (entry !== 'web') {
      assert.deepEqual(
        Object.keys(await import(`../dist/${entry}.js`)).sort(),
        [...names].sort(),
        `dist/${entry}`,
      );
    }
  }
});
