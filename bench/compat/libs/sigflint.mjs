// the package as a consumer imports it: the exports conditions pick the Bun entry on Bun, the WebCrypto entry on Workers (a promise, so awaited) and the node:crypto entry elsewhere
import { HREF, CREDS, REGION, FIXED_MS, sigOf } from '../common.mjs';
import { getAuthHeaders } from 'sigflint';
export const sign = async () => sigOf((await getAuthHeaders({ method: 'GET', url: new URL(HREF), region: REGION, now: FIXED_MS }, CREDS)).authorization);
