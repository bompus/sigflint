// The entry under test: Bun's entry on Bun, the node:crypto entry everywhere else (Node, Deno).
export const { getAuthHeaders } = await import(typeof Bun === 'undefined' ? '../src/node.js' : '../src/bun.js');
