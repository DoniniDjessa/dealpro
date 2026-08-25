-- Manual cash entries for the home summary card (sale / received / commission).

create table if not exists public.dealpro_cash_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  sale_amount numeric not null default 0,
  received_amount numeric not null default 0,
  commission numeric not null default 0,
  note text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists dealpro_cash_entries_user_occurred_idx
  on public.dealpro_cash_entries (user_id, occurred_at desc);

alter table public.dealpro_cash_entries enable row level security;

drop policy if exists dealpro_cash_entries_own on public.dealpro_cash_entries;
create policy dealpro_cash_entries_own on public.dealpro_cash_entries
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update, delete on table public.dealpro_cash_entries to anon, authenticated;
