// One adapter per candidate signer (sigflint plus the libraries it is compared with). Each adapter turns a corpus case into the SigV4 Authorization value its library
// produces, given the natural inputs a caller has (the serialized URL, method, extra headers, payload hash or body).
// `unsupported(case)` names the cases a library cannot express at all (kept visible, not counted as wrong).
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

export const CREDS = {
  accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
};
export const REGION = 'us-east-1';
export const FIXED_ISO = '2013-05-24T00:00:00.000Z';
export const FIXED = new Date(FIXED_ISO);

/**
 * A corpus case as the adapters read it (test/corpus.json).
 * @typedef {object} Case
 * @property {string} id
 * @property {string} method
 * @property {string} href
 * @property {Record<string, string>} headers
 * @property {string} body
 * @property {boolean} [unsigned]
 * @property {string} [token]
 * @property {string} [region]
 * @property {URL} [url] the parsed href, cached by U()
 */
/** @typedef {Record<string, { sig: string, canonical: string }>} Expected the reference signature and canonical request per case id */
/**
 * @typedef {object} AdapterInfo
 * @property {string} id
 * @property {string} label
 * @property {string} version
 * @property {(c: Case) => string | null} unsupported names why a library cannot express the case, or null
 */
/**
 * A sync adapter returns the signature; an async one a promise of it.
 * @typedef {AdapterInfo & ({ kind: 'sync', sign: (c: Case) => string } | { kind: 'async', sign: (c: Case) => Promise<string> })} Adapter
 */
/** @typedef {Record<string, string | string[]>} Query */

/** @param {string} s */
const sha = (s) => createHash('sha256').update(s).digest('hex');
/** @param {Case} c */
const payloadOf = (c) => (c.unsigned ? 'UNSIGNED-PAYLOAD' : sha(c.body));
/** @param {string} auth */
const sigOf = (auth) => auth.slice(-64); // validated against the reference before any timing
const require = createRequire(import.meta.url);
// the URL object is built once per case: callers of these signers already hold a parsed URL
/** @param {Case} c */
const U = (c) => (c.url ??= new URL(c.href));
// A session token travels as `x-amz-security-token`, signed with the other headers, as the SDKs send it. Libraries with
// a credentials option for it use that instead.
/**
 * @param {Case} c
 * @returns {Record<string, string>}
 */
const tok = (c) => (c.token ? { 'x-amz-security-token': c.token } : {});

// freezes `new Date()` and Date.now() for libraries that read the clock themselves
/** @param {string} [iso] */
export function freezeClock(iso = FIXED_ISO) {
  const RealDate = globalThis.Date;
  // a cast: the subclass has no call signature (Date() without new), which DateConstructor declares
  globalThis.Date = /** @type {DateConstructor} */ (
    /** @type {unknown} */ (
      class extends RealDate {
        /** @param {...any} a */
        constructor(...a) {
          super(.../** @type {[string]} */ (a.length === 0 ? [iso] : a));
        }
        /** @override */
        static now() {
          return RealDate.parse(iso);
        }
      }
    )
  );
  return () => {
    globalThis.Date = RealDate;
  };
}

// `only` (optional array of section ids: sigflint, aws4fetch, aws4, smithy, smithy-web, aws-sig, wdl, minio) loads just those libraries,
// so a memory or import-time measurement does not carry the other libraries; without it every library is loaded.
/**
 * @param {string} oursPath
 * @param {Expected | null} [expected]
 * @param {string[]} [only]
 * @returns {Promise<Adapter[]>}
 */
