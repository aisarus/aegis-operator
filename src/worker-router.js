// The router does not guess why a worker failed. Switching providers is safe
// only under an explicit retry policy: repeating mutating work after an ordinary
// error can modify files twice or send the same external request twice.
// retryOn: 'rate_limit' (default) or 'any'.

function createFallbackWorker({ name, workers, retryOn = 'rate_limit', onAttempt = null }) {
  if (!Array.isArray(workers) || workers.length === 0) {
    throw new Error('fallback worker needs at least one candidate');
  }

  let activeWorker = null;

  function kill() {
    if (activeWorker && typeof activeWorker.kill === 'function') activeWorker.kill();
  }

  async function run(request) {
    const attempts = [];

    for (let index = 0; index < workers.length; index += 1) {
      const worker = workers[index];
      const provider = worker.name || `${name}-${index + 1}`;
      let result;

      try {
        activeWorker = worker;
        result = await worker.run(request);
      } catch (error) {
        result = {
          transcript: '',
          status: 'failed',
          provider,
          costUsd: 0,
          error: error.message
        };
      }

      const normalized = {
        ...result,
        provider: result.provider || provider,
        status: result.status || 'ok',
        costUsd: result.costUsd ?? 0
      };
      attempts.push({
        provider: normalized.provider,
        status: normalized.status,
        resetAt: normalized.resetAt ?? null,
        costUsd: normalized.costUsd,
        timedOut: normalized.timedOut === true,
        timeoutKind: normalized.timeoutKind ?? null
      });

      if (typeof onAttempt === 'function') {
        onAttempt({
          provider: normalized.provider,
          status: normalized.status,
          resetAt: normalized.resetAt ?? null,
          timedOut: normalized.timedOut === true,
          timeoutKind: normalized.timeoutKind ?? null,
          error: normalized.error || null,
          index,
          total: workers.length
        });
      }

      const mayRetry = retryOn === 'any'
        ? normalized.status !== 'ok'
        : normalized.status === 'rate_limited';
      if (!mayRetry || index === workers.length - 1) {
        activeWorker = null;
        return { ...normalized, attempts };
      }
    }

    throw new Error('fallback worker reached an impossible state');
  }

  return { name, run, kill };
}

module.exports = { createFallbackWorker };
