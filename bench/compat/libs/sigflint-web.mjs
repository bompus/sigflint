// the WebCrypto entry: no node: modules, so it also loads in Workers without nodejs_compat
import { HREF, CREDS, REGION, FIXED_MS, sigOf } from '../common.mjs';
import { getAuthHeaders } from 'sigflint/web';
export const sign = async () =>
  sigOf(
    (
      await getAuthHeaders(
        { method: 'GET', url: new URL(HREF), region: REGION, now: FIXED_MS },
        CREDS,
      )
    ).authorization,
  );
