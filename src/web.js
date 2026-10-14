// Cloudflare Workers without nodejs_compat, browsers, and anywhere else that has WebCrypto but not node:crypto.
// WebCrypto only offers promises, so this entry returns a promise; everything else matches the other entries.
import { payloadHashOf, prepare, stringToSign, authorize } from './base.js';
import { preparePresign, presignedUrl } from './presign.js';
import { asymmetric, withRegionSet, regionSetQuery, kdfInput, scalarFrom } from './v4a.js';
import { seedOf, chunkStringToSign, trailerStringToSign, canonicalTrailers, frameChunk, frameEnd } from './chunks.js';
import { dateHeader, frameEvent, eventStringToSign, eventScope } from './events.js';

const subtle = /* @__PURE__ */ (() => globalThis.crypto.subtle)();
const utf8 = /* @__PURE__ */ new TextEncoder();

const hexOfByte = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'));
function toHex(buffer) {
  const bytes = new Uint8Array(buffer);
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += hexOfByte[bytes[i]];
  return out;
}

const hexHash = async (data) => toHex(await subtle.digest('SHA-256', typeof data === 'string' ? utf8.encode(data) : data));
const importKey = (raw) => subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
// the next key in the derivation chain: the HMAC of data, as a key
const deriveKey = async (key, data) => importKey(await subtle.sign('HMAC', key, utf8.encode(data)));

const signingKeys = new Map();
const maxSigningKeys = 1000;
let lastSecret;
let lastDate;
let lastRegion;
let lastService;
let lastKey;

async function getSigningKey(secretAccessKey, date, region, service) {
  if (secretAccessKey === lastSecret && date === lastDate && region === lastRegion && service === lastService) return lastKey;
  const cacheKey = `${date}/${region}/${service}/${secretAccessKey}`;
  let signingKey = signingKeys.get(cacheKey);
  if (signingKey === undefined) {
    const dateKey = await deriveKey(await importKey(utf8.encode('AWS4' + secretAccessKey)), date);
    signingKey = await deriveKey(await deriveKey(await deriveKey(dateKey, region), service), 'aws4_request');
    if (signingKeys.size >= maxSigningKeys) signingKeys.delete(signingKeys.keys().next().value);
    signingKeys.set(cacheKey, signingKey);
  }
  lastSecret = secretAccessKey;
  lastDate = date;
  lastRegion = region;
  lastService = service;
  lastKey = signingKey;
  return signingKey;
}

const signSymmetric = async (credentials, prepared, text) => toHex(await subtle.sign('HMAC', await getSigningKey(credentials.secretAccessKey, prepared.date, prepared.region, prepared.service), utf8.encode(text)));

// SigV4a: the derived scalar goes in as a PKCS#8 private key without the public point, which WebCrypto computes itself
const pkcs8 = /* @__PURE__ */ Uint8Array.from([0x30, 0x41, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07, 0x04, 0x27, 0x30, 0x25, 0x02, 0x01, 0x01, 0x04, 0x20]);
const asymmetricKeys = new Map();
async function getAsymmetricKey({ accessKeyId, secretAccessKey }) {
  const id = `${accessKeyId}/${secretAccessKey}`;
  let key = asymmetricKeys.get(id);
  if (key === undefined) {
    const root = await importKey(utf8.encode('AWS4A' + secretAccessKey));
    for (let counter = 1; key === undefined; counter++) {
      if (counter > 127) throw new Error('no SigV4a key for these credentials');
      const d = scalarFrom(new Uint8Array(await subtle.sign('HMAC', root, utf8.encode(kdfInput(accessKeyId, counter)))));
      if (d !== undefined) {
        const der = new Uint8Array(pkcs8.length + 32);
        der.set(pkcs8);
        der.set(d, pkcs8.length);
        key = await subtle.importKey('pkcs8', der, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
      }
    }
    if (asymmetricKeys.size >= 1000) asymmetricKeys.delete(asymmetricKeys.keys().next().value);
    asymmetricKeys.set(id, key);
  }
  return key;
}
// r and s as DER integers: leading zeros dropped, a zero byte in front when the top bit is set
function derInteger(bytes) {
  let start = 0;
  while (start < bytes.length - 1 && bytes[start] === 0) start++;
  const body = bytes.subarray(start);
  return body[0] & 0x80 ? [0x02, body.length + 1, 0, ...body] : [0x02, body.length, ...body];
}
async function signAsymmetric(credentials, text) {
  const raw = new Uint8Array(await subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, await getAsymmetricKey(credentials), utf8.encode(text)));
  const body = [...derInteger(raw.subarray(0, 32)), ...derInteger(raw.subarray(32))];
  return toHex(Uint8Array.from([0x30, body.length, ...body]));
}

