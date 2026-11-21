import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../app/api/company-search/route.js', import.meta.url), 'utf8');

test('company search requires a real user and server-side Plus authorization', () => {
  assert.match(source, /auth\.getUser\(token\)/);
  assert.match(source, /scoped\.rpc\("huspass_ai_access"\)/);
  assert.match(source, /access\.data!==true/);
  assert.doesNotMatch(source, /client\.rpc\("huspass_ai_access"/);
});

test('Brave credential stays server-side and missing configuration fails closed', () => {
  assert.match(source, /process\.env\.BRAVE_SEARCH_API_KEY/);
  assert.match(source, /status:503/);
  assert.match(source, /"X-Subscription-Token":process\.env\.BRAVE_SEARCH_API_KEY/);
  assert.doesNotMatch(source, /NEXT_PUBLIC_BRAVE_SEARCH_API_KEY/);
});

test('search output is explicitly unverified and does not fabricate quotes', () => {
  assert.match(source, /verified:false/);
  assert.match(source, /ikke verificerede virksomheder eller pristilbud/);
  assert.match(source, /Cache-Control":"no-store/);
});
