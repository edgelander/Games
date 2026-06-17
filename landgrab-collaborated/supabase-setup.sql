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

-- 3. Row Level Security: anyone can read and add plots ------------------------
alter table public.plots enable row level security;

drop policy if exists "anyone can read plots" on public.plots;
create policy "anyone can read plots"
  on public.plots for select using (true);

drop policy if exists "anyone can add plots" on public.plots;
create policy "anyone can add plots"
  on public.plots for insert with check (true);

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
