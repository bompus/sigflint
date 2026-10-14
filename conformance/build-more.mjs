// Regenerates the reference corpora for everything beyond S3 headers (test/corpus-general.json, corpus-presign.json, corpus-v4a.json, corpus-stream.json):
//   general  requests for other services, signed by botocore's SigV4Auth
//   presign  presigned URLs, signed by botocore's SigV4QueryAuth and S3SigV4QueryAuth
//   v4a      SigV4a requests and presigned URLs, signed by the AWS CRT (ECDSA is randomised, so this file differs on every run; the tests verify the signatures)
//   stream   chains of aws-chunked and event-stream signatures from the AWS SDK's smithy signer
// Needs python3 with the packages in requirements.txt (PYTHON=/path/to/python) and `npm ci` in conformance/streams.
// Usage: node conformance/build-more.mjs [general] [presign] [v4a] [stream]   (no argument builds all four, in that order)
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const here = new URL('.', import.meta.url).pathname;
const test = `${here}../test/`;
const python = process.env.PYTHON ?? 'python3';
const wanted = process.argv.length > 2 ? process.argv.slice(2) : ['general', 'presign', 'v4a', 'stream'];
const tmp = mkdtempSync(join(tmpdir(), 'sigflint-'));
const run = (command, args, options = {}) => execFileSync(command, args, { stdio: 'inherit', ...options });
const py = (script, ...args) => run(python, ['-I', `${here}${script}`, ...args]);
const node = (script, ...args) => run(process.execPath, [`${here}${script}`, ...args]);
const read = (name) => JSON.parse(readFileSync(`${test}${name}`, 'utf8'));
try {
  if (wanted.includes('general')) {
    py('general-cases.py', join(tmp, 'raw.json'));
    node('normalize.mjs', join(tmp, 'raw.json'), join(tmp, 'norm.json'));
    py('general-sign.py', join(tmp, 'norm.json'), `${test}corpus-general.json`);
  }
  if (wanted.includes('presign')) {
    py('presign.py', 'gen', join(tmp, 'raw-pre.json'));
    node('normalize.mjs', join(tmp, 'raw-pre.json'), join(tmp, 'norm-pre.json'));
    py('presign.py', 'sign', join(tmp, 'norm-pre.json'), `${test}corpus-presign.json`);
  }
  if (wanted.includes('v4a')) py('v4a.py', `${test}corpus-general.json`, `${test}corpus-presign.json`, `${test}corpus-v4a.json`);
  if (wanted.includes('stream')) {
    if (!existsSync(`${here}streams/node_modules`)) run('npm', ['ci', '--ignore-scripts'], { cwd: `${here}streams` });
    node('streams/gen-stream.mjs', join(tmp, 'stream.json'));
    // 60 chains of each kind keep the committed file small; the long ones carry the 64 KiB payloads
    const full = JSON.parse(readFileSync(join(tmp, 'stream.json'), 'utf8'));
    writeFileSync(`${test}corpus-stream.json`, JSON.stringify({ chunks: full.chunks.slice(0, 60), events: full.events.slice(0, 60) }));
  }
  for (const name of ['general', 'presign', 'v4a']) if (wanted.includes(name)) console.log(`test/corpus-${name}.json: ${read(`corpus-${name}.json`).length} cases`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
