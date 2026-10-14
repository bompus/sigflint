// SigV4a (multi-region): ECDSA P-256 instead of HMAC, a credential scope without the region, and the region set as a signed header (or a query parameter when
// presigning). The runtime entries supply the ECDSA primitive. Nothing in the symmetric path imports this file.
import { prepare, payloadHashOf, stringToSign, authorize } from './base.js';
import { preparePresign, presignedUrl, encodeQueryPart } from './presign.js';

export const asymmetric = { algorithm: 'AWS4-ECDSA-P256-SHA256', scope: (date, _region, service) => `${date}/${service}/aws4_request` };

function regionSetOf(request) {
  const regionSet = request.regionSet;
  if (typeof regionSet !== 'string' || regionSet === '') throw new TypeError("SigV4a needs request.regionSet, for example 'us-east-1,us-west-2' or '*'");
  return regionSet;
}

/** The request with the region set added as a signed header; `regionSet` is 'us-east-1,us-west-2' or '*'. */
export const withRegionSet = (request) => ({ ...request, signHeaders: { ...request.signHeaders, 'x-amz-region-set': regionSetOf(request) } });

export const regionSetQuery = (request) => `&X-Amz-Region-Set=${encodeQueryPart(regionSetOf(request))}`;

// 4-byte counter 1, label, 0x00, the access key id, the external counter, 256 as 4 bytes
export const kdfInput = (accessKeyId, counter) => `\0\0\0\x01AWS4-ECDSA-P256-SHA256\0${accessKeyId}${String.fromCharCode(counter)}\0\0\x01\0`;

/** The private scalar (HMAC output + 1) when the HMAC output is at most the curve order minus 2, else undefined. */
export function scalarFrom(k) {
  const nMinusTwo = 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc63254fn;
  let c = 0n;
  for (let i = 0; i < 32; i++) c = (c << 8n) | BigInt(k[i]);
  if (c > nMinusTwo) return undefined;
  c += 1n;
  const d = new Uint8Array(32);
  for (let i = 31; i >= 0; i--, c >>= 8n) d[i] = Number(c & 0xffn);
  return d;
}

/** The SigV4a private key: the P-256 scalar derived from the secret key by the counter-mode HMAC construction in the AWS documentation (32 bytes, big-endian). */
export function deriveP256(hmac, accessKeyId, secretAccessKey) {
  for (let counter = 1; counter < 128; counter++) {
    const d = scalarFrom(hmac('AWS4A' + secretAccessKey, kdfInput(accessKeyId, counter)));
    if (d !== undefined) return d;
  }
  throw new Error('no SigV4a key for these credentials');
}

const signers = /* @__PURE__ */ new WeakMap(); // ecdsa -> its signer, so the header and presign functions of one entry share one key cache

/** A signer from the string to sign to a hex DER ECDSA signature, with a cache of the keys built from credentials. Asking again for the same `ecdsa` returns the same signer. */
export function createAsymmetric(hmac, ecdsa) {
  let sign = signers.get(ecdsa);
  if (sign === undefined) signers.set(ecdsa, (sign = signerFor(hmac, ecdsa)));
  return sign;
}

function signerFor(hmac, ecdsa) {
  const keys = new Map();
  return function sign(credentials, text) {
    const id = `${credentials.accessKeyId}/${credentials.secretAccessKey}`;
    let key = keys.get(id);
    if (key === undefined) {
      key = ecdsa.key(deriveP256(hmac, credentials.accessKeyId, credentials.secretAccessKey));
      if (keys.size >= 1000) keys.delete(keys.keys().next().value);
      keys.set(id, key);
    }
    return ecdsa.sign(key, text);
  };
}

/**
 * @typedef {Object} AsymmetricPrimitives
 * @property {(data: string | Uint8Array) => string} hexHash - SHA-256 as lowercase hex
 * @property {(key: string | Uint8Array, data: string) => Uint8Array} hmac - HMAC-SHA-256 as bytes
 * @property {{ key: (scalar: Uint8Array) => unknown, sign: (key: any, text: string) => string }} ecdsa - the entry's ECDSA P-256 primitive; built here rather than in the entry so a bundle without SigV4a does not carry it
 */

/**
 * The synchronous entries' SigV4a header signer.
 * @param {AsymmetricPrimitives} primitives
 * @returns {(request: import('./base.js').SignRequest, credentials: import('./base.js').Credentials) => import('./base.js').AuthHeaders}
 */
export function createSignerV4a({ hexHash, hmac, ecdsa }) {
  const sign = createAsymmetric(hmac, ecdsa);
  return function getAuthHeadersV4a(request, credentials) {
    const prepared = prepare(withRegionSet(request), credentials, payloadHashOf(request, hexHash), asymmetric);
    return authorize(prepared, credentials.accessKeyId, sign(credentials, stringToSign(prepared, hexHash(prepared.canonicalRequest))));
  };
}

/**
 * @param {AsymmetricPrimitives} primitives
 * @returns {(request: import('./base.js').SignRequest, credentials: import('./base.js').Credentials) => string}
 */
export function createPresignerV4a({ hexHash, hmac, ecdsa }) {
  const sign = createAsymmetric(hmac, ecdsa);
  return function presignV4a(request, credentials) {
    const prepared = preparePresign(request, credentials, payloadHashOf(request, hexHash), asymmetric, regionSetQuery(request));
    return presignedUrl(prepared, sign(credentials, stringToSign(prepared, hexHash(prepared.canonicalRequest))));
  };
}
