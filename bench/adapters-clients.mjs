// Signing cores of S3 clients, with decoded object keys rather than serialized URLs.
// Source dependencies are pinned because lean-s3 and tiny-oss do not export their cores.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { CREDS, REGION } from './adapters.mjs';
/** @typedef {import('./screen.mjs').CorpusCase} CorpusCase */
/** @typedef {import('./adapters.mjs').Adapter} Adapter */

/** @param {string} path */
const source = (path) => new URL(`node_modules/${path}`, import.meta.url).href;
/** @param {string} name */
const version = (name) =>
  JSON.parse(readFileSync(new URL(source(`${name}/package.json`)), 'utf8')).version;
/** @param {CorpusCase} c */
const stamp = (c) => /** @type {CorpusCase & { stamp?: string }} */ (c).stamp ?? '20130524T000000Z';
/** @param {CorpusCase} c */
const date = (c) =>
  new Date(
    stamp(c).replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/, '$1-$2-$3T$4:$5:$6Z'),
  );
/** @param {CorpusCase} c */
function input(c) {
  const [, path, query] = c.canonical.split('\n');
  const key = decodeURIComponent(/** @type {string} */ (path).slice(1));
  const pairs = [...new URLSearchParams(query)];
  return { key, pairs, query: Object.fromEntries(pairs), host: new URL(c.href).host };
}
const ignored = new Set(['authorization', 'content-length', 'content-type', 'user-agent']);
export const tinyIgnored = new Set([...ignored, 'presigned-expires', 'expect', 'x-amzn-trace-id']);
/** @param {CorpusCase} c */
function unsupported(c) {
  if (Object.keys(c.headers).some((h) => ignored.has(h.toLowerCase()))) {
    return 'header excluded by client';
  }
  const { pairs } = input(c);
  if (new Set(pairs.map(([k]) => k)).size !== pairs.length) {
    return 'repeated query name';
  }
  return null;
}
/** @param {CorpusCase} c */
const payload = (c) =>
  c.unsigned ? 'UNSIGNED-PAYLOAD' : createHash('sha256').update(c.body).digest('hex');
/** @param {CorpusCase} c */
const headers = (c) => ({
  host: input(c).host,
  'x-amz-date': stamp(c),
  'x-amz-content-sha256': payload(c),
  ...(c.token ? { 'x-amz-security-token': c.token } : {}),
  ...c.headers,
});

/** @returns {Promise<Adapter[]>} */
export async function loadClientAdapters() {
  const { S3mini } = await import('s3mini');
  const { uriResourceEscape } = await import(source('s3mini/src/utils.ts'));
  const { getAwsSignature, awsUriEscapePath } = await import(
    source('tiny-oss/src/aws/signature.ts')
  );
  const { getAuthorizationHeader } = await import(source('lean-s3/src/request.ts'));
  const { buildRequestUrl, prepareHeadersForSigning } = await import(source('lean-s3/src/url.ts'));
  const { encodeURIComponentExtended } = await import(source('lean-s3/src/encode.ts'));
  const { getAmzDate } = await import(source('lean-s3/src/AmzDate.ts'));
  const { default: KeyCache } = await import(source('lean-s3/src/KeyCache.ts'));
  const { signV4 } = await import(source('@bradenmacdonald/s3-lite-client/signing.js'));
  const cache = new KeyCache();
  return [
    {
      id: 's3mini',
      label: 's3mini signing core',
      kind: 'async',
      version: version('s3mini'),
      unsupported: (c) =>
        !c.unsigned ? 'signed payload' : unsupported(/** @type {CorpusCase} */ (c)),
      async sign(c) {
        const { key, query } = input(/** @type {CorpusCase} */ (c));
        // No request is sent: _sign is the installed client's internal signer.
        const client = new S3mini({
          ...CREDS,
          endpoint: new URL(c.href).origin,
          region: c.region ?? REGION,
        });
        const signer =
          /** @type {{ _sign: (...args: any[]) => Promise<{ headers: Record<string, string> }> }} */ (
            /** @type {unknown} */ (client)
          );
        const result = await signer._sign(c.method, uriResourceEscape(key), query, {
          ...(c.token ? { 'x-amz-security-token': c.token } : {}),
          ...c.headers,
        });
        return /** @type {string} */ (result.headers.authorization).slice(-64);
      },
    },
    {
      id: 'tiny-oss',
      label: 'tiny-oss signing core',
      kind: 'sync',
      version: version('tiny-oss'),
      unsupported: (c) => {
        if (Object.keys(c.headers).some((h) => tinyIgnored.has(h.toLowerCase()))) {
          return 'header excluded by client';
        }
        return null;
      },
      sign(c) {
        const { key, pairs } = input(/** @type {CorpusCase} */ (c));
        const query = /** @type {Record<string, string | string[]>} */ (Object.create(null));
        for (const [k, v] of pairs) {
          query[k] = k in query ? [...[/** @type {string | string[]} */ (query[k])].flat(), v] : v;
        }
        return getAwsSignature({
          method: c.method,
          pathname: '/' + awsUriEscapePath(key),
          query,
          headers: headers(/** @type {CorpusCase} */ (c)),
          ...CREDS,
          region: c.region ?? REGION,
          payloadHash: payload(/** @type {CorpusCase} */ (c)),
          date: stamp(/** @type {CorpusCase} */ (c)),
        }).signature;
      },
    },
    {
      id: 'lean-s3',
      label: 'lean-s3 signing core',
      kind: 'sync',
      version: version('lean-s3'),
      unsupported: () => null,
      sign(c) {
        const { key, pairs } = input(/** @type {CorpusCase} */ (c));
        const url = buildRequestUrl(
          new URL(c.href).origin + '/{bucket}',
          '',
          c.region ?? REGION,
          key,
        );
        // Its core accepts an already sorted, encoded query. This does not test its operation-specific query builders.
        const query = pairs
          .map(([k, v]) => `${encodeURIComponentExtended(k)}=${encodeURIComponentExtended(v)}`)
          .join('&');
        return getAuthorizationHeader(
          cache,
          c.method,
          url.pathname,
          query,
          getAmzDate(date(/** @type {CorpusCase} */ (c))),
          prepareHeadersForSigning(headers(/** @type {CorpusCase} */ (c))),
          c.region ?? REGION,
          payload(/** @type {CorpusCase} */ (c)),
          CREDS.accessKeyId,
          CREDS.secretAccessKey,
        ).slice(-64);
      },
    },
    {
      id: 's3-lite-client',
      label: 's3-lite-client signing core',
      kind: 'async',
      version: version('@bradenmacdonald/s3-lite-client'),
      unsupported: () => null,
      async sign(c) {
        const { key } = input(/** @type {CorpusCase} */ (c));
        const query = /** @type {CorpusCase} */ (c).canonical.split('\n')[2];
        return (
          await signV4({
            method: c.method,
            path: '/' + key + (query ? '?' + query : ''),
            headers: new Headers(headers(/** @type {CorpusCase} */ (c))),
            date: date(/** @type {CorpusCase} */ (c)),
            region: c.region ?? REGION,
            accessKey: CREDS.accessKeyId,
            secretKey: CREDS.secretAccessKey,
          })
        ).slice(-64);
      },
    },
  ];
}
