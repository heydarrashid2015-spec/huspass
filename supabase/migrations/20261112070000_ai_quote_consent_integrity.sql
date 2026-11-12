-- Defense in depth for the dedicated HusPass AI consent ledger.
-- This migration is NOT safe to apply before the parent consent migration.
-- Bound the lifetime of newly issued consent. Existing rows must be audited
-- before deployment: validation will reject any legacy overlong grants.
alter table public.ai_quote_contact_consents
  add constraint ai_quote_consent_max_24h
  check (expires_at <= granted_at + interval '24 hours');

-- Preserve the original scope and timestamps after issuance. In particular,
-- a service credential must not silently recycle a consumed consent.
create or replace function public.guard_ai_quote_consent_mutation()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.id is distinct from old.id
    or new.owner_id is distinct from old.owner_id
    or new.project_id is distinct from old.project_id
    or new.contractor_id is distinct from old.contractor_id
    or new.granted_at is distinct from old.granted_at
    or new.expires_at is distinct from old.expires_at
    or (old.consumed_at is not null and new.consumed_at is distinct from old.consumed_at)
    or (old.revoked_at is not null and new.revoked_at is distinct from old.revoked_at)
  then
    raise exception 'AI quote consent scope or final state is immutable'
      using errcode = '23514';
  end if;
  if new.consumed_at is not null and new.consumed_at < old.granted_at then
    raise exception 'AI quote consent cannot be consumed before issuance'
      using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_ai_quote_consent_mutation() from public, anon, authenticated;
drop trigger if exists guard_ai_quote_consent_mutation on public.ai_quote_contact_consents;
create trigger guard_ai_quote_consent_mutation
before update on public.ai_quote_contact_consents
for each row execute function public.guard_ai_quote_consent_mutation();

-- This is only ledger integrity. A trusted issuer must independently check
-- project ownership and record explicit consent; no contractor is contacted.
