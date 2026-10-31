import { S3mini } from 's3mini';
import { HREF, CREDS, REGION, freezeClock, sigOf, UNSIGNED_EXPECTED } from '../common.mjs';
export const expected = UNSIGNED_EXPECTED;
export async function sign() {
  freezeClock();
  const u = new URL(HREF);
  const client = new S3mini({ ...CREDS, endpoint: u.origin, region: REGION });
  const signer =
    /** @type {{ _sign: (...args: any[]) => Promise<{ headers: Record<string, string> }> }} */ (
      /** @type {unknown} */ (client)
    );
  return sigOf((await signer._sign('GET', u.pathname.slice(1), {}, {})).headers.authorization);
}