/**
 * Same request and credentials as the other entries; resolves to the headers to send.
 * @param {import('./base.js').SignRequest} request
 * @param {import('./base.js').Credentials} credentials
 * @returns {Promise<import('./base.js').AuthHeaders>}
 */
export async function getAuthHeaders(request, credentials) {
  const prepared = prepare(request, credentials, await payloadHashOf(request, hexHash));
  return authorize(prepared, credentials.accessKeyId, await signSymmetric(credentials, prepared, stringToSign(prepared, await hexHash(prepared.canonicalRequest))));
}

/**
 * SigV4a: the same, signed with ECDSA for the regions in `request.regionSet` ('us-east-1,us-west-2' or '*').
 * @param {import('./base.js').SignRequest} request
 * @param {import('./base.js').Credentials} credentials
 * @returns {Promise<import('./base.js').AuthHeaders>}
 */
export async function getAuthHeadersV4a(request, credentials) {
  const prepared = prepare(withRegionSet(request), credentials, await payloadHashOf(request, hexHash), asymmetric);
  return authorize(prepared, credentials.accessKeyId, await signAsymmetric(credentials, stringToSign(prepared, await hexHash(prepared.canonicalRequest))));
}

/**
 * A presigned URL for the same request and credentials; `request.expires` is the lifetime in seconds (default 3600).
 * @param {import('./base.js').SignRequest} request
 * @param {import('./base.js').Credentials} credentials
 * @returns {Promise<string>}
 */
export async function presign(request, credentials) {
  const prepared = preparePresign(request, credentials, await payloadHashOf(request, hexHash));
  return presignedUrl(prepared, await signSymmetric(credentials, prepared, stringToSign(prepared, await hexHash(prepared.canonicalRequest))));
}

/**
 * SigV4a presigned URL for the regions in `request.regionSet`.
 * @param {import('./base.js').SignRequest} request
 * @param {import('./base.js').Credentials} credentials
 * @returns {Promise<string>}
 */
export async function presignV4a(request, credentials) {
  const prepared = preparePresign(request, credentials, await payloadHashOf(request, hexHash), asymmetric, regionSetQuery(request));
  return presignedUrl(prepared, await signAsymmetric(credentials, stringToSign(prepared, await hexHash(prepared.canonicalRequest))));
}

const signWith = async (key, text) => toHex(await subtle.sign('HMAC', key, utf8.encode(text)));

/**
 * Signs an aws-chunked upload chunk by chunk; the same shape as the other entries, with promises.
 * @param {import('./base.js').AuthHeaders} authHeaders - the headers getAuthHeaders returned for the request
 * @param {import('./base.js').Credentials} credentials
 * @returns {{ chunk: (data: Uint8Array) => Promise<Uint8Array>, end: (trailers?: Record<string, string>) => Promise<Uint8Array> }}
 */
export function chunkSigner(authHeaders, credentials) {
  const seed = seedOf(authHeaders);
  let previous = seed.signature;
  const keyPromise = getSigningKey(credentials.secretAccessKey, seed.date, seed.region, seed.service);
  // chunks are signed one after the other: a call waits for the one before it
  /** @type {Promise<any>} */
  let turn = Promise.resolve();
  const sign = (data) => (turn = turn.then(async () => (previous = await signWith(await keyPromise, chunkStringToSign(seed.datetime, seed.scope, previous, await hexHash(data))))));
  return {
    chunk: async (data) => frameChunk(await sign(data), data),
    async end(trailers) {
      const signature = await sign(new Uint8Array(0));
      if (trailers === undefined) return frameEnd(signature);
      const text = canonicalTrailers(trailers);
      return frameEnd(signature, text, await signWith(await keyPromise, trailerStringToSign(seed.datetime, seed.scope, signature, await hexHash(text))));
    },
  };
}

/**
 * Signs event-stream messages in order.
 * @param {import('./base.js').AuthHeaders} authHeaders - the headers getAuthHeaders returned for the request
 * @param {import('./base.js').Credentials} credentials
 * @returns {{ sign: (message: Uint8Array, now?: number) => Promise<Uint8Array> }}
 */
export function eventSigner(authHeaders, credentials) {
  const seed = seedOf(authHeaders);
  let previous = seed.signature;
  /** @type {Promise<any>} */
  let turn = Promise.resolve();
  return {
    sign: (message, now = Date.now()) => (turn = turn.then(async () => {
      const { datetime, scope, date } = eventScope(now, seed.region, seed.service);
      const header = dateHeader(now);
      previous = await signWith(await getSigningKey(credentials.secretAccessKey, date, seed.region, seed.service), eventStringToSign(datetime, scope, previous, await hexHash(header), await hexHash(message)));
      return frameEvent(header, previous, message);
    })),
  };
}
