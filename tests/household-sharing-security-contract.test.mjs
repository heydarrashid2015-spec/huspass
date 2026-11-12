import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('household sharing remains explicitly gated pending integration security tests', () => {
  const contract = read('docs/household-sharing-security-contract.md');
  assert.match(contract, /not deployed/i);
  assert.match(contract, /Do not merge as functional sharing/i);
  assert.match(contract, /Documents, file paths, image storage and task offers remain owner-only/i);
  assert.match(contract, /Previously issued Supabase Storage signed URLs/i);
});

test('draft membership and invitations are default-deny to client roles', () => {
  const sql = read('docs/household-sharing-schema-draft.sql');
  for (const table of ['home_memberships', 'home_invitations']) {
    assert.match(sql, new RegExp('alter table public\\.' + table + ' enable row level security', 'i'));
    assert.match(sql, new RegExp('revoke all on public\\.' + table + ' from anon, authenticated', 'i'));
  }
  assert.match(sql, /unique\(home_id,user_id\)/i);
  assert.match(sql, /token_hash text not null unique/i);
});

test('immutable ownership guards cover homes and tasks', () => {
  const sql = read('docs/household-sharing-ownership-guard.sql');
  assert.match(sql, /new\.user_id is distinct from old\.user_id/i);
  assert.match(sql, /new\.home_id is distinct from old\.home_id/i);
  assert.match(sql, /before update on public\.homes/i);
  assert.match(sql, /before update on public\.tasks/i);
});
