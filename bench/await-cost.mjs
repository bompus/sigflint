// What `await` adds when the signer returns its headers directly (Node, Bun, Deno): 7 alternating blocks of 200,000
// calls with and without await, in one process. Usage: <node|bun> await-cost.mjs
const { getAuthHeaders } = await import(
  typeof Bun === 'undefined' ? '../src/node.js' : '../src/bun.js'
);
const url = new URL(
  'https://examplebucket.s3.amazonaws.com/2022/05/media/upload/facebook-131__m4qhsQzwMdHCoc6UnBOYv.webp',
);
const req = { method: 'GET', url, region: 'us-east-1', now: 1369353600000 };
const cred = {
  accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
};
let sink = 0;
/** @param {number} n */
const sync = async (n) => {
  for (let i = 0; i < n; i++) {
    sink += getAuthHeaders(req, cred).authorization.length;
  }
};
/** @param {number} n */
const awaited = async (n) => {
  for (let i = 0; i < n; i++) {
    sink += (await getAuthHeaders(req, cred)).authorization.length;
  }
};
/**
 * @param {(n: number) => Promise<void>} f
 * @param {number} [n]
 */
const time = async (f, n = 200000) => {
  const t = performance.now();
  await f(n);
  return ((performance.now() - t) * 1e6) / n;
};
for (let w = 0; w < 3; w++) {
  await sync(50000);
  await awaited(50000);
}
/** @type {{ sync: number[], awaited: number[] }} */
const r = { sync: [], awaited: [] };
for (let k = 0; k < 7; k++) {
  r.sync.push(await time(sync));
  r.awaited.push(await time(awaited));
}
/** @param {number[]} a */
const med = (a) => /** @type {number} */ ([...a].sort((x, y) => x - y)[3]);
console.log(
  JSON.stringify({
    runtime: typeof Bun === 'undefined' ? `node ${process.versions.node}` : `bun ${Bun.version}`,
    syncNs: Math.round(med(r.sync)),
    awaitedNs: Math.round(med(r.awaited)),
    syncRange: [Math.round(Math.min(...r.sync)), Math.round(Math.max(...r.sync))],
    awaitedRange: [Math.round(Math.min(...r.awaited)), Math.round(Math.max(...r.awaited))],
    sink,
  }),
);
