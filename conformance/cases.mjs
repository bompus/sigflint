// Generates the conformance cases: S3 requests to sign, fixed edge cases plus seeded fuzz.
// Usage: node cases.mjs <out.json>
// A case is the logical request as the signer receives it: `href` is the WHATWG-serialized URL (what a browser or
// the server would send), `headers` are extra headers to sign (lowercase names), `body` is a string,
// `unsigned` means x-amz-content-sha256 is UNSIGNED-PAYLOAD instead of the body hash,
// `token` is a session token (signed as x-amz-security-token).
import { writeFileSync } from 'node:fs';

const B = 'https://examplebucket.s3.amazonaws.com';
const fixed = [
  ['aws-get-object-range-style', 'GET', `${B}/test.txt`, {}],
  ['aws-get-object-range', 'GET', `${B}/test.txt`, { range: 'bytes=0-9' }],
  ['aws-list-objects', 'GET', `${B}/?max-keys=2&prefix=J`, {}],
  ['aws-lifecycle', 'GET', `${B}/?lifecycle`, {}],
  ['aws-put-object', 'PUT', `${B}/test%24file.text`, { date: 'Fri, 24 May 2013 00:00:00 GMT', 'x-amz-storage-class': 'REDUCED_REDUNDANCY' }, 'Welcome to Amazon S3.'],
  ['plain-key', 'GET', `${B}/2022/05/media/upload/facebook-131__m4qhsQzwMdHCoc6UnBOYv.webp`, {}],
  ['path-space', 'GET', `${B}/a%20b.txt`, {}],
  ['path-plus-literal', 'GET', `${B}/a+b.txt`, {}],
  ['path-encoded-plus', 'GET', `${B}/a%2Bb.txt`, {}],
  ['path-unicode', 'GET', `${B}/%C3%BCn%C3%AF.txt`, {}],
  ['path-tilde', 'GET', `${B}/a~b.txt`, {}],
  ['path-sub-delims', 'GET', `${B}/f!'()*,;=:@$&.txt`, {}],
  ['path-double-slash', 'GET', `${B}/a//b.txt`, {}],
  ['path-trailing-slash', 'GET', `${B}/dir/`, {}],
  ['path-encoded-slash', 'GET', `${B}/a%2Fb.txt`, {}],
  ['path-invalid-utf8', 'GET', `${B}/%ff%fe.bin`, {}],
  ['path-stray-percent', 'GET', `${B}/100%.txt`, {}],
  ['path-bad-hex', 'GET', `${B}/a%zzb.txt`, {}],
  ['path-lowercase-hex', 'GET', `${B}/a%c3%a9.txt`, {}],
  ['multipart-upload-id-tilde', 'PUT', `${B}/obj?partNumber=1&uploadId=2~abcDEF-123_x`, {}],
  ['multipart-init', 'POST', `${B}/obj?uploads`, {}],
  ['query-space', 'GET', `${B}/?list-type=2&prefix=a%20b`, {}],
  ['query-plus-is-space', 'GET', `${B}/?prefix=a+b`, {}],
  ['query-encoded-plus', 'GET', `${B}/?prefix=a%2Bb`, {}],
  ['query-encoded-slash', 'GET', `${B}/?prefix=a%2Fb`, {}],
  ['query-star-bang', 'GET', `${B}/?x=*&y=!&z='()`, {}],
  ['query-tilde-name-and-value', 'GET', `${B}/?a~b=c~d`, {}],
  ['query-unsorted', 'GET', `${B}/?z=1&a=2&m=3`, {}],
  ['query-duplicate-names', 'GET', `${B}/?a=2&a=1&a=3`, {}],
  ['query-empty-value', 'GET', `${B}/?a=&b`, {}],
  ['query-unicode', 'GET', `${B}/?prefix=%E6%97%A5%E6%9C%AC`, {}],
  ['query-equals-in-value', 'GET', `${B}/?a=b=c`, {}],
  ['query-invalid-utf8', 'GET', `${B}/?a=%ff`, {}],
  ['query-stray-percent', 'GET', `${B}/?a=100%`, {}],
  ['headers-extra-spaces', 'PUT', `${B}/k`, { 'x-amz-meta-note': '  a   b  c ' }, 'x'],
  ['headers-acl-and-meta', 'PUT', `${B}/k`, { 'x-amz-acl': 'public-read', 'x-amz-meta-z': 'z', 'x-amz-meta-a': 'a' }, ''],
  ['body-unicode', 'PUT', `${B}/k`, {}, 'héllo wörld 日本語 😀'],
  ['body-empty-unsigned', 'PUT', `${B}/k`, {}, '', true],
  ['unsigned-payload', 'PUT', `${B}/k`, { 'x-amz-acl': 'private' }, '', true],
  ['port-nondefault', 'GET', 'https://127.0.0.1:9000/bucket/key', {}],
  ['path-style-host', 'GET', 'https://us-sea-1.linodeobjects.com/bucket/dir/file.txt', {}],
  ['http-scheme', 'GET', 'http://bucket.us-sea-1.linodeobjects.com/file', {}],
  ['bench-download', 'GET', `${B}/2022/05/media/upload/facebook-131__m4qhsQzwMdHCoc6UnBOYv.webp`, {}],
  ['session-token-get', 'GET', `${B}/test.txt`, {}, '', false, 'IQoJb3JpZ2luX2VjEXAMPLE//////////wEaCXVzLWVhc3QtMSJHMEUCIQDEXAMPLE+token=='],
  ['session-token-put-unsigned', 'PUT', `${B}/k?x=1`, { 'x-amz-acl': 'private' }, '', true, 'short-token'],
  ['bench-part-put', 'PUT', `${B}/2022/05/media/upload/video-1__abc123.mp4?partNumber=7&uploadId=2~m3XvQ9aD-ZkP_0wL`, { 'x-amz-acl': 'public-read' }, '', true],
  ['bench-encode', 'GET', `${B}/folder one/ünï cödé/file (1) [final]!.txt?prefix=a b&delimiter=/&max-keys=100`, {}],
  ['bench-body-1k', 'PUT', `${B}/2022/05/notes.json`, { 'x-amz-meta-note': 'a  b', 'x-amz-acl': 'private' }, 'x'.repeat(1024)],
  ['query-name-prefix-dash', 'GET', `${B}/?a-b=1&a=2`, {}],
  ['query-name-prefix-dash-sorted', 'GET', `${B}/?a=2&a-b=1`, {}],
  ['query-name-prefix-digit', 'GET', `${B}/?a1&a&max-keys`, {}],
  ['query-name-prefix-dot', 'GET', `${B}/?a.b&a`, {}],
  ['query-same-name-sorted', 'GET', `${B}/?a=1&a=2`, {}],
  ['query-same-name-and-value', 'GET', `${B}/?a=1&a=1`, {}],
  ['query-valueless-mix', 'GET', `${B}/?b&a&c=1`, {}],
  ['headers-name-prefix', 'PUT', `${B}/k`, { 'x-amz-meta-a_b': '3', 'x-amz-meta-a-b': '2', 'x-amz-meta-a': '1' }, 'x'],
  [
    'headers-around-the-fixed-three',
    'PUT',
    `${B}/k`,
    { 'x-amz-meta-z': 'z', 'content-type': 'text/plain', 'x-amz-acl': 'private', 'cache-control': 'no-cache', 'x-amz-storage-class': 'STANDARD' },
    'x',
  ],
  ['root-no-path', 'GET', 'https://bucket.us-sea-1.linodeobjects.com', {}],
];

