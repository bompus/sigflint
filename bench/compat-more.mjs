// node compat-others.mjs : how many of the any-service header cases and presigned-URL cases each library signs the same as botocore.
// Each library is called through its normal public API with natural inputs (the URL, method, headers, body, dates, service, region). A throw is counted as
// "cannot express"; a different signature as "differs". Run from this directory (node_modules is a link to the benchmark install).
import { readFileSync } from 'node:fs';
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
 */
/** @typedef {(c: MCase) => string | null | Promise<string | null>} Signer returns the signature, or throws when the library cannot express the case */
/** @param {MCase} c */
const creds = (c) => (c.token ? { ...CREDS, sessionToken: c.token } : CREDS);
/** @param {MCase} c */
const hdrs = (c) => ({
  ...c.headers,
  ...(c.unsigned ? { 'x-amz-content-sha256': 'UNSIGNED-PAYLOAD' } : {}),
});
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
// aws4 and aws-sig take the signing time from the clock when presigning, so the clock is frozen around the call
const RealDate = Date;
/**
 * @template T
 * @param {MCase} c
 * @param {() => T} fn
 * @returns {T}
 */
const frozen = (c, fn) => {
  const t = RealDate.parse(
    c.stamp.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/, '$1-$2-$3T$4:$5:$6Z'),
  );
  // a cast: the subclass has no call signature (Date() without new), which DateConstructor declares
  globalThis.Date = /** @type {DateConstructor} */ (
    /** @type {unknown} */ (
      class extends RealDate {
        /** @param {...any} a */
        constructor(...a) {
          super(.../** @type {[number]} */ (a.length ? a : [t]));
        }
        /** @override */
        static now() {
          return t;
        }
      }
    )
  );
  try {
    return fn();
  } finally {
    globalThis.Date = RealDate;
  }
};
/** @param {MCase} c */
const date = (c) =>
  new Date(c.stamp.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/, '$1-$2-$3T$4:$5:$6Z'));

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
        headers: { 'X-Amz-Date': c.stamp, ...hdrs(c) },
        body: c.body ?? undefined,
        service: c.service,
        region: c.region,
      },
      creds(c),
    );
    return o.headers.Authorization.slice(-64);
  },
  async aws4fetch(c) {
    const r = await new AwsClient({ ...creds(c), service: c.service, region: c.region }).sign(
      c.href,
      {
        method: c.method,
        headers: hdrs(c),
        body: c.body ?? undefined,
        aws: { allHeaders: true, datetime: c.stamp },
      },
    );
    return /** @type {string} */ (r.headers.get('authorization')).slice(-64);
  },
  async smithy(c) {
    const r = await smithyFor(c).sign(smithyReq(c, new URL(c.href)), { signingDate: date(c) });
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
        headers: { host: new URL(c.href).host, 'X-Amz-Date': c.stamp, ...hdrs(c) },
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
      // bytes, not a string: a string body makes wdl add (and sign) a Content-Type header
      body: c.body ? new TextEncoder().encode(c.body) : undefined,
      signingDate: c.stamp,
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
      'x-amz-date': c.stamp,
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
        date(c),
        'UNSIGNED-PAYLOAD',
      )
      .slice(-64);
  },
};
/**
 * aws-sig always hashes the body: sending `x-amz-content-sha256` does not make it sign `UNSIGNED-PAYLOAD`, and it
 * offers no payload-hash option, so it cannot express a payload opt-out outside S3.
 * @param {MCase} c
 */
