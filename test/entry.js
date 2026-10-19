// The entry under test: Bun's entry on Bun, the node:crypto entry everywhere else (Node, Deno). `dist` is the one-file build of the same entry that the
// package exports give to Node, Bun and Deno (npm run build; npm test builds it first).
const file = typeof Bun === 'undefined' ? 'node.js' : 'bun.js';
/** @typedef {typeof import('../src/node.js')} Entry the Node and Bun entries and their builds share these signatures */
export const { getAuthHeaders, presign, getAuthHeadersV4a, presignV4a, chunkSigner, eventSigner } =
  /** @type {Entry} */ (await import(`../src/${file}`));
const dist = /** @type {Entry} */ (await import(`../dist/${file}`));

// Both ways of signing: the synchronous entry above and the WebCrypto entry (promises). Tests await every result, so one loop covers both.
const web = await import('../src/web.js');
export const entries = /** @type {const} */ ([
  ['sync', { getAuthHeaders, presign, getAuthHeadersV4a, presignV4a, chunkSigner, eventSigner }],
  ['dist', dist],
  ['web', web],
]);
