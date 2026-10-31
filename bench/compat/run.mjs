// <node|bun|deno> run.mjs : signs one S3 GET with every library in this runtime; one JSON line per library.
import { EXPECTED, IDS } from './common.mjs';
const runtime =
  typeof Bun !== 'undefined'
    ? `bun ${Bun.version}`
    : typeof Deno !== 'undefined'
      ? `deno ${Deno.version.deno}`
      : `node ${process.versions.node}`;
for (const id of IDS) {
  let mod;
  try {
    mod = await import(`./libs/${id}.mjs`);
  } catch (e) {
    console.log(
      JSON.stringify({
        runtime,
        lib: id,
        status: 'load-error',
        // e is whatever was thrown; split() always returns at least one element
        detail: /** @type {string} */ (
          String(/** @type {{ message?: string }} */ (e).message ?? e).split('\n')[0]
        ).slice(0, 160),
      }),
    );
    continue;
  }
  try {
    const sig = await mod.sign();
    console.log(
      JSON.stringify({
        runtime,
        lib: id,
        status: sig === (mod.expected ?? EXPECTED) ? 'ok' : 'wrong',
        ...(sig === (mod.expected ?? EXPECTED) ? {} : { detail: sig }),
      }),
    );
  } catch (e) {
    console.log(
      JSON.stringify({
        runtime,
        lib: id,
        status: 'error',
        // e is whatever was thrown; split() always returns at least one element
        detail: /** @type {string} */ (
          String(/** @type {{ message?: string }} */ (e).message ?? e).split('\n')[0]
        ).slice(0, 160),
      }),
    );
  }
}
