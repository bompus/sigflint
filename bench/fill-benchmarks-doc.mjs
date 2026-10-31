// Fills the marked blocks of docs/benchmarks.md with the generated charts and tables (called by make-assets.mjs).
import { readFileSync, writeFileSync } from 'node:fs';
import { sortComparisonTables } from './comparison-order.mjs';

/**
 * @param {string} docPath docs/benchmarks.md
 * @param {string[]} tables the generated tables, in chart order (correctness, speed, size, runtimes first)
 * @param {string} moreTable the other-services compatibility table
 */
export function fillBenchmarksDoc(docPath, tables, moreTable) {
  // fill the marked blocks in the README: the chart (dark and light) and the table under it
  const sections = [
    ['correctness', 'Bar chart: how many requests each library signs the same as botocore'],
    ['speed', 'Bar chart: time to sign one request on Node.js and Bun'],
    ['size', 'Bar chart: bundled, minified and gzipped size of each library'],
    ['runtimes', 'Grid: which runtimes each library runs on'],
  ];
  let readme = readFileSync(docPath, 'utf8');
  readme = readme.replace(
    /(<!-- BEGIN compat-table -->)[\s\S]*?(<!-- END compat-table -->)/,
    (_, a, b) => `${a}\n${moreTable}\n${b}`,
  );
  sections.forEach(([key, alt], i) => {
    const picture = `<picture>\n  <source media="(prefers-color-scheme: dark)" srcset="${key}-dark.svg">\n  <img alt="${alt}" src="${key}-light.svg">\n</picture>`;
    const body = /** @type {string} */ (tables[i]).replace(/^### [^\n]*\n\n/, '');
    readme = readme.replace(
      new RegExp(`(<!-- BEGIN ${key} -->)[\\s\\S]*?(<!-- END ${key} -->)`),
      (_, a, b) => `${a}\n${picture}\n\n${body}\n${b}`,
    );
  });
  // charts that stand alone above a table the README writes by hand: <!-- BEGIN pic-<key> --> ... <!-- END pic-<key> -->
  for (const [key, alt] of [
    [
      'compat-more',
      'Bar chart: how many header and presigned-URL requests for other services each library signs the same as botocore',
    ],
    [
      'speed-more-node',
      'Bar chart: time to sign other-service and presigned-URL requests on Node.js',
    ],
    ['speed-more-bun', 'Bar chart: time to sign other-service and presigned-URL requests on Bun'],
    [
      'size-tiers',
      'Bar chart: gzipped and minified size of sigflint for each combination of signers',
    ],
  ]) {
    const picture = `<picture>\n  <source media="(prefers-color-scheme: dark)" srcset="${key}-dark.svg">\n  <img alt="${alt}" src="${key}-light.svg">\n</picture>`;
    const block = new RegExp(`(<!-- BEGIN pic-${key} -->)[\\s\\S]*?(<!-- END pic-${key} -->)`);
    if (!block.test(readme)) {
      throw new Error(`docs/benchmarks.md has no pic-${key} block`);
    }
    readme = readme.replace(block, (_, a, b) => `${a}\n${picture}\n${b}`);
  }
  writeFileSync(docPath, sortComparisonTables(readme));
}
