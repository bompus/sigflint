import { HREF, CREDS, REGION, EMPTY, sigOf } from '../common.mjs';
import { signedHeaders } from 'aws-sig';
export const sign = async () => {
  const s = signedHeaders({ method: 'GET', url: HREF, region: REGION, service: 's3', headers: { host: new URL(HREF).host, 'X-Amz-Date': '20130524T000000Z', 'x-amz-content-sha256': EMPTY } }, { ...CREDS, region: REGION, service: 's3' });
  return sigOf(s.headers[Object.keys(s.headers).find((h) => h.toLowerCase() === 'authorization')]);
};
