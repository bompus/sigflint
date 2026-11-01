// Checks the frozen inputs of a measurement campaign before a part runs: bun check-freeze.mjs <freeze.json> [<artifact dir>]
//   bun check-freeze.mjs <freeze.json> --write   records the current harness tree and compiled bundle hashes into the freeze record
// The record (results/release-1.0.4-freeze.json) names the source tree, the built artifacts, the corpora and lock files, the runtime and
// runner versions, the bundles compat/build-clients.mjs compiled, and the committed bench/ tree outside bench/results. A mismatch exits 1.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const [freezeArg, arg] = process.argv.slice(2);
const freezePath = /** @type {string} */ (freezeArg);
const here = new URL('.', import.meta.url).pathname;
const repo = join(here, '..');
const freeze = JSON.parse(readFileSync(freezePath, 'utf8'));
/** @param {string} f */
const sha = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');
/** @param {string[]} a */
const git = (...a) => execFileSync('git', ['-C', repo, ...a], { encoding: 'utf8' }).trim();
/** @param {string} cmd @param {string[]} args */
const out = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8' }).trim();

// Files that only read results (analysis, charts, doc filling) are not part of what measures, so they may be corrected while a campaign runs.
const analysisFile =
  /^bench\/(analyze[^/]*|make-[^/]*|fill-benchmarks-doc|pair-node-bun|admission-summary|comparison-order|check-benchmarked)\.mjs$/;
/** @param {string} path */
const measuring = (path) => !path.startsWith('bench/results/') && !analysisFile.test(path);
const benchTree = createHash('sha256')
  .update(
    git('ls-tree', '-r', 'HEAD', 'bench')
      .split('\n')
      .filter((l) => measuring(l.split('\t')[1] ?? ''))
      .join('\n'),
  )
  .digest('hex');
const bundleDir = join(here, 'compat', 'compiled');
const bundles = Object.fromEntries(
  readdirSync(bundleDir)
    .filter((f) => f.endsWith('.mjs'))
    .sort()
    .map((f) => [f, sha(join(bundleDir, f))]),
);

if (arg === '--write') {
  freeze.benchTreeSha256 = benchTree;
  freeze.compiledClientBundles = bundles;
  delete freeze.harnessCommit;
  delete freeze.harnessNote;
  writeFileSync(freezePath, JSON.stringify(freeze, null, 2) + '\n');
  console.log('freeze record updated');
  process.exit(0);
}

/** @type {string[]} */
const bad = [];
/** @param {string} what @param {unknown} want @param {unknown} got */
const same = (what, want, got) => {
  if (JSON.stringify(want) !== JSON.stringify(got)) {
    bad.push(`${what}: frozen ${JSON.stringify(want)}, now ${JSON.stringify(got)}`);
  }
};
same('src tree', freeze.srcTree, git('rev-parse', 'HEAD:src'));
same('bench tree outside results', freeze.benchTreeSha256, benchTree);
same('compiled client bundles', freeze.compiledClientBundles, bundles);
for (const dirty of git('status', '--porcelain', '--', 'src', 'bench', ':!bench/results')
  .split('\n')
  .filter(Boolean)) {
  if (!dirty.startsWith('??') && measuring(dirty.slice(3))) {
    bad.push(`uncommitted change: ${dirty}`);
  }
}
for (const [file, want] of Object.entries(freeze.inputs)) {
  same(file, want, sha(join(repo, file)));
}
if (arg) {
  for (const f of ['node.js', 'bun.js']) {
    same(`artifact ${f}`, freeze.artifacts[f], sha(join(arg, f)));
  }
}
same('bun', freeze.runtimes.bun, out('bun', ['--version']));
same('node', freeze.runtimes.node, out('node', ['--version']).replace(/^v/, ''));
same('hyperfine', freeze.runners.hyperfine, out('hyperfine', ['--version']).split(' ')[1]);
const tinybench = JSON.parse(
  readFileSync(join(here, 'node_modules/tinybench/package.json'), 'utf8'),
).version;
same('tinybench', freeze.runners.tinybench, tinybench);
if (bad.length) {
  console.error(`frozen inputs differ (${dirname(freezePath)}):\n  ${bad.join('\n  ')}`);
  process.exit(1);
}
console.log('frozen inputs match');
