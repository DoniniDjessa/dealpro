# Implementation Plan: Deal Hunter Core

**Branch**: `001-deal-hunter-core` | **Date**: 2026-08-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-deal-hunter-core/spec.md`

## Summary

Build DealPro V1 as a private Expo mobile app: capture offers, register demands, upsert directory contacts into an in-app CRM, score matches, and rank daily hunt actions. Stack matches Perso/Zo: Expo 54, Tamagui, Supabase, Plus Jakarta Sans, Gemini for extraction.

## Technical Context

**Language/Version**: TypeScript 5.9, React 19, React Native 0.81

**Primary Dependencies**: Expo 54, Expo Router 6, Tamagui 2.7, @supabase/supabase-js, Gemini generateContent, lucide-react-native, expo-contacts / image-picker / av / location / notifications / secure-store

**Storage**: Supabase Postgres (RLS, `dealpro_*` tables) + SecureStore for session

**Testing**: Manual mobile flow (login, capture, match, contacts). No automated suite in this increment.

**Target Platform**: Android/iOS via Expo (Android first, same as Perso)

**Project Type**: mobile-app (Expo Router)

**Performance Goals**: Home and lists feel instant under a few hundred rows; capture save < 1s after fields are ready

**Constraints**: Private uniperson; French UI; FCFA default; raw capture never overwritten; no apporteur network

**Scale/Scope**: Single owner, dozens to hundreds of offers/demands

## Constitution Check

| Principle | Plan response |
|---|---|
| Capture < 10s | One capture drawer: paste → extract → save. Manual title+price still saves. |
| Original trace sacred | `raw_text` / `source_url` columns; extracted JSON separate. |
| Match before browse | Home leads with money, matches, hunt actions. |
| Money first-class | `price`, `commission_rate`, generated `potential_commission`. |
| Reliability explicit | `verification` enum + derived score. |
| Contacts are CRM | Upsert from directory on attach. |
| One-person privacy | RLS `user_id = auth.uid()`; no sharing tables. |
| Nucleus first | No network/split commissions. |
| Honest intelligence | Match explanations stored; Gemini failure falls back to manual. |
| Spec before code | This plan implements `001-deal-hunter-core` only. |

Gate: PASS for V1 nucleus.

## Project Structure

### Documentation (this feature)

```text
specs/001-deal-hunter-core/
├── spec.md
├── plan.md
├── data-model.md
├── quickstart.md
└── checklists/requirements.md
```

### Source Code (repository root)

```text
app/
  _layout.tsx
  (auth)/login.tsx
  (app)/_layout.tsx              # drawer
  (app)/(tabs)/
    _layout.tsx                  # Zo-style floating tabs
    index.tsx                    # hunt home
    offers.tsx
    demands.tsx
    contacts.tsx
lib/
  supabase.ts, auth.tsx, env.ts, db.ts, types.ts
  match.ts, extract.ts, actions.ts, contacts.ts, hooks.ts
components/
  SidebarMenu, FloatingTabBar, ScreenShell, ScreenHeader
  FormDrawer, forms/OpportunityForm, DemandForm, ContactForm
  PeopleAttach, DealCard, SummaryBalloon, PrimaryButton
supabase/migrations/20260825120000_dealpro_core.sql
```

## UI lineage

- **Perso**: Plus Jakarta Sans, indigo/violet buttons, sidebar rows as cards, in-tab white cards, form drawer.
- **Zo**: floating dark tab bar with labels + active pill, home KPI hero (dark gradient), balloon overlays.

## Phase order

1. Scaffold Expo + Tamagui + auth (Perso pattern, DealPro tables).
2. Schema + RLS + pseudo RPCs.
3. Offers / demands / contacts CRUD + directory upsert.
4. Matching + hunt actions + home cockpit.
5. Gemini extraction with manual fallback.

## Risks

- Reusing Perso’s Supabase project: isolate with `dealpro_` prefix and RLS. Do not touch `perso-*` tables.
- Gemini key in the client (private app). Move to Edge Function in a later spec if the app is ever shared.
- Gemini key was pasted in `flow.md`; owner MUST rotate and keep it in `.env.local` only.
