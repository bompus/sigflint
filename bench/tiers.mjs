// What a consumer's bundle costs for each combination of signers it imports, per entry: minified, gzip and brotli bytes of `bun build --minify`.
// Usage: node tiers.mjs -> results/tiers.json (needs bun to bundle)
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { gzipSync, brotliCompressSync, constants } from 'node:zlib';
import { join } from 'node:path';

const here = new URL('.', import.meta.url).pathname;
const combinations = {
  'headers': ['getAuthHeaders'],
  'headers + presign': ['getAuthHeaders', 'presign'],
  'SigV4a headers': ['getAuthHeadersV4a'],
  'SigV4a presign': ['presignV4a'],
  'chunked uploads': ['chunkSigner'],
  'event streams': ['eventSigner'],
  'everything': ['getAuthHeaders', 'presign', 'getAuthHeadersV4a', 'presignV4a', 'chunkSigner', 'eventSigner'],
};
const out = {};
mkdirSync(join(here, 'results/tiers-out'), { recursive: true });
for (const entry of ['node', 'bun', 'web']) {
  out[entry] = {};
  for (const [name, exports] of Object.entries(combinations)) {
    const id = `${entry}-${name.replace(/\W+/g, '-')}`;
    const source = join(here, `results/tiers-out/${id}.entry.mjs`);
    const file = join(here, `results/tiers-out/${id}.min.js`);
    writeFileSync(source, `export { ${exports.join(', ')} } from '../../../src/${entry}.js';\n`);
    execFileSync('bun', ['build', source, '--target=node', '--format=esm', '--minify', `--outfile=${file}`], { cwd: here, stdio: ['ignore', 'pipe', 'pipe'] });
    const min = readFileSync(file);
    out[entry][name] = { minifiedBytes: min.length, gzipBytes: gzipSync(min, { level: 9 }).length, brotliBytes: brotliCompressSync(min, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length };
  }
}
writeFileSync(join(here, 'results/tiers.json'), JSON.stringify(out, null, 1));
console.table(Object.fromEntries(Object.entries(combinations).map(([name]) => [name, Object.fromEntries(['node', 'bun', 'web'].map((entry) => [entry, `${out[entry][name].minifiedBytes} / ${out[entry][name].gzipBytes} gz`]))])));
