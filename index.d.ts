import type { SignRequest, Credentials, AuthHeaders } from './types/core.js';

export type { SignRequest, Credentials, AuthHeaders };

/**
 * The headers to send with an S3 request: authorization, x-amz-date, x-amz-content-sha256, the session token header
 * when there is one, and any extra headers that were signed.
 *
 * Node.js, Bun and Deno return the headers directly. Cloudflare Workers and browsers have only promise-based
 * WebCrypto and return a promise. Always `await` the result and the same code runs everywhere.
 */
export function getAuthHeaders(request: SignRequest, credentials: Credentials): AuthHeaders | Promise<AuthHeaders>;
