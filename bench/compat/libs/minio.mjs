import { HREF, CREDS, REGION, EMPTY, FIXED_MS, sigOf } from '../common.mjs';
import * as mod from '../../node_modules/minio/dist/main/signing.js';
export const sign = async () => {
  const signV4 = mod.signV4 ?? mod.default?.signV4;
  const u = new URL(HREF);
  const headers = { host: u.host, 'x-amz-date': '20130524T000000Z', 'x-amz-content-sha256': EMPTY };
  return sigOf(
    signV4(
      { method: 'GET', path: u.pathname + u.search, headers },
      CREDS.accessKeyId,
      CREDS.secretAccessKey,
      REGION,
      new Date(FIXED_MS),
      EMPTY,
    ),
  );
};
