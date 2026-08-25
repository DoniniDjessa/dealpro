-- Blookingg-style capture fields on offers and richer CRM contacts.

alter table public.dealpro_offers
  add column if not exists rooms int,
  add column if not exists visite numeric,
  add column if not exists visite_text text,
  add column if not exists phones text[] not null default '{}',
  add column if not exists links jsonb not null default '[]'::jsonb,
  add column if not exists tags text[] not null default '{}',
  add column if not exists is_new boolean not null default false;

alter table public.dealpro_contacts
  add column if not exists phones text[] not null default '{}',
  add column if not exists localisation text,
  add column if not exists secteur text,
  add column if not exists specialite text,
  add column if not exists whatsapp text,
  add column if not exists facebook text,
  add column if not exists instagram text,
  add column if not exists tiktok text;

update public.dealpro_contacts
  set phones = array[phone]
  where phone is not null and phone <> '' and (phones is null or cardinality(phones) = 0);

grant select, insert, update, delete on table public.dealpro_offers to anon, authenticated;
grant select, insert, update, delete on table public.dealpro_contacts to anon, authenticated;
