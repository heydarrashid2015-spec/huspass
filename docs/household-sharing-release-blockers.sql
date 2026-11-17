-- Read-only release blocker diagnostic. Run against staging and production.
-- A returned row is a finding; do not enable sharing while findings remain.
-- RLS permissive UPDATE policies are OR-combined and cannot enforce immutable owner columns.
with required_triggers(table_name, trigger_name) as (
 values ('homes','household_guard_home_ownership'),
        ('tasks','household_guard_task_ownership')
), triggers as (
 select c.relname::text as table_name,t.tgname::text as trigger_name,t.tgenabled, p.proname::text as function_name, pn.nspname::text as function_schema, (t.tgtype & 2) <> 0 as is_before, (t.tgtype & 16) <> 0 as is_update, (t.tgtype & 1) <> 0 as is_row
 from pg_trigger t join pg_class c on c.oid=t.tgrelid
 join pg_namespace n on n.oid=c.relnamespace
 join pg_proc p on p.oid=t.tgfoid
 join pg_namespace pn on pn.oid=p.pronamespace
 where n.nspname='public' and not t.tgisinternal
)
select 'MISSING_ENABLED_OWNERSHIP_GUARD' as finding, r.table_name, r.trigger_name as detail
from required_triggers r left join triggers t
 on t.table_name=r.table_name and t.trigger_name=r.trigger_name and t.tgenabled in ('O','A')
 and t.function_name='household_guard_immutable_ownership' and t.function_schema='public'
 and t.is_before and t.is_update and t.is_row
where t.trigger_name is null
union all
select 'SHARED_UPDATE_WITHOUT_GUARD',p.tablename,p.policyname
from pg_policies p
where p.schemaname='public' and p.tablename in ('homes','tasks')
 and p.cmd in ('UPDATE','ALL')
 and (p.policyname ilike '%shared%' or coalesce(p.qual,'') ilike '%household_can_access%')
 and not exists (
  select 1 from triggers t join required_triggers r
   on r.table_name=t.table_name and r.trigger_name=t.trigger_name
  where t.table_name=p.tablename and t.tgenabled in ('O','A')
   and t.function_name='household_guard_immutable_ownership' and t.function_schema='public'
 and t.is_before and t.is_update and t.is_row
 )
union all
select 'MISSING_SHARING_TABLE', required.table_name, 'public table absent'
from (values ('home_memberships'),('home_invitations')) as required(table_name)
where to_regclass('public.' || required.table_name) is null
union all
select 'MISSING_OR_DISABLED_RLS', required.table_name, 'RLS must be enabled'
from (values ('homes'),('tasks'),('documents'),('home_memberships'),('home_invitations')) as required(table_name)
left join pg_class c on c.oid = to_regclass('public.' || required.table_name)
where c.oid is null or not c.relrowsecurity


union all
select 'MISSING_SHARING_ACCESS_POLICY', required.table_name, required.cmd || ' policy absent'
from (values
  ('home_memberships','SELECT'),
  ('home_invitations','SELECT'),
  ('home_invitations','INSERT')
) as required(table_name,cmd)
where to_regclass('public.' || required.table_name) is not null
 and not exists (
   select 1 from pg_policies p
   where p.schemaname='public' and p.tablename=required.table_name
     and p.cmd in (required.cmd,'ALL')
 )

union all
select 'MISSING_STORAGE_OBJECTS_TABLE','storage.objects','Storage objects table absent; cannot validate file access'
where to_regclass('storage.objects') is null
union all
select 'MISSING_STORAGE_RLS','storage.objects','Storage objects RLS must be enabled'
where exists (select 1 from pg_class c where c.oid=to_regclass('storage.objects') and not c.relrowsecurity)
union all
select 'MISSING_PRIVATE_STORAGE_BUCKET', required.bucket_id, 'Required private bucket is missing'
from (values ('home-documents'),('home-images')) as required(bucket_id)
where not exists (select 1 from storage.buckets b where b.id=required.bucket_id)
union all
select 'PUBLIC_HOUSEHOLD_STORAGE_BUCKET', b.id, 'Public bucket bypasses private object access expectations'
from storage.buckets b
where b.id in ('home-documents','home-images') and b.public is true
union all
select 'PUBLIC_STORAGE_READ_POLICY','storage.objects',p.policyname
from pg_policies p
where p.schemaname='storage' and p.tablename='objects'
  and p.cmd in ('SELECT','ALL')
  and (p.roles @> array['anon']::name[] or p.roles @> array['public']::name[])
order by finding,table_name,detail;
