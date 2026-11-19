-- PR #105: fail-closed ownership guard. NOT applied to production.
-- Requires staging migration and authenticated multi-account regression tests before release.
-- RLS permissive UPDATE policies are OR-combined; triggers enforce tenant invariants.
create or replace function public.household_guard_immutable_ownership()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_table_name = 'homes' then
    if new.id is distinct from old.id
       or new.user_id is distinct from old.user_id then
      raise exception 'home identity and ownership are immutable' using errcode = '42501';
    end if;
  elsif tg_table_name = 'tasks' then
    if new.id is distinct from old.id
       or new.user_id is distinct from old.user_id
       or new.home_id is distinct from old.home_id then
      raise exception 'task identity, ownership and home association are immutable' using errcode = '42501';
    end if;
  else
    raise exception 'unsupported household guard target' using errcode = '42501';
  end if;
  return new;
end;
$$;

-- Trigger execution does not require client EXECUTE permission on the function.
revoke all on function public.household_guard_immutable_ownership() from public, anon, authenticated;

drop trigger if exists household_guard_home_ownership on public.homes;
create trigger household_guard_home_ownership
before update on public.homes
for each row execute function public.household_guard_immutable_ownership();

drop trigger if exists household_guard_task_ownership on public.tasks;
create trigger household_guard_task_ownership
before update on public.tasks
for each row execute function public.household_guard_immutable_ownership();
