-- Reminders + push settings for appointments and untreated demands.

alter table public.dealpro_profiles
  add column if not exists push_token text,
  add column if not exists notify_appointments boolean not null default true,
  add column if not exists notify_demands boolean not null default true,
  add column if not exists notify_agenda_minutes integer not null default 30;

alter table public.dealpro_appointments
  add column if not exists reminder jsonb;

alter table public.dealpro_demands
  add column if not exists reminder jsonb;
