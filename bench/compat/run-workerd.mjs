// node run-workerd.mjs : every library in local workerd (via wrangler dev), with and without the nodejs_compat flag.
// One wrangler per (flag, library), started in its own process group and stopped by that recorded group id.
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { IDS } from './common.mjs';
const WRANGLER = process.env.WRANGLER ?? new URL('../node_modules/.bin/wrangler', import.meta.url).pathname;
const here = new URL('.', import.meta.url).pathname;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let port = 8810;
const out = [];
for (const flag of (process.argv[2] ? [process.argv[2]] : ['nodejs_compat', 'no-flag'])) {
  for (const id of IDS) {
    const dir = `${here}workers/${flag}-${id}`;
    mkdirSync(dir, { recursive: true });
    writeFileSync(`${dir}/wrangler.toml`, `name = "compat-${id}"\nmain = "index.mjs"\ncompatibility_date = "2026-01-01"\n${flag === 'nodejs_compat' ? 'compatibility_flags = ["nodejs_compat"]\n' : ''}`);
    writeFileSync(`${dir}/index.mjs`, `import { sign } from '../../libs/${id}.mjs';\nimport { EXPECTED } from '../../common.mjs';\nexport default { async fetch() { try { const s = await sign(); return Response.json({ status: s === EXPECTED ? 'ok' : 'wrong', detail: s === EXPECTED ? undefined : s }); } catch (e) { return Response.json({ status: 'error', detail: String(e && e.message || e).slice(0, 160) }); } } };\n`);
    const p = port++;
    const log = [];
    const child = spawn(WRANGLER, ['dev', '--local', '--port', String(p), '--ip', '127.0.0.1'], { cwd: dir, detached: true, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, WRANGLER_SEND_METRICS: 'false', CI: '1' } });
    child.stdout.on('data', (d) => log.push(String(d))); child.stderr.on('data', (d) => log.push(String(d)));
    let exited = false; child.on('exit', () => { exited = true; });
    let res = null;
    const t0 = Date.now();
    while (Date.now() - t0 < 25000 && !exited && !res) {
      await sleep(1000);
      try { const r = await fetch(`http://127.0.0.1:${p}/`, { signal: AbortSignal.timeout(2000) }); const t = await r.text(); try { res = JSON.parse(t); } catch { res = { status: `http-${r.status}`, detail: t.slice(0, 160) }; } } catch {}
    }
    try { process.kill(-child.pid); } catch {}
    await sleep(1500);
    if (!res) {
      const text = log.join('').replace(/\x1b\[[0-9;]*m/g, '');
      const m = text.match(/(Could not resolve[^\n]*|No such module[^\n]*|ERROR[^\n]*|✘[^\n]*)/);
      res = { status: exited ? 'bundle-or-start-error' : 'no-response-25s', detail: (m ? m[1] : text.split('\n').filter(Boolean).slice(-1)[0] ?? '').slice(0, 160) };
    }
    const line = { runtime: `workerd (${flag})`, lib: id, ...res };
    console.log(JSON.stringify(line));
    out.push(line);
  }
}
writeFileSync(`${here}workerd-results.json`, JSON.stringify(out, null, 1));
