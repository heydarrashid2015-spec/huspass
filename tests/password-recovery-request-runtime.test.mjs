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

test('pending email request retains busy state until Supabase settles', async () => {
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  const state = { busy: [], messages: [], calls: [] };
  const supabase = { auth: { resetPasswordForEmail: (...args) => {
    state.calls.push(args);
    return pending;
  } } };
  const build = new Function('supabase', 'email', 'setAuthMsg', 'setAuthBusy', 'authBusy', 'return (' + match[1] + ')');
  const handler = build(supabase, 'person@example.com', value => state.messages.push(value), value => state.busy.push(value), false);
  const running = handler();
  assert.equal(state.calls.length, 1);
  assert.deepEqual(state.busy, [true]);
  assert.deepEqual(state.messages, ['Sender link...']);
  release({ error: null });
  await running;
  assert.deepEqual(state.busy, [true, false]);
  assert.equal(state.messages.length, 2);
  assert.match(state.messages.at(-1), /Hvis e-mailadressen er registreret/);
});

test('pending recovery request clears busy state after an asynchronous rejection', async () => {
  let rejectRequest;
  const pending = new Promise((_, reject) => { rejectRequest = reject; });
  const state = { busy: [], messages: [], calls: [] };
  const supabase = { auth: { resetPasswordForEmail: (...args) => {
    state.calls.push(args);
    return pending;
  } } };
  const build = new Function('supabase', 'email', 'setAuthMsg', 'setAuthBusy', 'authBusy', 'return (' + match[1] + ')');
  const handler = build(supabase, 'person@example.com', value => state.messages.push(value), value => state.busy.push(value), false);
  const running = handler();
  assert.deepEqual(state.busy, [true]);
  assert.deepEqual(state.messages, ['Sender link...']);
  rejectRequest(new Error('temporary network outage'));
  await running;
  assert.equal(state.calls.length, 1);
  assert.deepEqual(state.busy, [true, false]);
  assert.equal(state.messages.length, 2);
  assert.match(state.messages.at(-1), /Hvis e-mailadressen er registreret/);
  assert.doesNotMatch(state.messages.at(-1), /network|outage|error/i);
});

test('Supabase error responses never disclose account status or delivery configuration', async () => {
  const failures = [
    { error: { message: 'User not found', status: 404 } },
    { error: { message: 'Email rate limit exceeded', status: 429 } },
    { error: { message: 'SMTP provider unavailable', status: 503 } },
    { error: { message: 'Email address not confirmed', status: 400 } }
  ];
  const baseline = await run('person@example.com', async () => ({ error: null }));
  for (const failure of failures) {
    const result = await run('person@example.com', async () => failure);
    assert.deepEqual(result.busy, [true, false]);
    assert.equal(result.calls.length, 1);
    assert.deepEqual(result.messages, baseline.messages);
    assert.doesNotMatch(result.messages.join(' '), /user not found|rate limit|smtp|not confirmed|404|429|503/i);
  }
});

test('different email addresses and thrown provider errors produce the same neutral confirmation', async () => {
  const cases = [
    ['existing@example.com', async () => ({ error: null })],
    ['missing@example.com', async () => ({ error: { message: 'User not found', status: 404 } })],
    ['blocked@example.com', async () => { throw new Error('SMTP delivery rejected'); }],
    ['limited@example.com', async () => { throw new Error('rate limit exceeded'); }]
  ];
  const results = [];
  for (const [address, response] of cases) {
    const result = await run(address, response);
    assert.equal(result.calls.length, 1);
    assert.equal(result.calls[0][0], address);
    assert.deepEqual(result.busy, [true, false]);
    assert.equal(result.messages.length, 1);
    results.push(result.messages[0]);
  }
  assert.equal(new Set(results).size, 1);
  assert.match(results[0], /Hvis e-mailadressen er registreret/);
});


test('malformed provider responses remain neutral and restore the request state', async () => {
  const baseline = await run('person@example.com', async () => ({ error: null }));
  for (const response of [null, undefined, { error: null }, { error: { message: 'Internal auth failure' } }]) {
    const result = await run('person@example.com', async () => response);
    assert.deepEqual(result.busy, [true, false]);
    assert.equal(result.calls.length, 1);
    assert.deepEqual(result.messages, baseline.messages);
  }
});

test('non-Error thrown values never expose internal details in recovery feedback', async () => {
  const baseline = await run('person@example.com', async () => ({ error: null }));
  for (const thrown of [null, undefined, 'SMTP secret failure', { message: 'account exists', status: 409 }, 429]) {
    const result = await run('person@example.com', async () => { throw thrown; });
    assert.deepEqual(result.busy, [true, false]);
    assert.equal(result.calls.length, 1);
    assert.deepEqual(result.messages, baseline.messages);
  }
});
