// AWS Signature Version 4, header based, for S3 and every other service (request.service, default 's3'). No imports: the hash and HMAC primitives come from the
// runtime entry. Presigned URLs, SigV4a and streamed bodies live in their own modules so a consumer only bundles what it imports.
// The canonical request follows the specification:
// - path:  S3 percent-decodes ('+' is a space) and encodes every byte but A-Z a-z 0-9 - . _ ~ and '/'; every other service normalises the path
//          (empty segments dropped, '.' and '..' resolved) and encodes it a second time.
// - query: split on '&', decode each name and value, encode every byte but A-Z a-z 0-9 - . _ ~, sort by name then value, valueless names get "name=".
// - headers: lowercase names, trimmed values with runs of spaces and tabs collapsed, sorted by name.
// The request (including its URL) is never modified.

export const emptyBodyHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

/**
 * @typedef {Object} Scheme
 * @property {string} algorithm
 * @property {(date: string, region: string, service: string) => string} scope
 */

/**
 * The scheme of a signature: its algorithm name and how the credential scope is written. SigV4a (v4a.js) has its own.
 * @type {Scheme}
 */
export const symmetric = {
  algorithm: 'AWS4-HMAC-SHA256',
  scope: (date, region, service) => `${date}/${region}/${service}/aws4_request`,
};

const reSafePath = /^[A-Za-z0-9\-._~/]*$/;
const reSafeQuery = /^[A-Za-z0-9\-._~=&]*$/;
const reSpaces = /[ \t]+/g;
const reDirty = /\t| {2}/;

// ASCII code -> what it is written as in a canonical path / query. url.pathname and url.search are always ASCII (the URL parser percent-encodes everything else).
// Built on first use, so importing this module costs nothing.
/** @type {string[] | undefined} */
let pathTable;
/** @type {string[] | undefined} */
let queryTable;
function tables() {
  if (pathTable !== undefined) {
    return;
  }
  pathTable = new Array(256);
  queryTable = new Array(256);
  for (let b = 0; b < 256; b++) {
    const c = String.fromCharCode(b);
    const unreserved = /[A-Za-z0-9\-._~]/.test(c);
    const escaped = (b < 16 ? '%0' : '%') + b.toString(16).toUpperCase();
    pathTable[b] = unreserved || c === '/' ? c : escaped;
    queryTable[b] = unreserved ? c : escaped;
  }
}

/** @param {number} code */
function hexValue(code) {
  if (code >= 48 && code <= 57) {
    return code - 48;
  } // 0-9
  if (code >= 65 && code <= 70) {
    return code - 55;
  } // A-F
  if (code >= 97 && code <= 102) {
    return code - 87;
  } // a-f
  return -1;
}

// Decodes %XX escapes to bytes (a '%' that does not start an escape is the byte 0x25) and encodes each byte with the table; '+' is a space.
// Runs of characters that are already canonical are copied as one piece.
/**
 * @param {string} string
 * @param {string[]} table
 */
function canonicalEncode(string, table) {
  let out = '';
  let start = 0;
  for (let i = 0; i < string.length; i++) {
    const code = string.charCodeAt(i);
    const same = /** @type {string} */ (table[code]);
    if (same.length === 1 && code !== 43) {
      continue;
    }
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

/** @param {string} pathname */
function canonicalPathGeneral(pathname) {
  const parts = pathname.split('/');
  const kept = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part === '' || part === '.') {
      continue;
    }
    if (part === '..') {
      kept.pop();
    } else {
      kept.push(part);
    }
  }
  const path =
    (pathname.startsWith('/') ? '/' : '') +
    kept.join('/') +
    (pathname.endsWith('/') && kept.length > 0 ? '/' : '');
  if (reSafePath.test(path)) {
    return path === '' ? '/' : path;
  }
  tables();
  let out = '';
  for (let i = 0; i < path.length; i++) {
    out +=
      /** @type {string[]} */ (queryTable)[path.charCodeAt(i)] === path[i] || path[i] === '/'
        ? path[i]
        : /** @type {string[]} */ (queryTable)[path.charCodeAt(i)];
  }
  return out;
}

/** @param {string} pathname */
function canonicalPathS3(pathname) {
  if (reSafePath.test(pathname)) {
    return pathname === '' ? '/' : pathname;
  }
  tables();
  return canonicalEncode(pathname, /** @type {string[]} */ (pathTable));
}

/**
 * The canonical path for a service.
 * @param {string} service
 * @param {string} pathname
 */
export const canonicalPath = (service, pathname) =>
  service === 's3' ? canonicalPathS3(pathname) : canonicalPathGeneral(pathname);

/**
 * @param {[string, string]} a
 * @param {[string, string]} b
 */
