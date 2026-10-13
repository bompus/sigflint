import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getAuthHeaders } from './entry.js';
import { credentials, now, signCase } from './helpers.js';

const corpus = JSON.parse(readFileSync(new URL('./corpus.json', import.meta.url), 'utf8'));
const byId = (id) => corpus.find((c) => c.id === id);
const sigOf = (headers) => headers.authorization.slice(-64);
const awsRange = byId('aws-get-object-range');

describe('result', () => {
  test('returns the headers to send, without host', () => {
    const headers = getAuthHeaders(
      { method: 'PUT', url: new URL('https://bucket.example.com/key'), region: 'us-east-1', unsignedPayload: true, signHeaders: { 'x-amz-acl': 'private' }, now },
      credentials,
    );
    assert.deepEqual(Object.keys(headers).sort(), ['authorization', 'x-amz-acl', 'x-amz-content-sha256', 'x-amz-date']);
    assert.equal(headers['x-amz-date'], '20130524T000000Z');
    assert.equal(headers['x-amz-content-sha256'], 'UNSIGNED-PAYLOAD');
    assert.match(
      headers.authorization,
      /^AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE\/20130524\/us-east-1\/s3\/aws4_request, SignedHeaders=host;x-amz-acl;x-amz-content-sha256;x-amz-date, Signature=[0-9a-f]{64}$/,
    );
  });

  test('hashes the body; an empty or missing body is the hash of an empty string', () => {
    const url = new URL('https://bucket.example.com/key');
    assert.equal(getAuthHeaders({ method: 'GET', url, now }, credentials)['x-amz-content-sha256'], 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    assert.equal(getAuthHeaders({ method: 'GET', url, body: '', now }, credentials)['x-amz-content-sha256'], 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    assert.equal(getAuthHeaders({ method: 'PUT', url, body: 'Welcome to Amazon S3.', now }, credentials)['x-amz-content-sha256'], '44ce7dd67c959e0d3524ffac1771dfbba87d2b6b4b4e99e42034a8b803f8b072');
  });

  test('a session token is signed and returned as x-amz-security-token', () => {
    const headers = signCase(getAuthHeaders, byId('session-token-get'));
    assert.equal(headers['x-amz-security-token'], byId('session-token-get').token);
    assert.match(headers.authorization, /SignedHeaders=host;x-amz-content-sha256;x-amz-date;x-amz-security-token,/);
  });

  test('unsignedPayload and an explicit x-amz-content-sha256 header give the same signature', () => {
    const base = { method: 'PUT', url: new URL('https://bucket.example.com/key'), region: 'us-east-1', body: 'ignored', now };
    const flag = getAuthHeaders({ ...base, unsignedPayload: true }, credentials);
    const header = getAuthHeaders({ ...base, signHeaders: { 'x-amz-content-sha256': 'UNSIGNED-PAYLOAD' } }, credentials);
    assert.equal(sigOf(flag), sigOf(header));
    assert.equal(header['x-amz-content-sha256'], 'UNSIGNED-PAYLOAD');
  });

  test('does not modify the request', () => {
    const url = new URL('https://bucket.example.com/a%20b?z=1&a=2&=x');
    const signHeaders = { 'X-Amz-Acl': ' private ' };
    const request = { method: 'GET', url, region: 'us-east-1', signHeaders, now };
    const copy = structuredClone({ ...request, url: undefined });
    getAuthHeaders(request, credentials);
    assert.equal(url.href, 'https://bucket.example.com/a%20b?z=1&a=2&=x');
    assert.deepEqual(signHeaders, { 'X-Amz-Acl': ' private ' });
    assert.deepEqual({ ...request, url: undefined }, copy);
  });

  test('region, body and signHeaders are optional, and the time defaults to now', () => {
    const before = Math.floor(Date.now() / 1000);
    const headers = getAuthHeaders({ method: 'GET', url: new URL('https://bucket.example.com/key') }, credentials);
    const after = Math.floor(Date.now() / 1000);
    const stamp = headers['x-amz-date'];
    const signed = Date.parse(stamp.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/, '$1-$2-$3T$4:$5:$6Z')) / 1000;
    assert.ok(signed >= before && signed <= after);
    assert.ok(headers.authorization.includes(`/${stamp.slice(0, 8)}//s3/aws4_request`));
  });
});

describe('signing key cache', () => {
  const nextDay = byId('extra-next-day');
  const otherRegion = byId('extra-other-region');

  test('matches the AWS example on a cold and a warm cache', () => {
    assert.equal(sigOf(signCase(getAuthHeaders, awsRange)), awsRange.sig);
    assert.equal(sigOf(signCase(getAuthHeaders, awsRange)), awsRange.sig);
  });

  test('uses the right key for another date and another region, and again for the first after they are cached', () => {
    assert.equal(sigOf(signCase(getAuthHeaders, nextDay)), nextDay.sig);
    assert.equal(sigOf(signCase(getAuthHeaders, otherRegion)), otherRegion.sig);
    assert.equal(sigOf(signCase(getAuthHeaders, awsRange)), awsRange.sig);
    assert.equal(sigOf(signCase(getAuthHeaders, nextDay)), nextDay.sig);
  });

  test('does not reuse the signing key of another secret', () => {
    const request = { method: 'GET', url: new URL(awsRange.href), region: 'us-east-1', signHeaders: awsRange.headers, now };
    const other = getAuthHeaders(request, { ...credentials, secretAccessKey: 'another-secret' });
    assert.notEqual(sigOf(other), awsRange.sig);
    assert.equal(sigOf(signCase(getAuthHeaders, awsRange)), awsRange.sig);
  });

  test('stays correct when more keys than the cache holds are used', () => {
    for (let i = 0; i < 1100; i++) getAuthHeaders({ method: 'GET', url: new URL(awsRange.href), region: `r${i}`, now }, credentials);
    assert.equal(sigOf(signCase(getAuthHeaders, awsRange)), awsRange.sig);
  });
});
