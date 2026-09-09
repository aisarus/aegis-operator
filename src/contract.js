const path = require('node:path');

function assertInsideWorkspace(relPath, itemId) {
  const normalized = path.normalize(relPath);
  if (path.isAbsolute(normalized) || normalized.split(path.sep)[0] === '..') {
    throw new Error(`contract item ${itemId}: evidence path "${relPath}" must stay inside the workspace`);
  }
}

function parseContract(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('contract must be an object');
  if (typeof raw.task !== 'string' || raw.task.trim() === '') throw new Error('contract.task must be a non-empty string');
  if (!Array.isArray(raw.items) || raw.items.length === 0) throw new Error('contract must have at least one item');

  const seen = new Set();
  const items = raw.items.map((item) => {
    if (!item || typeof item.id !== 'string' || item.id.trim() === '') throw new Error('every contract item needs a non-empty id');
    if (seen.has(item.id)) throw new Error(`duplicate item id: ${item.id}`);
    seen.add(item.id);
    if (typeof item.claim !== 'string' || item.claim.trim() === '') throw new Error(`contract item ${item.id}: claim must be a non-empty string`);

    const check = item.check == null ? null : item.check;
    if (check !== null && (typeof check.cmd !== 'string' || check.cmd.trim() === '')) {
      throw new Error(`contract item ${item.id}: check.cmd must be a non-empty string`);
    }

    const evidenceRequired = Array.isArray(item.evidenceRequired) ? item.evidenceRequired : [];
    for (const rel of evidenceRequired) {
      if (typeof rel !== 'string' || rel.trim() === '') throw new Error(`contract item ${item.id}: evidence paths must be non-empty strings`);
      assertInsideWorkspace(rel, item.id);
    }

    if (check === null && evidenceRequired.length === 0) {
      throw new Error(`contract item ${item.id}: not verifiable — needs a check command or at least one evidence path`);
    }

    return { id: item.id, claim: item.claim, check, evidenceRequired };
  });

  return { task: raw.task, items };
}

module.exports = { parseContract };