function comparePairs(a, b) {
  return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0;
}

/** @param {string} search - url.search, which is '' or starts with '?' */
export function canonicalQuery(search) {
  if (search.length < 2) {
    return '';
  }
  const query = search.slice(1);
  const simple = reSafeQuery.test(query);
  if (simple) {
    // Plain characters, one '=' per parameter, in order: the canonical query is the query (a name without a value gets a '='). Anything else, including two
    // parameters with the same name and value, is left to the general code below.
    let out = '';
    let previousName = '';
    let previousValue = '';
    let start = 0;
    for (;;) {
      let end = query.indexOf('&', start);
      if (end === -1) {
        end = query.length;
      }
      let eq = query.indexOf('=', start);
      if (eq === -1 || eq > end) {
        eq = end;
      }
      const name = query.slice(start, eq);
      const value = query.slice(eq + 1, end);
      if (
        end === start ||
        eq === start ||
        value.includes('=') ||
        (start > 0 && (name < previousName || (name === previousName && value <= previousValue)))
      ) {
        break;
      }
      out += (start === 0 ? '' : '&') + name + '=' + value;
      if (end === query.length) {
        return out;
      }
      previousName = name;
      previousValue = value;
      start = end + 1;
    }
  }
  tables();
  /** @type {[string, string][]} */
  const pairs = [];
  for (const part of query.split('&')) {
    if (part === '') {
      continue;
    }
    const eq = part.indexOf('=');
    const rawName = eq === -1 ? part : part.slice(0, eq);
    const rawValue = eq === -1 ? '' : part.slice(eq + 1);
    // a '=' inside a value must be encoded, so the plain-characters shortcut applies only to values without one
    pairs.push(
      simple && !rawValue.includes('=')
        ? [rawName, rawValue]
        : [
            canonicalEncode(rawName, /** @type {string[]} */ (queryTable)),
            canonicalEncode(rawValue, /** @type {string[]} */ (queryTable)),
          ],
    );
  }
  if (pairs.length > 1) {
    pairs.sort(comparePairs);
  }
  let out = '';
  for (let i = 0; i < pairs.length; i++) {
    out +=
      (i === 0 ? '' : '&') +
      /** @type {[string, string]} */ (pairs[i])[0] +
      '=' +
      /** @type {[string, string]} */ (pairs[i])[1];
  }
  return out;
}

/**
 * Inserts into the name-ordered lists, replacing an entry with the same name.
 * @param {string[]} names
 * @param {string[]} values
 * @param {string} name
 * @param {string} value
 */
export function insert(names, values, name, value) {
  let i = names.length;
  while (i > 0 && /** @type {string} */ (names[i - 1]) > name) {
    i--;
  }
  if (i > 0 && names[i - 1] === name) {
    values[i - 1] = value;
    return;
  }
  for (let j = names.length; j > i; j--) {
    names[j] = /** @type {string} */ (names[j - 1]);
    values[j] = /** @type {string} */ (values[j - 1]);
  }
  names[i] = name;
  values[i] = value;
}

/**
 * Refuses a signHeaders entry that cannot be signed as given: x-amz-date and authorization are set by the signer, `__proto__` cannot be a property of the
 * returned headers, and a line break in a value would start another canonical header line. Returns the lowercase name.
 * @param {string} name
 * @param {string} value
 */
export function signHeaderName(name, value) {
  const lowerName = name.toLowerCase();
  if (lowerName === 'x-amz-date' || lowerName === 'authorization' || lowerName === '__proto__') {
    throw new TypeError(`signHeaders cannot contain ${lowerName}`);
  }
  if (/[\r\n]/.test(value)) {
    throw new TypeError(`signHeaders ${lowerName} has a line break in its value`);
  }
  return lowerName;
}

/**
 * A header value as it is signed: trimmed, runs of spaces and tabs collapsed.
 * @param {unknown} value
 */
export const headerValue = (value) => {
  const trimmed = String(value).trim();
  return reDirty.test(trimmed) ? trimmed.replace(reSpaces, ' ') : trimmed;
};

// 20130524T000000Z, recomputed only when the second changes
let lastSecond = NaN;
let lastDatetime = '';
/** @param {number} now - milliseconds since the epoch */
export function amzDatetime(now) {
  const second = Math.floor(now / 1000);
  if (second !== lastSecond) {
    const iso = new Date(second * 1000).toISOString(); // 2013-05-24T00:00:00.000Z
    lastDatetime =
      iso.slice(0, 4) +
      iso.slice(5, 7) +
      iso.slice(8, 10) +
      'T' +
      iso.slice(11, 13) +
      iso.slice(14, 16) +
      iso.slice(17, 19) +
      'Z';
    lastSecond = second;
  }
  return lastDatetime;
}

