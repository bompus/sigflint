// Bun: its own SHA-256 and HMAC, which are faster than node:crypto there.
import crypto from 'node:crypto';
import { createSigner } from './core.js';

const bun = /** @type {any} */ (globalThis).Bun;

// the HMAC state for the signing key in use is built once and cloned for each signature
let baseKey;
let base;

export const getAuthHeaders = createSigner({
  hexHash: (data) => bun.SHA256.hash(data, 'hex'),
  hmac: (key, data) => crypto.createHmac('sha256', key).update(data).digest(),
  hmacHex: (key, data) => {
    if (key !== baseKey) {
      baseKey = key;
      base = new bun.CryptoHasher('sha256', key);
    }
    return base.copy().update(data).digest('hex');
  },
});
