// Cloudflare Workers without nodejs_compat, browsers, and anywhere else that has WebCrypto but not node:crypto.
// WebCrypto only offers promises, so this entry returns a promise; everything else matches the other entries.
import { payloadHashOf, prepare, stringToSign, authorize } from './core.js';

const subtle = globalThis.crypto.subtle;
const utf8 = new TextEncoder();

const hexOfByte = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'));
function toHex(buffer) {
  const bytes = new Uint8Array(buffer);
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += hexOfByte[bytes[i]];
  return out;
}

const hexHash = async (data) => toHex(await subtle.digest('SHA-256', utf8.encode(data)));
const importKey = (raw) => subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
// the next key in the derivation chain: the HMAC of data, as a key
const deriveKey = async (key, data) => importKey(await subtle.sign('HMAC', key, utf8.encode(data)));

const signingKeys = new Map();
const maxSigningKeys = 1000;
let lastSecret;
let lastDate;
let lastRegion;
let lastKey;

async function getSigningKey(secretAccessKey, date, region) {
  if (secretAccessKey === lastSecret && date === lastDate && region === lastRegion) return lastKey;
  const cacheKey = `${date}/${region}/${secretAccessKey}`;
  let signingKey = signingKeys.get(cacheKey);
  if (signingKey === undefined) {
    const dateKey = await deriveKey(await importKey(utf8.encode('AWS4' + secretAccessKey)), date);
    signingKey = await deriveKey(await deriveKey(await deriveKey(dateKey, region), 's3'), 'aws4_request');
    if (signingKeys.size >= maxSigningKeys) signingKeys.delete(signingKeys.keys().next().value);
    signingKeys.set(cacheKey, signingKey);
  }
  lastSecret = secretAccessKey;
  lastDate = date;
  lastRegion = region;
  lastKey = signingKey;
  return signingKey;
}

/**
 * Same request and credentials as the other entries; resolves to the headers to send.
 * @param {import('./core.js').SignRequest} request
 * @param {import('./core.js').Credentials} credentials
 * @returns {Promise<import('./core.js').AuthHeaders>}
 */
export async function getAuthHeaders(request, credentials) {
  const prepared = prepare(request, credentials, await payloadHashOf(request, hexHash));
  const key = await getSigningKey(credentials.secretAccessKey, prepared.date, prepared.region);
  const signature = toHex(await subtle.sign('HMAC', key, utf8.encode(stringToSign(prepared, await hexHash(prepared.canonicalRequest)))));
  return authorize(prepared, credentials.accessKeyId, signature);
}
