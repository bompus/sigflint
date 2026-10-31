import { signV4 } from '../compiled/s3-lite-client.mjs';
import { HREF, CREDS, REGION, EMPTY, FIXED_MS, sigOf } from '../common.mjs';
export async function sign() {
  const u = new URL(HREF);
  return sigOf(
    await signV4({
      method: 'GET',
      path: u.pathname,
      headers: new Headers({
        host: u.host,
        'x-amz-date': '20130524T000000Z',
        'x-amz-content-sha256': EMPTY,
      }),
      date: new Date(FIXED_MS),
      region: REGION,
      accessKey: CREDS.accessKeyId,
      secretKey: CREDS.secretAccessKey,
    }),
  );
}
