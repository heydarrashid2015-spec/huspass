import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync(new URL('../supabase/migrations/20261112080000_ai_quote_consent_revoke.sql', import.meta.url), 'utf8');

test('revoke uses atomic conditional update and returns success only for updated row', () => {
  assert.match(sql, /update public\.ai_quote_contact_consents[\s\S]*returning id into v_revoked/);
  assert.match(sql, /return v_revoked is not null/);
});
test('requires authenticated caller and matching owner/project/contractor', () => {
  for (const clause of ['auth.uid() is null', 'owner_id = auth.uid()', 'project_id = p_project_id', 'contractor_id = p_contractor_id'])
    assert.ok(sql.includes(clause), clause);
});
test('cannot revoke consumed or previously revoked grants', () => {
  assert.match(sql, /revoked_at is null/);
  assert.match(sql, /consumed_at is null/);
});
test('no anonymous or public execution rights', () => {
  assert.match(sql, /revoke all on function public\.revoke_ai_quote_contact_consent\(text,text,text\)[\s\S]*from public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.revoke_ai_quote_contact_consent\(text,text,text\)[\s\S]*to authenticated/);
});
test('pinned search path and no outbound network side effects', () => {
  assert.match(sql, /security definer set search_path = ''/);
  assert.doesNotMatch(sql, /http_post\s*\(|net\.http_post\s*\(/);
});
