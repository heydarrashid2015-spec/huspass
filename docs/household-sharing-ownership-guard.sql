-- Security gate for household sharing. REVIEW AND TEST IN STAGING BEFORE APPLYING.
-- RLS policies alone are insufficient: PostgreSQL OR-combines permissive policies.
-- An editor UPDATE policy on homes can otherwise permit changing homes.user_id.
-- Likewise tasks_shared_editor_update can permit changing tasks.user_id or home_id.
-- These guards enforce immutable ownership independent of RLS policy composition.
create or replace function public.household_guard_immutable_ownership()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  if tg_table_name = 'homes' then
    if new.id is distinct from old.id or new.user_id is distinct from old.user_id then
      raise exception 'Home identity and ownership cannot be changed'
        using errcode = '42501';
    end if;
  elsif tg_table_name = 'tasks' then
    if new.id is distinct from old.id
      or new.user_id is distinct from old.user_id
      or new.home_id is distinct from old.home_id then
      raise exception 'Task identity, ownership and home cannot be changed'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.household_guard_immutable_ownership() from public, anon, authenticated;
drop trigger if exists household_guard_home_ownership on public.homes;
create trigger household_guard_home_ownership
before update on public.homes for each row
execute function public.household_guard_immutable_ownership();
drop trigger if exists household_guard_task_ownership on public.tasks;
create trigger household_guard_task_ownership
before update on public.tasks for each row
execute function public.household_guard_immutable_ownership();
-- Mandatory regression tests with two distinct authenticated users:
-- viewer cannot update; editor can update permitted fields only;
-- neither can reassign user_id, id, or tasks.home_id;
-- revoked member loses access; document IDs, metadata and storage paths stay private.
