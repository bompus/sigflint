import { getAwsSignature } from '../compiled/tiny-oss.mjs';
import { HREF, CREDS, REGION, UNSIGNED_EXPECTED } from '../common.mjs';
export const expected = UNSIGNED_EXPECTED;
export async function sign() {
  const u = new URL(HREF);
  return getAwsSignature({
    method: 'GET',
    pathname: u.pathname,
    headers: {
      host: u.host,
      'x-amz-date': '20130524T000000Z',
      'x-amz-content-sha256': 'UNSIGNED-PAYLOAD',
    },
    ...CREDS,
    region: REGION,
    date: '20130524T000000Z',
  }).signature;
}
