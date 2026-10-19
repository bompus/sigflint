import { HREF, CREDS, REGION, EMPTY, FIXED_MS, sigOf } from '../common.mjs';
import * as mod from '../../node_modules/minio/dist/main/signing.js';
/** @typedef {typeof mod.signV4} SignV4 */
export const sign = async () => {
  // the CommonJS module may arrive as named exports or only under default, depending on the runtime and bundler;
  // one of the two is always present (the casts are for the type checker only)
  const signV4 = /** @type {SignV4} */ (
    /** @type {{ signV4?: SignV4 }} */ (mod).signV4 ??
    /** @type {{ default?: { signV4: SignV4 } }} */ (mod).default?.signV4
  );
  const u = new URL(HREF);
  const headers = { host: u.host, 'x-amz-date': '20130524T000000Z', 'x-amz-content-sha256': EMPTY };
  return sigOf(
    signV4(
      // signV4 reads method, path and headers; it does not use protocol
      /** @type {Parameters<SignV4>[0]} */ (
        /** @type {unknown} */ ({ method: 'GET', path: u.pathname + u.search, headers })
      ),
      CREDS.accessKeyId,
      CREDS.secretAccessKey,
      REGION,
      new Date(FIXED_MS),
      EMPTY,
    ),
  );
};
