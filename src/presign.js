// Presigned URLs: the signature goes in the query string instead of the authorization header.
import { symmetric, canonicalPath, canonicalQuery, insert, headerValue, signHeaderName, amzDatetime, payloadHashOf, stringToSign } from './base.js';

export const encodeQueryPart = (text) => encodeURIComponent(text).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());

/**
 * Everything up to the hashing for a presigned URL. `request.expires` is the lifetime in seconds (default 3600). Only the host and request.signHeaders are
 * signed; S3 URLs are always UNSIGNED-PAYLOAD, other services sign the body hash. `extra` is appended to the authentication parameters.
 */
export function preparePresign(request, credentials, payloadHash, scheme = symmetric, extra = '') {
  const { url, signHeaders } = request;
  const method = request.method.toUpperCase();
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new TypeError('presign needs an http or https URL');
  if (url.search.length > 1 && (url.search.includes('X-Amz-Signature=') || url.search.includes('X-Amz-Algorithm='))) throw new TypeError('the URL is already presigned');
  const expires = request.expires ?? 3600;
  if (!Number.isInteger(expires) || expires < 1 || expires > 604800) throw new RangeError('expires must be a whole number of seconds from 1 to 604800 (7 days)');
  const region = request.region ?? '';
  const service = request.service ?? 's3';
  const datetime = amzDatetime(request.now ?? Date.now());
  const date = datetime.slice(0, 8);
  const credentialScope = scheme.scope(date, region, service);
  const names = ['host'];
  const values = [url.host];
  if (signHeaders !== undefined) for (const name of Object.keys(signHeaders)) insert(names, values, signHeaderName(name, signHeaders[name]), headerValue(signHeaders[name]));
  let canonicalHeaders = '';
  for (let i = 0; i < names.length; i++) canonicalHeaders += `${names[i]}:${values[i]}\n`;
  const signedHeaders = names.join(';');
  let auth = `X-Amz-Algorithm=${scheme.algorithm}&X-Amz-Credential=${encodeQueryPart(`${credentials.accessKeyId}/${credentialScope}`)}&X-Amz-Date=${datetime}&X-Amz-Expires=${expires}&X-Amz-SignedHeaders=${encodeQueryPart(signedHeaders)}`;
  if (credentials.sessionToken) auth += `&X-Amz-Security-Token=${encodeQueryPart(credentials.sessionToken)}`;
  auth += extra;
  const query = url.search.length > 1 ? url.search + '&' + auth : '?' + auth;
  const hash = service === 's3' || request.unsignedPayload ? 'UNSIGNED-PAYLOAD' : payloadHash;
  const canonicalRequest = `${method}\n${canonicalPath(service, url.pathname)}\n${canonicalQuery(query)}\n${canonicalHeaders}\n${signedHeaders}\n${hash}`;
  return { canonicalRequest, datetime, date, region, service, credentialScope, signedHeaders, algorithm: scheme.algorithm, base: url.origin + url.pathname, query };
}

/** The URL to hand out: the original URL with the authentication query parameters and the signature appended. */
export const presignedUrl = (prepared, signature) => `${prepared.base}${prepared.query}&X-Amz-Signature=${signature}`;

/**
 * @param {import('./base.js').Primitives} primitives
 * @returns {(request: import('./base.js').SignRequest, credentials: import('./base.js').Credentials) => string}
 */
export function createPresigner({ hexHash, hmacHex, getSigningKey }) {
  return function presign(request, credentials) {
    const prepared = preparePresign(request, credentials, payloadHashOf(request, hexHash));
    return presignedUrl(
      prepared,
      hmacHex(getSigningKey(credentials.secretAccessKey, prepared.date, prepared.region, prepared.service), stringToSign(prepared, hexHash(prepared.canonicalRequest))),
    );
  };
}
