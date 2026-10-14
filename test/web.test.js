// The WebCrypto entry (sigflint/web): the same corpus and the same results as the node:crypto entry, through promises.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getAuthHeaders } from '../src/web.js';
import { getAuthHeaders as getAuthHeadersSync } from './entry.js';
import { credentials, now, signCase } from './helpers.js';

const corpus = JSON.parse(readFileSync(new URL('./corpus.json', import.meta.url), 'utf8'));

test('returns the same headers as the synchronous entry, session token included', async () => {
  const request = { method: 'PUT', url: new URL('https://bucket.example.com/a b?x=1'), region: 'eu-west-1', body: 'hello', signHeaders: { 'X-Amz-Acl': 'private' }, now };
  const withToken = { ...credentials, sessionToken: 'token' };
  assert.deepEqual(await getAuthHeaders(request, withToken), getAuthHeadersSync(request, withToken));
});

test('many requests in flight at once all sign correctly', async () => {
  const cases = corpus.filter((c) => c.kind !== 'extra').slice(0, 200);
  const results = await Promise.all(cases.map((c) => signCase(getAuthHeaders, c)));
  results.forEach((headers, i) => assert.equal(headers.authorization.slice(-64), cases[i].sig, cases[i].id));
});

test('the signing key follows the date and the region', async () => {
  const url = new URL('https://bucket.example.com/key');
  const sign = async (region, ms) => (await getAuthHeaders({ method: 'GET', url, region, now: ms }, credentials)).authorization;
  const base = await sign('us-east-1', now);
  assert.notEqual(await sign('us-west-2', now), base);
  assert.notEqual(await sign('us-east-1', now + 86400000), base);
  assert.equal(await sign('us-east-1', now), base);
});
