// Fills the other-service speed tables and notes of docs/benchmarks.md from results/speed-more-summary.json (called by make-assets.mjs).
import { readFileSync, writeFileSync } from 'node:fs';

/** @typedef {{ ns: number, times: number, settled?: boolean }} MoreTiming */
/** @typedef {{ runtime: string, workload: string, sigflintNs: number, bandPct: number, libraries: Record<string, MoreTiming | string> }} MoreRow */

/**
 * @param {string} docPath docs/benchmarks.md
 * @param {{ more: MoreRow[], alone: Record<string, { nodeNs: number, bunNs: number }> }} summary the saved part B summary
 */
export function fillMoreTables(docPath, summary) {
  const { more, alone } = summary;
  /** @type {[string, string][]} */
  const moreColumns = [
    ['aws4', 'aws4'],
    ['aws4fetch', 'aws4fetch'],
    ['aws-sig', 'aws-sig'],
    ['lean-s3', 'lean-s3'],
    ['minio', 'minio'],
    ['s3-lite-client', 's3-lite-client'],
    ['s3mini', 's3mini'],
    ['smithy', '@smithy/signature-v4'],
    ['tiny-oss', 'tiny-oss'],
    ['wdl', '@wdl-dev/aws-sigv4'],
  ];
  /** @type {Record<string, string>} */
  const moreLabels = {
    'any-post-json': 'DynamoDB POST, JSON body',
    'any-token': 'API Gateway GET, session token',
    'any-query': 'SQS, query parameters',
    'presign-any': 'presigned URL, API Gateway',
    'presign-s3': 'presigned URL, S3',
  };
  let unsettledMore = 0;
  /** @param {string} runtime */
  const speedMoreTable = (runtime) => {
    const lines = [
      `| Request | sigflint | ${moreColumns.map(([, n]) => n).join(' | ')} |`,
      `| --- | --: |${moreColumns.map(() => ' --: |').join('')}`,
    ];
    for (const w of Object.keys(moreLabels)) {
      const r = /** @type {MoreRow} */ (
        more.find((x) => x.runtime === runtime && x.workload === w)
      );
      const cells = moreColumns.map(([id]) => {
        const v = /** @type {(MoreTiming & { settled?: boolean }) | string | undefined} */ (
          r.libraries[id]
        );
        if (v === undefined) {
          return 'Not measured';
        }
        if (typeof v === 'string') {
          return v === 'wrong-result' ? 'wrong signature' : 'Not measured';
        }
        if (v.settled === false) {
          unsettledMore++;
        }
        return `${(v.ns / 1000).toFixed(2)} (${v.times.toFixed(1)}×${v.settled === false ? ', no clear change' : ''})`;
      });
      lines.push(
        `| ${/** @type {string} */ (moreLabels[w])} | **${(r.sigflintNs / 1000).toFixed(2)}** | ${cells.join(' | ')} |`,
      );
    }
    return lines.join('\n');
  };
  /** @param {string} runtime */
  const bandRange = (runtime) => {
    const b = more.filter((x) => x.runtime === runtime).map((x) => x.bandPct);
    return `${Math.min(...b).toFixed(1)}% to ${Math.max(...b).toFixed(1)}%`;
  };
  const nodeMore = speedMoreTable('node'),
    bunMore = speedMoreTable('bun');
  /** @param {string} k @param {'nodeNs' | 'bunNs'} rt */
  const us = (k, rt) => (/** @type {any} */ (alone)[k][rt] / 1000).toFixed(2);
  const moreNotes = `“Wrong signature” means the result differed from botocore's for that request, so it was not timed; for \`aws4\` that is the headers it adds and signs itself (see above), and \`minio\` signs S3 only. Reporting bands: Node ${bandRange('node')}, Bun ${bandRange('bun')}. ${unsettledMore === 0 ? 'All measured library comparisons are outside their bands and have non-overlapping ranges.' : `${unsettledMore} measured comparisons are unsettled and shown as no clear change.`}

  Only sigflint offers SigV4a (\`@smithy/signature-v4\` also offers chunked uploads and event streams, which were not timed here). Microseconds per call, Node / Bun: SigV4a headers ${us('sigv4a-header', 'nodeNs')} / ${us('sigv4a-header', 'bunNs')}, SigV4a presigned URL ${us('sigv4a-presign', 'nodeNs')} / ${us('sigv4a-presign', 'bunNs')}, one 64 KiB chunk ${us('chunk-64k', 'nodeNs')} / ${us('chunk-64k', 'bunNs')}, the last chunk with a trailer ${us('chunk-end-trailer', 'nodeNs')} / ${us('chunk-end-trailer', 'bunNs')}, a 4 KiB event ${us('event-4k', 'nodeNs')} / ${us('event-4k', 'bunNs')}. SigV4a is dominated by the ECDSA signature.`;
  let docText = readFileSync(docPath, 'utf8');
  for (const [key, body] of [
    ['speed-more-node-table', nodeMore],
    ['speed-more-bun-table', bunMore],
    ['speed-more-notes', moreNotes],
  ]) {
    const marker = new RegExp(`(<!-- BEGIN ${key} -->)[\\s\\S]*?(<!-- END ${key} -->)`);
    if (!marker.test(docText)) {
      throw new Error(`docs/benchmarks.md has no ${key} block`);
    }
    docText = docText.replace(marker, (_, x, y) => `${x}\n${body}\n${y}`);
  }
  writeFileSync(docPath, docText);
}
