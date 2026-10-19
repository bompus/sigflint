import { HREF, CREDS, REGION, sigOf } from '../common.mjs';
import { signAwsRequest } from '@wdl-dev/aws-sigv4';
export const sign = async () => {
  const r = await signAwsRequest({
    ...CREDS,
    service: 's3',
    region: REGION,
    method: 'GET',
    url: HREF,
    headers: {},
    body: undefined,
    signingDate: '20130524T000000Z',
    signAllHeaders: true,
    unsignedPayload: false,
  });
  return sigOf(r.headers.get('authorization'));
};
