# sigflint

Fast, dependency-free AWS Signature Version 4 signing for S3 on Node.js, Bun, Deno and Cloudflare Workers.

Work in progress: the full README, benchmarks and charts are not written yet.

```js
import { getAuthHeaders } from 'sigflint';

const headers = getAuthHeaders(
  { method: 'GET', url: new URL('https://examplebucket.s3.amazonaws.com/test.txt'), region: 'us-east-1' },
  { accessKeyId, secretAccessKey },
);
const response = await fetch(url, { headers });
```
