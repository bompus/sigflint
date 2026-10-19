// Release gate: the speed, memory, import and size runs must have been repeated on the code being released.
// `node bench/check-benchmarked.mjs --record` stores the package version and the git tree of src/ after a re-run;
// without the flag it fails unless both still match (the publish workflow runs it before `npm publish`).
// Usage: node check-benchmarked.mjs [--record]
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const file = new URL('./results/benchmarked.json', import.meta.url);
const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const srcTree = execFileSync('git', ['rev-parse', 'HEAD:src'], {
  encoding: 'utf8',
  cwd: new URL('..', import.meta.url),
}).trim();

if (process.argv.includes('--record')) {
  writeFileSync(
    file,
    JSON.stringify({ version, srcTree, date: new Date().toISOString().slice(0, 10) }, null, 2) +
      '\n',
  );
  console.log(`recorded version ${version}, src tree ${srcTree}`);
} else {
  let recorded;
  try {
    recorded = JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    console.error(
      'bench/results/benchmarked.json is missing: re-run the benchmarks, then `node bench/check-benchmarked.mjs --record`',
    );
    process.exit(1);
  }
  if (recorded.version !== version || recorded.srcTree !== srcTree) {
    console.error(
      `the benchmarks were last recorded for version ${recorded.version}, src tree ${recorded.srcTree}; this is version ${version}, src tree ${srcTree}. Re-run them, then --record`,
    );
    process.exit(1);
  }
  console.log(`benchmarks recorded for version ${version} (${recorded.date})`);
}
