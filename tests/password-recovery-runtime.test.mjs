import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../app/page.js', import.meta.url), 'utf8');
const start = source.indexOf('<h1>Ny adgangskode</h1>');
const end = source.indexOf('<label>Ny adgangskode', start);
assert.ok(start >= 0 && end > start, 'password recovery form exists');
const form = source.slice(start, end);
const match = form.match(/onSubmit=\{(async e=>\{[\s\S]*?\})\}>/);
assert.ok(match, 'recovery submit handler can be isolated');

function harness(updateUser, authBusy = false) {
  const state = { busy: [], messages: [], views: [], recovery: [], notifications: [], updates: 0, clearedPassword: [] };
  const supabase = { auth: { updateUser: async payload => { state.updates++; return updateUser(payload); } } };
  const passwordRecoveryActiveRef = { current: true };
  const build = new Function('supabase', 'passwordRecoveryActiveRef', 'setAuthBusy', 'setAuthMsg', 'setRecoveryMode', 'setNewPassword', 'setView', 'notify', 'newPassword', 'authBusy', 'return (' + match[1] + ')');
  const submit = password => build(supabase, passwordRecoveryActiveRef, x => state.busy.push(x), x => state.messages.push(x), x => state.recovery.push(x), x => state.clearedPassword.push(x), x => state.views.push(x), x => state.notifications.push(x), password, authBusy);
  return { state, passwordRecoveryActiveRef, submit };
}

test('expired or invalid recovery session leaves recovery screen active on Auth error', async () => {
  for (const message of ['Token has expired', 'Invalid Refresh Token']) {
    const h = harness(async () => ({ error: { message } }));
    await h.submit('SecurePass123')({ preventDefault() {} });
    assert.equal(h.state.updates, 1);
    assert.deepEqual(h.state.busy, [true, false]);
    assert.equal(h.passwordRecoveryActiveRef.current, true);
    assert.deepEqual(h.state.views, []);
    assert.match(h.state.messages.at(-1), /kunne ikke ændres/);
  }
});

test('network rejection cannot unlock recovery screen or strand busy indicator', async () => {
  const h = harness(async () => { throw new Error('network'); });
  await h.submit('SecurePass123')({ preventDefault() {} });
  assert.deepEqual(h.state.busy, [true, false]);
  assert.equal(h.passwordRecoveryActiveRef.current, true);
  assert.deepEqual(h.state.views, []);
});

test('invalid password is rejected locally without updating Supabase', async () => {
  for (const password of ['short1', 'onlyletters', '12345678']) {
    const h = harness(async () => ({ data: { user: { id: 'recovered-user' } }, error: null }));
    await h.submit(password)({ preventDefault() {} });
    assert.equal(h.state.updates, 0);
    assert.equal(h.passwordRecoveryActiveRef.current, true);
  }
});

test('successful password update exits recovery without modifying home data', async () => {
  const h = harness(async payload => { assert.deepEqual(payload, { password: 'SecurePass123' }); return { data: { user: { id: 'recovered-user' } }, error: null }; });
  await h.submit('SecurePass123')({ preventDefault() {} });
  assert.equal(h.state.updates, 1);
  assert.equal(h.passwordRecoveryActiveRef.current, false);
  assert.deepEqual(h.state.recovery, [false]);
  assert.deepEqual(h.state.views, ['Overblik']);
  assert.deepEqual(h.state.clearedPassword, ['']);
});

test('busy password update does not submit a duplicate request or change recovery state', async () => {
  const h = harness(async () => { throw new Error('duplicate update must not run'); }, true);
  await h.submit('SecurePass123')({ preventDefault() {} });
  assert.equal(h.state.updates, 0);
  assert.deepEqual(h.state.busy, []);
  assert.deepEqual(h.state.messages, []);
  assert.equal(h.passwordRecoveryActiveRef.current, true);
  assert.deepEqual(h.state.views, []);
});

