// <node|bun|deno> run.mjs : signs one S3 GET with every library in this runtime; one JSON line per library.
import { EXPECTED, IDS } from './common.mjs';
const runtime = typeof Bun !== 'undefined' ? `bun ${Bun.version}` : typeof Deno !== 'undefined' ? `deno ${Deno.version.deno}` : `node ${process.versions.node}`;
for (const id of IDS) {
  let mod;
  try { mod = await import(`./libs/${id}.mjs`); } catch (e) { console.log(JSON.stringify({ runtime, lib: id, status: 'load-error', detail: String(e.message ?? e).split('\n')[0].slice(0, 160) })); continue; }
  try { const sig = await mod.sign(); console.log(JSON.stringify({ runtime, lib: id, status: sig === EXPECTED ? 'ok' : 'wrong', ...(sig === EXPECTED ? {} : { detail: sig }) })); }
  catch (e) { console.log(JSON.stringify({ runtime, lib: id, status: 'error', detail: String(e.message ?? e).split('\n')[0].slice(0, 160) })); }
}
