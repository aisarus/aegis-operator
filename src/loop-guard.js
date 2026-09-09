const crypto = require('node:crypto');

function createLoopGuard() {
  const seen = new Set();
  function check(snapshotHash, stepText) {
    const hash = crypto.createHash('sha256').update(`${snapshotHash} ${stepText}`).digest('hex');
    const repeat = seen.has(hash);
    seen.add(hash);
    return { repeat, hash };
  }
  return { check };
}

module.exports = { createLoopGuard };