export async function loadAdapters(oursPath, expected, only) {
  /** @param {string} k */
  const want = (k) => !only || only.includes(k);
  /** @type {Adapter[]} */
  const adapters = [];
  /** @param {Adapter} a */
  const add = (a) => adapters.push(a);

  // JSON.parse reads the Buffer as UTF-8 text (the casts are for the type checker only)
  /** @param {string} p */
  const ver = (p) =>
    JSON.parse(
      /** @type {string} */ (
        /** @type {unknown} */ (
          readFileSync(new URL(`./node_modules/${p}/package.json`, import.meta.url))
        )
      ),
    ).version;

  // --- sigflint (the entry for the runtime this process runs on, from the frozen copy)
  if (want('sigflint')) {
    const { getAuthHeaders } = await import(oursPath);
    add({
      id: 'sigflint',
      label: 'sigflint',
      kind: 'sync',
      version: JSON.parse(
        /** @type {string} */ (
          /** @type {unknown} */ (readFileSync(new URL('../package.json', import.meta.url)))
        ),
      ).version,
      unsupported: () => null,
      sign(c) {
        const credentials = c.token ? { ...CREDS, sessionToken: c.token } : CREDS;
        return sigOf(
          getAuthHeaders(
            {
              method: c.method,
              url: U(c),
              region: c.region ?? REGION,
              body: c.body,
              unsignedPayload: c.unsigned,
              signHeaders: { ...c.headers },
            },
            credentials,
          ).authorization,
        );
      },
    });
  }
  // --- aws4fetch
  if (want('aws4fetch')) {
    const { AwsClient } = await import('aws4fetch');
    const aws4fetch = new AwsClient({ ...CREDS, service: 's3', region: REGION });
    add({
      id: 'aws4fetch',
      label: 'aws4fetch',
      kind: 'async',
      version: ver('aws4fetch'),
      unsupported: () => null,
      async sign(c) {
        const r = await aws4fetch.sign(c.href, {
          method: c.method,
          headers: { 'x-amz-content-sha256': payloadOf(c), ...c.headers },
          ...(c.token && { aws: { sessionToken: c.token } }),
        });
        return sigOf(/** @type {string} */ (r.headers.get('authorization')));
      },
    });
  }
  // --- aws4 (mhart)
  if (want('aws4')) {
    const aws4 = (await import('aws4')).default;
    add({
      id: 'aws4',
      label: 'aws4 (mhart)',
      kind: 'sync',
      version: ver('aws4'),
      unsupported: () => null,
      sign(c) {
        const u = U(c);
        const o = aws4.sign(
          {
            host: u.host,
            path: u.pathname + u.search,
            method: c.method,
            headers: { 'X-Amz-Content-Sha256': payloadOf(c), ...c.headers },
            service: 's3',
            region: REGION,
          },
          c.token ? { ...CREDS, sessionToken: c.token } : CREDS,
        );
        return sigOf(o.headers.Authorization);
      },
    });
  }
  // --- @smithy/signature-v4 (what the AWS SDK for JavaScript v3 uses)
  if (want('smithy')) {
    const { SignatureV4 } = await import('@smithy/signature-v4');
    const { HttpRequest } = await import('@smithy/protocol-http');
    const { Hash } = await import('@smithy/hash-node');
    const smithy = new SignatureV4({
      credentials: CREDS,
      region: REGION,
      service: 's3',
      sha256: Hash.bind(null, 'sha256'),
      uriEscapePath: false,
    });
    add({
      id: 'smithy',
      label: '@smithy/signature-v4',
      kind: 'async',
      version: ver('@smithy/signature-v4'),
      unsupported: () => null,
      async sign(c) {
        const u = U(c);
        /** @type {Query} */
        const query = {};
        for (const [k, v] of u.searchParams) {
          query[k] =
            k in query
              ? /** @type {string[]} */ ([]).concat(/** @type {string | string[]} */ (query[k]), v)
              : v;
        }
        const req = new HttpRequest({
          method: c.method,
          protocol: u.protocol,
          hostname: u.hostname,
          port: u.port ? Number(u.port) : undefined,
          path: u.pathname,
          query,
          headers: { host: u.host, 'x-amz-content-sha256': payloadOf(c), ...c.headers, ...tok(c) },
        });
        const signed = await smithy.sign(req, { signingDate: FIXED });
        return sigOf(/** @type {string} */ (signed.headers.authorization));
      },
    });

    if (expected) {
      // the AWS SDK and the MinIO client encode the path and query before they sign; give the signing core the same
      /** @param {Case} c */
      const pre = (c) => {
        const [, path, query] = /** @type {[string, string, string]} */ (
          /** @type {{ canonical: string }} */ (expected[c.id]).canonical.split('\n')
        );
        return { path, query };
      };
      add({
        id: 'smithy-pre',
        label: '@smithy/signature-v4 (pre-encoded input)',
        kind: 'async',
        version: ver('@smithy/signature-v4'),
        unsupported: () => null,
        async sign(c) {
          const u = U(c);
          const { path, query: q } = pre(c);
          /** @type {Query} */
          const query = {};
          for (const [k, v] of new URLSearchParams(q)) {
            query[k] =
              k in query
                ? /** @type {string[]} */ ([]).concat(
                    /** @type {string | string[]} */ (query[k]),
                    v,
                  )
                : v;
          }
          const req = new HttpRequest({
            method: c.method,
            protocol: u.protocol,
            hostname: u.hostname,
            port: u.port ? Number(u.port) : undefined,
            path,
            query,
            headers: {
              host: u.host,
              'x-amz-content-sha256': payloadOf(c),
              ...c.headers,
              ...tok(c),
            },
          });
          return sigOf(
            /** @type {string} */ (
              (await smithy.sign(req, { signingDate: FIXED })).headers.authorization
            ),
          );
        },
      });
    }
  }
  // --- @smithy/signature-v4 with the web SHA-256 helper (what the AWS SDK uses off Node)
  if (want('smithy-web')) {
    const { SignatureV4 } = await import('@smithy/signature-v4');
    const { HttpRequest } = await import('@smithy/protocol-http');
    const { Sha256 } = await import('@aws-crypto/sha256-js');
    const smithyWeb = new SignatureV4({
      credentials: CREDS,
      region: REGION,
      service: 's3',
      sha256: Sha256,
      uriEscapePath: false,
    });
    add({
      id: 'smithy-web',
      label: '@smithy/signature-v4 (web SHA-256)',
      kind: 'async',
      version: ver('@smithy/signature-v4'),
      unsupported: () => null,
      async sign(c) {
        const u = U(c);
        /** @type {Query} */
        const query = {};
        for (const [k, v] of u.searchParams) {
          query[k] =
            k in query
              ? /** @type {string[]} */ ([]).concat(/** @type {string | string[]} */ (query[k]), v)
              : v;
        }
        const req = new HttpRequest({
          method: c.method,
          protocol: u.protocol,
          hostname: u.hostname,
          port: u.port ? Number(u.port) : undefined,
          path: u.pathname,
          query,
          headers: { host: u.host, 'x-amz-content-sha256': payloadOf(c), ...c.headers, ...tok(c) },
        });
        return sigOf(
          /** @type {string} */ (
            (await smithyWeb.sign(req, { signingDate: FIXED })).headers.authorization
          ),
        );
      },
    });
  }
  // --- aws-sig
  if (want('aws-sig')) {
    const { signedHeaders } = await import('aws-sig');
    add({
      id: 'aws-sig',
      label: 'aws-sig',
      kind: 'sync',
      version: ver('aws-sig'),
      unsupported: () => null,
      sign(c) {
        const s = signedHeaders(
          {
            method: c.method,
            url: c.href,
            region: REGION,
            service: 's3',
            // aws-sig hashes the body it is given and ignores the hash header, so the body goes in whatever the method
            body: c.body,
            headers: {
              host: U(c).host,
              'X-Amz-Date': '20130524T000000Z',
              'x-amz-content-sha256': payloadOf(c),
              ...c.headers,
              ...tok(c),
            },
          },
          { ...CREDS, region: REGION, service: 's3' },
        );
        const k = Object.keys(s.headers).find((h) => h.toLowerCase() === 'authorization');
        return sigOf(s.headers[/** @type {string} */ (k)]);
      },
    });
  }
  // --- @wdl-dev/aws-sigv4
  if (want('wdl')) {
    const { signAwsRequest } = await import('@wdl-dev/aws-sigv4');
    add({
      id: 'wdl',
      label: '@wdl-dev/aws-sigv4',
      kind: 'async',
      version: ver('@wdl-dev/aws-sigv4'),
      unsupported: () => null,
      async sign(c) {
        const r = await signAwsRequest({
          ...CREDS,
          sessionToken: c.token,
          service: 's3',
          region: REGION,
          method: c.method,
          url: c.href,
          headers: c.headers,
          // bytes, not a string: a string body makes wdl add (and sign) a Content-Type header; any method may carry one
          body: c.body === '' ? undefined : new TextEncoder().encode(c.body),
          signingDate: '20130524T000000Z',
          signAllHeaders: true,
          unsignedPayload: c.unsigned,
        });
        return sigOf(/** @type {string} */ (r.headers.get('authorization')));
      },
    });
  }
  // --- minio (signV4 only; the caller supplies path and query already encoded)
  if (want('minio')) {
    const { signV4 } = require('minio/dist/main/signing.js');
    add({
      id: 'minio',
      label: 'minio signV4',
      kind: 'sync',
      version: ver('minio'),
      unsupported: () => null,
      sign(c) {
        const u = U(c);
        const payload = payloadOf(c);
        const headers = {
          host: u.host,
          'x-amz-date': '20130524T000000Z',
          'x-amz-content-sha256': payload,
          ...c.headers,
          ...tok(c),
        };
        return sigOf(
          signV4(
            // signV4 reads method, path and headers; it does not use protocol
            /** @type {Parameters<typeof signV4>[0]} */ (
              /** @type {unknown} */ ({
                method: c.method,
                path: u.pathname + u.search,
                headers,
              })
            ),
            CREDS.accessKeyId,
            CREDS.secretAccessKey,
            REGION,
            FIXED,
            payload,
          ),
        );
      },
    });

    if (expected) {
      add({
        id: 'minio-pre',
        label: 'minio signV4 (pre-encoded input)',
        kind: 'sync',
        version: ver('minio'),
        unsupported: () => null,
        sign(c) {
          const u = U(c);
          const [, path, query] = /** @type {[string, string, string]} */ (
            /** @type {{ canonical: string }} */ (expected[c.id]).canonical.split('\n')
          );
          const payload = payloadOf(c);
          const headers = {
            host: u.host,
            'x-amz-date': '20130524T000000Z',
            'x-amz-content-sha256': payload,
            ...c.headers,
            ...tok(c),
          };
          return sigOf(
            signV4(
              // signV4 reads method, path and headers; it does not use protocol
              /** @type {Parameters<typeof signV4>[0]} */ (
                /** @type {unknown} */ ({
                  method: c.method,
                  path: path + (query ? '?' + query : ''),
                  headers,
                })
              ),
              CREDS.accessKeyId,
              CREDS.secretAccessKey,
              REGION,
              FIXED,
              payload,
            ),
          );
        },
      });
    }
  }
  return adapters;
}
