// Compiled (not run) by `npm run types`: checks that the published declarations accept the documented calls and reject wrong ones.
import { getAuthHeaders } from 'sigflint';

const headers: Record<string, string> = await getAuthHeaders(
  { method: 'PUT', url: new URL('https://bucket.s3.us-east-1.amazonaws.com/key'), region: 'us-east-1', body: 'x', signHeaders: { 'x-amz-acl': 'private' }, unsignedPayload: false, now: Date.now() },
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
