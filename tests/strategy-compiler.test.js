const test = require('node:test');
const assert = require('node:assert/strict');
const { compileStrategy, routableCapabilities } = require('../src/strategy-compiler');

function strategy(overrides = {}) {
  return {
    objective: 'ship a verified result',
    tactics: [{ id: 'build', type: 'implement', purpose: 'build it', requiredCapabilities: ['files', 'shell'] }],
    characteristics: {
      variantGeneration: 'none',
      exploration: 'low',
      openness: 'low',
      resourceDiscovery: 'low',
      freshness: 'none',
      verificationDepth: 'low',
      ...(overrides.characteristics || {})
    },
    reviewNeeds: overrides.reviewNeeds || [],
    ...overrides,
    characteristics: {
      variantGeneration: 'none',
      exploration: 'low',
      openness: 'low',
      resourceDiscovery: 'low',
      freshness: 'none',
      verificationDepth: 'low',
      ...(overrides.characteristics || {})
    }
  };
}

test('keeps repository-side capabilities routable as one job', () => {
  const jobs = compileStrategy(strategy());
  assert.deepEqual(jobs[0].requiredCapabilities, ['files', 'shell']);
});

test('adds exploration for open-ended high-exploration work', () => {
  const jobs = compileStrategy(strategy({
    characteristics: { exploration: 'high', openness: 'high', variantGeneration: 'required' }
  }));
  assert.equal(jobs.some((job) => job.id === 'auto-explore'), true);
});

test('rejects a single job that asks for live research and repository mutation', () => {
  assert.throws(
    () => routableCapabilities(['live_research', 'files'], 'mixed-job'),
    /split the tactic/
  );
});
