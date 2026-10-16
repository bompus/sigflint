// Inputs that used to produce a signature the service rejects, or a wrong one without an error. They now fail loudly or sign correctly. Each case runs on the
// synchronous entry, the built file and the WebCrypto entry.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { entries } from './entry.js';
import { credentials, now } from './helpers.js';

const url = new URL('https://examplebucket.s3.amazonaws.com/test.txt');
const request = { method: 'GET', url, region: 'us-east-1', now };
const text = (bytes) => new TextDecoder().decode(bytes);

for (const [name, { getAuthHeaders, presign, getAuthHeadersV4a, chunkSigner, eventSigner }] of entries) {
  const rejects = async (fn, type, pattern) =>
    assert.rejects(
      async () => fn(),
      (error) => error instanceof type && pattern.test(error.message),
    );
  const chunkedHeaders = () => getAuthHeaders({ method: 'PUT', url, region: 'us-east-1', now, body: 'x', signHeaders: { 'content-encoding': 'aws-chunked' } }, credentials);

  test(`${name}: a trailer name in capitals is signed with its value`, async () => {
    const lower = text(await (await chunkSigner(await chunkedHeaders(), credentials)).end({ 'x-amz-checksum-crc32c': 'sOO8/Q==' }));
    const upper = text(await (await chunkSigner(await chunkedHeaders(), credentials)).end({ 'X-Amz-Checksum-CRC32C': 'sOO8/Q==' }));
    assert.equal(upper, lower);
    assert.match(upper, /\r\nx-amz-checksum-crc32c:sOO8\/Q==\r\n/);
  });

  test(`${name}: signHeaders cannot replace the date or the authorization, or be named __proto__`, async () => {
    for (const header of ['x-amz-date', 'X-Amz-Date', 'authorization', '__proto__']) {
      const signHeaders = JSON.parse(`{"${header}":"v"}`); // an own property, even for __proto__
      await rejects(() => getAuthHeaders({ ...request, signHeaders }, credentials), TypeError, /signHeaders/);
      await rejects(() => presign({ ...request, signHeaders }, credentials), TypeError, /signHeaders/);
    }
  });

  test(`${name}: a line break in a signed header value is refused`, async () => {
    await rejects(() => getAuthHeaders({ ...request, signHeaders: { 'x-foo': 'a\nx-amz-date:19700101T000000Z' } }, credentials), TypeError, /line break/);
    await rejects(() => presign({ ...request, signHeaders: { 'x-foo': 'a\r\nb' } }, credentials), TypeError, /line break/);
  });

  test(`${name}: a lowercase method signs as the uppercase one, as botocore does`, async () => {
    for (const method of ['get', 'Put', 'delete']) {
      const lower = { ...request, method };
      const upper = { ...request, method: method.toUpperCase() };
      assert.deepEqual(await getAuthHeaders(lower, credentials), await getAuthHeaders(upper, credentials));
      assert.equal(await presign(lower, credentials), await presign(upper, credentials));
    }
  });

  test(`${name}: a line break in a trailer name or value is refused`, async () => {
    for (const trailers of [{ 'x-amz-checksum-crc32c': 'a\nx-evil:1' }, { 'x-amz-checksum-crc32c': 'a\r\nx-evil:1' }, { 'x-a\nx-evil': '1' }]) {
      const signer = await chunkSigner(await chunkedHeaders(), credentials);
      await rejects(() => signer.end(trailers), TypeError, /line break/);
    }
  });

  test(`${name}: a refused trailer does not move the chunk chain, so end() can be retried`, async () => {
    const good = { 'x-amz-checksum-crc32c': 'sOO8/Q==' };
    const signer = await chunkSigner(await chunkedHeaders(), credentials);
    await signer.chunk(new Uint8Array([1, 2, 3]));
    await rejects(() => signer.end({ 'x-amz-checksum-crc32c': 'a\nb' }), TypeError, /line break/);
    const retried = await signer.end(good);
    const fresh = await chunkSigner(await chunkedHeaders(), credentials);
    await fresh.chunk(new Uint8Array([1, 2, 3]));
    assert.deepEqual(retried, await fresh.end(good));
  });

  test(`${name}: presign signs own signHeaders only and refuses a URL it cannot sign`, async () => {
    const inherited = Object.create({ 'x-inherited': 'yes' });
    inherited['x-own'] = '1';
    const signed = new URL(await presign({ ...request, signHeaders: inherited }, credentials)).searchParams.get('X-Amz-SignedHeaders');
    assert.equal(signed, 'host;x-own');
    await rejects(() => presign({ ...request, url: new URL('s3://bucket/key') }, credentials), TypeError, /http or https/);
    const done = await presign(request, credentials);
    await rejects(() => presign({ ...request, url: new URL(done) }, credentials), TypeError, /already presigned/);
  });

  test(`${name}: expires must be a whole number of seconds up to seven days`, async () => {
    for (const expires of ['60&x-evil=1', 0, -1, 1.5, 604801, NaN]) await rejects(() => presign({ ...request, expires }, credentials), RangeError, /expires/);
    for (const expires of [1, 3600, 604800]) assert.match(await presign({ ...request, expires }, credentials), new RegExp(`X-Amz-Expires=${expires}&`));
  });

  test(`${name}: a region and service with slashes do not share a cached signing key`, async () => {
    const sign = async (region, service) => (await getAuthHeaders({ method: 'GET', url: new URL('https://x.example.com/'), region, service, now }, credentials)).authorization;
    const first = await sign('a/b', 'c');
    const second = await sign('a', 'b/c');
    assert.notEqual(second.slice(-64), first.slice(-64));
    assert.equal(await sign('a/b', 'c'), first);
  });

  test(`${name}: a SigV4a authorization cannot start a chunk or event stream`, async () => {
    const v4a = await getAuthHeadersV4a({ ...request, regionSet: '*' }, credentials);
    await rejects(() => chunkSigner(v4a, credentials), TypeError, /getAuthHeaders/);
    await rejects(() => eventSigner(v4a, credentials), TypeError, /getAuthHeaders/);
  });

  test(`${name}: an empty chunk is not sent and does not end the upload`, async () => {
    const signer = await chunkSigner(await chunkedHeaders(), credentials);
    const empty = await signer.chunk(new Uint8Array(0));
    assert.equal(empty.length, 0);
    const reference = await (await chunkSigner(await chunkedHeaders(), credentials)).chunk(new Uint8Array([1, 2, 3]));
    assert.deepEqual(await signer.chunk(new Uint8Array([1, 2, 3])), reference);
  });

  test(`${name}: an event signed at a fractional millisecond time is the same as at the whole millisecond`, async () => {
    const message = new Uint8Array([1, 2, 3]);
    const a = await (await eventSigner(await getAuthHeaders({ ...request, service: 'transcribe' }, credentials), credentials)).sign(message, now + 5.7);
    const b = await (await eventSigner(await getAuthHeaders({ ...request, service: 'transcribe' }, credentials), credentials)).sign(message, now + 5);
    assert.deepEqual(a, b);
  });

  test(`${name}: SigV4a still needs a region set`, async () => {
    await rejects(() => getAuthHeadersV4a(request, credentials), TypeError, /regionSet/);
  });
}