function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20261013);
const rndToken = mulberry32(7);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const ri = (n) => Math.floor(rnd() * n);

const pathAtoms = [
  'a',
  'B',
  'z9',
  '0',
  '-',
  '_',
  '.',
  '~',
  '!',
  '$',
  '&',
  "'",
  '(',
  ')',
  '*',
  '+',
  ',',
  ';',
  '=',
  ':',
  '@',
  '%41',
  '%2F',
  '%2B',
  '%7E',
  '%20',
  '%zz',
  '%',
  '%f',
  ' ',
  '"',
  '<',
  '>',
  '^',
  '`',
  '{',
  '}',
  '|',
  'é',
  '日本',
  '😀',
  '/',
  '//',
  '%C3%A9',
  '%c3%a9',
  '%ff',
];
const qAtoms = [
  'a',
  'B',
  'z9',
  '0',
  '-',
  '_',
  '.',
  '~',
  '!',
  '$',
  "'",
  '(',
  ')',
  '*',
  '+',
  ',',
  ';',
  ':',
  '@',
  '/',
  '?',
  '%41',
  '%2F',
  '%2B',
  '%7E',
  '%20',
  '%zz',
  '%',
  '%f',
  ' ',
  '"',
  '<',
  '>',
  '^',
  '`',
  '{',
  '}',
  '|',
  'é',
  '日本',
  '😀',
  '%C3%A9',
  '%ff',
  '=',
];
const word = (atoms, max) => Array.from({ length: 1 + ri(max) }, () => pick(atoms)).join('');
const hosts = ['examplebucket.s3.amazonaws.com', 'bucket.us-sea-1.linodeobjects.com', 'us-lax-1.linodeobjects.com', '127.0.0.1:9000'];
const bodies = ['', 'hello', 'héllo 日本', 'x'.repeat(100)];
const metaVals = ['a', '  a  b ', 'x   y   z', ' lead', 'trail '];

