import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../app/page.js', import.meta.url), 'utf8');
const start = source.indexOf('className="forgot"');
assert.ok(start >= 0, 'forgot-password button exists');
const section = source.slice(start, source.indexOf('</button>', start));
const match = section.match(/onClick=\{(async\(\)=>\{[\s\S]*?\})\}\>/);
assert.ok(match, 'forgot-password handler exists');

test('email reset request is scoped to auth and never mutates housing data', async () => {
  const calls = [];
  const supabase = {
    auth: { resetPasswordForEmail: async (...args) => { calls.push(args); return { error: null }; } },
    from: () => { throw new Error('housing data access during recovery'); },
    storage: { from: () => { throw new Error('storage access during recovery'); } }
  };
  const messages = [];
  const busy = [];
  const handler = new Function('supabase', 'email', 'setAuthMsg', 'setAuthBusy', 'authBusy', 'return (' + match[1] + ')')(
    supabase, '  Owner@example.com  ', x => messages.push(x), x => busy.push(x), false
  );
  await handler();
  assert.deepEqual(calls, [['Owner@example.com', { redirectTo: 'https://huspass.dk' }]]);
  assert.deepEqual(busy, [true, false]);
  assert.match(messages.at(-1), /Hvis e-mailadressen er registreret/);
});

test('password recovery request does not include credentials or personal records', () => {
  assert.doesNotMatch(section, /supabase\.from\(|supabase\.storage|updateUser\(|signInWithPassword\(|signOut\(|deleteUser\(/);
  assert.match(section, /resetPasswordForEmail\(cleanEmail,/);
});
