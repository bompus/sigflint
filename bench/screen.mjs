// Correctness screen: every candidate on every corpus case against the reference signatures (botocore).
// Usage: <bun|node> screen.mjs <sigflint entry path>   -> prints a table and writes results/screen-<runtime>.json
//
// Each case is tagged; the headline counts only cases with no tag (well-formed S3 requests):
//   plus-in-path     a raw '+' in the path: S3 reads it as a space, a strict RFC 3986 reader as a plus
//   malformed        stray '%', bad hex, or bytes that are not valid UTF-8 (S3 keys cannot contain them)
//   empty-query-name a query pair with an empty name ("?=x"): the old signer and aws4fetch drop it, the specification keeps it
//   session-token    a case with a session token, passed as each library takes it (a credentials option, else the x-amz-security-token header)
//   unsigned-header  a header some libraries deliberately never sign (date, range): valid, but a different signature
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { loadAdapters, freezeClock } from './adapters.mjs';
import { tagOf } from './tags.mjs';
/** @typedef {import('./adapters.mjs').Case & { kind: string, sig: string, canonical: string }} CorpusCase */
/** @typedef {{ pass: number, fail: number, error: number }} TagResult */

const oursPath = process.argv[2];
// JSON.parse reads the Buffer as UTF-8 text (the casts are for the type checker only)
/** @type {CorpusCase[]} */
const corpus = JSON.parse(
  /** @type {string} */ (
    /** @type {unknown} */ (readFileSync(new URL('../test/corpus.json', import.meta.url)))
  ),
);
const expected = Object.fromEntries(
  corpus.map((c) => [c.id, { sig: c.sig, canonical: c.canonical }]),
);
const cases = corpus.filter((c) => c.kind !== 'extra');
const adapters = await loadAdapters(/** @type {string} */ (oursPath), expected);

const tags = new Map(cases.map((c) => [c.id, tagOf(c)]));
/** @type {Record<string, number>} */
const tagCounts = {};
for (const t of tags.values()) {
  tagCounts[t ?? 'well-formed'] = (tagCounts[t ?? 'well-formed'] ?? 0) + 1;
}
console.log('cases:', JSON.stringify(tagCounts));

const restore = freezeClock();
/** @type {{ tagCounts: Record<string, number>, candidates: Record<string, unknown> }} */
const out = { tagCounts, candidates: {} };
for (const a of adapters) {
  /** @type {{ label: string, version: string, unsupported: number, byTag: Record<string, TagResult>, failIds: string[], errIds: string[] }} */
  const r = {
    label: a.label,
    version: a.version,
    unsupported: 0,
    byTag: {},
    failIds: [],
    errIds: [],
  };
  for (const c of cases) {
    if (a.unsupported(c)) {
      r.unsupported++;
      continue;
    }
    const tag = tags.get(c.id) ?? 'well-formed';
    const b = (r.byTag[tag] ??= { pass: 0, fail: 0, error: 0 });
    let sig;
    try {
      sig = await a.sign(c);
    } catch (e) {
      b.error++;
      if (tag === 'well-formed' && r.errIds.length < 6) {
        r.errIds.push(`${c.id}: ${String(/** @type {Error} */ (e).message).slice(0, 70)}`);
      }
      continue;
    }
    if (sig === /** @type {{ sig: string }} */ (expected[c.id]).sig) {
      b.pass++;
    } else {
      b.fail++;
      if (tag === 'well-formed' && r.failIds.length < 14) {
        r.failIds.push(c.id);
      }
    }
  }
  out.candidates[a.id] = r;
  const wf = r.byTag['well-formed'] ?? { pass: 0, fail: 0, error: 0 };
  const other = Object.entries(r.byTag)
    .filter(([t]) => t !== 'well-formed')
    .map(([t, v]) => `${t} ${v.pass}/${v.pass + v.fail + v.error}`)
    .join('  ');
  console.log(
    `${a.label.padEnd(44)} well-formed ${String(wf.pass).padStart(4)}/${wf.pass + wf.fail + wf.error} (fail ${wf.fail}, error ${wf.error}, n/a ${r.unsupported})  | ${other}`,
  );
  if (r.failIds.length) {
    console.log(`    first failing: ${r.failIds.join(', ')}`);
  }
  if (r.errIds.length) {
    console.log(`    first errors: ${r.errIds.join(' | ')}`);
  }
}
restore();
mkdirSync(new URL('results/', import.meta.url), { recursive: true });
writeFileSync(
  new URL(`results/screen-${typeof Bun !== 'undefined' ? 'bun' : 'node'}.json`, import.meta.url),
  JSON.stringify(out, null, 1),
);