/**
 * @typedef {Object} SignRequest
 * @property {string} method - GET, HEAD, PUT, POST, DELETE; any case, signed in upper case (as botocore does)
 * @property {URL} url
 * @property {string} [service] - default 's3'
 * @property {string} [region] - for example us-west-2
 * @property {string} [body] - hashed into x-amz-content-sha256; an empty or missing body is the hash of an empty string
 * @property {boolean} [unsignedPayload] - send UNSIGNED-PAYLOAD as x-amz-content-sha256 instead of hashing the body
 * @property {Record<string, string>} [signHeaders] - extra headers to sign and return; names are lowercased in the result
 * @property {number} [now] - signing time in milliseconds since the epoch; defaults to the current time
 * @property {number} [expires] - presigned URLs: lifetime in seconds, default 3600
 * @property {string} [regionSet] - SigV4a: the regions the signature is valid for, 'us-east-1,us-west-2' or '*'
 */

/**
 * @typedef {Object} Credentials
 * @property {string} accessKeyId
 * @property {string} secretAccessKey
 * @property {string} [sessionToken] - temporary credentials: signed and returned as x-amz-security-token
 */

/** @typedef {Record<string, string>} AuthHeaders */

/**
 * @typedef {Object} Primitives
 * @property {(data: string | Uint8Array) => string} hexHash - SHA-256 as lowercase hex
 * @property {(key: string | Uint8Array, data: string) => Uint8Array} hmac - HMAC-SHA-256 as bytes
 * @property {(key: Uint8Array, data: string) => string} hmacHex - HMAC-SHA-256 as lowercase hex
 * @property {ReturnType<typeof createKeys>} getSigningKey - the entry's one signing-key cache, shared by every symmetric signer
 */

/**
 * The payload hash for x-amz-content-sha256. The hash function may return a promise, which is then the result.
 * @template {string | Promise<string>} H
 * @param {SignRequest} request
 * @param {(data: string) => H} hexHash
 * @returns {string | H}
 */
export function payloadHashOf(request, hexHash) {
  const body = request.body ?? '';
  return request.unsignedPayload
    ? 'UNSIGNED-PAYLOAD'
    : body.length === 0
      ? emptyBodyHash
      : hexHash(body);
}

/**
 * Everything up to the hashing: the headers to return, the canonical request and the credential scope.
 * @param {SignRequest} request
 * @param {Credentials} credentials
 * @param {string} payloadHash
 * @param {Scheme} [scheme]
 */