const optOutUnsigned = (c) => {
  if (c.service !== 's3' && c.unsigned) {
    throw new Error('no payload opt-out');
  }
};
// presigned URLs: returns the X-Amz-Signature value
/** @type {Record<string, Signer>} */
const presign = {
  aws4(c) {
    const u = withExpires(c.href, c.expires);
    const o = frozen(c, () =>
      aws4.sign(
        {
          host: u.host,
          path: u.pathname + u.search,
          method: c.method,
          headers: hdrs(c),
          service: c.service,
          region: c.region,
          signQuery: true,
          // the payload opt-out header carries the hash and is not signed, as the reference signs without it
          extraHeadersToIgnore: c.unsigned ? { 'x-amz-content-sha256': true } : undefined,
        },
        creds(c),
      ),
    );
    return sigFromUrl(o.path);
  },
  async aws4fetch(c) {
    const r = await new AwsClient({ ...creds(c), service: c.service, region: c.region }).sign(
      withExpires(c.href, c.expires).href,
      {
        method: c.method,
        headers: hdrs(c),
        aws: { signQuery: true, allHeaders: true, datetime: c.stamp },
      },
    );
    return sigFromUrl(r.url);
  },
  async smithy(c) {
    // S3 presigns with an unsigned payload; any other service does when the caller opts out. The header carries the
    // payload hash to the signer and is left unhoisted and unsigned, as the reference signs only `host`.
    const unsigned = c.service === 's3' || c.unsigned;
    const u = new URL(c.href);
    const r = await smithyFor(c).presign(
      smithyReq(
        c,
        u,
        unsigned
          ? { headers: { host: u.host, ...c.headers, 'x-amz-content-sha256': 'UNSIGNED-PAYLOAD' } }
          : {},
      ),
      {
        expiresIn: c.expires,
        signingDate: date(c),
        unhoistableHeaders: new Set(['x-amz-content-sha256', ...Object.keys(c.headers)]),
        unsignableHeaders: new Set(unsigned ? ['x-amz-content-sha256'] : []),
      },
    );
    return r.query['X-Amz-Signature'];
  },
  'aws-sig'(c) {
    optOutUnsigned(c);
    const s = frozen(c, () =>
      signedQuery(
        {
          method: c.method,
          url: withExpires(c.href, c.expires).href,
          region: c.region,
          service: c.service,
          headers: hdrs(c),
        },
        { ...creds(c), region: c.region, service: c.service },
      ),
    );
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
        date(c),
        c.expires,
      ),
    );
  },
};

/**
 * Prints how many cases each library signs the same as the reference.
 * @param {string} name
 * @param {Record<string, Signer>} impls
 * @param {MCase[]} corpus
 * @param {(c: MCase) => string} expected
 * @param {(c: MCase) => unknown} [filter]
 */
async function run(name, impls, corpus, expected, filter = () => true) {
  console.log(`\n${name}: ${corpus.filter(filter).length} cases`);
  const rows = [];
  for (const [lib, fn] of Object.entries(impls)) {
    let same = 0,
      differs = 0,
      cannot = 0,
      n = 0;
    /** @type {Record<string, number>} */
    const diffs = {},
      /** @type {Record<string, number>} */
      errs = {};
    for (const c of corpus.filter(filter)) {
      n++;
      try {
        const got = await fn(c);
        if (got === expected(c)) {
          same++;
        } else {
          differs++;
          {
            const k =
              c.kind ??
              (c.mode ?? '') +
                (c.unsigned ? 'unsigned' : 'signed') +
                (c.token ? '+token' : '') +
                (Object.keys(c.headers).length ? '+hdrs' : '');
            diffs[k] = (diffs[k] ?? 0) + 1;
          }
        }
      } catch (e) {
        cannot++;
        errs[String(/** @type {Error} */ (e).message).slice(0, 50)] =
          (errs[String(/** @type {Error} */ (e).message).slice(0, 50)] ?? 0) + 1;
      }
    }
    rows.push({ library: lib, same, differs, cannot, 'same %': +((100 * same) / n).toFixed(1) });
    if (process.env.VERBOSE) {
      console.log(' ', lib, JSON.stringify({ diffs, errs }));
    }
  }
  console.table(rows);
}
const general = JSON.parse(
  readFileSync(new URL('../test/corpus-general.json', import.meta.url), 'utf8'),
);
const pre = JSON.parse(
  readFileSync(new URL('../test/corpus-presign.json', import.meta.url), 'utf8'),
);
await run('any service, header signing', header, general, (c) => c.sig);
await run(
  'presigned URLs, any service but S3, payload signed',
  presign,
  pre,
  (c) => c.sig,
  (c) => c.service !== 's3' && !c.unsigned,
);
await run(
  'presigned URLs, any service but S3, caller opts out of payload signing',
  presign,
  pre,
  (c) => c.sig,
  (c) => c.service !== 's3' && c.unsigned,
);
await run(
  'presigned URLs, S3',
  presign,
  pre,
  (c) => c.sig,
  (c) => c.service === 's3',
);
