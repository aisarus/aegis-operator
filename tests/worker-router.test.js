const test = require('node:test');
const assert = require('node:assert/strict');
const { createFallbackWorker } = require('../src/worker-router');

function worker(name, result) {
  return { name, async run() { return typeof result === 'function' ? result() : result; } };
}

test('falls back on explicit rate limit by default', async () => {
  const routed = createFallbackWorker({
    name: 'coding',
    workers: [
      worker('a', { status: 'rate_limited', costUsd: 0 }),
      worker('b', { status: 'ok', transcript: 'done', costUsd: 0 })
    ]
  });
  const result = await routed.run({});
  assert.equal(result.provider, 'b');
  assert.equal(result.attempts.length, 2);
});

test('does not repeat ordinary failure by default', async () => {
  let secondCalled = false;
  const routed = createFallbackWorker({
    name: 'coding',
    workers: [
      worker('a', { status: 'failed', error: 'ambiguous failure' }),
      worker('b', () => { secondCalled = true; return { status: 'ok' }; })
    ]
  });
  const result = await routed.run({});
  assert.equal(result.provider, 'a');
  assert.equal(secondCalled, false);
});

test('retryOn any is available for safe read-only work', async () => {
  const routed = createFallbackWorker({
    name: 'judge',
    retryOn: 'any',
    workers: [worker('a', { status: 'failed' }), worker('b', { status: 'ok' })]
  });
  assert.equal((await routed.run({})).provider, 'b');
});
