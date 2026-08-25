-- DealPro V1 core schema. Isolated from perso-* tables.
-- Run in the Supabase SQL editor.

create table if not exists public.dealpro_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  pseudo text not null unique,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.dealpro_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  phone text,
  device_contact_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists dealpro_contacts_device_uidx
  on public.dealpro_contacts (user_id, device_contact_id)
  where device_contact_id is not null;

create table if not exists public.dealpro_offers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  category text not null default 'immobilier',
  price numeric not null default 0,
  currency text not null default 'XOF',
  commission_rate numeric not null default 0.03,
  location text,
  size_label text,
  size_value numeric,
  description text,
  raw_text text,
  source_url text,
  source text not null default 'manual',
  phone text,
  contact_id uuid references public.dealpro_contacts (id) on delete set null,
  verification text not null default 'unverified',
  pipeline text not null default 'captured',
  reliability int not null default 20,
  map_lat double precision,
  map_lng double precision,
  map_label text,
  last_touched_at timestamptz not null default now(),
  collected_commission numeric,
  extracted jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dealpro_demands (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  category text not null default 'immobilier',
  location text,
  budget_min numeric,
  budget_max numeric,
  currency text not null default 'XOF',
  size_min numeric,
  notes text,
  contact_id uuid references public.dealpro_contacts (id) on delete set null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dealpro_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  offer_id uuid not null references public.dealpro_offers (id) on delete cascade,
  demand_id uuid not null references public.dealpro_demands (id) on delete cascade,
  score int not null,
  reasons jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, offer_id, demand_id)
);

alter table public.dealpro_profiles enable row level security;
alter table public.dealpro_contacts enable row level security;
alter table public.dealpro_offers enable row level security;
alter table public.dealpro_demands enable row level security;
alter table public.dealpro_matches enable row level security;

drop policy if exists dealpro_profiles_own on public.dealpro_profiles;
create policy dealpro_profiles_own on public.dealpro_profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists dealpro_contacts_own on public.dealpro_contacts;
create policy dealpro_contacts_own on public.dealpro_contacts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists dealpro_offers_own on public.dealpro_offers;
create policy dealpro_offers_own on public.dealpro_offers
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists dealpro_demands_own on public.dealpro_demands;
create policy dealpro_demands_own on public.dealpro_demands
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists dealpro_matches_own on public.dealpro_matches;
create policy dealpro_matches_own on public.dealpro_matches
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.dealpro_email_for_pseudo(p_pseudo text)
returns text
language sql
security definer
set search_path = public
as $$
  select u.email
  from public.dealpro_profiles p
  join auth.users u on u.id = p.id
  where p.pseudo = lower(trim(p_pseudo))
  limit 1;
$$;

create or replace function public.dealpro_pseudo_taken(p_pseudo text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.dealpro_profiles where pseudo = lower(trim(p_pseudo))
  );
$$;

create or replace function public.dealpro_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.dealpro_profiles (id, pseudo, display_name)
  values (
    new.id,
    coalesce(nullif(lower(trim(new.raw_user_meta_data->>'pseudo')), ''), split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'pseudo', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists dealpro_on_auth_user_created on auth.users;
create trigger dealpro_on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.dealpro_handle_new_user();

grant execute on function public.dealpro_email_for_pseudo(text) to anon, authenticated;
grant execute on function public.dealpro_pseudo_taken(text) to anon, authenticated;
