// SigV4a. ECDSA signatures are randomised, so nothing is compared byte for byte. The AWS CRT (botocore's reference signer, see conformance/) signed each request;
// its signature must verify, under the public key derived here, over the string to sign built here. That ties the key derivation, the canonical request and the
// credential scope to the reference. Our own signatures must verify under the same key, and every other part of the authorization must equal the reference's.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import { entries } from './entry.js';
import { credentials, now, toMs } from './helpers.js';
import { prepare, payloadHashOf, stringToSign } from '../src/base.js';
import { preparePresign } from '../src/presign.js';
import { asymmetric, withRegionSet, regionSetQuery, deriveP256 } from '../src/v4a.js';

const corpus = /** @type {Record<string, any>[]} */ (
  JSON.parse(readFileSync(new URL('./corpus-v4a.json', import.meta.url), 'utf8'))
).filter((c) => !c.skipped);
/** @param {string} text */
const hexHash = (text) => crypto.createHash('sha256').update(text).digest('hex');
/**
 * @param {string | Uint8Array} key
 * @param {string} text
 */
const hmac = (key, text) => crypto.createHmac('sha256', key).update(text).digest();

const d = deriveP256(hmac, credentials.accessKeyId, credentials.secretAccessKey);
const ecdh = crypto.createECDH('prime256v1');
ecdh.setPrivateKey(d);
const point = ecdh.getPublicKey();
const publicKey = crypto.createPublicKey({
  key: {
    kty: 'EC',
    crv: 'P-256',
    x: point.subarray(1, 33).toString('base64url'),
    y: point.subarray(33).toString('base64url'),
  },
  format: 'jwk',
});
/**
 * @param {string} text
 * @param {string} signatureHex
 */
const verifies = (text, signatureHex) =>
  crypto.verify(
    'sha256',
    Buffer.from(text),
    { key: publicKey, dsaEncoding: 'der' },
    Buffer.from(signatureHex, 'hex'),
  );

for (const [name, { getAuthHeadersV4a, presignV4a }] of entries) {
  test(`${name}: the reference signatures verify and ours verify and carry the same parameters`, async () => {
    const failures = [];
    for (const c of corpus) {
      const creds = c.token ? { ...credentials, sessionToken: c.token } : credentials;
      const url = new URL(c.href);
      const request = {
        method: c.method,
        url,
        service: c.service,
        region: c.regionSet,
        regionSet: c.regionSet,
        body: c.body ?? undefined,
        unsignedPayload: c.unsigned && url.protocol === 'https:',
        signHeaders: { ...c.headers },
        expires: c.expires,
        now: toMs(c.stamp),
      };
      if (c.mode === 'header') {
        const prepared = prepare(
          withRegionSet(request),
          creds,
          payloadHashOf(request, hexHash),
          asymmetric,
        );
        const text = stringToSign(prepared, hexHash(prepared.canonicalRequest));
        const [referenceRest, referenceSignature] = c.authorization.split(', Signature=');
        const [ownRest, ownSignature] = (
          await getAuthHeadersV4a(request, creds)
        ).authorization.split(', Signature=');
        if (!verifies(text, referenceSignature)) {
          failures.push(['reference signature', c.id, c.href]);
        }
        if (!verifies(text, ownSignature)) {
          failures.push(['our signature', c.id, c.href]);
        }
        if (ownRest !== referenceRest) {
          failures.push(['authorization parameters', c.id, ownRest, referenceRest]);
        }
      } else {
        const prepared = preparePresign(
          request,
          creds,
          payloadHashOf(request, hexHash),
          asymmetric,
          regionSetQuery(request),
        );
        const text = stringToSign(prepared, hexHash(prepared.canonicalRequest));
        const reference = new URL(c.url);
        const own = new URL(await presignV4a(request, creds));
        /** @param {URL} u */
        const withoutSignature = (u) =>
          JSON.stringify([...u.searchParams].filter(([k]) => k !== 'X-Amz-Signature').sort());
        if (
          !verifies(text, /** @type {string} */ (reference.searchParams.get('X-Amz-Signature')))
        ) {
          failures.push(['reference signature', c.id, c.href]);
        }
        if (!verifies(text, /** @type {string} */ (own.searchParams.get('X-Amz-Signature')))) {
          failures.push(['our signature', c.id, c.href]);
        }
        if (withoutSignature(own) !== withoutSignature(reference)) {
          failures.push(['query parameters', c.id]);
        }
      }
    }
    assert.ok(corpus.length >= 600, `only ${corpus.length} cases`);
    assert.deepEqual(
      failures.slice(0, 5),
      [],
      `${failures.length} failures in ${corpus.length} cases`,
    );
  });
}

test('the scope has no region, and the region set is signed (header) or a query parameter (presigned)', async () => {
  const [, { getAuthHeadersV4a, presignV4a }] = entries[0];
  const request = {
    method: 'GET',
    url: new URL('https://bucket.s3.amazonaws.com/key'),
    regionSet: 'us-east-1,us-west-2',
    now,
  };
  const headers = await getAuthHeadersV4a(request, credentials);
  assert.match(
    headers.authorization,
    /^AWS4-ECDSA-P256-SHA256 Credential=AKIAIOSFODNN7EXAMPLE\/20130524\/s3\/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date;x-amz-region-set, Signature=[0-9a-f]+$/,
  );
  assert.equal(headers['x-amz-region-set'], 'us-east-1,us-west-2');
  const link = new URL(await presignV4a(request, credentials));
  assert.equal(link.searchParams.get('X-Amz-Region-Set'), 'us-east-1,us-west-2');
  assert.equal(link.searchParams.get('X-Amz-Algorithm'), 'AWS4-ECDSA-P256-SHA256');
});

for (const [name, { getAuthHeadersV4a, presignV4a }] of entries) {
  test(`${name}: a missing region set is an error, not a signature`, async () => {
    const request = { method: 'GET', url: new URL('https://bucket.s3.amazonaws.com/key'), now };
    await assert.rejects(async () => getAuthHeadersV4a(request, credentials), TypeError);
    await assert.rejects(
      async () => presignV4a({ ...request, regionSet: '' }, credentials),
      TypeError,
    );
  });
}
