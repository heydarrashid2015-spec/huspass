-- Draft only. Do not apply before integrating all ownership-scoped reads/writes and storage policies.
-- An invitation is not a grant: membership requires explicit owner approval and acceptance.
create table if not exists public.home_memberships (
 id uuid primary key default gen_random_uuid(),
 home_id uuid not null references public.homes(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check (role in ('viewer','editor')),
 created_at timestamptz not null default now(),
 unique(home_id,user_id)
);
create table if not exists public.home_invitations (
 id uuid primary key default gen_random_uuid(),
 home_id uuid not null references public.homes(id) on delete cascade,
 invited_email text not null check (length(btrim(invited_email)) > 0),
 role text not null check(role in ('viewer','editor')),
 token_hash text not null unique check (length(btrim(token_hash)) > 0),
 expires_at timestamptz not null,
 accepted_at timestamptz,
 revoked_at timestamptz,
 created_at timestamptz not null default now(),
 check (expires_at > created_at),
 check (accepted_at is null or (accepted_at >= created_at and accepted_at <= expires_at)),
 check (revoked_at is null or revoked_at >= created_at)
);
create index if not exists home_memberships_user_idx on public.home_memberships(user_id);
create index if not exists home_invitations_home_idx on public.home_invitations(home_id);
alter table public.home_memberships enable row level security;
alter table public.home_invitations enable row level security;
-- Default deny: no client grants or policies until invite acceptance, owner
-- revocation, cross-table RLS, storage access and audit tests are implemented.
revoke all on public.home_memberships from anon, authenticated;
revoke all on public.home_invitations from anon, authenticated;
