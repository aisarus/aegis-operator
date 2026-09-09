// Strategy → Job intents.
//
// The model proposes the character of the work; deterministic code turns that
// into executable intents so “how to work” does not remain unchecked prose.

const TYPE_FLOOR = Object.freeze({
  research: ['research'],
  resource_discovery: ['research'],
  explore_options: ['brainstorm'],
  decide: ['brainstorm'],
  understand: ['research'],
  implement: ['writing'],
  verify: ['writing'],
  review: ['writing'],
  repair: ['writing'],
  generic: ['writing']
});

const NEEDS_FRESH = Object.freeze(['research', 'resource_discovery', 'understand']);
const CODE_SIDE = Object.freeze(['shell', 'tests', 'git', 'repo_read', 'repo_write', 'files', 'verified_cli']);

function unique(list) {
  return [...new Set(list.filter(Boolean))];
}

function routableCapabilities(capabilities, where) {
  const all = unique(capabilities);
  const code = all.filter((capability) => CODE_SIDE.includes(capability));
  if (code.length === 0) return all;
  if (all.includes('live_research')) {
    throw new Error(`${where}: one step asks for both live research and repository work; split the tactic`);
  }
  return code;
}

function capabilitiesFor(tactic, strategy) {
  const declared = unique(tactic.requiredCapabilities || []);
  const base = declared.length > 0 ? declared : [...(TYPE_FLOOR[tactic.type] || TYPE_FLOOR.generic)];
  const local = base.some((capability) => CODE_SIDE.includes(capability));
  if (strategy.characteristics.freshness === 'required' && NEEDS_FRESH.includes(tactic.type) && !local) {
    return unique([...base, 'live_research']);
  }
  return base;
}

function intent({ id, type, purpose, capabilities, parallelizable = false, reviewNeeds = [], source }) {
  return {
    id,
    type,
    goal: purpose,
    requiredCapabilities: routableCapabilities(capabilities, id),
    parallelizable: parallelizable === true,
    reviewNeeds,
    source
  };
}

function ensureExploration(tactics, strategy) {
  const wanted = strategy.characteristics.variantGeneration === 'required'
    || (strategy.characteristics.exploration === 'high' && strategy.characteristics.openness !== 'low');
  if (!wanted || tactics.some((tactic) => tactic.type === 'explore_options')) return tactics;
  const at = tactics.findIndex((tactic) => ['implement', 'generic', 'repair'].includes(tactic.type));
  const added = intent({
    id: 'auto-explore',
    type: 'explore_options',
    purpose: `Generate and compare multiple approaches to “${strategy.objective}” before fixing one`,
    capabilities: ['brainstorm'],
    source: 'rule:exploration'
  });
  const copy = [...tactics];
  copy.splice(at < 0 ? copy.length : at, 0, added);
  return copy;
}

function ensureResourceDiscovery(tactics, strategy) {
  if (strategy.characteristics.resourceDiscovery !== 'high' || tactics.some((tactic) => tactic.type === 'resource_discovery')) return tactics;
  const capabilities = strategy.characteristics.freshness === 'none' ? ['research'] : ['research', 'live_research'];
  const added = intent({
    id: 'auto-resources',
    type: 'resource_discovery',
    purpose: `Find external material that can materially improve “${strategy.objective}”`,
    capabilities,
    source: 'rule:resources'
  });
  const at = tactics.findIndex((tactic) => ['implement', 'generic', 'repair'].includes(tactic.type));
  const copy = [...tactics];
  copy.splice(at < 0 ? copy.length : at, 0, added);
  return copy;
}

function ensureVerification(tactics, strategy) {
  const wanted = strategy.characteristics.verificationDepth === 'high' || strategy.reviewNeeds.length > 0;
  if (!wanted || tactics.some((tactic) => ['verify', 'review'].includes(tactic.type))) return tactics;
  return [...tactics, intent({
    id: 'auto-review',
    type: 'review',
    purpose: `Review the result against: ${strategy.reviewNeeds.join(', ') || 'the objective'}`,
    capabilities: ['writing'],
    reviewNeeds: strategy.reviewNeeds,
    source: 'rule:review'
  })];
}

function ensureLiveResearch(tactics, strategy) {
  if (strategy.characteristics.freshness !== 'required') return tactics;
  if (tactics.some((tactic) => tactic.requiredCapabilities.includes('live_research'))) return tactics;
  return [intent({
    id: 'auto-fresh',
    type: 'research',
    purpose: `Find current external evidence for “${strategy.objective}” and preserve source links`,
    capabilities: ['research', 'live_research'],
    source: 'rule:freshness'
  }), ...tactics];
}

function compileStrategy(strategy) {
  if (!strategy || !Array.isArray(strategy.tactics)) throw new Error('compiler requires a validated strategy');
  const base = strategy.tactics.map((tactic) => intent({
    id: tactic.id,
    type: tactic.type,
    purpose: tactic.purpose,
    capabilities: capabilitiesFor(tactic, strategy),
    parallelizable: tactic.parallelizable,
    reviewNeeds: ['review', 'verify'].includes(tactic.type) ? strategy.reviewNeeds : [],
    source: 'strategy'
  }));
  return ensureLiveResearch(
    ensureVerification(
      ensureResourceDiscovery(
        ensureExploration(base, strategy),
        strategy
      ),
      strategy
    ),
    strategy
  ).map((entry, index) => ({ ...entry, order: index }));
}

module.exports = { compileStrategy, routableCapabilities, TYPE_FLOOR, NEEDS_FRESH, CODE_SIDE };
