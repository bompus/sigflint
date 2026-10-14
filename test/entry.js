// The entry under test: Bun's entry on Bun, the node:crypto entry everywhere else (Node, Deno).
export const { getAuthHeaders, presign, getAuthHeadersV4a, presignV4a, chunkSigner, eventSigner } = await import(typeof Bun === 'undefined' ? '../src/node.js' : '../src/bun.js');

// Both ways of signing: the synchronous entry above and the WebCrypto entry (promises). Tests await every result, so one loop covers both.
const web = await import('../src/web.js');
export const entries = /** @type {const} */ ([
  ['sync', { getAuthHeaders, presign, getAuthHeadersV4a, presignV4a, chunkSigner, eventSigner }],
  ['web', web],
]);
