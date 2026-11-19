-- PR #105: fail-closed ownership guard. NOT applied to production.
-- Owner and editor may edit permitted fields, but never reassign tenant identity.
-- BEFORE UPDATE triggers enforce invariants independently of permissive RLS OR policies.
create or replace function public.household_guard_immutable_ownership()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if tg_table_name = 'homes' then
    if new.user_id is distinct from old.user_id then
      raise exception 'home ownership is immutable' using errcode = '42501';
    end if;
  elsif tg_table_name = 'tasks' then
    if new.user_id is distinct from old.user_id
       or new.home_id is distinct from old.home_id then
      raise exception 'task ownership and home association are immutable' using errcode = '42501';
    end if;
  else
    raise exception 'unsupported household guard target' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists household_guard_home_ownership on public.homes;
create trigger household_guard_home_ownership
before update on public.homes
for each row execute function public.household_guard_immutable_ownership();

drop trigger if exists household_guard_task_ownership on public.tasks;
create trigger household_guard_task_ownership
before update on public.tasks
for each row execute function public.household_guard_immutable_ownership();
