// Correctness screen: every candidate on every corpus case against the reference signatures (botocore).
// Usage: <bun|node> screen.mjs <sigflint entry path>   -> prints a table and writes results/screen-<runtime>.json
//
// Each case is tagged; the headline counts only cases with no tag (well-formed S3 requests):
//   plus-in-path     a raw '+' in the path: S3 reads it as a space, a strict RFC 3986 reader as a plus
//   malformed        stray '%', bad hex, or bytes that are not valid UTF-8 (S3 keys cannot contain them)
//   empty-query-name a query pair with an empty name ("?=x"): the old signer and aws4fetch drop it, the specification keeps it
//   session-token    a case with a session token: only sigflint is run on these (the others are not wired for them here)
//   unsigned-header  a header some libraries deliberately never sign (date, range): valid, but a different signature
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { loadAdapters, freezeClock } from './adapters.mjs';

const oursPath = process.argv[2];
const corpus = JSON.parse(readFileSync(new URL('../test/corpus.json', import.meta.url)));
const expected = Object.fromEntries(corpus.map((c) => [c.id, { sig: c.sig, canonical: c.canonical }]));
const cases = corpus.filter((c) => c.kind !== 'extra');
const adapters = await loadAdapters(oursPath, expected);

const enc = new TextEncoder();
function decodedBytes(raw) {
  const out = [];
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === '%' && /^[0-9A-Fa-f]{2}$/.test(raw.slice(i + 1, i + 3))) { out.push(parseInt(raw.slice(i + 1, i + 3), 16)); i += 2; } else out.push(...enc.encode(raw[i]));
  }
  return Uint8Array.from(out);
}
function tagOf(c) {
  if (c.token) return 'session-token';
  const u = new URL(c.href);
  if ('date' in c.headers || 'range' in c.headers) return 'unsigned-header';
  const raw = u.pathname + u.search;
  if (/%(?![0-9A-Fa-f]{2})/.test(raw)) return 'malformed';
  try { new TextDecoder('utf-8', { fatal: true }).decode(decodedBytes(raw)); } catch { return 'malformed'; }
  if (u.search.slice(1).split('&').some((p) => p.startsWith('='))) return 'empty-query-name';
  if (u.pathname.includes('+')) return 'plus-in-path';
  return null;
}
const tags = new Map(cases.map((c) => [c.id, tagOf(c)]));
const tagCounts = {};
for (const t of tags.values()) tagCounts[t ?? 'well-formed'] = (tagCounts[t ?? 'well-formed'] ?? 0) + 1;
console.log('cases:', JSON.stringify(tagCounts));

const restore = freezeClock();
const out = { tagCounts, candidates: {} };
for (const a of adapters) {
  const r = { label: a.label, version: a.version, unsupported: 0, byTag: {}, failIds: [], errIds: [] };
  for (const c of cases) {
    if (c.token && a.id !== 'sigflint') { r.unsupported++; continue; }
    if (a.unsupported(c)) { r.unsupported++; continue; }
    const tag = tags.get(c.id) ?? 'well-formed';
    const b = (r.byTag[tag] ??= { pass: 0, fail: 0, error: 0 });
    let sig;
    try { sig = await a.sign(c); } catch (e) {
      b.error++;
      if (tag === 'well-formed' && r.errIds.length < 6) r.errIds.push(`${c.id}: ${String(e.message).slice(0, 70)}`);
      continue;
    }
    if (sig === expected[c.id].sig) b.pass++;
    else { b.fail++; if (tag === 'well-formed' && r.failIds.length < 14) r.failIds.push(c.id); }
  }
  out.candidates[a.id] = r;
  const wf = r.byTag['well-formed'] ?? { pass: 0, fail: 0, error: 0 };
  const other = Object.entries(r.byTag).filter(([t]) => t !== 'well-formed').map(([t, v]) => `${t} ${v.pass}/${v.pass + v.fail + v.error}`).join('  ');
  console.log(`${a.label.padEnd(44)} well-formed ${String(wf.pass).padStart(4)}/${wf.pass + wf.fail + wf.error} (fail ${wf.fail}, error ${wf.error}, n/a ${r.unsupported})  | ${other}`);
  if (r.failIds.length) console.log(`    first failing: ${r.failIds.join(', ')}`);
  if (r.errIds.length) console.log(`    first errors: ${r.errIds.join(' | ')}`);
}
restore();
mkdirSync(new URL('results/', import.meta.url), { recursive: true });
writeFileSync(new URL(`results/screen-${typeof Bun !== 'undefined' ? 'bun' : 'node'}.json`, import.meta.url), JSON.stringify(out, null, 1));
