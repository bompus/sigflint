// aws-chunked uploads and event streams. Chunk and event-message signatures chain: each is signed with the one before it. Checked against the two examples in the
// S3 documentation and against chains from the AWS SDK's smithy signer (see conformance/); event frames are also checked structurally.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { entries } from './entry.js';
import { credentials } from './helpers.js';

const corpus = JSON.parse(readFileSync(new URL('./corpus-stream.json', import.meta.url), 'utf8'));
/** @param {Uint8Array} bytes */
const text = (bytes) => new TextDecoder().decode(bytes);
/**
 * @param {string} seed
 * @param {{ date?: string, datetime?: string, region?: string, service?: string }} [scope]
 */
const authFor = (
  seed,
  { date = '20130524', datetime = '20130524T000000Z', region = 'us-east-1', service = 's3' } = {},
) => ({
  authorization: `AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/${date}/${region}/${service}/aws4_request, SignedHeaders=host, Signature=${seed}`,
  'x-amz-date': datetime,
});
/** @param {number} ms */
const datetimeOf = (ms) => new Date(ms).toISOString().replace(/[-:]|\.\d{3}/g, '');
const data = new Uint8Array(65 * 1024).fill(97); // 65 KiB of 'a': a 64 KiB chunk and a 1 KiB chunk

// the table-driven CRC-32 that event frames carry
const crcTable = Int32Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return c;
});
/** @param {Uint8Array} bytes */
const crc32 = (bytes) => {
  let crc = -1;
  for (const b of bytes) {
    crc = /** @type {number} */ (crcTable[(crc ^ b) & 255]) ^ (crc >>> 8);
  }
  return ~crc >>> 0;
};

for (const [name, { chunkSigner, eventSigner }] of entries) {
  void test(`${name}: the AWS documentation example for a chunked upload`, async () => {
    const signer = chunkSigner(
      authFor('4f232c4386841ef735655705268965c44a0e4690baa4adea153f7db9fa80a0a9'),
      credentials,
    );
    const first = await signer.chunk(data.subarray(0, 65536));
    const second = await signer.chunk(data.subarray(65536));
    const last = await signer.end();
    assert.ok(
      text(first.subarray(0, 100)).startsWith(
        '10000;chunk-signature=ad80c730a21e5b8d04586a2213dd63b9a0e99e0e2307b0ade35a65485a288648\r\n',
      ),
    );
    assert.ok(
      text(second.subarray(0, 100)).startsWith(
        '400;chunk-signature=0055627c9e194cb4542bae2aa5492e3c1575bbb81b612b7d234b86a503ef5497\r\n',
      ),
    );
    assert.equal(
      text(last),
      '0;chunk-signature=b6c6ea8a5354eaf15b3cb7646744f4275b71ea724fed81ceb9323e279d449df9\r\n\r\n',
    );
    assert.deepEqual(
      first.subarray(first.length - 65538, first.length - 2),
      data.subarray(0, 65536),
    );
    assert.equal(text(first.subarray(first.length - 2)), '\r\n');
  });

  void test(`${name}: the AWS documentation example for a chunked upload with a signed trailing checksum`, async () => {
    const signer = chunkSigner(
      authFor('106e2a8a18243abcf37539882f36619c00e2dfc72633413f02d3b74544bfeb8e'),
      credentials,
    );
    const first = await signer.chunk(data.subarray(0, 65536));
    const second = await signer.chunk(data.subarray(65536));
    const last = await signer.end({ 'x-amz-checksum-crc32c': 'sOO8/Q==' });
    assert.ok(
      text(first.subarray(0, 100)).startsWith(
        '10000;chunk-signature=b474d8862b1487a5145d686f57f013e54db672cee1c953b3010fb58501ef5aa2\r\n',
      ),
    );
    assert.ok(
      text(second.subarray(0, 100)).startsWith(
        '400;chunk-signature=1c1344b170168f8e65b41376b44b20fe354e373826ccbbe2c1d40a8cae51e5c7\r\n',
      ),
    );
    assert.equal(
      text(last),
      '0;chunk-signature=2ca2aba2005185cf7159c6277faf83795951dd77a3a99e6e65d5c9f85863f992\r\nx-amz-checksum-crc32c:sOO8/Q==\r\nx-amz-trailer-signature:d81f82fc3505edab99d459891051a732e8730629a2e4a59689829ca17fe2e435\r\n\r\n',
    );
  });

  void test(`${name}: every chunk in every smithy chain has the same signature`, async () => {
    const failures = [];
    let chunks = 0;
    for (const chain of corpus.chunks) {
      const dt = datetimeOf(chain.items[0].at);
      const signer = chunkSigner(
        authFor(chain.seed, {
          date: dt.slice(0, 8),
          datetime: dt,
          region: chain.region,
          service: chain.service,
        }),
        credentials,
      );
      for (const item of chain.items) {
        chunks++;
        assert.equal(item.at, chain.items[0].at); // aws-chunked signs every chunk with the date of the upload's headers
        const frame =
          item.payload === ''
            ? await signer.end()
            : await signer.chunk(Uint8Array.from(Buffer.from(item.payload, 'base64')));
        const got = /** @type {RegExpExecArray} */ (
          /chunk-signature=([0-9a-f]{64})/.exec(text(frame.subarray(0, 120)))
        )[1];
        if (got !== item.signature) {
          failures.push({ seed: chain.seed, expected: item.signature, got });
        }
      }
    }
    assert.ok(chunks >= 150, `only ${chunks} chunks`);
    assert.deepEqual(failures.slice(0, 5), []);
  });

  void test(`${name}: every event in every smithy chain has the same signature, and the frame is well formed`, async () => {
    const failures = [];
    let events = 0;
    for (const chain of corpus.events) {
      const dt = datetimeOf(chain.items[0].at);
      const signer = eventSigner(
        authFor(chain.seed, {
          date: dt.slice(0, 8),
          datetime: dt,
          region: chain.region,
          service: chain.service,
        }),
        credentials,
      );
      for (const item of chain.items) {
        events++;
        const frame = await signer.sign(
          Uint8Array.from(Buffer.from(item.payload, 'base64')),
          item.at,
        );
        const view = new DataView(frame.buffer, frame.byteOffset, frame.byteLength);
        const headersLength = view.getUint32(4);
        const signatureAt = 12 + 15 + 1 + 16 + 1 + 2; // prelude, the :date header, the :chunk-signature name, its type and length
        const problems = [];
        if (view.getUint32(0) !== frame.length) {
          problems.push('total length');
        }
        if (view.getUint32(8) !== crc32(frame.subarray(0, 8))) {
          problems.push('prelude checksum');
        }
        if (view.getUint32(frame.length - 4) !== crc32(frame.subarray(0, frame.length - 4))) {
          problems.push('message checksum');
        }
        if (view.getBigInt64(12 + 7) !== BigInt(item.at)) {
          problems.push(':date');
        }
        if (
          Buffer.from(frame.subarray(signatureAt, signatureAt + 32)).toString('hex') !==
          item.signature
        ) {
          problems.push('signature');
        }
        if (
          Buffer.compare(
            frame.subarray(12 + headersLength, frame.length - 4),
            Buffer.from(item.payload, 'base64'),
          ) !== 0
        ) {
          problems.push('payload');
        }
        if (problems.length > 0) {
          failures.push({ seed: chain.seed, problems });
        }
      }
    }
    assert.ok(events >= 100, `only ${events} events`);
    assert.deepEqual(failures.slice(0, 5), []);
  });
}
