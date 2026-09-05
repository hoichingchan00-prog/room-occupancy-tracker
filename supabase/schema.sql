-- Math Centre occupancy tracker
-- Run this in the Supabase SQL Editor (Dashboard → SQL).

create extension if not exists pgcrypto;

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  max_capacity integer not null check (max_capacity > 0),
  current_occupancy integer not null default 0 check (current_occupancy >= 0),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists rooms_set_updated_at on public.rooms;
create trigger rooms_set_updated_at
before update on public.rooms
for each row
execute procedure public.set_updated_at();

-- Atomic occupancy change so +1/-1 from multiple devices stay consistent.
create or replace function public.adjust_occupancy(p_room_id uuid, p_delta integer)
returns public.rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.rooms;
begin
  update public.rooms
  set current_occupancy = greatest(0, current_occupancy + p_delta)
  where id = p_room_id
  returning * into result;

  if result.id is null then
    raise exception 'Room not found';
  end if;

  return result;
end;
$$;

grant execute on function public.adjust_occupancy(uuid, integer) to anon, authenticated;

alter table public.rooms enable row level security;

drop policy if exists "Public read rooms" on public.rooms;
create policy "Public read rooms"
on public.rooms
for select
to anon, authenticated
using (true);

drop policy if exists "Public update occupancy" on public.rooms;
create policy "Public update occupancy"
on public.rooms
for update
to anon, authenticated
using (true)
with check (true);

-- Realtime: include this table in the supabase_realtime publication.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'rooms'
  ) then
    alter publication supabase_realtime add table public.rooms;
  end if;
end $$;

insert into public.rooms (name, max_capacity, current_occupancy)
select * from (
  values
    ('Room 101 — Algebra', 16, 7),
    ('Room 102 — Geometry', 14, 11),
    ('Room 201 — Calculus', 18, 4),
    ('Room 202 — Statistics', 20, 18),
    ('Room 301 — SAT Prep', 12, 6),
    ('Lab A — Tutoring Hub', 24, 9)
) as seed(name, max_capacity, current_occupancy)
where not exists (select 1 from public.rooms);
