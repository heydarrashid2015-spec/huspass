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

test('sharing contract explicitly blocks cross-account document and storage access', () => {
  const contract = read('docs/household-sharing-security-contract.md');
  assert.match(contract, /guessed document IDs across accounts/i);
  assert.match(contract, /no new URL can be issued afterward/i);
  assert.match(contract, /signed URLs are bearer credentials/i);
  assert.match(contract, /authenticated server proxy that rechecks current membership/i);
});

test('ownership migration cannot grant clients new privileges', () => {
  const sql = read('docs/household-sharing-ownership-guard.sql').replace(/--[^\n]*/g, '');
  assert.match(sql, /revoke all on function public\.household_guard_immutable_ownership\(\) from public, anon, authenticated/i);
  assert.doesNotMatch(sql, /\bgrant\s+(?:all|execute|update|insert|delete)\b/i);
  assert.doesNotMatch(sql, /\bdisable\s+row\s+level\s+security\b/i);
});

test('read-only staging audit covers RLS, privileges, ownership triggers and Storage without mutation', () => {
  const audit = read('docs/household-sharing-readonly-security-audit.sql');
  const sql = audit.replace(/--[^\n]*/g, '').trim();
  assert.match(sql, /from\s+pg_class\b/i);
  assert.match(sql, /from\s+pg_policies\b/i);
  assert.match(sql, /from\s+information_schema\.role_table_grants\b/i);
  assert.match(sql, /from\s+pg_trigger\b/i);
  assert.match(sql, /schemaname\s*=\s*'storage'/i);
  for (const table of ['homes', 'tasks', 'documents', 'home_memberships', 'home_invitations']) {
    assert.match(sql, new RegExp("'"+table+"'"));
  }
  assert.doesNotMatch(sql, /\b(?:insert|update|delete|alter|create|drop|truncate|grant|revoke|execute|call)\b/i);
});


test('release blocker audit remains read-only and detects absent or disabled ownership guards', () => {
  const sql = read('docs/household-sharing-release-blockers.sql').replace(/--[^\n]*/g, '').trim();
  assert.match(sql, /MISSING_ENABLED_OWNERSHIP_GUARD/);
  assert.match(sql, /SHARED_UPDATE_WITHOUT_GUARD/);
  assert.match(sql, /t\.tgenabled\s+in\s*\('O','A'\)/i);
  assert.match(sql, /household_guard_home_ownership/);
  assert.match(sql, /household_guard_task_ownership/);
  assert.doesNotMatch(sql, /\b(?:insert|update|delete|alter|create|drop|truncate|grant|revoke|execute|call)\s+(?:table|on|into|from|function|trigger|policy)\b/i);
});


test('release blocker requires row-level ownership triggers rather than statement triggers', () => {
  const sql = read('docs/household-sharing-release-blockers.sql').replace(/--[^\n]*/g, '');
  assert.match(sql, /\(t\.tgtype\s*&\s*1\)\s*<>\s*0\s+as\s+is_row/i);
  assert.equal((sql.match(/and\s+t\.is_before\s+and\s+t\.is_update\s+and\s+t\.is_row/gi) || []).length, 2);
});

test('release blocker audits private household storage bucket configuration', () => {
  const sql = read('docs/household-sharing-release-blockers.sql').replace(/--[^\n]*/g, '');
  assert.match(sql, /MISSING_PRIVATE_STORAGE_BUCKET/);
  assert.match(sql, /PUBLIC_HOUSEHOLD_STORAGE_BUCKET/);
  assert.match(sql, /from\s+storage\.buckets/i);
  assert.match(sql, /b\.public\s+is\s+true/i);
  for (const bucket of ['home-documents', 'home-images']) {
    assert.match(sql, new RegExp("'" + bucket + "'"));
  }
});

test('release blocker requires membership-scoped home and task read policies', () => {
  const sql = read('docs/household-sharing-release-blockers.sql').replace(/--[^\n]*/g, '');
  assert.match(sql, /MISSING_MEMBERSHIP_SCOPED_HOME_READ_POLICY/);
  assert.match(sql, /MISSING_MEMBERSHIP_SCOPED_TASK_READ_POLICY/);
  for (const table of ['homes', 'tasks']) {
    assert.match(sql, new RegExp("tablename='" + table + "'"));
  }
});

