// AWS Signature Version 4 for S3, header based. The hash and HMAC primitives come from the runtime entry that calls
// createSigner, so this file has no imports.
// https://docs.aws.amazon.com/AmazonS3/latest/API/sig-v4-header-based-auth.html
// https://docs.aws.amazon.com/IAM/latest/UserGuide/create-signed-request.html
//
// The canonical request follows the specification:
// - path:  percent-decode ('+' is a space, as S3 reads it; an encoded plus is %2B), then encode every byte except
//          A-Z a-z 0-9 - . _ ~ and the '/' separators.
// - query: split on '&', decode each name and value the same way, encode every byte except A-Z a-z 0-9 - . _ ~,
//          sort by encoded name and then encoded value, and write valueless names as "name=".
// - headers: lowercase names, trimmed values with runs of spaces and tabs collapsed to one space, sorted by name.
// The request (including its URL) is never modified.

const emptyBodyHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

const reSafePath = /^[A-Za-z0-9\-._~/]*$/;
const reSafeQuery = /^[A-Za-z0-9\-._~=&]*$/;
const reSpaces = /[ \t]+/g;

const hexDigits = '0123456789ABCDEF';

// byte (or ASCII code) -> what it is written as in a canonical path / query
const pathTable = new Array(256);
const queryTable = new Array(256);
for (let b = 0; b < 256; b++) {
  const c = String.fromCharCode(b);
  const unreserved = /[A-Za-z0-9\-._~]/.test(c);
  const escaped = '%' + hexDigits[b >> 4] + hexDigits[b & 15];
  pathTable[b] = unreserved || c === '/' ? c : escaped;
  queryTable[b] = unreserved ? c : escaped;
}

function hexValue(code) {
  if (code >= 48 && code <= 57) return code - 48; // 0-9
  if (code >= 65 && code <= 70) return code - 55; // A-F
  if (code >= 97 && code <= 102) return code - 87; // a-f
  return -1;
}

const utf8Encoder = new TextEncoder();

// Decodes %XX escapes to bytes (a '%' that does not start an escape is the byte 0x25), then encodes each byte with
// the table. Characters outside ASCII are written as their UTF-8 bytes. '+' is a space.
function canonicalEncode(string, table) {
  let out = '';
  for (let i = 0; i < string.length; i++) {
    const code = string.charCodeAt(i);
    if (code === 37) {
      const hi = hexValue(string.charCodeAt(i + 1));
      const lo = hexValue(string.charCodeAt(i + 2));
      if (hi >= 0 && lo >= 0) {
        out += table[(hi << 4) | lo];
        i += 2;
      } else {
        out += '%25';
      }
    } else if (code === 43) {
      out += '%20';
    } else if (code < 128) {
      out += table[code];
    } else {
      const codePoint = string.codePointAt(i);
      if (codePoint > 0xffff) i++;
      for (const byte of utf8Encoder.encode(String.fromCodePoint(codePoint))) out += table[byte];
    }
  }
  return out;
}

function canonicalPath(pathname) {
  if (reSafePath.test(pathname)) return pathname === '' ? '/' : pathname;
  return canonicalEncode(pathname, pathTable);
}

