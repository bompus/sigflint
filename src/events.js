// Event streams (Transcribe, Lex, Bedrock, Kinesis, ...): each message is wrapped in an outer message that carries a :date and a :chunk-signature header.
import { amzDatetime } from './base.js';
import { seedOf, utf8 } from './chunks.js';

let crcTable;
function crc32(bytes, start, end) {
  if (crcTable === undefined) {
    crcTable = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c;
    }
  }
  let crc = -1;
  for (let i = start; i < end; i++) crc = crcTable[(crc ^ bytes[i]) & 255] ^ (crc >>> 8);
  return ~crc >>> 0;
}

/** The :date header of an event: name, type 8 (timestamp), milliseconds since the epoch as 8 bytes. */
export function dateHeader(ms) {
  const out = new Uint8Array(15);
  out[0] = 5;
  out.set(utf8.encode(':date'), 1);
  out[6] = 8;
  new DataView(out.buffer).setBigInt64(7, BigInt(Math.floor(ms)));
  return out;
}

/** The signed event: prelude, the :date and :chunk-signature headers, the inner message as payload, checksums. */
export function frameEvent(dateBytes, signatureHex, inner) {
  const headersLength = dateBytes.length + 52;
  const out = new Uint8Array(16 + headersLength + inner.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, out.length);
  view.setUint32(4, headersLength);
  view.setUint32(8, crc32(out, 0, 8));
  out.set(dateBytes, 12);
  let at = 12 + dateBytes.length;
  out[at++] = 16;
  out.set(utf8.encode(':chunk-signature'), at);
  at += 16;
  out[at++] = 6;
  view.setUint16(at, 32);
  at += 2;
  for (let i = 0; i < 32; i++) out[at + i] = parseInt(signatureHex.slice(2 * i, 2 * i + 2), 16);
  at += 32;
  out.set(inner, at);
  view.setUint32(out.length - 4, crc32(out, 0, out.length - 4));
  return out;
}

export const eventStringToSign = (datetime, scope, previous, headersHash, payloadHash) =>
  `AWS4-HMAC-SHA256-PAYLOAD\n${datetime}\n${scope}\n${previous}\n${headersHash}\n${payloadHash}`;
export const eventScope = (ms, region, service) => {
  const datetime = amzDatetime(ms);
  return { datetime, scope: `${datetime.slice(0, 8)}/${region}/${service}/aws4_request`, date: datetime.slice(0, 8) };
};

/**
 * @typedef {Object} EventSigner
 * @property {(message: Uint8Array, now?: number) => Uint8Array} sign - the signed event to send for one encoded message
 */

/**
 * @param {import('./base.js').Primitives} primitives
 * @returns {(authHeaders: import('./base.js').AuthHeaders, credentials: import('./base.js').Credentials) => EventSigner}
 */
export function createEventSigner({ hexHash, hmacHex, getSigningKey }) {
  return function eventSigner(authHeaders, credentials) {
    const seed = seedOf(authHeaders);
    let previous = seed.signature;
    return {
      sign(message, now = Date.now()) {
        const { datetime, scope, date } = eventScope(now, seed.region, seed.service);
        const header = dateHeader(now);
        previous = hmacHex(
          getSigningKey(credentials.secretAccessKey, date, seed.region, seed.service),
          eventStringToSign(datetime, scope, previous, hexHash(header), hexHash(message)),
        );
        return frameEvent(header, previous, message);
      },
    };
  };
}