export function prepare(request, credentials, payloadHash, scheme = symmetric) {
  const { url, signHeaders } = request;
  const method = request.method.toUpperCase(); // 'get' is signed as GET, which is what fetch sends and what botocore signs
  const region = request.region ?? '';
  const service = request.service ?? 's3';
  // S3 always sends x-amz-content-sha256; other services only when the payload is unsigned
  const withHash = service === 's3' || request.unsignedPayload === true;
  const sessionToken = credentials.sessionToken;
  const datetime = amzDatetime(request.now ?? Date.now());
  const date = datetime.slice(0, 8);

  /** @type {AuthHeaders} */
  const headers = withHash
    ? { 'x-amz-date': datetime, 'x-amz-content-sha256': payloadHash }
    : { 'x-amz-date': datetime }; // as returned

  const extraNames = signHeaders === undefined ? [] : Object.keys(signHeaders);
  let canonicalHeaders;
  let signedHeaders;
  if (extraNames.length === 0 && !sessionToken) {
    // the usual request: only the headers that are always signed, already in sorted order
    canonicalHeaders = withHash
      ? `host:${url.host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${datetime}\n`
      : `host:${url.host}\nx-amz-date:${datetime}\n`;
    signedHeaders = withHash ? 'host;x-amz-content-sha256;x-amz-date' : 'host;x-amz-date';
  } else {
    // the extra headers (and the session token) in name order, then merged with the ones that are always signed;
    // a header named like one of those, or like an earlier extra, replaces it
    /** @type {string[]} */
    const names = [];
    /** @type {string[]} */
    const values = [];
    if (sessionToken) {
      headers['x-amz-security-token'] = sessionToken;
      insert(names, values, 'x-amz-security-token', sessionToken.trim());
    }
    for (const name of extraNames) {
      const value = /** @type {string} */ (
        /** @type {Record<string, string>} */ (signHeaders)[name]
      );
      const lowerName = signHeaderName(name, value);
      headers[lowerName] = value;
      insert(names, values, lowerName, headerValue(value));
    }
    const baseNames = withHash
      ? ['host', 'x-amz-content-sha256', 'x-amz-date']
      : ['host', 'x-amz-date'];
    const baseValues = withHash ? [url.host, payloadHash, datetime] : [url.host, datetime];
    const nBase = baseNames.length;
    canonicalHeaders = '';
    signedHeaders = '';
    let i = 0;
    let j = 0;
    while (i < names.length || j < nBase) {
      let name;
      let value;
      if (
        j === nBase ||
        (i < names.length &&
          /** @type {string} */ (names[i]) <= /** @type {string} */ (baseNames[j]))
      ) {
        name = /** @type {string} */ (names[i]);
        value = /** @type {string} */ (values[i++]);
        if (j < nBase && name === baseNames[j]) {
          j++;
        }
      } else {
        name = /** @type {string} */ (baseNames[j]);
        value = /** @type {string} */ (baseValues[j++]);
      }
      if (name === 'x-amz-content-sha256') {
        payloadHash = value;
      } // a caller-supplied one replaces the computed one
      canonicalHeaders += `${name}:${value}\n`;
      signedHeaders += signedHeaders === '' ? name : ';' + name;
    }
  }

  const canonicalRequest = `${method}\n${canonicalPath(service, url.pathname)}\n${canonicalQuery(url.search)}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  return {
    headers,
    canonicalRequest,
    datetime,
    date,
    region,
    service,
    credentialScope: scheme.scope(date, region, service),
    signedHeaders,
    algorithm: scheme.algorithm,
  };
}

/** @typedef {{ algorithm: string, datetime: string, credentialScope: string }} StringToSignParts */

/**
 * @param {StringToSignParts} prepared
 * @param {string} canonicalRequestHash
 */
export const stringToSign = (prepared, canonicalRequestHash) =>
  `${prepared.algorithm}\n${prepared.datetime}\n${prepared.credentialScope}\n${canonicalRequestHash}`;

/**
 * Adds the authorization header to the headers to return.
 * @param {ReturnType<typeof prepare>} prepared
 * @param {string} accessKeyId
 * @param {string} signature
 */
export function authorize(prepared, accessKeyId, signature) {
  prepared.headers.authorization = `${prepared.algorithm} Credential=${accessKeyId}/${prepared.credentialScope}, SignedHeaders=${prepared.signedHeaders}, Signature=${signature}`;
  return prepared.headers;
}

/**
 * @param {(key: string | Uint8Array, data: string) => Uint8Array} hmac
 * @returns {(secretAccessKey: string, date: string, region: string, service: string) => Uint8Array}
 */
export function createKeys(hmac) {
  /** @type {Map<string, Uint8Array>} */
  const signingKeys = new Map();
  const maxSigningKeys = 1000;

  // the key used last is checked first, which skips building the lookup string on repeated calls
  /** @type {string | undefined} */
  let lastSecret;
  /** @type {string | undefined} */
  let lastDate;
  /** @type {string | undefined} */
  let lastRegion;
  /** @type {string | undefined} */
  let lastService;
  /** @type {Uint8Array | undefined} */
  let lastKey;

  return function getSigningKey(secretAccessKey, date, region, service) {
    if (
      secretAccessKey === lastSecret &&
      date === lastDate &&
      region === lastRegion &&
      service === lastService
    ) {
      return /** @type {Uint8Array} */ (lastKey);
    }
    const cacheKey = `${date}\n${region}\n${service}\n${secretAccessKey}`; // a region or service cannot contain a line break, so two scopes never share a key
    let signingKey = signingKeys.get(cacheKey);
    if (signingKey === undefined) {
      signingKey = hmac(
        hmac(hmac(hmac('AWS4' + secretAccessKey, date), region), service),
        'aws4_request',
      );
      if (signingKeys.size >= maxSigningKeys) {
        signingKeys.delete(/** @type {string} */ (signingKeys.keys().next().value));
      }
      signingKeys.set(cacheKey, signingKey);
    }
    lastSecret = secretAccessKey;
    lastDate = date;
    lastRegion = region;
    lastService = service;
    lastKey = signingKey;
    return signingKey;
  };
}

/**
 * @param {Primitives} primitives
 * @returns {(request: SignRequest, credentials: Credentials) => AuthHeaders}
 */
export function createSigner({ hexHash, hmacHex, getSigningKey }) {
  return function getAuthHeaders(request, credentials) {
    const prepared = prepare(request, credentials, payloadHashOf(request, hexHash));
    return authorize(
      prepared,
      credentials.accessKeyId,
      hmacHex(
        getSigningKey(
          credentials.secretAccessKey,
          prepared.date,
          prepared.region,
          prepared.service,
        ),
        stringToSign(prepared, hexHash(prepared.canonicalRequest)),
      ),
    );
  };
}
