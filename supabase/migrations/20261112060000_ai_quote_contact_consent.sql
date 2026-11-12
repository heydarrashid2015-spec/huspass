-- Dedicated HusPass AI quote-contact consent ledger.
-- Apply only after reviewing ownership integration and Supabase role privileges.
-- No client can insert/update consent records directly. A trusted server must
-- verify project ownership before inserting a row using service credentials.
create table if not exists public.ai_quote_contact_consents (
  id text primary key default gen_random_uuid()::text,
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  contractor_id text not null,
  granted_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  consumed_at timestamptz,
  constraint ai_quote_consent_valid_expiry check (expires_at > granted_at),
  constraint ai_quote_consent_nonblank_ids check (
    length(trim(project_id)) > 0 and length(trim(contractor_id)) > 0
  )
);
create index if not exists ai_quote_consents_owner_project_idx
  on public.ai_quote_contact_consents (owner_id, project_id);
alter table public.ai_quote_contact_consents enable row level security;
-- No user-facing SELECT/INSERT/UPDATE/DELETE policies: default deny.
revoke all on public.ai_quote_contact_consents from public, anon, authenticated;
-- SECURITY DEFINER executes a single conditional UPDATE, which is atomic under
-- PostgreSQL row locking: only one concurrent caller can claim the same consent.
create or replace function public.claim_ai_quote_contact_consent(
  p_consent_id text, p_project_id text, p_contractor_id text
) returns boolean
language plpgsql security definer set search_path = ''
as $$
declare v_claimed text;
begin
  if auth.uid() is null or nullif(trim(p_consent_id), '') is null
    or nullif(trim(p_project_id), '') is null
    or nullif(trim(p_contractor_id), '') is null then
    return false;
  end if;
  update public.ai_quote_contact_consents
     set consumed_at = transaction_timestamp()
   where id = p_consent_id
     and owner_id = auth.uid()
     and project_id = p_project_id
     and contractor_id = p_contractor_id
     and consumed_at is null
     and revoked_at is null
     and expires_at > transaction_timestamp()
  returning id into v_claimed;
  return v_claimed is not null;
end;
$$;
revoke all on function public.claim_ai_quote_contact_consent(text,text,text)
  from public, anon;
grant execute on function public.claim_ai_quote_contact_consent(text,text,text)
  to authenticated;
-- IMPORTANT: This RPC claims consent only. It neither sends a message nor
-- verifies that project_id is owned by owner_id. The trusted issuer MUST
-- verify project ownership before creating a consent row.
