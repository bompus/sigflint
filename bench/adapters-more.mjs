// node compat-others.mjs : how many of the any-service header cases and presigned-URL cases each library signs the same as botocore.
// Each library is called through its normal public API with natural inputs (the URL, method, headers, body, dates, service, region). A throw is counted as
// "cannot express"; a different signature as "differs". Run from this directory (node_modules is a link to the benchmark install).
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const CREDS = {
  accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
};
/**
 * A case of test/corpus-general.json (header signing) or test/corpus-presign.json (presigned URLs).
 * @typedef {object} MCase
 * @property {string} id
 * @property {string} service
 * @property {string} region
 * @property {string} method
 * @property {string} href
 * @property {Record<string, string>} headers
 * @property {string | null} [body]
 * @property {boolean} [unsigned]
 * @property {string | null} [token]
 * @property {string} stamp
 * @property {number} [expires]
 * @property {string} [kind]
 * @property {string} [mode]
 * @property {string} sig
 * @property {URL} [url] the parsed href, cached by speed-more.mjs
 */
/** @typedef {(c: MCase) => string | null | Promise<string | null>} Signer returns the signature, or throws when the library cannot express the case */
/** @param {MCase} c */
const creds = (c) => (c.token ? { ...CREDS, sessionToken: c.token } : CREDS);
/** @param {MCase} c */
const hdrs = (c) => ({
  ...c.headers,
  ...(c.unsigned ? { 'x-amz-content-sha256': 'UNSIGNED-PAYLOAD' } : {}),
});
const amz = () => new Date().toISOString().replace(/[-:]|\.\d{3}/g, '');
/** @param {string} u */
const sigFromUrl = (u) => new URL(u, 'https://x').searchParams.get('X-Amz-Signature');
/**
 * @param {string} href
 * @param {number | undefined} n
 */
const withExpires = (href, n) => {
  const u = new URL(href);
  u.searchParams.set('X-Amz-Expires', String(n));
  return u;
};

const fetchClients = new Map();
/** @param {MCase} c */
const fetchClient = (c) => {
  const k = `${c.service}|${c.region}|${c.token ?? ''}`;
  if (!fetchClients.has(k)) {
    fetchClients.set(k, new AwsClient({ ...creds(c), service: c.service, region: c.region }));
  }
  return fetchClients.get(k);
};
const aws4 = (await import('aws4')).default;
const { AwsClient } = await import('aws4fetch');
const { SignatureV4 } = await import('@smithy/signature-v4');
const { HttpRequest } = await import('@smithy/protocol-http');
const { Hash } = await import('@smithy/hash-node');
const { signedHeaders, signedQuery } = await import('aws-sig');
const { signAwsRequest } = await import('@wdl-dev/aws-sigv4');
const minio = require('minio/dist/main/signing.js');

const smithyCache = new Map();
/** @param {MCase} c */
const smithyFor = (c) => {
  const k = `${c.service}|${c.region}|${c.token ?? ''}`;
  if (!smithyCache.has(k)) {
    smithyCache.set(
      k,
      new SignatureV4({
        credentials: creds(c),
        region: c.region,
        service: c.service,
        sha256: Hash.bind(null, 'sha256'),
        applyChecksum: c.service === 's3',
        uriEscapePath: c.service !== 's3',
      }),
    );
  }
  return smithyCache.get(k);
};
/**
 * @param {MCase} c
 * @param {URL} u
 * @param {{ headers?: Record<string, string> }} [extra]
 */
const smithyReq = (c, u, extra = {}) => {
  /** @type {Record<string, string | string[]>} */
  const query = {};
  for (const [k, v] of u.searchParams) {
    query[k] =
      k in query
        ? /** @type {string[]} */ ([]).concat(/** @type {string | string[]} */ (query[k]), v)
        : v;
  }
  return new HttpRequest({
    method: c.method,
    protocol: u.protocol,
    hostname: u.hostname,
    port: u.port ? Number(u.port) : undefined,
    path: u.pathname,
    query,
    headers: { host: u.host, ...hdrs(c) },
    body: c.body ?? undefined,
    ...extra,
  });
};

