import { HREF, CREDS, REGION, EMPTY, freezeClock, sigOf } from '../common.mjs';
import aws4 from 'aws4';
export const sign = async () => {
  freezeClock();
  const u = new URL(HREF);
  return sigOf(
    aws4.sign(
      {
        host: u.host,
        path: u.pathname + u.search,
        method: 'GET',
        headers: { 'X-Amz-Content-Sha256': EMPTY },
        service: 's3',
        region: REGION,
      },
      CREDS,
    ).headers.Authorization,
  );
};
