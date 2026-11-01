// Turns a Hyperfine --export-json file (schema 2) into result rows, one per run:
//   bun hyperfine-rows.mjs <hyperfine.json> <round> <runtime label> <unit id> <runs per command> <comma-separated command names>
// Each command was named with `--command-name <arm>` (-n). A run that exited non-zero becomes an error row, so its unit is not admitted.
import { readFileSync } from 'node:fs';

const [file, round, rt, unit, runsArg, namesArg] = process.argv.slice(2);
const runs = Number(runsArg);
const expected = (namesArg ?? '').split(',').filter(Boolean);
const report = JSON.parse(readFileSync(/** @type {string} */ (file), 'utf8'));
if (report.schema_version !== 2) {
  throw new Error(`Hyperfine JSON schema ${report.schema_version}; this reader knows schema 2`);
}
const seen = new Set();
for (const result of report.results) {
  const armTag = result.name ?? result.command;
  seen.add(armTag);
  if (result.measurements.length !== runs) {
    console.log(
      JSON.stringify({
        round: Number(round),
        kind: 'import',
        armTag,
        rt,
        unit,
        status: 'error',
        msg: `${result.measurements.length} runs, ${runs} expected`,
      }),
    );
  }
  result.measurements.forEach(
    /** @param {any} m @param {number} i */ (m, i) => {
      const base = { round: Number(round), rep: i + 1, kind: 'import', armTag, rt, unit };
      if (m.exit_code !== 0) {
        console.log(JSON.stringify({ ...base, status: 'error', exit: m.exit_code }));
        return;
      }
      console.log(
        JSON.stringify({
          ...base,
          status: 'ok',
          wallMs: m.time_wall_clock.value * 1000,
          cpuMs: m.time_cpu.value * 1000,
          peakRssBytes: m.memory_peak_resident.value,
        }),
      );
    },
  );
}
for (const name of expected) {
  if (!seen.has(name)) {
    console.log(
      JSON.stringify({
        round: Number(round),
        kind: 'import',
        armTag: name,
        rt,
        unit,
        status: 'error',
        msg: 'command missing from the Hyperfine report',
      }),
    );
  }
}
