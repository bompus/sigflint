import { getAuthorizationHeader, KeyCache, getAmzDate } from '../compiled/lean-s3.mjs';
import { HREF, CREDS, REGION, EMPTY, FIXED_MS, sigOf } from '../common.mjs';
export async function sign() {
  const u = new URL(HREF);
  return sigOf(
    getAuthorizationHeader(
      new KeyCache(),
      'GET',
      u.pathname,
      '',
      getAmzDate(new Date(FIXED_MS)),
      { host: u.host, 'x-amz-content-sha256': EMPTY, 'x-amz-date': '20130524T000000Z' },
      REGION,
      EMPTY,
      CREDS.accessKeyId,
      CREDS.secretAccessKey,
    ),
  );
}
