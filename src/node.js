// Node.js, Deno and Cloudflare Workers with the nodejs_compat flag: node:crypto.
import crypto from 'node:crypto';
import { createSigner } from './core.js';

const utf8 = new TextEncoder();
const maxData = 1024;
const inner = new Uint8Array(64 + maxData); // the ipad block, then the data
const outer = new Uint8Array(64 + 32); // the opad block, then the inner digest
const data = inner.subarray(64);
const innerViews = [];
let blockKey;
const nibble = (c) => (c > 96 ? c - 87 : c - 48);

// HMAC-SHA-256 as two one-shot hashes over preallocated buffers: it avoids creating a Hmac object per signature.
// Only a key of at most 64 bytes is handled; the signing key is always 32 bytes.
function hmacHexOneShot(key, text) {
  if (key !== blockKey) {
    blockKey = key;
    inner.fill(0x36, 0, 64);
    outer.fill(0x5c, 0, 64);
    for (let i = 0; i < key.length; i++) {
      inner[i] ^= key[i];
      outer[i] ^= key[i];
    }
  }
  const end = 64 + utf8.encodeInto(text, data).written;
  const hex = crypto.hash('sha256', (innerViews[end] ??= inner.subarray(0, end)), 'hex');
  for (let i = 0; i < 32; i++) outer[64 + i] = (nibble(hex.charCodeAt(2 * i)) << 4) | nibble(hex.charCodeAt(2 * i + 1));
  return crypto.hash('sha256', outer, 'hex');
}

const hmacHexStreaming = (key, text) => crypto.createHmac('sha256', key).update(text).digest('hex');

const hmac = (key, text) => crypto.createHmac('sha256', key).update(text).digest();

// The one-shot form is used only when it agrees with the streaming one on a sample, and only for short data.
const probeKey = hmac('probe', 'key');
const oneShotWorks = hmacHexOneShot(probeKey, 'AWS4-HMAC-SHA256\n20130524T000000Z') === hmacHexStreaming(probeKey, 'AWS4-HMAC-SHA256\n20130524T000000Z');
blockKey = undefined;

export const getAuthHeaders = createSigner({
  hexHash: (text) => crypto.hash('sha256', text, 'hex'),
  hmac,
  hmacHex: oneShotWorks
    ? (key, text) => (text.length * 3 > maxData || key.length > 64 ? hmacHexStreaming(key, text) : hmacHexOneShot(key, text))
    : hmacHexStreaming,
});
