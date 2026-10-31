// Compile the pinned source cores without replacing their runtime APIs or adding polyfills.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const out = new URL('compiled/', import.meta.url).pathname;
mkdirSync(out, { recursive: true });
writeFileSync(
  `${out}lean-source.mjs`,
  `export { getAuthorizationHeader } from '../../node_modules/lean-s3/src/request.ts';
export { default as KeyCache } from '../../node_modules/lean-s3/src/KeyCache.ts';
export { getAmzDate } from '../../node_modules/lean-s3/src/AmzDate.ts';
export { buildRequestUrl, prepareHeadersForSigning } from '../../node_modules/lean-s3/src/url.ts';
export { encodeURIComponentExtended } from '../../node_modules/lean-s3/src/encode.ts';`,
);
for (const [id, source] of [
  ['tiny-oss', '../node_modules/tiny-oss/src/aws/signature.ts'],
  ['s3mini-utils', '../node_modules/s3mini/src/utils.ts'],
  ['lean-s3', './compiled/lean-source.mjs'],
  ['s3-lite-client', '../node_modules/@bradenmacdonald/s3-lite-client/signing.js'],
]) {
  const result = await Bun.build({
    entrypoints: [new URL(/** @type {string} */ (source), import.meta.url).pathname],
    target: 'browser',
    banner: '// @ts-nocheck -- generated third-party source',
    external: ['node:*'],
    outdir: out,
    naming: `${id}.mjs`,
  });
  if (!result.success) {
    throw new Error(result.logs.join('\n'));
  }
}

if (process.argv.includes('--record-environment')) {
  const version = (/** @type {string} */ name) =>
    JSON.parse(
      readFileSync(new URL(`../node_modules/${name}/package.json`, import.meta.url), 'utf8'),
    ).version;
  writeFileSync(
    new URL('../results/compat-environment.json', import.meta.url),
    JSON.stringify(
      {
        date: new Date().toISOString().slice(0, 10),
        bun: Bun.version,
        wrangler: version('wrangler'),
        workerd: version('workerd'),
        sourceBuilds: ['tiny-oss', 'lean-s3', 's3-lite-client'],
        sourceBuildTarget: 'browser, node:* external, no polyfills',
        unsignedReference: 'botocore S3SigV4Auth; bench-download with unsigned=true',
      },
      null,
      2,
    ) + '\n',
  );
}
