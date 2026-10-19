import type { SignRequest, Credentials, AuthHeaders } from './types/base.js';

export type { SignRequest, Credentials, AuthHeaders };

/** A SigV4a request: a SignRequest whose `regionSet` is required, for example 'us-east-1,us-west-2' or '*'. */
export type SignRequestV4a = SignRequest & { regionSet: string };

/** A value that is a promise on Cloudflare Workers and in browsers (WebCrypto has only promises) and the value itself on Node.js, Bun and Deno. Always `await` it. */
export type MaybePromise<T> = T | Promise<T>;

/** Signs an aws-chunked upload: `chunk` for each piece of the body in order, then `end`. */
export interface ChunkSigner {
  chunk(data: Uint8Array): MaybePromise<Uint8Array>;
  end(trailers?: Record<string, string>): MaybePromise<Uint8Array>;
}

/** Signs the messages of an event stream in order. */
export interface EventSigner {
  sign(message: Uint8Array, now?: number): MaybePromise<Uint8Array>;
}

/**
 * The headers to send with a request: authorization, x-amz-date, the session token header when there is one, any extra headers that were signed and, for S3 (or
 * when `unsignedPayload` is set), x-amz-content-sha256. `request.service` defaults to 's3'.
 *
 * Node.js, Bun and Deno return the headers directly. Cloudflare Workers and browsers have only promise-based
 * WebCrypto and return a promise. Always `await` the result and the same code runs everywhere.
 */
export function getAuthHeaders(
  request: SignRequest,
  credentials: Credentials,
): MaybePromise<AuthHeaders>;

/** A presigned URL: the original URL with the authentication parameters and the signature added. `request.expires` is the lifetime in seconds (default 3600). */
export function presign(request: SignRequest, credentials: Credentials): MaybePromise<string>;

/** SigV4a (multi-region) headers; `request.regionSet` is required, for example 'us-east-1,us-west-2' or '*'. */
export function getAuthHeadersV4a(
  request: SignRequestV4a,
  credentials: Credentials,
): MaybePromise<AuthHeaders>;

/** A SigV4a presigned URL; `request.regionSet` is required. */
export function presignV4a(request: SignRequestV4a, credentials: Credentials): MaybePromise<string>;

/** Chunk signer for an upload sent with `x-amz-content-sha256: STREAMING-AWS4-HMAC-SHA256-PAYLOAD`; `authHeaders` are the headers getAuthHeaders returned for it. */
export function chunkSigner(authHeaders: AuthHeaders, credentials: Credentials): ChunkSigner;

/** Event-stream signer; `authHeaders` are the headers getAuthHeaders returned for the request that opened the stream. */
export function eventSigner(authHeaders: AuthHeaders, credentials: Credentials): EventSigner;
