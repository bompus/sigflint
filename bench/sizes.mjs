// Bundles each signer's entry with its dependencies (node and bun builtins external) and measures it.
// Usage: node sizes.mjs -> results/sizes.json (needs bun to bundle)
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, statSync, readdirSync } from 'node:fs';
import { gzipSync, brotliCompressSync, constants } from 'node:zlib';
import { join } from 'node:path';

const here = new URL('.', import.meta.url).pathname;
/** @type {Record<string, { entry: string, pkg: string | null, note?: string }>} */
const entries = {
  'sigflint-node': { entry: 'sigflint-node.mjs', pkg: null },
  'sigflint-bun': { entry: 'sigflint-bun.mjs', pkg: null },
  aws4fetch: { entry: 'aws4fetch.mjs', pkg: 'aws4fetch' },
  aws4: { entry: 'aws4.mjs', pkg: 'aws4' },
  smithy: { entry: 'smithy.mjs', pkg: '@smithy/signature-v4' },
  'aws-sig': { entry: 'aws-sig.mjs', pkg: 'aws-sig' },
  wdl: { entry: 'wdl.mjs', pkg: '@wdl-dev/aws-sigv4' },
  minio: { entry: 'minio.mjs', pkg: 'minio' },
};
/**
 * @param {string} d
 * @returns {number}
 */
const dirBytes = (d) =>
  readdirSync(d, { withFileTypes: true }).reduce(
    (n, e) =>
      n +
      (e.name === 'node_modules'
        ? 0
        : e.isDirectory()
          ? dirBytes(join(d, e.name))
          : statSync(join(d, e.name)).size),
    0,
  );
/**
 * @typedef {object} SizeRow
 * @property {string} [note]
 * @property {number} [bundledBytes]
 * @property {number} [minifiedBytes]
 * @property {number} [gzipBytes]
 * @property {number} [brotliBytes]
 * @property {string} [error]
 * @property {number} [unpackedBytes]
 * @property {number} [directDependencies]
 * @property {string[]} [dependencyNames]
 * @property {{ bytes: number, lines: number }} [source]
 */
/** @type {Record<string, SizeRow>} */
const out = {};
mkdirSync(join(here, 'results/size-out'), { recursive: true });
for (const [id, e] of Object.entries(entries)) {
  /** @type {SizeRow} */
  const r = { note: e.note };
  /** @param {boolean} min */
  const build = (min) => {
    const file = join(here, `results/size-out/${id}${min ? '.min' : ''}.js`);
    const args = [
      'build',
      join(here, 'size-entries', e.entry),
      '--target=node',
      '--format=esm',
      `--outfile=${file}`,
    ];
    if (min) {
      args.push('--minify');
    }
    execFileSync('bun', args, { cwd: here, stdio: ['ignore', 'pipe', 'pipe'] });
    return readFileSync(file);
  };
  try {
    const raw = build(false),
      min = build(true);
    r.bundledBytes = raw.length;
    r.minifiedBytes = min.length;
    r.gzipBytes = gzipSync(min, { level: 9 }).length;
    r.brotliBytes = brotliCompressSync(min, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
    }).length;
  } catch (err) {
    // execFileSync errors carry the child's stderr
    const failure = /** @type {{ stderr?: Buffer, message: string }} */ (err);
    r.error = String(failure.stderr ?? failure.message).slice(0, 200);
  }
  if (e.pkg) {
    // JSON.parse reads the Buffer as UTF-8 text (the casts are for the type checker only)
    const pj = JSON.parse(
      /** @type {string} */ (
        /** @type {unknown} */ (readFileSync(join(here, 'node_modules', e.pkg, 'package.json')))
      ),
    );
    r.unpackedBytes = dirBytes(join(here, 'node_modules', e.pkg));
    r.directDependencies = Object.keys(pj.dependencies ?? {}).length;
    r.dependencyNames = Object.keys(pj.dependencies ?? {});
  }
  out[id] = r;
  console.log(id.padEnd(11), JSON.stringify({ ...r, dependencyNames: undefined, note: undefined }));
}
// source files of sigflint
/** @param {string} f */
const src = (f) => {
  const t = readFileSync(join(here, f), 'utf8');
  return { bytes: Buffer.byteLength(t), lines: t.split('\n').length - 1 };
};
// (every module the entry imports; the bundles above hold only the header signer)
const modules = ['base', 'presign', 'v4a', 'chunks', 'events'].map((m) => `../src/${m}.js`);
// both entries were measured in the loop above
const node = /** @type {SizeRow} */ (out['sigflint-node']),
  bun = /** @type {SizeRow} */ (out['sigflint-bun']);
node.source = [...modules, '../src/node.js']
  .map(src)
  .reduce((a, b) => ({ bytes: a.bytes + b.bytes, lines: a.lines + b.lines }));
node.directDependencies = 0;
node.dependencyNames = [];
bun.source = [...modules, '../src/bun.js']
  .map(src)
  .reduce((a, b) => ({ bytes: a.bytes + b.bytes, lines: a.lines + b.lines }));
bun.directDependencies = 0;
bun.dependencyNames = [];
writeFileSync(join(here, 'results/sizes.json'), JSON.stringify(out, null, 1));
