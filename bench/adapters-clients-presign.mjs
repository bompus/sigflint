// Public S3 presign APIs. Keys are decoded from the botocore canonical path;
// business query pairs retain their serialized-URL interpretation.
import { CREDS } from './adapters.mjs';
import { createHash } from 'node:crypto';
import { tinyIgnored } from './adapters-clients.mjs';
/** @typedef {import('./adapters-more.mjs').MCase & { canonical: string }} PresignCase */
const source = (/** @type {string} */ path) =>
  new URL(`node_modules/${path}`, import.meta.url).href;
/** @param {PresignCase} c */
const keyOf = (c) =>
  decodeURIComponent(/** @type {string} */ (c.canonical.split('\n')[1]).slice(1));
/** @param {PresignCase} c */
const pairsOf = (c) => [...new URL(c.href).searchParams];
/** @param {PresignCase} c */
const dateOf = (c) =>
  new Date(c.stamp.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/, '$1-$2-$3T$4:$5:$6Z'));
/** @param {PresignCase} c */
function commonUnsupported(c) {
  if (c.service !== 's3') {
    return 'S3 only';
  }
  try {
    keyOf(c);
  } catch {
    return 'not a decoded UTF-8 key';
  }
  if (!c.canonical.endsWith('\nUNSIGNED-PAYLOAD')) {
    return 'S3 presign uses unsigned payload';
  }
  return null;
}

export async function loadClientPresignAdapters() {
  const { S3mini } = await import('s3mini');
  const { default: S3Client } = await import(source('lean-s3/src/S3Client.ts'));
  // Bun's built-in undici shim lacks Agent.close; use the installed dependency
  // for this caller-owned pool, without changing the signing implementation.
  const { Agent } = await import(source('undici/index.js'));
  const { awsSignUrl } = await import(source('tiny-oss/src/aws/signatureUrl.ts'));
  const { presignV4 } = await import(source('@bradenmacdonald/s3-lite-client/signing.js'));
  return [
    {
      id: 's3mini',
      unsupported(/** @type {PresignCase} */ c) {
        return (
          commonUnsupported(c) ??
          (!['GET', 'PUT'].includes(c.method)
            ? 'public API accepts GET or PUT'
            : !keyOf(c)
              ? 'public API requires nonempty key'
              : new Set(pairsOf(c).map(([k]) => k)).size !== pairsOf(c).length
                ? 'repeated query name'
                : null)
        );
      },
      async sign(/** @type {PresignCase} */ c) {
        // A caller-supplied fetch selects its JavaScript signer rather than
        // Bun.S3Client's native clock/implementation. No request is sent.
        const client = new S3mini({
          ...CREDS,
          endpoint: new URL(c.href).origin,
          region: c.region,
          fetch: globalThis.fetch.bind(globalThis),
        });
        return new URL(
          await client.getPresignedUrl(
            /** @type {'GET' | 'PUT'} */ (c.method),
            keyOf(c),
            c.expires,
            {
              ...Object.fromEntries(pairsOf(c)),
              ...(c.token ? { 'X-Amz-Security-Token': c.token } : {}),
            },
            c.headers,
          ),
        ).searchParams.get('X-Amz-Signature');
      },
    },
    {
      id: 'lean-s3',
      unsupported(/** @type {PresignCase} */ c) {
        return (
          commonUnsupported(c) ??
          (!keyOf(c)
            ? 'public API requires nonempty key'
            : pairsOf(c).length
              ? 'no arbitrary query parameter API'
              : Object.keys(c.headers).some(
                    (h) => !['content-type', 'content-length'].includes(h.toLowerCase()),
                  )
                ? 'no arbitrary signed header API'
                : null)
        );
      },
      async sign(/** @type {PresignCase} */ c) {
        const u = new URL(c.href);
        const bucket = /** @type {string} */ (u.hostname.split('.')[0]);
        const dispatcher = new Agent();
        const client = new S3Client({
          ...CREDS,
          dispatcher,
          sessionToken: c.token ?? undefined,
          bucket,
          endpoint: u.origin.replace(`://${bucket}.`, '://{bucket}.'),
          region: c.region,
        });
        const h = new Headers(c.headers);
        try {
          return new URL(
            client.presign(keyOf(c), {
              method: c.method,
              expiresIn: c.expires,
              type: h.get('content-type') ?? undefined,
              contentLength: h.has('content-length') ? Number(h.get('content-length')) : undefined,
            }),
          ).searchParams.get('X-Amz-Signature');
        } finally {
          await client.close();
          await dispatcher.close();
        }
      },
    },
    {
      id: 'tiny-oss',
      unsupported(/** @type {PresignCase} */ c) {
        return (
          commonUnsupported(c) ?? (Object.keys(c.headers).length ? 'presign signs only host' : null)
        );
      },
      sign(/** @type {PresignCase} */ c) {
        const query = /** @type {Record<string, string | string[]>} */ (Object.create(null));
        for (const [k, v] of pairsOf(c)) {
          query[k] = k in query ? [...[/** @type {string | string[]} */ (query[k])].flat(), v] : v;
        }
        return new URL(
          awsSignUrl(
            {
              accessKeyId: CREDS.accessKeyId,
              accessKeySecret: CREDS.secretAccessKey,
              stsToken: c.token ?? undefined,
              endpoint: new URL(c.href).host,
              region: c.region,
              secure: new URL(c.href).protocol === 'https:',
            },
            keyOf(c),
            { ...query, method: c.method, expires: c.expires },
          ),
        ).searchParams.get('X-Amz-Signature');
      },
    },
    {
      id: 's3-lite-client',
      unsupported(/** @type {PresignCase} */ c) {
        return (
          commonUnsupported(c) ??
          (Object.keys(c.headers).some((h) =>
            ['authorization', 'content-length', 'content-type', 'user-agent'].includes(
              h.toLowerCase(),
            ),
          )
            ? 'header excluded by client'
            : null)
        );
      },
      async sign(/** @type {PresignCase} */ c) {
        const u = new URL(c.href);
        return new URL(
          await presignV4({
            accessKey: CREDS.accessKeyId,
            secretKey: CREDS.secretAccessKey,
            sessionToken: c.token ?? undefined,
            region: c.region,
            protocol: u.protocol,
            method: c.method,
            path: '/' + keyOf(c) + u.search,
            headers: new Headers({ host: u.host, ...c.headers }),
            date: dateOf(c),
            expirySeconds: c.expires,
          }),
        ).searchParams.get('X-Amz-Signature');
      },
    },
  ];
}