test('pending password update keeps recovery active until Supabase confirms success', async () => {
  let settle;
  const pending = new Promise(resolve => { settle = resolve; });
  const h = harness(async () => pending);
  const running = h.submit('SecurePass123')({ preventDefault() {} });
  assert.equal(h.state.updates, 1);
  assert.deepEqual(h.state.busy, [true]);
  assert.equal(h.passwordRecoveryActiveRef.current, true);
  assert.deepEqual(h.state.views, []);
  assert.deepEqual(h.state.clearedPassword, []);
  settle({ data: { user: { id: 'recovered-user' } }, error: null });
  await running;
  assert.deepEqual(h.state.busy, [true, false]);
  assert.equal(h.passwordRecoveryActiveRef.current, false);
  assert.deepEqual(h.state.views, ['Overblik']);
});

test('pending password update rejection preserves recovery state and entered password', async () => {
  let rejectUpdate;
  const pending = new Promise((_, reject) => { rejectUpdate = reject; });
  const h = harness(async () => pending);
  const running = h.submit('SecurePass123')({ preventDefault() {} });
  assert.deepEqual(h.state.busy, [true]);
  assert.equal(h.passwordRecoveryActiveRef.current, true);
  assert.deepEqual(h.state.views, []);
  assert.deepEqual(h.state.clearedPassword, []);
  rejectUpdate(new Error('network unavailable'));
  await running;
  assert.deepEqual(h.state.busy, [true, false]);
  assert.equal(h.passwordRecoveryActiveRef.current, true);
  assert.deepEqual(h.state.views, []);
  assert.deepEqual(h.state.clearedPassword, []);
  assert.equal(h.state.updates, 1);
  assert.match(h.state.messages.at(-1), /kunne ikke ændres/);
});

test('expired and invalid tokens preserve the entered password and never navigate', async () => {
  for (const message of ['Token has expired', 'Invalid Refresh Token']) {
    const h = harness(async () => ({ error: { message } }));
    await h.submit('SecurePass123')({ preventDefault() {} });
    assert.equal(h.state.updates, 1);
    assert.deepEqual(h.state.clearedPassword, []);
    assert.deepEqual(h.state.recovery, []);
    assert.deepEqual(h.state.views, []);
    assert.equal(h.passwordRecoveryActiveRef.current, true);
    assert.deepEqual(h.state.busy, [true, false]);
    assert.doesNotMatch(h.state.messages.at(-1), /SecurePass123|Invalid Refresh Token|Token has expired/);
  }
});

test('failed recovery never emits success notification or clears password', async () => {
  for (const updateUser of [
    async () => ({ error: { message: 'Invalid Refresh Token' } }),
    async () => { throw new Error('connection interrupted'); }
  ]) {
    const h = harness(updateUser);
    await h.submit('SecurePass123')({ preventDefault() {} });
    assert.deepEqual(h.state.notifications, []);
    assert.deepEqual(h.state.clearedPassword, []);
    assert.deepEqual(h.state.recovery, []);
    assert.deepEqual(h.state.views, []);
    assert.equal(h.passwordRecoveryActiveRef.current, true);
    assert.deepEqual(h.state.busy, [true, false]);
  }
});

test('malformed password update responses fail closed without reporting success', async () => {
  for (const response of [null, undefined, {}, { error: null }, { data: { user: null }, error: null }, { error: { message: 'Auth unavailable' } }]) {
    const h = harness(async () => response);
    await h.submit('SecurePass123')({ preventDefault() {} });
    assert.equal(h.state.updates, 1);
    assert.deepEqual(h.state.busy, [true, false]);
    assert.equal(h.passwordRecoveryActiveRef.current, true);
    assert.deepEqual(h.state.recovery, []);
    assert.deepEqual(h.state.views, []);
    assert.deepEqual(h.state.clearedPassword, []);
    assert.deepEqual(h.state.notifications, []);
    assert.match(h.state.messages.at(-1), /kunne ikke ændres/);
  }
});
