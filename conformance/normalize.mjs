// Stage 2: rewrite each href the way the JS URL parser sees it (the signer receives a URL object) and split out the
// decoded query pairs for botocore (+ is a space, escapes decoded as UTF-8). node norm.mjs raw.json norm.json
import { readFileSync, writeFileSync } from 'node:fs';
const [, , inPath, outPath] = process.argv;
const cases = JSON.parse(readFileSync(inPath, 'utf8'));
for (const c of cases) {
  const url = new URL(c.href);
  c.href = url.href;
  c.pairs = [];
  for (const part of url.search.slice(1).split('&')) {
    if (part === '') continue;
    const eq = part.indexOf('=');
    const dec = (s) => decodeURIComponent(s.replace(/\+/g, ' '));
    c.pairs.push([dec(eq === -1 ? part : part.slice(0, eq)), eq === -1 ? '' : dec(part.slice(eq + 1))]);
  }
  c.pathHref = url.origin + url.pathname; // url without the query, for botocore (the query goes in as params)
}
writeFileSync(outPath, JSON.stringify(cases));
console.log(cases.length, 'normalized');
