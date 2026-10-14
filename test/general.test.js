// Requests for other services against the reference signatures from botocore's generic SigV4Auth (see conformance/): the paths services normalise, their
// query strings, headers, bodies, session tokens, unsigned payloads, and 1,500 seeded random requests.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { entries } from './entry.js';
import { credentials, toMs } from './helpers.js';

const corpus = JSON.parse(readFileSync(new URL('./corpus-general.json', import.meta.url), 'utf8'));

for (const [name, { getAuthHeaders }] of entries) {
  test(`${name}: matches the botocore reference authorization for every case`, async () => {
    const failures = [];
    for (const c of corpus) {
      const headers = await getAuthHeaders(
        {
          method: c.method,
          url: new URL(c.href),
          service: c.service,
          region: c.region,
          body: c.body ?? undefined,
          unsignedPayload: c.unsigned,
          signHeaders: { ...c.headers },
          now: toMs(c.stamp),
        },
        c.token ? { ...credentials, sessionToken: c.token } : credentials,
      );
      if (headers.authorization !== c.authorization) failures.push({ id: c.id, href: c.href, expected: c.authorization, got: headers.authorization });
    }
    assert.ok(corpus.length >= 1600, `only ${corpus.length} cases`);
    assert.deepEqual(failures.slice(0, 5), [], `${failures.length} of ${corpus.length} cases differ`);
  });
}

test('the service defaults to s3, and other services send x-amz-content-sha256 only for an unsigned payload', async () => {
  const [, { getAuthHeaders }] = entries[0];
  const request = { method: 'POST', url: new URL('https://sqs.us-east-1.amazonaws.com/'), region: 'us-east-1', body: 'Action=ListQueues', now: toMs('20130524T000000Z') };
  const s3 = await getAuthHeaders(request, credentials);
  assert.match(s3.authorization, /Credential=[^/]+\/20130524\/us-east-1\/s3\/aws4_request/);
  assert.ok('x-amz-content-sha256' in s3);
  const sqs = await getAuthHeaders({ ...request, service: 'sqs' }, credentials);
  assert.match(sqs.authorization, /\/sqs\/aws4_request, SignedHeaders=host;x-amz-date,/);
  assert.deepEqual(Object.keys(sqs).sort(), ['authorization', 'x-amz-date']);
  const unsigned = await getAuthHeaders({ ...request, service: 'sqs', unsignedPayload: true }, credentials);
  assert.equal(unsigned['x-amz-content-sha256'], 'UNSIGNED-PAYLOAD');
});
