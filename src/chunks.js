// aws-chunked uploads (x-amz-content-sha256: STREAMING-AWS4-HMAC-SHA256-PAYLOAD[-TRAILER]): every chunk is signed with the previous signature, starting from the
// one in the request's authorization header. The pure helpers are shared by the synchronous entries (createChunkSigner) and the WebCrypto one.
import { emptyBodyHash as emptyHash } from './base.js';

export const utf8 = /* @__PURE__ */ new TextEncoder();

/** The seed signature, timestamp and scope of a signed request, from the headers getAuthHeaders returned. */
export function seedOf(authHeaders) {
  const auth = authHeaders.authorization;
  if (typeof auth !== 'string' || !auth.startsWith('AWS4-HMAC-SHA256 '))
    throw new TypeError('authHeaders must be the headers getAuthHeaders returned (a SigV4a signature cannot start a chunk or event stream)');
  const scope = auth.slice(auth.indexOf('Credential=') + 11, auth.indexOf(',')).split('/'); // access key, date, region, service, aws4_request
  return {
    signature: auth.slice(auth.lastIndexOf('Signature=') + 10),
    datetime: authHeaders['x-amz-date'],
    date: scope[1],
    region: scope[2],
    service: scope[3],
    scope: scope.slice(1).join('/'),
  };
}

export const chunkStringToSign = (datetime, scope, previous, payloadHash) => `AWS4-HMAC-SHA256-PAYLOAD\n${datetime}\n${scope}\n${previous}\n${emptyHash}\n${payloadHash}`;
export const trailerStringToSign = (datetime, scope, previous, trailerHash) => `AWS4-HMAC-SHA256-TRAILER\n${datetime}\n${scope}\n${previous}\n${trailerHash}`;

/** Trailing headers in canonical form: lowercase names in name order, each line ending in a newline. */
export function canonicalTrailers(trailers) {
  return Object.keys(trailers)
    .map((name) => [name.toLowerCase(), String(trailers[name]).trim()])
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([name, value]) => `${name}:${value}\n`)
    .join('');
}

/** The bytes of one chunk on the wire: size in hex, signature, the data. */
export function frameChunk(signature, data) {
  const head = utf8.encode(`${data.length.toString(16)};chunk-signature=${signature}\r\n`);
  const out = new Uint8Array(head.length + data.length + 2);
  out.set(head);
  out.set(data, head.length);
  out[out.length - 2] = 13;
  out[out.length - 1] = 10;
  return out;
}

/** The last chunk (no data), with the signed trailing headers when there are any. */
export function frameEnd(signature, trailers, trailerSignature) {
  return utf8.encode(
    trailers === undefined
      ? `0;chunk-signature=${signature}\r\n\r\n`
      : `0;chunk-signature=${signature}\r\n${trailers.replace(/\n/g, '\r\n')}x-amz-trailer-signature:${trailerSignature}\r\n\r\n`,
  );
}

/**
 * @typedef {Object} ChunkSigner
 * @property {(data: Uint8Array) => Uint8Array} chunk - the bytes to send for one chunk of the body
 * @property {(trailers?: Record<string, string>) => Uint8Array} end - the last chunk, with the signed trailing headers when there are any
 */

/**
 * @param {import('./base.js').Primitives} primitives
 * @returns {(authHeaders: import('./base.js').AuthHeaders, credentials: import('./base.js').Credentials) => ChunkSigner}
 */
export function createChunkSigner({ hexHash, hmacHex, getSigningKey }) {
  return function chunkSigner(authHeaders, credentials) {
    const seed = seedOf(authHeaders);
    const key = getSigningKey(credentials.secretAccessKey, seed.date, seed.region, seed.service);
    let previous = seed.signature;
    const sign = (data) => (previous = hmacHex(key, chunkStringToSign(seed.datetime, seed.scope, previous, hexHash(data))));
    return {
      chunk: (data) => (data.length === 0 ? data : frameChunk(sign(data), data)), // a zero-length chunk would end the upload; it is not sent
      end(trailers) {
        const signature = sign(new Uint8Array(0));
        if (trailers === undefined) return frameEnd(signature);
        const text = canonicalTrailers(trailers);
        const trailerSignature = hmacHex(key, trailerStringToSign(seed.datetime, seed.scope, signature, hexHash(text)));
        return frameEnd(signature, text, trailerSignature);
      },
    };
  };
}
