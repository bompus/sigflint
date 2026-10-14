// Compiled (not run) by `npm run types`: checks that the published declarations accept the documented calls and reject wrong ones.
import { getAuthHeaders } from 'sigflint';

const headers: Record<string, string> = await getAuthHeaders(
  {
    method: 'PUT',
    url: new URL('https://bucket.s3.us-east-1.amazonaws.com/key'),
    region: 'us-east-1',
    body: 'x',
    signHeaders: { 'x-amz-acl': 'private' },
    unsignedPayload: false,
    now: Date.now(),
  },
  { accessKeyId: 'id', secretAccessKey: 'secret', sessionToken: 'token' },
);
const auth: string = headers.authorization;
void auth;

// @ts-expect-error url must be a URL, not a string
getAuthHeaders({ method: 'GET', url: 'https://bucket.example.com/key' }, { accessKeyId: 'id', secretAccessKey: 'secret' });
// @ts-expect-error credentials need a secretAccessKey
getAuthHeaders({ method: 'GET', url: new URL('https://bucket.example.com/key') }, { accessKeyId: 'id' });
// @ts-expect-error the result may be a promise (on Workers), so it must be awaited before it is used as headers
const unawaited: Record<string, string> = getAuthHeaders({ method: 'GET', url: new URL('https://bucket.example.com/key') }, { accessKeyId: 'id', secretAccessKey: 'secret' });
void unawaited;

// the WebCrypto entry returns a promise
import { getAuthHeaders as getAuthHeadersWeb } from 'sigflint/web';

const pending: Promise<Record<string, string>> = getAuthHeadersWeb(
  { method: 'GET', url: new URL('https://bucket.example.com/key') },
  { accessKeyId: 'id', secretAccessKey: 'secret' },
);
void pending;
// @ts-expect-error a promise is not the headers
const notHeaders: Record<string, string> = getAuthHeadersWeb({ method: 'GET', url: new URL('https://bucket.example.com/key') }, { accessKeyId: 'id', secretAccessKey: 'secret' });
void notHeaders;

// the other signers
import { presign, getAuthHeadersV4a, presignV4a, chunkSigner, eventSigner } from 'sigflint';
import { presign as presignWeb, chunkSigner as chunkSignerWeb } from 'sigflint/web';

const credentials = { accessKeyId: 'id', secretAccessKey: 'secret' };
const request = { method: 'GET', url: new URL('https://sqs.us-east-1.amazonaws.com/'), service: 'sqs', region: 'us-east-1', expires: 60 };
const link: string = await presign(request, credentials);
const multi: Record<string, string> = await getAuthHeadersV4a({ ...request, regionSet: '*' }, credentials);
const multiLink: string = await presignV4a({ ...request, regionSet: 'us-east-1,us-west-2' }, credentials);
const chunks = chunkSigner(multi, credentials);
const frame: Uint8Array = await chunks.chunk(new Uint8Array(3));
const last: Uint8Array = await chunks.end({ 'x-amz-checksum-crc32c': 'sOO8/Q==' });
const event: Uint8Array = await eventSigner(multi, credentials).sign(new Uint8Array(3), Date.now());
void [link, multiLink, frame, last, event];
// @ts-expect-error the service must be a string
presign({ ...request, service: 1 }, credentials);
// @ts-expect-error the trailers are a record of strings
chunks.end({ 'x-amz-checksum-crc32c': 1 });

// the WebCrypto entry: presigned URLs are promises, and so are the chunk signer's methods
const pendingLink: Promise<string> = presignWeb(request, credentials);
const pendingFrame: Promise<Uint8Array> = chunkSignerWeb(multi, credentials).chunk(new Uint8Array(3));
void [pendingLink, pendingFrame];
// @ts-expect-error a promise is not the link
const notLink: string = presignWeb(request, credentials);
void notLink;