test('task revocation guard remains restrictive and covers read, update and delete', () => {
  const sql = read('supabase/migrations/20261119131500_household_task_membership_guards.sql')
    .replace(/--[^\n]*/g, '');
  for (const [action,write] of [['select',false],['update',true],['delete',true]]) {
    const name = 'tasks_household_membership_' + action + '_guard';
    assert.match(sql, new RegExp('create\\s+policy\\s+' + name + '\\s+on\\s+public\\.tasks\\s+as\\s+restrictive\\s+for\\s+' + action + '\\s+to\\s+authenticated', 'i'));
    assert.match(sql, new RegExp('using\\s*\\(public\\.household_can_access\\(home_id,\\s*' + write + '\\)\\)', 'i'));
  }
  assert.match(sql, /with\s+check\s*\(public\.household_can_access\(home_id,\s*true\)\)/i);
  assert.doesNotMatch(sql, /\b(?:grant|disable\s+row\s+level\s+security)\b/i);
});


test('task INSERT is restricted to current household editors, not merely task creators', () => {
  const sql = read('supabase/migrations/20261119131500_household_task_membership_guards.sql').replace(/--[^\n]*/g, '');
  assert.match(sql, /create\s+policy\s+tasks_household_membership_insert_guard\s+on\s+public\.tasks\s+as\s+restrictive\s+for\s+insert\s+to\s+authenticated/i);
  assert.match(sql, /with\s+check\s*\(public\.household_can_access\(home_id,\s*true\)\)/i);
});


test('deployable ownership migration protects both home and task identity', () => {
  const sql = read('supabase/migrations/20261119030000_household_immutable_ownership.sql').replace(/--[^\n]*/g, '');
  assert.match(sql, /security\s+invoker\s+set\s+search_path\s*=\s*''/i);
  for (const field of ['id', 'user_id']) {
    assert.match(sql, new RegExp('new\\.' + field + '\\s+is\\s+distinct\\s+from\\s+old\\.' + field, 'i'));
  }
  assert.match(sql, /new\.home_id\s+is\s+distinct\s+from\s+old\.home_id/i);
  for (const table of ['homes', 'tasks']) {
    assert.match(sql, new RegExp('before\\s+update\\s+on\\s+public\\.' + table + '\\s+for\\s+each\\s+row', 'i'));
  }
  assert.match(sql, /revoke\s+all\s+on\s+function\s+public\.household_guard_immutable_ownership\(\)\s+from\s+public,\s*anon,\s*authenticated/i);
  assert.doesNotMatch(sql, /\bdisable\s+(?:row\s+level\s+security|trigger)\b/i);
});

test('release audit fails closed when task revocation guards are missing', () => {
  const sql = read('docs/household-sharing-release-blockers.sql').replace(/--[^\n]*/g, '');
  assert.match(sql, /MISSING_RESTRICTIVE_TASK_MEMBERSHIP_GUARD/);
  assert.match(sql, /p\.permissive\s*=\s*'RESTRICTIVE'/i);
  for (const action of ['SELECT', 'INSERT', 'UPDATE', 'DELETE']) {
    assert.match(sql, new RegExp("'"+action+"','tasks_household_membership_"+action.toLowerCase()+"_guard'"));
  }
});

test('shared document metadata is readable only by current household members, without write grants', () => {
  const sql = read('supabase/migrations/20261121210500_household_document_member_read.sql')
    .replace(/--[^\n]*/g, '');
  assert.match(sql, /create\s+policy\s+documents_household_member_read\s+on\s+public\.documents/i);
  assert.match(sql, /for\s+select\s+to\s+authenticated/i);
  assert.match(sql, /home_id\s+is\s+not\s+null/i);
  assert.match(sql, /public\.household_can_access\(home_id,\s*false\)/i);
  assert.doesNotMatch(sql, /\b(?:grant|for\s+(?:update|insert|delete)|disable\s+row\s+level\s+security)\b/i);
});

test('document sharing migration cannot weaken owner write policies or expose anonymous access', () => {
  const sql = read('supabase/migrations/20261121210500_household_document_member_read.sql')
    .replace(/--[^\n]*/g, '');
  const drops = [...sql.matchAll(/drop\s+policy\s+if\s+exists\s+([a-z_]+)\s+on\s+public\.documents/gi)]
    .map(match => match[1].toLowerCase());
  assert.deepEqual(drops, ['documents_household_member_read']);
  assert.match(sql, /as\s+permissive\s+for\s+select\s+to\s+authenticated/i);
  assert.match(sql, /home_id\s+is\s+not\s+null\s+and\s+public\.household_can_access\(home_id,\s*false\)/i);
  assert.doesNotMatch(sql, /\b(?:grant|revoke|alter\s+table|create\s+function|security\s+definer)\b/i);
  assert.doesNotMatch(sql, /\bto\s+(?:anon|public)\b/i);
});
