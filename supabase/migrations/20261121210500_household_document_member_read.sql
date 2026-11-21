-- PR #105: permit current household members to read shared document metadata.
-- Staging validation required before production deployment.
-- Only SELECT is granted; document mutations remain governed by existing owner policies.
-- The household_can_access helper checks auth.uid() against current home ownership
-- or current membership, so revoked members cannot make new authorized reads.
drop policy if exists documents_household_member_read on public.documents;
create policy documents_household_member_read
on public.documents
as permissive
for select
to authenticated
using (
  home_id is not null
  and public.household_can_access(home_id, false)
);
