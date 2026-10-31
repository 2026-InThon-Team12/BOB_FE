/** Bounded work queue. Results retain selection order; failed slots are retryable. */
export async function orderedBatch<T, R>(inputs: T[], work: (input: T) => Promise<R>, onResult: (index: number, result: PromiseSettledResult<R>) => void, concurrency = 2) {
  let cursor = 0;
  await Promise.all(Array.from({length: Math.min(concurrency, inputs.length)}, async () => {
    while (cursor < inputs.length) {
      const index = cursor++;
      try { onResult(index, {status: 'fulfilled', value: await work(inputs[index])}); }
      catch (reason) { onResult(index, {status: 'rejected', reason}); }
    }
  }));
}
