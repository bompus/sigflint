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
const creds = (c) => (c.token ? { ...CREDS, sessionToken: c.token } : CREDS);
const hdrs = (c) => ({
  ...c.headers,
  ...(c.unsigned ? { 'x-amz-content-sha256': 'UNSIGNED-PAYLOAD' } : {}),
});
const sigFromUrl = (u) => new URL(u, 'https://x').searchParams.get('X-Amz-Signature');
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
const smithyFor = (c) => {
  const k = `${c.service}|${c.region}|${c.token ?? ''}`;
  if (!smithyCache.has(k))
    smithyCache.set(
      k,
      new SignatureV4({
        credentials: creds(c),
        region: c.region,
        service: c.service,
        sha256: Hash.bind(null, 'sha256'),
        applyChecksum: c.service === 's3' ? true : false,
        uriEscapePath: c.service !== 's3',
      }),
    );
  return smithyCache.get(k);
};
const smithyReq = (c, u, extra = {}) => {
  const query = {};
  for (const [k, v] of u.searchParams) query[k] = k in query ? [].concat(query[k], v) : v;
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
const frozen = (c, fn) => {
  const t = RealDate.parse(
    c.stamp.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/, '$1-$2-$3T$4:$5:$6Z'),
  );
  globalThis.Date = class extends RealDate {
    constructor(...a) {
      super(...(a.length ? a : [t]));
    }
    static now() {
      return t;
    }
  };
  try {
    return fn();
  } finally {
    globalThis.Date = RealDate;
  }
};
const date = (c) =>
  new Date(c.stamp.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/, '$1-$2-$3T$4:$5:$6Z'));

// header signing: returns the 64-hex signature
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
    return r.headers.get('authorization').slice(-64);
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
    return s.headers[Object.keys(s.headers).find((h) => h.toLowerCase() === 'authorization')].slice(
      -64,
    );
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
      signingDate: c.stamp,
      signAllHeaders: true,
      unsignedPayload: c.unsigned,
    });
    return r.headers.get('authorization').slice(-64);
  },
  minio(c) {
    if (c.service !== 's3') throw new Error('S3 only');
    const u = new URL(c.href);
    const h = {
      host: u.host,
      'x-amz-date': c.stamp,
      'x-amz-content-sha256': 'UNSIGNED-PAYLOAD',
      ...c.headers,
    };
    return minio
      .signV4(
        { method: c.method, path: u.pathname + u.search, headers: h },
        CREDS.accessKeyId,
        CREDS.secretAccessKey,
        c.region,
        date(c),
        'UNSIGNED-PAYLOAD',
      )
      .slice(-64);
  },
};
// presigned URLs: returns the X-Amz-Signature value
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
        signingDate: date(c),
        unhoistableHeaders: new Set(['x-amz-content-sha256', ...Object.keys(c.headers)]),
        unsignableHeaders: new Set(s3 ? ['x-amz-content-sha256'] : []),
      },
    );
    return r.query['X-Amz-Signature'];
  },
  'aws-sig'(c) {
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
    if (c.service !== 's3') throw new Error('S3 only');
    const u = new URL(c.href);
    return sigFromUrl(
      minio.presignSignatureV4(
        {
          protocol: u.protocol,
          host: u.host,
          path: u.pathname + u.search,
          headers: { host: u.host, ...c.headers },
          method: c.method,
        },
        CREDS.accessKeyId,
        CREDS.secretAccessKey,
        c.token ?? null,
        c.region,
        date(c),
        c.expires,
      ),
    );
  },
};

async function run(name, impls, corpus, expected, filter = () => true) {
  console.log(`\n${name}: ${corpus.filter(filter).length} cases`);
  const rows = [];
  for (const [lib, fn] of Object.entries(impls)) {
    let same = 0,
      differs = 0,
      cannot = 0,
      n = 0;
    const diffs = {},
      errs = {};
    for (const c of corpus.filter(filter)) {
      n++;
      try {
        const got = await fn(c);
        if (got === expected(c)) same++;
        else {
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
        errs[String(e.message).slice(0, 50)] = (errs[String(e.message).slice(0, 50)] ?? 0) + 1;
      }
    }
    rows.push({ library: lib, same, differs, cannot, 'same %': +((100 * same) / n).toFixed(1) });
    if (process.env.VERBOSE) console.log(' ', lib, JSON.stringify({ diffs, errs }));
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