// tiny-oss's exported signing core also accepts a service and payload hash.
// Unlike the S3 API, it needs the caller's already canonicalized path.
export async function loadClientGeneralAdapters() {
  const { getAwsSignature } = await import(source('tiny-oss/src/aws/signature.ts'));
  return ['s3mini', 'lean-s3', 's3-lite-client', 'tiny-oss'].map((id) => ({
    id,
    unsupported: (/** @type {PresignCase} */ c) =>
      id !== 'tiny-oss'
        ? 'S3 only'
        : Object.keys(c.headers).some((h) => tinyIgnored.has(h.toLowerCase()))
          ? 'header excluded by core'
          : null,
    sign(/** @type {PresignCase} */ c) {
      const [, path, encodedQuery] = c.canonical.split('\n');
      const query = /** @type {Record<string, string | string[]>} */ (Object.create(null));
      for (const [k, v] of new URLSearchParams(encodedQuery)) {
        query[k] = k in query ? [...[/** @type {string | string[]} */ (query[k])].flat(), v] : v;
      }
      return getAwsSignature({
        ...CREDS,
        service: c.service,
        region: c.region,
        method: c.method,
        pathname: path,
        query,
        headers: {
          host: new URL(c.href).host,
          'x-amz-date': c.stamp,
          ...(c.token ? { 'x-amz-security-token': c.token } : {}),
          ...(c.unsigned ? { 'x-amz-content-sha256': 'UNSIGNED-PAYLOAD' } : {}),
          ...c.headers,
        },
        payloadHash: c.unsigned
          ? 'UNSIGNED-PAYLOAD'
          : createHash('sha256')
              .update(c.body ?? '')
              .digest('hex'),
        date: c.stamp,
      }).signature;
    },
  }));
}
