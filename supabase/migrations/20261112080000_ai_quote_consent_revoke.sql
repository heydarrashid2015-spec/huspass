-- Allow a customer to revoke an unused, scoped contractor-contact consent.
-- Depends on the consent ledger and integrity trigger migrations.
-- No outbound contractor contact is performed here.
create or replace function public.revoke_ai_quote_contact_consent(
  p_consent_id text, p_project_id text, p_contractor_id text
) returns boolean
language plpgsql security definer set search_path = ''
as $$
declare v_revoked text;
begin
  if auth.uid() is null
    or nullif(btrim(p_consent_id), '') is null
    or nullif(btrim(p_project_id), '') is null
    or nullif(btrim(p_contractor_id), '') is null then
    return false;
  end if;

  update public.ai_quote_contact_consents
     set revoked_at = transaction_timestamp()
   where id = p_consent_id
     and owner_id = auth.uid()
     and project_id = p_project_id
     and contractor_id = p_contractor_id
     and revoked_at is null
     and consumed_at is null
  returning id into v_revoked;

  return v_revoked is not null;
end;
$$;
revoke all on function public.revoke_ai_quote_contact_consent(text,text,text)
  from public, anon, authenticated;
grant execute on function public.revoke_ai_quote_contact_consent(text,text,text)
  to authenticated;
-- SECURITY NOTE: Revocation does not retract a message already sent.
-- Issuance must verify project ownership on the trusted server.
