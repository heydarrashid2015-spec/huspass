-- Draft migration: private 2D floor-plan metadata only. No public bucket or upload endpoint.
-- Apply only after tenant-isolation and storage-policy integration tests pass.
create table if not exists public.home_floorplans (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  original_filename text not null,
  media_type text not null check (media_type in ('application/pdf','image/png','image/jpeg','image/webp')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 20971520),
  created_at timestamptz not null default now(),
  constraint floorplan_storage_path_owner check (
    storage_path = user_id::text || '/' || home_id::text || '/' || id::text
  ),
  constraint floorplan_filename_length check (char_length(original_filename) between 1 and 180),
  unique (storage_path)
);
create index if not exists home_floorplans_owner_idx on public.home_floorplans(user_id,home_id);
alter table public.home_floorplans enable row level security;
-- A metadata row is not proof of storage authorization; storage.objects must have separate policies.
create policy "home_floorplans_owner_select" on public.home_floorplans
  for select to authenticated using (
    user_id = (select auth.uid()) and exists (
      select 1 from public.homes h where h.id=home_id and h.user_id=(select auth.uid())
    )
  );
create policy "home_floorplans_owner_insert" on public.home_floorplans
  for insert to authenticated with check (
    user_id = (select auth.uid()) and exists (
      select 1 from public.homes h where h.id=home_id and h.user_id=(select auth.uid())
    )
  );
create policy "home_floorplans_owner_update" on public.home_floorplans
  for update to authenticated using (
    user_id = (select auth.uid()) and exists (
      select 1 from public.homes h where h.id=home_id and h.user_id=(select auth.uid())
    )
  ) with check (
    user_id = (select auth.uid()) and exists (
      select 1 from public.homes h where h.id=home_id and h.user_id=(select auth.uid())
    )
  );
create policy "home_floorplans_owner_delete" on public.home_floorplans
  for delete to authenticated using (
    user_id = (select auth.uid()) and exists (
      select 1 from public.homes h where h.id=home_id and h.user_id=(select auth.uid())
    )
  );
revoke all on public.home_floorplans from anon;
grant select,insert,update,delete on public.home_floorplans to authenticated;
-- Intentionally no storage bucket creation or public URL generation.
