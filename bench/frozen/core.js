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
const reDirty = /\t|  /;

// ASCII code -> what it is written as in a canonical path / query. url.pathname and url.search are always ASCII (the
// URL parser percent-encodes everything else), and so is anything a %XX escape decodes to once the high bytes are
// escaped again.
const pathTable = new Array(256);
const queryTable = new Array(256);
for (let b = 0; b < 256; b++) {
  const c = String.fromCharCode(b);
  const unreserved = /[A-Za-z0-9\-._~]/.test(c);
  const escaped = (b < 16 ? '%0' : '%') + b.toString(16).toUpperCase();
  pathTable[b] = unreserved || c === '/' ? c : escaped;
  queryTable[b] = unreserved ? c : escaped;
}

function hexValue(code) {
  if (code >= 48 && code <= 57) return code - 48; // 0-9
  if (code >= 65 && code <= 70) return code - 55; // A-F
  if (code >= 97 && code <= 102) return code - 87; // a-f
  return -1;
}

// Decodes %XX escapes to bytes (a '%' that does not start an escape is the byte 0x25) and encodes each byte with the
// table; '+' is a space. Runs of characters that are already canonical are copied as one piece.
function canonicalEncode(string, table) {
  let out = '';
  let start = 0;
  for (let i = 0; i < string.length; i++) {
    const code = string.charCodeAt(i);
    const same = table[code];
    if (same.length === 1 && code !== 43) continue;
    out += string.slice(start, i);
    start = i + 1;
    if (code === 37) {
      const hi = hexValue(string.charCodeAt(i + 1));
      const lo = hexValue(string.charCodeAt(i + 2));
      if (hi >= 0 && lo >= 0) {
        out += table[(hi << 4) | lo];
        i += 2;
        start = i + 1;
      } else {
        out += '%25';
      }
    } else {
      out += code === 43 ? '%20' : same;
    }
  }
  return start === 0 ? string : out + string.slice(start);
}

function canonicalPath(pathname) {
  if (reSafePath.test(pathname)) return pathname === '' ? '/' : pathname;
  return canonicalEncode(pathname, pathTable);
}

function comparePairs(a, b) {
  return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0;
}