// header signing: returns the 64-hex signature
/** @type {Record<string, Signer>} */
const header = {
  aws4(c) {
    const u = new URL(c.href);
    const o = aws4.sign(
      {
        host: u.host,
        path: u.pathname + u.search,
        method: c.method,
        headers: hdrs(c),
        body: c.body ?? undefined,
        service: c.service,
        region: c.region,
      },
      creds(c),
    );
    return o.headers.Authorization.slice(-64);
  },
  async aws4fetch(c) {
    const r = await fetchClient(c).sign(c.href, {
      method: c.method,
      headers: hdrs(c),
      body: c.body ?? undefined,
      aws: { allHeaders: true },
    });
    return r.headers.get('authorization').slice(-64);
  },
  async smithy(c) {
    const r = await smithyFor(c).sign(smithyReq(c, new URL(c.href)), {});
    return r.headers.authorization.slice(-64);
  },
  'aws-sig'(c) {
    const s = signedHeaders(
      {
        method: c.method,
        url: c.href,
        region: c.region,
        service: c.service,
        body: c.body ?? undefined,
        headers: { host: new URL(c.href).host, 'X-Amz-Date': amz(), ...hdrs(c) },
      },
      { ...creds(c), region: c.region, service: c.service },
    );
    return s.headers[
      /** @type {string} */ (
        Object.keys(s.headers).find((h) => h.toLowerCase() === 'authorization')
      )
    ].slice(-64);
  },
  async wdl(c) {
    const r = await signAwsRequest({
      ...creds(c),
      service: c.service,
      region: c.region,
      method: c.method,
      url: c.href,
      headers: c.headers,
      body: c.body ? c.body : undefined,
      signAllHeaders: true,
      unsignedPayload: c.unsigned,
    });
    return /** @type {string} */ (r.headers.get('authorization')).slice(-64);
  },
  minio(c) {
    if (c.service !== 's3') {
      throw new Error('S3 only');
    }
    const u = new URL(c.href);
    const h = {
      host: u.host,
      'x-amz-date': amz(),
      'x-amz-content-sha256': 'UNSIGNED-PAYLOAD',
      ...c.headers,
    };
    return minio
      .signV4(
        // signV4 reads method, path and headers; it does not use protocol
        /** @type {Parameters<typeof minio.signV4>[0]} */ (
          /** @type {unknown} */ ({ method: c.method, path: u.pathname + u.search, headers: h })
        ),
        CREDS.accessKeyId,
        CREDS.secretAccessKey,
        c.region,
        new Date(),
        'UNSIGNED-PAYLOAD',
      )
      .slice(-64);
  },
};
// presigned URLs: returns the X-Amz-Signature value
/** @type {Record<string, Signer>} */
const presign = {
  aws4(c) {
    const u = withExpires(c.href, c.expires);
    const o = (() =>
      aws4.sign(
        {
          host: u.host,
          path: u.pathname + u.search,
          method: c.method,
          headers: hdrs(c),
          service: c.service,
          region: c.region,
          signQuery: true,
        },
        creds(c),
      ))();
    return sigFromUrl(o.path);
  },
  async aws4fetch(c) {
    const r = await fetchClient(c).sign(withExpires(c.href, c.expires).href, {
      method: c.method,
      headers: hdrs(c),
      aws: { signQuery: true, allHeaders: true },
    });
    return sigFromUrl(r.url);
  },
  async smithy(c) {
    const s3 = c.service === 's3';
    const u = new URL(c.href);
    const r = await smithyFor(c).presign(
      smithyReq(
        c,
        u,
        s3
          ? { headers: { host: u.host, ...c.headers, 'x-amz-content-sha256': 'UNSIGNED-PAYLOAD' } }
          : {},
      ),
      {
        expiresIn: c.expires,
        unhoistableHeaders: new Set(['x-amz-content-sha256', ...Object.keys(c.headers)]),
        unsignableHeaders: new Set(s3 ? ['x-amz-content-sha256'] : []),
      },
    );
    return r.query['X-Amz-Signature'];
  },
  'aws-sig'(c) {
    const s = (() =>
      signedQuery(
        {
          method: c.method,
          url: withExpires(c.href, c.expires).href,
          region: c.region,
          service: c.service,
          headers: hdrs(c),
        },
        { ...creds(c), region: c.region, service: c.service },
      ))();
    return sigFromUrl(s.url);
  },
  wdl() {
    throw new Error('no presigning');
  },
  minio(c) {
    if (c.service !== 's3') {
      throw new Error('S3 only');
    }
    const u = new URL(c.href);
    return sigFromUrl(
      minio.presignSignatureV4(
        /** @type {Parameters<typeof minio.presignSignatureV4>[0]} */ ({
          protocol: u.protocol,
          host: u.host,
          path: u.pathname + u.search,
          headers: { host: u.host, ...c.headers },
          method: c.method,
        }),
        CREDS.accessKeyId,
        CREDS.secretAccessKey,
        /** @type {string | undefined} */ (c.token ?? null),
        c.region,
        new Date(),
        c.expires,
      ),
    );
  },
};

export { header, presign };
