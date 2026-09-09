const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoopGuard } = require('../src/loop-guard');

test('same workspace state and step are detected as a repeat', () => {
  const guard = createLoopGuard();
  assert.equal(guard.check('workspace-a', 'build index').repeat, false);
  assert.equal(guard.check('workspace-a', 'build index').repeat, true);
});

test('a changed workspace state is not the same loop fingerprint', () => {
  const guard = createLoopGuard();
  guard.check('workspace-a', 'build index');
  assert.equal(guard.check('workspace-b', 'build index').repeat, false);
});
