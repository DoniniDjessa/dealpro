-- Clients are contacts that can be attached to a demand.

alter table public.dealpro_contacts
  add column if not exists kind text not null default 'contact';

update public.dealpro_contacts
set kind = 'client'
where kind is distinct from 'client'
  and id in (
    select contact_id from public.dealpro_demands where contact_id is not null
  );

alter table public.dealpro_contacts
  drop constraint if exists dealpro_contacts_kind_check;

alter table public.dealpro_contacts
  add constraint dealpro_contacts_kind_check
  check (kind in ('contact', 'client'));
