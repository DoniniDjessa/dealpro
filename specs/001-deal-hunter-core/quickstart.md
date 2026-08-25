# Quickstart: DealPro V1

## 1. Env

Copy `.env.local` (Supabase URL + anon key, Gemini key). Never commit it.

## 2. Schema

Run `supabase/migrations/20260825120000_dealpro_core.sql` on the linked Supabase project (SQL editor or CLI). Confirm tables `dealpro_profiles`, `dealpro_contacts`, `dealpro_offers`, `dealpro_demands`, `dealpro_matches` exist with RLS enabled.

## 3. Install and run

```bash
npm install
npx expo start
```

Open on Android device/emulator.

## 4. Smoke flow

1. Create an account (pseudo + email + password) and sign in.
2. Accueil shows zeroes and Capture.
3. Capture an offer: paste a terrain ad, extract, attach a directory contact, save.
4. Create a compatible demand.
5. Accueil shows money, a match, and hunt actions.
6. Contacts lists the directory person with the linked offer.
