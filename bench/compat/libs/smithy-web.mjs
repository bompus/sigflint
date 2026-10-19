import { HREF, CREDS, REGION, EMPTY, FIXED_MS, sigOf } from '../common.mjs';
import { SignatureV4 } from '@smithy/signature-v4';
import { HttpRequest } from '@smithy/protocol-http';
import { Sha256 } from '@aws-crypto/sha256-js';
export const sign = async () => {
  const s = new SignatureV4({
    credentials: CREDS,
    region: REGION,
    service: 's3',
    sha256: Sha256,
    uriEscapePath: false,
  });
  const u = new URL(HREF);
  const req = new HttpRequest({
    method: 'GET',
    protocol: u.protocol,
    hostname: u.hostname,
    path: u.pathname,
    query: {},
    headers: { host: u.host, 'x-amz-content-sha256': EMPTY },
  });
  return sigOf((await s.sign(req, { signingDate: new Date(FIXED_MS) })).headers.authorization);
};
