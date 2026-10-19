// <bun|node> speed-more.mjs <candidate> [secs=1] : one candidate (sigflint or another library), one process; the workloads beyond S3 headers. See protocol-more.md.
// Each workload: validate the signature against botocore with a frozen clock (outside the timed region), warm up, then time ~50 ms batches with the real clock.
import { readFileSync } from 'node:fs';
const [, , candidate, secsArg = '1'] = process.argv;
const secs = Number(secsArg);
const arm = process.env.ARM ?? candidate;
const runtime = typeof Bun !== 'undefined' ? `bun ${Bun.version}` : `node ${process.versions.node}`;
const rt = typeof Bun !== 'undefined' ? 'bun' : 'node';
const CREDS = { accessKeyId: 'AKIAIOSFODNN7EXAMPLE', secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY' };
const creds = (c) => (c.token ? { ...CREDS, sessionToken: c.token } : CREDS);
const general = JSON.parse(readFileSync(new URL('../test/corpus-general.json', import.meta.url)));
const pre = JSON.parse(readFileSync(new URL('../test/corpus-presign.json', import.meta.url)));
const byId = (L, id) => L.find((c) => c.id === id);
const workloads = {
  'any-post-json': { kind: 'header', c: byId(general, 'g-post-json-0009') },
  'any-token': { kind: 'header', c: byId(general, 'g-token-0003') },
  'any-query': { kind: 'header', c: byId(general, 'g-query-action-0018') },
  'presign-any': { kind: 'presign', c: byId(pre, 'p-execute-api-0031') },
  'presign-s3': { kind: 'presign', c: byId(pre, 'p-s3-0003') },
};
const own = candidate === 'sigflint';
let impl;
if (own) {
  const mod = await import(`${process.env.SRC ?? new URL('../src', import.meta.url).pathname}/${rt}.js`);
  const req = (c) => ({ method: c.method, url: (c.url ??= new URL(c.href)), service: c.service, region: c.region, body: c.body ?? undefined, unsignedPayload: c.unsigned, signHeaders: c.headers, expires: c.expires });
  impl = {
    header: { sync: true, run: (c) => mod.getAuthHeaders(req(c), creds(c)).authorization.slice(-64) },
    presign: { sync: true, run: (c) => { const u = mod.presign(req(c), creds(c)); return u.slice(u.lastIndexOf('=') + 1); } },
  };
} else {
  const o = await import('./adapters-more.mjs');
  const name = candidate;
  impl = { header: o.header[name] && { sync: false, run: o.header[name] }, presign: o.presign[name] && { sync: false, run: o.presign[name] } };
}
const RealDate = globalThis.Date;
const frozen = (c) => { const t = RealDate.parse(c.stamp.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/, '$1-$2-$3T$4:$5:$6Z')); globalThis.Date = class extends RealDate { constructor(...a) { super(...(a.length ? a : [t])); } static now() { return t; } }; };
const restore = () => { globalThis.Date = RealDate; };
const emit = (o) => console.log(JSON.stringify({ arm, candidate, runtime, ...o }));

async function measure(id, fn, isSync) {
  let sink = 0;
  const batch = async (n) => { const t0 = performance.now(); if (isSync) for (let i = 0; i < n; i++) sink += fn().length; else for (let i = 0; i < n; i++) sink += (await fn()).length; return performance.now() - t0; };
  let n = 100, ms = 0;
  const warmEnd = performance.now() + 300;
  while (performance.now() < warmEnd) { ms = await batch(n); if (ms < 25) n *= 2; }
  n = Math.max(10, Math.round((n * 50) / Math.max(ms, 1)));
  const samples = [];
  const end = performance.now() + secs * 1000;
  while (performance.now() < end) samples.push((await batch(n)) / n);
  samples.sort((x, y) => x - y);
  const ns = samples[Math.floor(samples.length / 2)] * 1e6;
  emit({ workload: id, status: 'ok', nsPerOp: Math.round(ns), opsPerSec: Math.round(1e9 / ns), batches: samples.length, batchSize: n, sink });
}
for (const [id, w] of Object.entries(workloads)) {
  const m = impl[w.kind];
  if (!m) { emit({ workload: id, status: 'unsupported' }); continue; }
  frozen(w.c);
  let got;
  try { got = await m.run(w.c); } catch (e) { got = `error: ${String(e.message).slice(0, 60)}`; }
  restore();
  if (got !== w.c.sig) { emit({ workload: id, status: 'wrong-result' }); continue; }
  await measure(id, () => m.run(w.c), m.sync);
}
if (own) {
  // workloads no other library offers. The outputs are checked against the references by test/v4a.test.js and test/stream.test.js; only the speed is measured here.
  const mod = await import(`${process.env.SRC ?? new URL('../src', import.meta.url).pathname}/${rt}.js`);
  const base = { method: 'POST', url: new URL('https://execute-api.us-east-1.amazonaws.com/a/b?x=1'), service: 'execute-api', region: 'us-east-1', body: '{"a":1}', signHeaders: { 'content-type': 'application/json' } };
  const v4a = { ...base, regionSet: '*' };
  await measure('sigv4a-header', () => mod.getAuthHeadersV4a(v4a, CREDS).authorization, true);
  await measure('sigv4a-presign', () => mod.presignV4a({ ...v4a, method: 'GET', body: undefined, signHeaders: undefined, expires: 3600 }, CREDS), true);
  const auth = mod.getAuthHeaders({ method: 'PUT', url: new URL('https://bkt.s3.us-east-1.amazonaws.com/k'), service: 's3', region: 'us-east-1', signHeaders: { 'x-amz-content-sha256': 'STREAMING-AWS4-HMAC-SHA256-PAYLOAD-TRAILER' }, unsignedPayload: false, body: undefined }, CREDS);
  const cs = mod.chunkSigner(auth, CREDS);
  const d64 = new Uint8Array(65536).fill(97);
  await measure('chunk-64k', () => { cs.chunk(d64); return 'x'; }, true);
  await measure('chunk-end-trailer', () => { cs.end({ 'x-amz-checksum-crc32': 'AAAAAA==' }); return 'x'; }, true);
  const es = mod.eventSigner(auth, CREDS);
  const m4k = new Uint8Array(4096).fill(98);
  await measure('event-4k', () => { es.sign(m4k); return 'x'; }, true);
}