// search is url.search, which is '' or starts with '?'
function canonicalQuery(search) {
  if (search.length < 2) return '';
  const query = search.slice(1);
  const simple = reSafeQuery.test(query);
  if (simple) {
    // Plain characters, one '=' per parameter, in order: the canonical query is the query (a name without a value gets
    // a '='). Anything else, including two parameters with the same name and value, is left to the general code below.
    let out = '';
    let previousName = '';
    let previousValue = '';
    let start = 0;
    for (;;) {
      let end = query.indexOf('&', start);
      if (end === -1) end = query.length;
      let eq = query.indexOf('=', start);
      if (eq === -1 || eq > end) eq = end;
      const name = query.slice(start, eq);
      const value = query.slice(eq + 1, end);
      if (end === start || eq === start || value.includes('=') || (start > 0 && (name < previousName || (name === previousName && value <= previousValue)))) break;
      out += (start === 0 ? '' : '&') + name + '=' + value;
      if (end === query.length) return out;
      previousName = name;
      previousValue = value;
      start = end + 1;
    }
  }
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

// inserts into the name-ordered lists, replacing an entry with the same name
function insert(names, values, name, value) {
  let i = names.length;
  while (i > 0 && names[i - 1] > name) i--;
  if (i > 0 && names[i - 1] === name) {
    values[i - 1] = value;
    return;
  }
  for (let j = names.length; j > i; j--) {
    names[j] = names[j - 1];
    values[j] = values[j - 1];
  }
  names[i] = name;
  values[i] = value;
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
 * The payload hash for x-amz-content-sha256. The hash function may return a promise, which is then the result.
 * @param {SignRequest} request
 * @param {(data: string) => any} hexHash
 */
export function payloadHashOf(request, hexHash) {
  const body = request.body ?? '';
  // The x-amz-content-sha256 header is required for all AWS Signature Version 4 requests to S3. Without a payload it
  // is the hash of an empty string.
  return request.unsignedPayload ? 'UNSIGNED-PAYLOAD' : body.length === 0 ? emptyBodyHash : hexHash(body);
}

/**
 * Everything up to the hashing: the headers to return, the canonical request and the credential scope.
 * @param {SignRequest} request
 * @param {Credentials} credentials
 * @param {string} payloadHash - from payloadHashOf
 */
export function prepare(request, credentials, payloadHash) {
  const { method, url, signHeaders } = request;
  const region = request.region ?? '';
  const sessionToken = credentials.sessionToken;
  const datetime = amzDatetime(request.now ?? Date.now());
  const date = datetime.slice(0, 8);

  const headers = { 'x-amz-date': datetime, 'x-amz-content-sha256': payloadHash }; // as returned
  let canonicalHeaders;
  let signedHeaders;

  const extraNames = signHeaders === undefined ? [] : Object.keys(signHeaders);
  if (extraNames.length === 0 && !sessionToken) {
    // host, x-amz-content-sha256 and x-amz-date are already in sorted order
    canonicalHeaders = `host:${url.host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${datetime}\n`;
    signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  } else {
    // the extra headers (and the session token) in name order, then merged with the three that are always signed;
    // a header named like one of those, or like an earlier extra, replaces it
    const names = [];
    const values = [];
    if (sessionToken) {
      headers['x-amz-security-token'] = sessionToken;
      insert(names, values, 'x-amz-security-token', sessionToken.trim());
    }
    for (const name of extraNames) {
      const value = /** @type {Record<string, string>} */ (signHeaders)[name];
      const lowerName = name.toLowerCase();
      headers[lowerName] = value;
      const trimmed = String(value).trim();
      insert(names, values, lowerName, reDirty.test(trimmed) ? trimmed.replace(reSpaces, ' ') : trimmed);
    }
    const baseNames = ['host', 'x-amz-content-sha256', 'x-amz-date'];
    const baseValues = [url.host, payloadHash, datetime];
    canonicalHeaders = '';
    signedHeaders = '';
    let i = 0;
    let j = 0;
    while (i < names.length || j < 3) {
      let name;
      let value;
      if (j === 3 || (i < names.length && names[i] <= baseNames[j])) {
        name = names[i];
        value = values[i++];
        if (j < 3 && name === baseNames[j]) j++;
      } else {
        name = baseNames[j];
        value = baseValues[j++];
      }
      if (name === 'x-amz-content-sha256') payloadHash = value; // a caller-supplied one replaces the computed one
      canonicalHeaders += `${name}:${value}\n`;
      signedHeaders += signedHeaders === '' ? name : ';' + name;
    }
  }

  const credentialScope = `${date}/${region}/s3/aws4_request`;
  const canonicalRequest = `${method}\n${canonicalPath(url.pathname)}\n${canonicalQuery(url.search)}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  return { headers, canonicalRequest, datetime, date, region, credentialScope, signedHeaders };
}

/** @typedef {ReturnType<typeof prepare>} Prepared */

/**
 * @param {Prepared} prepared
 * @param {string} canonicalRequestHash - hex SHA-256 of prepared.canonicalRequest
 */
export function stringToSign(prepared, canonicalRequestHash) {
  return `AWS4-HMAC-SHA256\n${prepared.datetime}\n${prepared.credentialScope}\n${canonicalRequestHash}`;
}

/**
 * Adds the authorization header to the headers to return.
 * @param {Prepared} prepared
 * @param {string} accessKeyId
 * @param {string} signature - hex
 * @returns {AuthHeaders}
 */
export function authorize(prepared, accessKeyId, signature) {
  prepared.headers.authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${prepared.credentialScope}, SignedHeaders=${prepared.signedHeaders}, Signature=${signature}`;
  return prepared.headers;
}

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
    const prepared = prepare(request, credentials, payloadHashOf(request, hexHash));
    const signature = hmacHex(getSigningKey(credentials.secretAccessKey, prepared.date, prepared.region), stringToSign(prepared, hexHash(prepared.canonicalRequest)));
    return authorize(prepared, credentials.accessKeyId, signature);
  };
}
