-- Read-only diagnostic for household sharing. Run with a privileged staging SQL session.
-- This script does not grant access, modify policies, or deploy sharing.
-- Review all returned rows; a passing query is not a substitute for two-user tests.
select n.nspname as schema_name, c.relname as table_name,
       c.relrowsecurity as rls_enabled, c.relforcerowsecurity as force_rls
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('homes','tasks','documents','home_memberships','home_invitations')
  and c.relkind in ('r','p')
order by c.relname;

select schemaname, tablename, policyname, permissive, roles, cmd,
       qual as using_expression, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('homes','tasks','documents','home_memberships','home_invitations')
order by tablename, cmd, policyname;

-- Flag any client privileges on draft membership/invitation tables.
select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('home_memberships','home_invitations')
  and grantee in ('anon','authenticated','PUBLIC')
order by table_name, grantee, privilege_type;

-- Check whether the ownership triggers actually exist and are enabled.
select c.relname as table_name, t.tgname as trigger_name,
       t.tgenabled as enabled_state, pg_get_triggerdef(t.oid) as definition
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('homes','tasks')
  and not t.tgisinternal
order by c.relname, t.tgname;

-- Inspect storage policies; object-level checks and signed URL reuse still
-- require separate authenticated tests with two real accounts.
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;
