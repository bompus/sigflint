// Node.js, Deno and Cloudflare Workers with the nodejs_compat flag: node:crypto.
import crypto from 'node:crypto';
import { createSigner } from './core.js';

export const getAuthHeaders = createSigner({
  hexHash: (data) => crypto.hash('sha256', data, 'hex'),
  hmac: (key, data) => crypto.createHmac('sha256', key).update(data).digest(),
  hmacHex: (key, data) => crypto.createHmac('sha256', key).update(data).digest('hex'),
});
