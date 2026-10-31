// Which corpus cases are well-formed S3 requests, and why the others are not (shared by screen.mjs and compat-clients.mjs).
// Each case is tagged; the headline counts only cases with no tag:
//   plus-in-path     a raw '+' in the path: S3 reads it as a space, a strict RFC 3986 reader as a plus
//   malformed        stray '%', bad hex, or bytes that are not valid UTF-8 (S3 keys cannot contain them)
//   empty-query-name a query pair with an empty name ("?=x"): the old signer and aws4fetch drop it, the specification keeps it
//   session-token    a case with a session token, given to each library as it takes one (a credentials option, else the x-amz-security-token header)
//   unsigned-header  a header some libraries deliberately never sign (date, range): valid, but a different signature
/** @typedef {import('./adapters.mjs').Case} Case */

const enc = new TextEncoder();
/** @param {string} raw */
function decodedBytes(raw) {
  /** @type {number[]} */
  const out = [];
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === '%' && /^[0-9A-Fa-f]{2}$/.test(raw.slice(i + 1, i + 3))) {
      out.push(parseInt(raw.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      out.push(...enc.encode(raw[i]));
    }
  }
  return Uint8Array.from(out);
}
/** @param {Case} c */
export function tagOf(c) {
  if (c.token) {
    return 'session-token';
  }
  const u = new URL(c.href);
  if ('date' in c.headers || 'range' in c.headers) {
    return 'unsigned-header';
  }
  const raw = u.pathname + u.search;
  if (/%(?![0-9A-Fa-f]{2})/.test(raw)) {
    return 'malformed';
  }
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(decodedBytes(raw));
  } catch {
    return 'malformed';
  }
  if (
    u.search
      .slice(1)
      .split('&')
      .some((p) => p.startsWith('='))
  ) {
    return 'empty-query-name';
  }
  if (u.pathname.includes('+')) {
    return 'plus-in-path';
  }
  return null;
}
