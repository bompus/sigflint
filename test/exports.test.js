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
const resolves = (condition) => execFileSync(process.execPath, [...(condition ? [`--conditions=${condition}`] : []), '--input-type=module', '-e', probe], { cwd: new URL('..', import.meta.url), encoding: 'utf8' }).trim();

const skip = typeof Deno !== 'undefined' ? 'Deno takes conditions through a different flag' : false;

test('the default import is synchronous', { skip }, () => assert.equal(resolves(null), 'sync'));
for (const condition of ['workerd', 'worker', 'browser']) {
  test(`the ${condition} condition selects the WebCrypto entry`, { skip }, () => assert.equal(resolves(condition), 'promise'));
}
