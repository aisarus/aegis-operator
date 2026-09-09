const test = require('node:test');
const assert = require('node:assert/strict');
const { scrubbedEnv, isSecretName } = require('../src/safe-env');

test('drops sensitive-looking environment names', () => {
  const { env, dropped } = scrubbedEnv({
    PATH: '/usr/bin',
    OPENAI_API_KEY: 'secret',
    SESSION_COOKIE: 'cookie',
    SAFE_VALUE: 'ok'
  });
  assert.equal(env.PATH, '/usr/bin');
  assert.equal(env.SAFE_VALUE, 'ok');
  assert.equal(env.OPENAI_API_KEY, undefined);
  assert.equal(env.SESSION_COOKIE, undefined);
  assert.deepEqual(new Set(dropped), new Set(['OPENAI_API_KEY', 'SESSION_COOKIE']));
});

test('SSH_AUTH_SOCK is explicitly preserved', () => {
  assert.equal(isSecretName('SSH_AUTH_SOCK'), false);
});
