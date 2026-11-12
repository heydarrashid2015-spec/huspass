import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const sql = readFileSync(new URL('../supabase/migrations/20261112070000_ai_quote_consent_integrity.sql', import.meta.url), 'utf8');
test('consent expiry is bounded to 24 hours', () => {
  assert.match(sql, /expires_at <= granted_at \+ interval '24 hours'/);
});
test('immutable owner, project, contractor and grant fields', () => {
  for (const field of ['id', 'owner_id', 'project_id', 'contractor_id', 'granted_at', 'expires_at'])
    assert.match(sql, new RegExp('new\\.' + field + ' is distinct from old\\.' + field));
});
test('consumed consent cannot be recycled or cleared', () => {
  assert.match(sql, /old\.consumed_at is not null and new\.consumed_at is distinct from old\.consumed_at/);
});
test('revocation cannot be cleared', () => {
  assert.match(sql, /old\.revoked_at is not null and new\.revoked_at is distinct from old\.revoked_at/);
});
test('guard is installed as an update trigger', () => {
  assert.match(sql, /before update on public\.ai_quote_contact_consents/);
  assert.match(sql, /for each row execute function public\.guard_ai_quote_consent_mutation\(\)/);
});
test('trigger function cannot be invoked directly by clients', () => {
  assert.match(sql, /revoke all on function public\.guard_ai_quote_consent_mutation\(\) from public, anon, authenticated/);
});
