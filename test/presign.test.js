// Presigned URLs against the reference from botocore's SigV4QueryAuth (other services) and S3SigV4QueryAuth (S3); see conformance/.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { entries } from './entry.js';
import { credentials, now, toMs } from './helpers.js';

const corpus = JSON.parse(readFileSync(new URL('./corpus-presign.json', import.meta.url), 'utf8'));

for (const [name, { presign }] of entries) {
  test(`${name}: matches the botocore reference signature and parameters for every case`, async () => {
    const failures = [];
    for (const c of corpus) {
      const out = new URL(
        await presign(
          {
            method: c.method,
            url: new URL(c.href),
            service: c.service,
            region: c.region,
            signHeaders: { ...c.headers },
            unsignedPayload: c.unsigned,
            expires: c.expires,
            now: toMs(c.stamp),
          },
          c.token ? { ...credentials, sessionToken: c.token } : credentials,
        ),
      );
      const params = Object.entries(
        Object.fromEntries(
          [...out.searchParams].filter(([k]) => k.startsWith('X-Amz-') && k !== 'X-Amz-Signature'),
        ),
      ).sort();
      const kept = [...new URL(c.href).searchParams].every(
        ([k, v]) => out.searchParams.get(k) === v,
      );
      if (
        out.searchParams.get('X-Amz-Signature') !== c.sig ||
        JSON.stringify(params) !== JSON.stringify(Object.entries(c.authParams).sort()) ||
        !kept
      ) {
        failures.push({ id: c.id, href: c.href, expected: c.sig });
      }
    }
    assert.ok(corpus.length >= 1600, `only ${corpus.length} cases`);
    assert.deepEqual(
      failures.slice(0, 5),
      [],
      `${failures.length} of ${corpus.length} cases differ`,
    );
  });
}

test('the lifetime defaults to an hour, and the URL keeps its path and original query', async () => {
  const [, { presign }] = entries[0];
  const link = new URL(
    await presign(
      {
        method: 'GET',
        url: new URL('https://bucket.s3.us-east-1.amazonaws.com/a/b?versionId=3'),
        region: 'us-east-1',
        now,
      },
      credentials,
    ),
  );
  assert.equal(link.origin + link.pathname, 'https://bucket.s3.us-east-1.amazonaws.com/a/b');
  assert.equal(link.searchParams.get('versionId'), '3');
  assert.equal(link.searchParams.get('X-Amz-Expires'), '3600');
  assert.equal(link.searchParams.get('X-Amz-Date'), '20130524T000000Z');
});
