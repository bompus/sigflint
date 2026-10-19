// Every case in corpus.json against the reference signature that botocore's S3 signing steps produce for it
// (see conformance/). The corpus holds the four examples from the S3 documentation, edge cases for paths, queries,
// headers, bodies and session tokens, and 3,300 seeded random requests.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { entries } from './entry.js';
import { credentials, signCase } from './helpers.js';

/** @type {import('./helpers.js').CorpusCase[]} */
const corpus = JSON.parse(readFileSync(new URL('./corpus.json', import.meta.url), 'utf8'));

// Each entry runs the corpus: the synchronous source, the built file Node and Bun load, and the WebCrypto entry (its results are promises; awaiting a value is harmless).
for (const [name, { getAuthHeaders }] of entries) {
  test(`${name}: matches the botocore reference signature for every case`, async () => {
    const failures = [];
    let checked = 0;
    for (const c of corpus) {
      if (c.kind === 'extra') {
        continue;
      }
      checked++;
      const got = (await signCase(getAuthHeaders, c)).authorization.slice(-64);
      if (got !== c.sig) {
        failures.push({ id: c.id, href: c.href, expected: c.sig, got, canonical: c.canonical });
      }
    }
    assert.ok(checked >= 3300, `only ${checked} cases checked`);
    assert.deepEqual(failures.slice(0, 5), [], `${failures.length} of ${checked} cases differ`);
  });
}

// the examples published in the S3 documentation, with the full Authorization value
const awsExamples = [
  [
    'GET Object with a Range header',
    'aws-get-object-range',
    'host;range;x-amz-content-sha256;x-amz-date',
    'f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41',
  ],
  [
    'PUT Object',
    'aws-put-object',
    'date;host;x-amz-content-sha256;x-amz-date;x-amz-storage-class',
    '98ad721746da40c64f1a55b78f14c238d841ea1380cd77a1b5971af0ece108bd',
  ],
  [
    'GET Bucket Lifecycle',
    'aws-lifecycle',
    'host;x-amz-content-sha256;x-amz-date',
    'fea454ca298b7da1c68078a5d1bdbfbbe0d65c699e0f91ac7a200a0136783543',
  ],
  [
    'GET Bucket (List Objects)',
    'aws-list-objects',
    'host;x-amz-content-sha256;x-amz-date',
    '34b48302e7b5fa45bde8084f4b7868a86f0a534bc59db6670ed5711ef69dc6f7',
  ],
];
for (const [name, id, signedHeaders, signature] of awsExamples) {
  test(`AWS documentation example: ${name}`, async () => {
    const headers = await signCase(
      entries[0][1].getAuthHeaders,
      /** @type {import('./helpers.js').CorpusCase} */ (corpus.find((c) => c.id === id)),
    );
    assert.equal(
      headers.authorization,
      `AWS4-HMAC-SHA256 Credential=${credentials.accessKeyId}/20130524/us-east-1/s3/aws4_request, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    );
  });
}
