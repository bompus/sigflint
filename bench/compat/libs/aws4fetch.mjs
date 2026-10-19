import { HREF, CREDS, REGION, EMPTY, freezeClock, sigOf } from '../common.mjs';
import { AwsClient } from 'aws4fetch';
export const sign = async () => {
  freezeClock();
  const c = new AwsClient({ ...CREDS, service: 's3', region: REGION });
  return sigOf(
    (await c.sign(HREF, { method: 'GET', headers: { 'x-amz-content-sha256': EMPTY } })).headers.get(
      'authorization',
    ),
  );
};
