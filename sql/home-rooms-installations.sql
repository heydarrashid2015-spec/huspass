-- Owner-only room and installation registry. Apply after review, before enabling the UI.
create table if not exists public.home_rooms (
 id uuid primary key default gen_random_uuid(),
 home_id uuid not null references public.homes(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 name text not null check (char_length(trim(name)) between 1 and 100),
 floor_label text not null default 'Stueetage' check (char_length(floor_label) between 1 and 60),
 area_m2 numeric(9,2) check (area_m2 > 0 and area_m2 <= 10000),
 created_at timestamptz not null default now(),
 unique(id,home_id,user_id)
);
create table if not exists public.room_installations (
 id uuid primary key default gen_random_uuid(),
 room_id uuid not null,
 home_id uuid not null,
 user_id uuid not null references auth.users(id) on delete cascade,
 name text not null check (char_length(trim(name)) between 1 and 120),
 category text not null default 'Andet' check (char_length(category) between 1 and 60),
 notes text check (char_length(notes) <= 2000),
 created_at timestamptz not null default now(),
 foreign key(room_id,home_id,user_id) references public.home_rooms(id,home_id,user_id) on delete cascade
);
create index if not exists home_rooms_owner_idx on public.home_rooms(user_id,home_id);
create index if not exists room_installations_owner_idx on public.room_installations(user_id,home_id,room_id);
alter table public.home_rooms enable row level security;
alter table public.room_installations enable row level security;
create policy "home_rooms_owner_select" on public.home_rooms for select to authenticated using ((select auth.uid())=user_id and exists(select 1 from public.homes h where h.id=home_id and h.user_id=(select auth.uid())));
create policy "home_rooms_owner_insert" on public.home_rooms for insert to authenticated with check ((select auth.uid())=user_id and exists(select 1 from public.homes h where h.id=home_id and h.user_id=(select auth.uid())));
create policy "home_rooms_owner_update" on public.home_rooms for update to authenticated using ((select auth.uid())=user_id and exists(select 1 from public.homes h where h.id=home_id and h.user_id=(select auth.uid()))) with check ((select auth.uid())=user_id and exists(select 1 from public.homes h where h.id=home_id and h.user_id=(select auth.uid())));
create policy "home_rooms_owner_delete" on public.home_rooms for delete to authenticated using ((select auth.uid())=user_id and exists(select 1 from public.homes h where h.id=home_id and h.user_id=(select auth.uid())));
create policy "room_installations_owner_select" on public.room_installations for select to authenticated using ((select auth.uid())=user_id and exists(select 1 from public.home_rooms r where r.id=room_id and r.home_id=home_id and r.user_id=(select auth.uid())));
create policy "room_installations_owner_insert" on public.room_installations for insert to authenticated with check ((select auth.uid())=user_id and exists(select 1 from public.home_rooms r where r.id=room_id and r.home_id=home_id and r.user_id=(select auth.uid())));
create policy "room_installations_owner_update" on public.room_installations for update to authenticated using ((select auth.uid())=user_id and exists(select 1 from public.home_rooms r where r.id=room_id and r.home_id=home_id and r.user_id=(select auth.uid()))) with check ((select auth.uid())=user_id and exists(select 1 from public.home_rooms r where r.id=room_id and r.home_id=home_id and r.user_id=(select auth.uid())));
create policy "room_installations_owner_delete" on public.room_installations for delete to authenticated using ((select auth.uid())=user_id and exists(select 1 from public.home_rooms r where r.id=room_id and r.home_id=home_id and r.user_id=(select auth.uid())));
grant select,insert,update,delete on public.home_rooms,public.room_installations to authenticated;
revoke all on public.home_rooms,public.room_installations from anon;
