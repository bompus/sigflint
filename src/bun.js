// Bun: its own SHA-256 and HMAC, which are faster than node:crypto there.
import crypto from 'node:crypto';
import { createSigner } from './base.js';
import { createPresigner } from './presign.js';
import { createSignerV4a, createPresignerV4a } from './v4a.js';
import { createChunkSigner } from './chunks.js';
import { createEventSigner } from './events.js';

const bun = /** @type {any} */ (globalThis).Bun;

// the HMAC state for the signing key in use is built once and cloned for each signature
let baseKey;
let base;

// SigV4a: ECDSA P-256. The key is rebuilt from the derived scalar; ECDH supplies the public point that a JWK needs.
const b64url = (bytes) => Buffer.from(bytes).toString('base64url');
const ecdsa = {
  key(d) {
    const ecdh = crypto.createECDH('prime256v1');
    ecdh.setPrivateKey(d);
    const point = ecdh.getPublicKey();
    return crypto.createPrivateKey({ key: { kty: 'EC', crv: 'P-256', d: b64url(d), x: b64url(point.subarray(1, 33)), y: b64url(point.subarray(33)) }, format: 'jwk' });
  },
  sign: (key, text) => crypto.sign('sha256', text, { key, dsaEncoding: 'der' }).toString('hex'),
};

const primitives = {
  hexHash: (data) => bun.SHA256.hash(data, 'hex'),
  hmac: (key, data) => crypto.createHmac('sha256', key).update(data).digest(),
  hmacHex: (key, data) => {
    if (key !== baseKey) {
      baseKey = key;
      base = new bun.CryptoHasher('sha256', key);
    }
    return base.copy().update(data).digest('hex');
  },
};

export const getAuthHeaders = /* @__PURE__ */ createSigner(primitives);
export const presign = /* @__PURE__ */ createPresigner(primitives);
export const getAuthHeadersV4a = /* @__PURE__ */ createSignerV4a(primitives, ecdsa);
export const presignV4a = /* @__PURE__ */ createPresignerV4a(primitives, ecdsa);
export const chunkSigner = /* @__PURE__ */ createChunkSigner(primitives);
export const eventSigner = /* @__PURE__ */ createEventSigner(primitives);