function compareStrings(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function comparePairs(a, b) {
  return compareStrings(a[0], b[0]) || compareStrings(a[1], b[1]);
}

// search is url.search, which is '' or starts with '?'
function canonicalQuery(search) {
  if (search.length < 2) return '';
  const query = search.slice(1);
  const simple = reSafeQuery.test(query);
  const pairs = [];
  for (const part of query.split('&')) {
    if (part === '') continue;
    const eq = part.indexOf('=');
    const rawName = eq === -1 ? part : part.slice(0, eq);
    const rawValue = eq === -1 ? '' : part.slice(eq + 1);
    // a '=' inside a value must be encoded, so the plain-characters shortcut applies only to values without one
    pairs.push(simple && !rawValue.includes('=') ? [rawName, rawValue] : [canonicalEncode(rawName, queryTable), canonicalEncode(rawValue, queryTable)]);
  }
  if (pairs.length > 1) pairs.sort(comparePairs);
  let out = '';
  for (let i = 0; i < pairs.length; i++) out += (i === 0 ? '' : '&') + pairs[i][0] + '=' + pairs[i][1];
  return out;
}

// 20130524T000000Z, recomputed only when the second changes
let lastSecond = NaN;
let lastDatetime = '';
function amzDatetime(now) {
  const second = Math.floor(now / 1000);
  if (second !== lastSecond) {
    const iso = new Date(second * 1000).toISOString(); // 2013-05-24T00:00:00.000Z
    lastDatetime = iso.slice(0, 4) + iso.slice(5, 7) + iso.slice(8, 10) + 'T' + iso.slice(11, 13) + iso.slice(14, 16) + iso.slice(17, 19) + 'Z';
    lastSecond = second;
  }
  return lastDatetime;
}

/**
 * @typedef {Object} SignRequest
 * @property {string} method - GET, HEAD, PUT, POST, DELETE
 * @property {URL} url
 * @property {string} [region] - for example us-west-2
 * @property {string} [body] - hashed into x-amz-content-sha256; an empty or missing body is the hash of an empty string
 * @property {boolean} [unsignedPayload] - send UNSIGNED-PAYLOAD as x-amz-content-sha256 instead of hashing the body
 * @property {Record<string, string>} [signHeaders] - extra headers to sign and return; names are lowercased in the result
 * @property {number} [now] - signing time in milliseconds since the epoch; defaults to the current time
 */

/**
 * @typedef {Object} Credentials
 * @property {string} accessKeyId
 * @property {string} secretAccessKey
 * @property {string} [sessionToken] - temporary credentials: signed and returned as x-amz-security-token
 */

/**
 * The headers to send with the request: x-amz-date, x-amz-content-sha256, the extra signed headers, the session token
 * header when there is one, and authorization. The host header is signed but not returned; the HTTP client sets it
 * from the URL.
 * @typedef {Record<string, string>} AuthHeaders
 */

/**
 * @typedef {Object} Primitives
 * @property {(data: string) => string} hexHash - SHA-256 as lowercase hex
 * @property {(key: string | Uint8Array, data: string) => Uint8Array} hmac - HMAC-SHA-256 as bytes
 * @property {(key: Uint8Array, data: string) => string} hmacHex - HMAC-SHA-256 as lowercase hex
 */

/**
 * @param {Primitives} primitives
 * @returns {(request: SignRequest, credentials: Credentials) => AuthHeaders}
 */
export function createSigner({ hexHash, hmac, hmacHex }) {
  const signingKeys = new Map();
  const maxSigningKeys = 1000;

  // the key used last is checked first, which skips building the lookup string on repeated calls
  let lastSecret;
  let lastDate;
  let lastRegion;
  let lastKey;

  function getSigningKey(secretAccessKey, date, region) {
    if (secretAccessKey === lastSecret && date === lastDate && region === lastRegion) return lastKey;
    const cacheKey = `${date}/${region}/${secretAccessKey}`;
    let signingKey = signingKeys.get(cacheKey);
    if (signingKey === undefined) {
      signingKey = hmac(hmac(hmac(hmac('AWS4' + secretAccessKey, date), region), 's3'), 'aws4_request');
      if (signingKeys.size >= maxSigningKeys) signingKeys.delete(signingKeys.keys().next().value);
      signingKeys.set(cacheKey, signingKey);
    }
    lastSecret = secretAccessKey;
    lastDate = date;
    lastRegion = region;
    lastKey = signingKey;
    return signingKey;
  }

  return function getAuthHeaders(request, credentials) {
    const { method, url, signHeaders } = request;
    const region = request.region ?? '';
    const body = request.body ?? '';
    const sessionToken = credentials.sessionToken;
    const datetime = amzDatetime(request.now ?? Date.now());
    const date = datetime.slice(0, 8);

    // The x-amz-content-sha256 header is required for all AWS Signature Version 4 requests to S3. Without a payload
    // it is the hash of an empty string.
    let payloadHash = request.unsignedPayload ? 'UNSIGNED-PAYLOAD' : body.length === 0 ? emptyBodyHash : hexHash(body);
    const headers = { 'x-amz-date': datetime, 'x-amz-content-sha256': payloadHash }; // as returned
    let canonicalHeaders;
    let signedHeaders;

    const extraNames = signHeaders === undefined ? [] : Object.keys(signHeaders);
    if (extraNames.length === 0 && !sessionToken) {
      // host, x-amz-content-sha256 and x-amz-date are already in sorted order
      canonicalHeaders = `host:${url.host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${datetime}\n`;
      signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
    } else {
      const extras = signHeaders ?? {};
      const signed = { host: url.host, 'x-amz-date': datetime, 'x-amz-content-sha256': payloadHash };
      if (sessionToken) {
        headers['x-amz-security-token'] = sessionToken;
        signed['x-amz-security-token'] = sessionToken.trim();
      }
      for (const name of extraNames) {
        const lowerName = name.toLowerCase();
        headers[lowerName] = extras[name];
        signed[lowerName] = String(extras[name]).trim().replace(reSpaces, ' ');
      }
      const names = Object.keys(signed).sort();
      canonicalHeaders = '';
      for (const name of names) canonicalHeaders += `${name}:${signed[name]}\n`;
      signedHeaders = names.join(';');
      payloadHash = signed['x-amz-content-sha256'];
    }

    const credentialScope = `${date}/${region}/s3/aws4_request`;
    const canonicalRequest = `${method}\n${canonicalPath(url.pathname)}\n${canonicalQuery(url.search)}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
    const stringToSign = `AWS4-HMAC-SHA256\n${datetime}\n${credentialScope}\n${hexHash(canonicalRequest)}`;
    const signature = hmacHex(getSigningKey(credentials.secretAccessKey, date, region), stringToSign);

    headers.authorization = `AWS4-HMAC-SHA256 Credential=${credentials.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    return headers;
  };
}
