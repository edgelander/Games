-- LandGrab Collaborated — one-time Supabase setup (safe to re-run).
-- Paste this whole file into the Supabase dashboard → SQL Editor → Run.
--
-- It creates the shared "plots" table, a public storage bucket for images,
-- enables live updates, and opens read/write access so you and a friend can
-- both add plots. (It's intentionally open for now — no login required.
-- We can lock this down with auth/moderation later.)

-- 1. The shared board ---------------------------------------------------------
create table if not exists public.plots (
  id          uuid primary key default gen_random_uuid(),
  x           real not null,          -- position as a fraction of canvas width  (0..1)
  y           real not null,          -- position as a fraction of canvas height (0..1)
  width       real not null,          -- size as a fraction of canvas width
  height      real not null,          -- size as a fraction of canvas height
  is_image    boolean not null default true,
  image_url   text,
  price_paid  real,
  created_at  timestamptz not null default now()
);

-- 2. Live updates (only add to the publication if it isn't already a member) --
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'plots'
  ) then
    alter publication supabase_realtime add table public.plots;
  end if;
end $$;

-- 2b. Phase 4: ownership, world, and active/overtaken columns -----------------
-- (add_column if_not_exists keeps this safe to re-run; existing rows become
--  neutral/unowned but still render.)
alter table public.plots add column if not exists owner_id    text;
alter table public.plots add column if not exists owner_name  text;
alter table public.plots add column if not exists owner_color text;
alter table public.plots add column if not exists world_id    text not null default 'global';
alter table public.plots add column if not exists active      boolean not null default true;

-- 2c. Players (identity + coin wallet). Phase 5: accounts are username + PIN.
-- The row id IS the normalized username, so names are unique by construction.
-- The PIN is bcrypt-hashed (pgcrypto) and only ever touched via the login()
-- function below — clients can't read it. Balances stay client-trusted in v1;
-- the real-money phase moves to Supabase Auth + server-authoritative balances.
-- Supabase installs pgcrypto into the `extensions` schema (not public), so the
-- login() function's search_path below must include it or crypt()/gen_salt()
-- resolve to "function does not exist".
create extension if not exists pgcrypto;

create table if not exists public.players (
  id         text primary key,                 -- normalized username (lower/trim)
  name       text,                              -- display name (original case)
  color      text,
  balance    numeric not null default 1000,     -- starting coins
  created_at timestamptz not null default now()
);
alter table public.players add column if not exists pin_hash text;

-- login(): create-or-verify an account, returning the public fields (never the
-- pin_hash). New username → account created with the given PIN; existing → PIN
-- must match. SECURITY DEFINER so it can read/write players while clients can't.
create or replace function public.login(p_username text, p_pin text, p_color text)
returns table (id text, name text, color text, balance numeric)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  uname text := lower(trim(p_username));
  rec public.players;
begin
  if uname = '' then raise exception 'username required'; end if;
  if length(coalesce(p_pin, '')) < 4 then raise exception 'pin too short'; end if;

  select * into rec from public.players p where p.id = uname;

  if rec.id is null then
    insert into public.players (id, name, color, balance, pin_hash)
    values (uname, trim(p_username), coalesce(p_color, '#9A8A6A'), 1000, crypt(p_pin, gen_salt('bf')))
    returning * into rec;
  elsif rec.pin_hash is null or rec.pin_hash <> crypt(p_pin, rec.pin_hash) then
    raise exception 'wrong pin';
  end if;

  return query select rec.id, rec.name, rec.color, rec.balance;
end;
$$;

grant execute on function public.login(text, text, text) to anon, authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'players'
  ) then
    alter publication supabase_realtime add table public.players;
  end if;
end $$;

-- 3. Row Level Security ------------------------------------------------------
-- Intentionally open for now (no login). Note: the UPDATE policy on plots is
-- what lets a player mark someone else's plot inactive when they overtake it.
alter table public.plots enable row level security;

drop policy if exists "anyone can read plots" on public.plots;
create policy "anyone can read plots"
  on public.plots for select using (true);

drop policy if exists "anyone can add plots" on public.plots;
create policy "anyone can add plots"
  on public.plots for insert with check (true);

drop policy if exists "anyone can update plots" on public.plots;
create policy "anyone can update plots"
  on public.plots for update using (true) with check (true);

-- Players are locked down: no direct read/insert from clients (that would
-- expose pin_hash and let anyone forge accounts). Account creation/verification
-- happens only through login(). The one open door is UPDATE, used for spending
-- coins — still client-trusted in v1 (flagged; real-money phase replaces this).
alter table public.players enable row level security;

drop policy if exists "anyone can read players" on public.players;
drop policy if exists "anyone can add players" on public.players;

drop policy if exists "anyone can update players" on public.players;
create policy "anyone can update player balance"
  on public.players for update using (true) with check (true);

-- 4. Public storage bucket for the uploaded photos ---------------------------
insert into storage.buckets (id, name, public)
values ('plots', 'plots', true)
on conflict (id) do nothing;

drop policy if exists "anyone can read plot images" on storage.objects;
create policy "anyone can read plot images"
  on storage.objects for select using (bucket_id = 'plots');

drop policy if exists "anyone can upload plot images" on storage.objects;
create policy "anyone can upload plot images"
  on storage.objects for insert with check (bucket_id = 'plots');
