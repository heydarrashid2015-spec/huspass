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

test('invitation schema rejects empty credentials and inconsistent lifecycle timestamps', () => {
  const sql = read('docs/household-sharing-schema-draft.sql');
  assert.match(sql, /invited_email text not null check \(length\(btrim\(invited_email\)\) > 0\)/i);
  assert.match(sql, /token_hash text not null unique check \(length\(btrim\(token_hash\)\) > 0\)/i);
  assert.match(sql, /expires_at > created_at/i);
  assert.match(sql, /accepted_at >= created_at and accepted_at <= expires_at/i);
  assert.match(sql, /revoked_at >= created_at/i);
  assert.match(sql, /revoked_at >= accepted_at/i);
});

test('immutable ownership guards also protect primary identifiers', () => {
  const sql = read('docs/household-sharing-ownership-guard.sql');
  assert.match(sql, /new\.id is distinct from old\.id/i);
  assert.match(sql, /create trigger household_guard_home_ownership/i);
  assert.match(sql, /create trigger household_guard_task_ownership/i);
});

test('draft schema does not accidentally enable client access or permissive sharing policies', () => {
  const sql = read('docs/household-sharing-schema-draft.sql')
    .replace(/--[^\n]*/g, '');
  assert.doesNotMatch(sql, /create\s+policy\b/i);
  assert.doesNotMatch(sql, /grant\s+(?:all|select|insert|update|delete)\b/i);
  assert.doesNotMatch(sql, /disable\s+row\s+level\s+security/i);
  for (const table of ['home_memberships', 'home_invitations']) {
    assert.match(sql, new RegExp('alter\\s+table\\s+public\\.' + table + '\\s+enable\\s+row\\s+level\\s+security', 'i'));
  }
});

test('ownership guard stays invoker-scoped and cannot be silently disabled in migration', () => {
  const sql = read('docs/household-sharing-ownership-guard.sql').replace(/--[^\n]*/g, '');
  assert.match(sql, /security\s+invoker\s+set\s+search_path\s*=\s*''/i);
  assert.doesNotMatch(sql, /security\s+definer/i);
  assert.doesNotMatch(sql, /alter\s+table\s+[^;]+disable\s+trigger/i);
  assert.doesNotMatch(sql, /drop\s+trigger\s+(?!if\s+exists\s+household_guard_(?:home|task)_ownership)/i);
  assert.match(sql, /before\s+update\s+on\s+public\.homes\s+for\s+each\s+row/i);
  assert.match(sql, /before\s+update\s+on\s+public\.tasks\s+for\s+each\s+row/i);
});

test('household sharing mutations are gated in both handlers and UI until backend security is verified', () => {
  const page = read('app/page.js');
  assert.match(page, /const HOUSEHOLD_SHARING_ENABLED=false;/);
  assert.match(page, /sendHouseholdInvitation=async\(\)=>\{if\(!HOUSEHOLD_SHARING_ENABLED\)return/);
  assert.match(page, /acceptHouseholdInvitation=async\(id\)=>\{if\(!HOUSEHOLD_SHARING_ENABLED\)return/);
  assert.match(page, /disabled=\{!HOUSEHOLD_SHARING_ENABLED\|\|!home\?\.id\|\|householdInviting\}/);
  assert.match(page, /disabled=\{!HOUSEHOLD_SHARING_ENABLED\|\|householdActionBusy\} onClick=\{\(\)=>acceptHouseholdInvitation/);
  assert.match(page, /if\(!HOUSEHOLD_SHARING_ENABLED\)return;if\(!window\.confirm/);
});
