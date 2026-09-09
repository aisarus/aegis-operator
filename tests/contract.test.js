const test = require('node:test');
const assert = require('node:assert/strict');
const { parseContract } = require('../src/contract');

test('accepts a mechanically verifiable item', () => {
  const parsed = parseContract({
    task: 'ship a file',
    items: [{ id: 'file', claim: 'result exists', check: { cmd: 'test -f result.txt' }, evidenceRequired: [] }]
  });
  assert.equal(parsed.items[0].id, 'file');
});

test('rejects items with no check and no evidence', () => {
  assert.throws(() => parseContract({
    task: 'do something',
    items: [{ id: 'vague', claim: 'looks good', check: null, evidenceRequired: [] }]
  }), /not verifiable/);
});

test('rejects evidence paths outside the workspace', () => {
  assert.throws(() => parseContract({
    task: 'inspect evidence',
    items: [{ id: 'escape', claim: 'read file', check: null, evidenceRequired: ['../secret.txt'] }]
  }), /must stay inside the workspace/);
});
