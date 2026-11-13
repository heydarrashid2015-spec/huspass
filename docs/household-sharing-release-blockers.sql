-- Read-only release blocker diagnostic. Run against staging and production.
-- A returned row is a finding; do not enable sharing while findings remain.
-- RLS permissive UPDATE policies are OR-combined and cannot enforce immutable owner columns.
with required_triggers(table_name, trigger_name) as (
 values ('homes','household_guard_home_ownership'),
        ('tasks','household_guard_task_ownership')
), triggers as (
 select c.relname::text as table_name,t.tgname::text as trigger_name,t.tgenabled
 from pg_trigger t join pg_class c on c.oid=t.tgrelid
 join pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and not t.tgisinternal
)
select 'MISSING_ENABLED_OWNERSHIP_GUARD' as finding, r.table_name, r.trigger_name as detail
from required_triggers r left join triggers t
 on t.table_name=r.table_name and t.trigger_name=r.trigger_name and t.tgenabled in ('O','A')
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
 )
order by finding,table_name,detail;
