// Times a JavaScript operation with Tinybench, the host's runner for JS operations. One task invocation is a batch of
// BATCH calls, so the timer's own cost is spread over the batch; per-call figures are the batch statistic divided by BATCH.
import { Bench } from 'tinybench';

export const BATCH = 1000;

/**
 * @param {() => string | Promise<string>} call one operation; it returns the signature, whose length is summed so the call cannot be dropped
 * @param {boolean} isSync
 * @param {number} secs timed seconds per task, after a 0.3 s warmup
 * @returns {Promise<{ nsPerOp: number, batches: number, batchSize: number, rmePct: number, sink: number }>}
 */
export async function timeOperation(call, isSync, secs) {
  let sink = 0;
  const bench = new Bench({ time: secs * 1000, warmupTime: 300, throws: true });
  bench.add(
    'batch',
    isSync
      ? () => {
          for (let i = 0; i < BATCH; i++) {
            sink += /** @type {string} */ (call()).length;
          }
        }
      : async () => {
          for (let i = 0; i < BATCH; i++) {
            sink += (await call()).length;
          }
        },
  );
  await bench.run();
  const result = /** @type {import('tinybench').Task} */ (bench.tasks[0]).result;
  if (result.state !== 'completed') {
    throw new Error(`Tinybench task ended in state ${result.state}`);
  }
  return {
    nsPerOp: Math.round((result.latency.p50 / BATCH) * 1e6),
    batches: result.latency.samplesCount,
    batchSize: BATCH,
    rmePct: result.latency.rme,
    sink,
  };
}
