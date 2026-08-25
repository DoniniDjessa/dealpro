-- Important flag on offers + appointments (affaires / visites).

alter table public.dealpro_offers
  add column if not exists important boolean not null default false;

create table if not exists public.dealpro_appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null default 'affaire',
  title text not null,
  starts_at timestamptz not null,
  place text,
  notes text,
  contact_id uuid references public.dealpro_contacts (id) on delete set null,
  offer_id uuid references public.dealpro_offers (id) on delete set null,
  demand_id uuid references public.dealpro_demands (id) on delete set null,
  map_lat double precision,
  map_lng double precision,
  map_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dealpro_appointments_user_starts_idx
  on public.dealpro_appointments (user_id, starts_at);

alter table public.dealpro_appointments enable row level security;

drop policy if exists dealpro_appointments_own on public.dealpro_appointments;
create policy dealpro_appointments_own on public.dealpro_appointments
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update, delete on table public.dealpro_appointments to anon, authenticated;
grant select, insert, update, delete on table public.dealpro_offers to anon, authenticated;
