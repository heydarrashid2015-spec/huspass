import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const sql = readFileSync(new URL('../supabase/migrations/20261112060000_ai_quote_contact_consent.sql', import.meta.url), 'utf8');
test('one-time claim is a single conditional UPDATE with consumed-at guard', () => {
  assert.match(sql, /update public\.ai_quote_contact_consents[\s\S]*consumed_at is null[\s\S]*returning id into v_claimed/i);
});
test('claim requires authenticated owner and matching project and contractor', () => {
  for (const clause of ['auth.uid() is null','owner_id = auth.uid()','project_id = p_project_id','contractor_id = p_contractor_id']) assert.ok(sql.includes(clause), clause);
});
test('expired or revoked consent cannot be consumed', () => {
  assert.match(sql, /revoked_at is null/);
  assert.match(sql, /expires_at > transaction_timestamp\(\)/);
});
test('default-deny RLS and no direct authenticated table access', () => {
  assert.match(sql, /enable row level security/);
  assert.match(sql, /revoke all on public\.ai_quote_contact_consents from public, anon, authenticated/);
});
test('only authenticated users can execute claim RPC', () => {
  assert.match(sql, /grant execute on function public\.claim_ai_quote_contact_consent\(text,text,text\)\s+to authenticated/);
});
test('function has pinned search path and does not send external messages', () => {
  assert.match(sql, /security definer set search_path = ''/);
  assert.doesNotMatch(sql, /http_post\s*\(|net\.http_post\s*\(/);
});
