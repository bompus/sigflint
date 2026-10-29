// SHA-256 and query-part encoding on one runtime, in one process. See protocol-hash-encode.md.
// Usage: <node|bun> hash-encode.mjs. ROUND and UNIT (environment) are copied into every row.
// Cases: the hash calls sigflint makes (Bun: Bun.SHA256.hash, which the Bun build uses, and crypto.hash, which the Node build uses; Node: crypto.hash), the
// encoders of the presigner (encodeURIComponent alone and encodeQueryPart, the exported function the presigner calls) on the strings it encodes, and the
// presigner itself (src/<runtime>.js presign) on three corpus requests. Each arm is warmed up, then timed in two passes (A forward, B reverse) of 15 batches;
// the A and B passes of one arm are the A/A control. Outputs are checked outside the timed region.
import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import os from 'node:os';
import { basename } from 'node:path';

const isBun = typeof Bun !== 'undefined';
const rt = isBun ? 'bun' : 'node';
const runtime = isBun ? `bun ${Bun.version}` : `node ${process.versions.node}`;
const mod = await import(`../src/${rt}.js`);
const { encodeQueryPart } = await import('../src/presign.js');
const round = Number(process.env.ROUND ?? 0);
const unit = process.env.UNIT ?? '';
const BATCHES = 15;

/** @param {Record<string, unknown>} o */
const emit = (o) => console.log(JSON.stringify({ runtime, rt, round, unit, ...o }));
/** @param {string | Uint8Array} x */
const sha = (x) => crypto.createHash('sha256').update(x).digest('hex');
/** @param {number[]} a */
const med = (a) => /** @type {number} */ ([...a].sort((x, y) => x - y)[a.length >> 1]);

// Inputs
let seed = 12345;
/** @param {number} n */
const bytes = (n) => {
  const b = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
    b[i] = seed >>> 24;
  }
  return b;
};
const stringToSign = `AWS4-HMAC-SHA256\n20240229T120000Z\n20240229/us-east-1/s3/aws4_request\n${sha('canonical')}`;
const canonicalRequest =
  'GET\n/photos/2026/cat.jpg\n\nhost:my-bucket.s3.us-east-1.amazonaws.com\nx-amz-content-sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\nx-amz-date:20261016T220000Z\n\nhost;x-amz-content-sha256;x-amz-date\ne3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const body1kBytes = bytes(1024);
const body64kBytes = bytes(65536);
const body1kString = Buffer.from(bytes(768)).toString('base64'); // 1,024 ASCII characters
const longToken = Buffer.from(bytes(300)).toString('base64'); // 400 characters with '+', '/' and '=' as session tokens have

/** @typedef {{ id: string, group: string, n: number, warm: number, input: string | Uint8Array, arms: Record<string, () => unknown>, output?: () => unknown }} Case */
/** @type {Case[]} */
const cases = [];
/**
 * @param {string} id
 * @param {string | Uint8Array} input
 * @param {number} n calls per batch
 * @param {number} warm calls before the first pass
 */
const hashCase = (id, input, n, warm) => {
  /** @type {Record<string, () => unknown>} */
  const arms = { 'crypto-hash': () => crypto.hash('sha256', input, 'hex') };
  if (isBun) {
    arms['bun-sha256'] = () => Bun.SHA256.hash(input, 'hex');
  }
  cases.push({ id, group: 'hash', n, warm, input, arms });
};
hashCase('hash-string-to-sign', stringToSign, 50000, 200000);
hashCase('hash-canonical-request', canonicalRequest, 50000, 200000);
hashCase('hash-body-1k-string', body1kString, 20000, 100000);
hashCase('hash-body-1k-bytes', body1kBytes, 20000, 100000);
hashCase('hash-body-64k-bytes', body64kBytes, 1000, 5000);

/** @type {Record<string, string>} */
const encodeInputs = {
  'encode-credential-execute-api':
    'AKIAIOSFODNN7EXAMPLE/20240229/us-east-1/execute-api/aws4_request',
  'encode-credential-s3': 'AKIAIOSFODNN7EXAMPLE/20240229/us-east-1/s3/aws4_request',
  'encode-signed-headers': 'host',
  'encode-token-12': 'tok663902+/=',
  'encode-token-400': longToken,
};
for (const [id, input] of Object.entries(encodeInputs)) {
  const long = input.length > 100;
  cases.push({
    id,
    group: 'encode',
    n: long ? 50000 : 100000,
    warm: 300000,
    input,
    arms: {
      encodeURIComponent: () => encodeURIComponent(input),
      encodeQueryPart: () => encodeQueryPart(input),
    },
  });
}