const cases = [];
// the AWS GET Object example at another date and in another region (for the signing-key cache test only)
for (const [id, extra] of [
  ['extra-next-day', { stamp: '20130525T000000Z' }],
  ['extra-other-region', { region: 'us-west-2' }],
]) {
  cases.push({ id, kind: 'extra', method: 'GET', href: `${B}/test.txt`, headers: { range: 'bytes=0-9' }, body: '', unsigned: false, ...extra });
}
for (const [id, method, href, headers, body = '', unsigned = false, token] of fixed) {
  const u = new URL(href);
  cases.push({ id, kind: 'fixed', method, href: u.href, headers, body, unsigned, ...(token ? { token } : {}) });
}
for (let i = 0; i < 3000; i++) {
  const nSeg = ri(4);
  let path = '/' + Array.from({ length: nSeg }, () => word(pathAtoms, 4)).join('/');
  const nQ = ri(4);
  const pairs = Array.from({ length: nQ }, () => (rnd() < 0.15 ? word(qAtoms, 3) : `${word(qAtoms, 3)}=${rnd() < 0.2 ? '' : word(qAtoms, 4)}`));
  let raw = `https://${pick(hosts)}${path}`;
  if (pairs.length) raw += '?' + pairs.join('&');
  let u;
  try {
    u = new URL(raw);
  } catch {
    continue;
  }
  const headers = {};
  if (rnd() < 0.3) headers['x-amz-acl'] = pick(['private', 'public-read']);
  if (rnd() < 0.2) headers['x-amz-meta-note'] = pick(metaVals);
  const method = pick(['GET', 'PUT', 'POST', 'DELETE', 'HEAD']);
  const c = { id: `fuzz-${i}`, kind: 'fuzz', method, href: u.href, headers, body: pick(bodies), unsigned: rnd() < 0.5 };
  if (rndToken() < 0.1) c.token = `token-${i}-${Math.floor(rndToken() * 1e6)}+/=`;
  cases.push(c);
}
// queries whose names start with one another, in every order, with and without values
const qNames = ['a', 'a-b', 'a.b', 'a1', 'a_b', 'ab', 'b', 'B', 'a~b'];
for (let i = 0; i < 300; i++) {
  const pairs = Array.from({ length: 1 + ri(5) }, () => {
    const name = pick(qNames);
    return rnd() < 0.25 ? name : `${name}=${pick(['', '1', '2', 'x', 'a b', '~'])}`;
  });
  const u = new URL(`https://${pick(hosts)}/k?${pairs.join('&')}`);
  cases.push({ id: `qname-${i}`, kind: 'fuzz', method: 'GET', href: u.href, headers: {}, body: '', unsigned: false });
}
writeFileSync(process.argv[2], JSON.stringify(cases));
console.log(`${cases.length} cases (${cases.filter((c) => c.kind === 'fixed').length} fixed, ${cases.filter((c) => c.kind === 'fuzz').length} fuzz)`);
