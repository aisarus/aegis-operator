const SECRET_NAME = /(?:KEY|SECRET|TOKEN|PASSWORD|PASSWD|CREDENTIAL|AUTH|SESSION|COOKIE|PRIVATE)/i;

const KEEP = new Set(['SSH_AUTH_SOCK']);

function isSecretName(name) {
  if (KEEP.has(name)) return false;
  return SECRET_NAME.test(String(name));
}

/**
 * Return a copy of the environment without values whose names look sensitive.
 * The original process.env is never mutated because Aegis itself may still
 * need those values; only untrusted child processes receive the scrubbed copy.
 */
function scrubbedEnv(base = process.env, { alsoDrop = [] } = {}) {
  const env = {};
  const dropped = [];
  const extra = new Set(alsoDrop.map(String));
  for (const [name, value] of Object.entries(base)) {
    if (isSecretName(name) || extra.has(name)) {
      dropped.push(name);
      continue;
    }
    env[name] = value;
  }
  return { env, dropped };
}

module.exports = { scrubbedEnv, isSecretName, SECRET_NAME };
