// node gen-stream.mjs out.json : smithy's signer produces chains of chunk signatures and event-message signatures
import { SignatureV4 } from '@smithy/signature-v4';
import { Sha256 } from '@aws-crypto/sha256-js';
import { writeFileSync } from 'node:fs';
let seed = 20261016;
const rnd = () => {
  seed ^= seed << 13;
  seed >>>= 0;
  seed ^= seed >>> 17;
  seed ^= seed << 5;
  seed >>>= 0;
  return seed / 2 ** 32;
};
/** @param {number} n */
const bytes = (n) => Uint8Array.from({ length: n }, () => Math.floor(rnd() * 256));
/** @param {number} n */
const hex = (n) => Array.from(bytes(n), (b) => b.toString(16).padStart(2, '0')).join('');
const credentials = {
  accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
};
const SIZES = [0, 1, 17, 64, 1000, 4096, 65536];
const REGIONS = ['us-east-1', 'eu-west-1', 'ap-southeast-2'];
/**
 * @typedef {Object} Chain
 * @property {string} region
 * @property {string} service
 * @property {string} seed
 * @property {{ at: number, payload: string, signature: string }[]} items
 */
/** @type {{ chunks: Chain[], events: Chain[] }} */
const out = { chunks: [], events: [] };
for (let i = 0; i < 300; i++) {
  const region = /** @type {string} */ (REGIONS[Math.floor(rnd() * 3)]),
    service =
      rnd() < 0.5
        ? 's3'
        : /** @type {string} */ (['transcribe', 'lex', 'bedrock'][Math.floor(rnd() * 3)]);
  const signer = new SignatureV4({
    credentials,
    region,
    service,
    sha256: Sha256,
    applyChecksum: false,
  });
  const start = Date.UTC(2024, 0, 1) + Math.floor(rnd() * 2e10);
  /** @type {Chain} */
  const chain = { region, service, seed: hex(32), items: [] };
  let prior = chain.seed;
  const n = 1 + Math.floor(rnd() * 5);
  for (let j = 0; j < n; j++) {
    const payload = bytes(/** @type {number} */ (SIZES[Math.floor(rnd() * SIZES.length)]));
    const signingDate = new Date(start); // aws-chunked signs every chunk with the date of the upload's headers (the seed's x-amz-date)
    // signEvent is marked private in the SDK's type declarations
    /** @type {string} */
    const signature = await /** @type {any} */ (signer).signEvent(
      { headers: new Uint8Array(0), payload },
      { signingDate, priorSignature: prior, signingRegion: region, signingService: service },
    );
    chain.items.push({
      at: signingDate.getTime(),
      payload: Buffer.from(payload).toString('base64'),
      signature,
    });
    prior = signature;
  }
  out.chunks.push(chain);
}
for (let i = 0; i < 300; i++) {
  const region = /** @type {string} */ (REGIONS[Math.floor(rnd() * 3)]),
    service = /** @type {string} */ (['transcribe', 'lex', 'bedrock', 's3'][Math.floor(rnd() * 4)]);
  const signer = new SignatureV4({
    credentials,
    region,
    service,
    sha256: Sha256,
    applyChecksum: false,
  });
  const start = Date.UTC(2024, 0, 1) + Math.floor(rnd() * 2e10);
  /** @type {Chain} */
  const chain = { region, service, seed: hex(32), items: [] };
  let prior = chain.seed;
  const n = 1 + Math.floor(rnd() * 4);
  for (let j = 0; j < n; j++) {
    const payload = bytes(/** @type {number} */ (SIZES[Math.floor(rnd() * 6)]));
    const signingDate = new Date(start + j * Math.floor(rnd() * 90000000)); // events may cross a day boundary
    const { signature } = await signer.signMessage(
      {
        message: { headers: { ':date': { type: 'timestamp', value: signingDate } }, body: payload },
        priorSignature: prior,
      },
      { signingDate, signingRegion: region, signingService: service },
    );
    chain.items.push({
      at: signingDate.getTime(),
      payload: Buffer.from(payload).toString('base64'),
      signature,
    });
    prior = signature;
  }
  out.events.push(chain);
}
writeFileSync(/** @type {string} */ (process.argv[2]), JSON.stringify(out));
console.log(out.chunks.length, 'chunk chains,', out.events.length, 'event chains');
