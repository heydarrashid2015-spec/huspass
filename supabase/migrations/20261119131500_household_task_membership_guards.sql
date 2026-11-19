-- PR #105: fail closed when task creator loses household access.
-- NOT applied to production. Validate in staging with independent authenticated accounts.
-- PostgreSQL permissive RLS policies are OR-combined; legacy tasks_*_own
-- otherwise allow a former member to read/update/delete tasks they created.
-- Restrictive policies are AND-combined with all permissive policies.
drop policy if exists tasks_household_membership_select_guard on public.tasks;
create policy tasks_household_membership_select_guard
on public.tasks as restrictive for select to authenticated
using (public.household_can_access(home_id, false));

drop policy if exists tasks_household_membership_update_guard on public.tasks;
create policy tasks_household_membership_update_guard
on public.tasks as restrictive for update to authenticated
using (public.household_can_access(home_id, true))
with check (public.household_can_access(home_id, true));

drop policy if exists tasks_household_membership_delete_guard on public.tasks;
create policy tasks_household_membership_delete_guard
on public.tasks as restrictive for delete to authenticated
using (public.household_can_access(home_id, true));
