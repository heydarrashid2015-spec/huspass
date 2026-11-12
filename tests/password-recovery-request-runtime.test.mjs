import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../app/page.js', import.meta.url), 'utf8');
const start = source.indexOf('className="forgot"');
assert.ok(start >= 0, 'forgot-password control exists');
const section = source.slice(start, source.indexOf('</button>', start));
const match = section.match(/onClick=\{(async\(\)=>\{[\s\S]*?\})\}\>/);
assert.ok(match, 'forgot-password click handler is isolated');

async function run(email, resetPasswordForEmail, authBusy = false) {
  const state = { messages: [], busy: [], calls: [] };
  const supabase = { auth: { resetPasswordForEmail: async (...args) => {
    state.calls.push(args);
    return resetPasswordForEmail(...args);
  } } };
  const build = new Function('supabase', 'email', 'setAuthMsg', 'setAuthBusy', 'authBusy', 'return (' + match[1] + ')');
  await build(supabase, email, value => state.messages.push(value), value => state.busy.push(value), authBusy)();
  return state;
}

test('registered, unregistered and network failures have identical user-visible outcome', async () => {
  const scenarios = [
    async () => ({ error: null }),
    async () => ({ error: { message: 'User not found' } }),
    async () => { throw new Error('network unavailable'); }
  ];
  const results = await Promise.all(scenarios.map(fn => run('person@example.com', fn)));
  for (const result of results) {
    assert.deepEqual(result.busy, [true, false]);
    assert.equal(result.calls.length, 1);
    assert.deepEqual(result.calls[0], ['person@example.com', { redirectTo: 'https://huspass.dk' }]);
    assert.equal(result.messages.at(-1), results[0].messages.at(-1));
    assert.doesNotMatch(result.messages.at(-1), /not found|network|error/i);
  }
});

test('empty email does not call Supabase', async () => {
  const result = await run('   ', async () => { throw new Error('should not be called'); });
  assert.equal(result.calls.length, 0);
  assert.deepEqual(result.busy, []);
  assert.match(result.messages.at(-1), /e-mail/);
});

test('busy recovery request cannot trigger a second email or overwrite feedback', async () => {
  const result = await run('person@example.com', async () => { throw new Error('duplicate request'); }, true);
  assert.deepEqual(result.calls, []);
  assert.deepEqual(result.busy, []);
  assert.deepEqual(result.messages, []);
});

test('surrounding whitespace is removed before requesting recovery', async () => {
  const result = await run('  Person+test@example.com  ', async () => ({ error: null }));
  assert.deepEqual(result.calls, [[
    'Person+test@example.com',
    { redirectTo: 'https://huspass.dk' }
  ]]);
  assert.deepEqual(result.busy, [true, false]);
});

test('whitespace-only addresses never trigger recovery requests', async () => {
  for (const email of [' ', '\t\n', '   \t   ']) {
    const result = await run(email, async () => { throw new Error('must not send'); });
    assert.equal(result.calls.length, 0);
    assert.deepEqual(result.busy, []);
  }
});
