// Bun: its own SHA-256 and HMAC, which are faster than node:crypto there.
import crypto from 'node:crypto';
import { createSigner, createKeys } from './base.js';
import { createPresigner } from './presign.js';
import { createSignerV4a, createPresignerV4a } from './v4a.js';
import { ecdsa } from './ecdsa-node.js';
import { createChunkSigner } from './chunks.js';
import { createEventSigner } from './events.js';

const bun = /** @type {any} */ (globalThis).Bun;

// the HMAC state for the signing key in use is built once and cloned for each signature
/** @type {Uint8Array | undefined} */
let baseKey;
/** @type {any} */
let base;

/**
 * @param {string | Uint8Array} key
 * @param {string} data
 */
const hmac = (key, data) => crypto.createHmac('sha256', key).update(data).digest();
const getSigningKey = /* @__PURE__ */ createKeys(hmac);
/** @param {string | Uint8Array} data */
const hexHash = (data) => bun.SHA256.hash(data, 'hex');
const primitives = {
  hexHash,
  hmac,
  /**
   * @param {Uint8Array} key
   * @param {string} data
   */
  hmacHex: (key, data) => {
    if (key !== baseKey) {
      baseKey = key;
      base = new bun.CryptoHasher('sha256', key);
    }
    return base.copy().update(data).digest('hex');
  },
  getSigningKey,
};

export const getAuthHeaders = /* @__PURE__ */ createSigner(primitives);
export const presign = /* @__PURE__ */ createPresigner(primitives);
export const getAuthHeadersV4a = /* @__PURE__ */ createSignerV4a({ hexHash, hmac, ecdsa });
export const presignV4a = /* @__PURE__ */ createPresignerV4a({ hexHash, hmac, ecdsa });
export const chunkSigner = /* @__PURE__ */ createChunkSigner(primitives);
export const eventSigner = /* @__PURE__ */ createEventSigner(primitives);