// the presigner on the corpus requests of the two presigned-URL speed workloads, and one with a session token
const corpus = JSON.parse(
  readFileSync(new URL('../test/corpus-presign.json', import.meta.url), 'utf8'),
);
const CREDS = {
  accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
};
/**
 * @typedef {object} PresignCase
 * @property {string} service
 * @property {string} region
 * @property {string} method
 * @property {string} href
 * @property {Record<string, string>} headers
 * @property {string | null} token
 * @property {boolean} unsigned
 * @property {number} expires
 * @property {string} stamp
 * @property {string} id
 * @property {string} sig
 */
const presignWorkloads = {
  'presign-any': 'p-execute-api-0031',
  'presign-s3': 'p-s3-0003',
  'presign-s3-token': 'p-s3-0008',
};
for (const [id, corpusId] of Object.entries(presignWorkloads)) {
  const c = /** @type {PresignCase} */ (
    corpus.find((/** @type {PresignCase} */ x) => x.id === corpusId)
  );
  const url = new URL(c.href);
  const creds = c.token ? { ...CREDS, sessionToken: c.token } : CREDS;
  /** @param {number | undefined} now */
  const call = (now) =>
    mod.presign(
      {
        method: c.method,
        url,
        service: c.service,
        region: c.region,
        unsignedPayload: c.unsigned,
        signHeaders: c.headers,
        expires: c.expires,
        now,
      },
      creds,
    );
  // the signature at the corpus's own clock is checked against the corpus's botocore value, outside the timed region
  const frozen = Date.parse(
    c.stamp.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/, '$1-$2-$3T$4:$5:$6Z'),
  );
  if (!call(frozen).endsWith(`X-Amz-Signature=${c.sig}`)) {
    emit({ status: 'error', msg: `presign signature of ${corpusId} differs from the corpus` });
    process.exit(1);
  }
  cases.push({
    id,
    group: 'presign',
    n: 20000,
    warm: 100000,
    input: c.href,
    arms: { presign: () => call(undefined) },
    output: () => call(frozen),
  });
}

/**
 * @param {() => unknown} fn
 * @param {number} n
 */
function pass(fn, n) {
  let sink = 0;
  /** @type {number[]} */
  const ns = [];
  for (let b = 0; b < BATCHES; b++) {
    const t0 = process.hrtime.bigint();
    for (let i = 0; i < n; i++) {
      sink += /** @type {string} */ (fn()).length;
    }
    ns.push(Number(process.hrtime.bigint() - t0) / n);
  }
  if (sink === 0) {
    throw new Error('no work done');
  }
  return ns;
}

emit({
  kind: 'header',
  executable: basename(process.execPath),
  priority: os.getPriority(),
  batches: BATCHES,
  caseCount: cases.length,
  corpusSha256: sha(readFileSync(new URL('../test/corpus-presign.json', import.meta.url))),
});
for (const c of cases) {
  const names = Object.keys(c.arms);
  // outputs, outside the timed region: every arm of a hash case must give the reference SHA-256 of the input
  /** @type {Record<string, string>} */
  const outDigest = {};
  for (const name of names) {
    const out = String(c.output ? c.output() : /** @type {() => unknown} */ (c.arms[name])());
    outDigest[name] = sha(out);
    if (c.group === 'hash' && out !== sha(c.input)) {
      emit({ status: 'error', msg: `${c.id} ${name} differs from the reference hash` });
      process.exit(1);
    }
  }
  for (const name of names) {
    const fn = /** @type {() => unknown} */ (c.arms[name]);
    for (let i = 0; i < c.warm; i++) {
      fn();
    }
  }
  /** @type {[string, string[]][]} */
  const passes = [
    ['A', names],
    ['B', [...names].reverse()],
  ];
  for (const [label, order] of passes) {
    for (const name of order) {
      const ns = pass(/** @type {() => unknown} */ (c.arms[name]), c.n);
      emit({
        kind: 'row',
        case: c.id,
        group: c.group,
        arm: name,
        pass: label,
        ns: med(ns),
        batches: ns,
        callsPerBatch: c.n,
        warmCalls: c.warm,
        inputBytes: typeof c.input === 'string' ? Buffer.byteLength(c.input) : c.input.length,
        inputSha256: sha(c.input),
        outputSha256: outDigest[name],
      });
    }
  }
}
emit({ kind: 'done' });
