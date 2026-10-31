/** Compare displayed library names, keeping the reference entries first.
 * @param {string} a
 * @param {string} b
 */
export function compareLibraries(a, b) {
  return (
    Number(b.startsWith('sigflint')) - Number(a.startsWith('sigflint')) ||
    a.localeCompare(b, 'en', { ignorePunctuation: true, numeric: true })
  );
}

/** Keep hand-written library rows and library columns in the generated order.
 * @param {string} markdown
 */
export function sortComparisonTables(markdown) {
  return markdown.replace(
    /^\| (?:Library|Request) \|[^\n]*\n\|[-:| ]+\n(?:\|[^\n]+\n?)+/gm,
    (table) => {
      const lines = table.trimEnd().split('\n');
      if (lines[0]?.includes('Input method')) {
        return table;
      }
      const cells = lines.map((line) =>
        line
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim()),
      );
      const header = /** @type {string[]} */ (cells[0]);
      if (header[0] === 'Request') {
        const columns = header
          .map((_, i) => i)
          .slice(1)
          .sort((a, b) => compareLibraries(header[a] ?? '', header[b] ?? ''));
        return (
          cells
            .map((row) => `| ${[row[0], ...columns.map((i) => row[i])].join(' | ')} |`)
            .join('\n') + '\n'
        );
      }
      const rows = lines
        .slice(2)
        .sort((a, b) =>
          compareLibraries(
            (a.split('|')[1] ?? '').replaceAll('**', '').trim(),
            (b.split('|')[1] ?? '').replaceAll('**', '').trim(),
          ),
        );
      return [...lines.slice(0, 2), ...rows].join('\n') + '\n';
    },
  );
}
