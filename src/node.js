// Node.js, Deno and Cloudflare Workers with the nodejs_compat flag: node:crypto.
import crypto from 'node:crypto';
import { createSigner, createKeys } from './base.js';
import { createPresigner } from './presign.js';
import { createSignerV4a, createPresignerV4a } from './v4a.js';
import { ecdsa } from './ecdsa-node.js';
import { createChunkSigner } from './chunks.js';
import { createEventSigner } from './events.js';

const utf8 = /* @__PURE__ */ new TextEncoder();
const maxData = 1024;
const inner = /* @__PURE__ */ new Uint8Array(64 + maxData); // the ipad block, then the data
const outer = /* @__PURE__ */ new Uint8Array(64 + 32); // the opad block, then the inner digest
const data = /* @__PURE__ */ inner.subarray(64);
/** @type {Uint8Array[]} */
const innerViews = [];
/** @type {Uint8Array | undefined} */
let blockKey;
/** @param {number} c */
const nibble = (c) => (c > 96 ? c - 87 : c - 48);

// HMAC-SHA-256 as two one-shot hashes over preallocated buffers: it avoids creating a Hmac object per signature.
// Only a key of at most 64 bytes is handled; the signing key is always 32 bytes.
/**
 * @param {Uint8Array} key
 * @param {string} text
 */
function hmacHexOneShot(key, text) {
  if (key !== blockKey) {
    blockKey = key;
    inner.fill(0x36, 0, 64);
    outer.fill(0x5c, 0, 64);
    for (let i = 0; i < key.length; i++) {
      inner[i] = /** @type {number} */ (inner[i]) ^ /** @type {number} */ (key[i]);
      outer[i] = /** @type {number} */ (outer[i]) ^ /** @type {number} */ (key[i]);
    }
  }
  const end = 64 + utf8.encodeInto(text, data).written;
  const hex = crypto.hash('sha256', (innerViews[end] ??= inner.subarray(0, end)), 'hex');
  for (let i = 0; i < 32; i++) {
    outer[64 + i] = (nibble(hex.charCodeAt(2 * i)) << 4) | nibble(hex.charCodeAt(2 * i + 1));
  }
  return crypto.hash('sha256', outer, 'hex');
}

/**
 * @param {Uint8Array} key
 * @param {string} text
 */
const hmacHexStreaming = (key, text) => crypto.createHmac('sha256', key).update(text).digest('hex');

/**
 * @param {string | Uint8Array} key
 * @param {string} text
 */
const hmac = (key, text) => crypto.createHmac('sha256', key).update(text).digest();

// The one-shot form is used only when it agrees with the streaming one on a sample, and only for short data. The sample is checked on first use.
/** @type {boolean | undefined} */
let oneShotWorks;
function probe() {
  const key = hmac('probe', 'key');
  const text = 'AWS4-HMAC-SHA256\n20130524T000000Z';
  const works = hmacHexOneShot(key, text) === hmacHexStreaming(key, text);
  blockKey = undefined;
  return works;
}
/**
 * @param {Uint8Array} key
 * @param {string} text
 */
const hmacHex = (key, text) =>
  (oneShotWorks ??= probe()) && text.length * 3 <= maxData && key.length <= 64
    ? hmacHexOneShot(key, text)
    : hmacHexStreaming(key, text);

const getSigningKey = /* @__PURE__ */ createKeys(hmac);
/** @param {string | Uint8Array} text */
const hexHash = (text) => crypto.hash('sha256', text, 'hex');
const primitives = { hexHash, hmac, hmacHex, getSigningKey };

export const getAuthHeaders = /* @__PURE__ */ createSigner(primitives);
export const presign = /* @__PURE__ */ createPresigner(primitives);
export const getAuthHeadersV4a = /* @__PURE__ */ createSignerV4a({ hexHash, hmac, ecdsa });
export const presignV4a = /* @__PURE__ */ createPresignerV4a({ hexHash, hmac, ecdsa });
export const chunkSigner = /* @__PURE__ */ createChunkSigner(primitives);
export const eventSigner = /* @__PURE__ */ createEventSigner(primitives);
