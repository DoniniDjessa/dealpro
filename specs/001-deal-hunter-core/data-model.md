# Data Model: Deal Hunter Core

All tables are owner-scoped. RLS: `user_id = auth.uid()`.

## Enums

**category**: `immobilier` `automobile` `agriculture` `btp` `industrie` `commerce` `b2b` `opportunite`

**verification**: `unverified` `phone_ok` `verified` `exclusive`

**pipeline**: `captured` `contacting` `visit` `negotiation` `closing` `won` `lost`

**source**: `paste` `link` `voice` `photo` `manual`

## dealpro_profiles

| column | type | notes |
|---|---|---|
| id | uuid PK | = auth.users.id |
| pseudo | text unique | 3–24 `[a-z0-9._]` |
| display_name | text | |
| created_at | timestamptz | |

## dealpro_contacts

| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | owner |
| name | text | required |
| phone | text | |
| device_contact_id | text | phone directory id |
| notes | text | |
| created_at / updated_at | timestamptz | |

Unique `(user_id, device_contact_id)` where device id is not null.
Unique `(user_id, phone)` where phone is not empty.

## dealpro_offers

| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | |
| title | text | |
| category | text | taxonomy |
| price | numeric | |
| currency | text | default `XOF` |
| commission_rate | numeric | default `0.03` |
| location | text | |
| size_label | text | e.g. `1500 m²` |
| size_value | numeric | optional numeric part |
| description | text | |
| raw_text | text | sacred original |
| source_url | text | |
| source | text | enum above |
| phone | text | extracted or typed |
| contact_id | uuid FK | dealpro_contacts |
| verification | text | |
| pipeline | text | |
| reliability | int | 0–100 |
| map_lat / map_lng / map_label | | |
| last_touched_at | timestamptz | for relance |
| collected_commission | numeric | when won |
| extracted | jsonb | model output, never replaces raw_text |
| created_at / updated_at | timestamptz | |

Generated (app-side): `potential_commission = price * commission_rate` while pipeline not lost.

## dealpro_demands

| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | |
| title | text | |
| category | text | |
| location | text | zones, slash-separated ok |
| budget_min / budget_max | numeric | |
| currency | text | |
| size_min | numeric | |
| notes | text | |
| contact_id | uuid FK | |
| status | text | `open` `paused` `won` `dropped` |
| created_at / updated_at | timestamptz | |

## dealpro_matches

| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | |
| offer_id / demand_id | uuid FK | unique pair per owner |
| score | int | 0–100 |
| reasons | jsonb | `[{code, label, points}]` |
| created_at / updated_at | timestamptz | |

Recomputed on offer/demand save. Deleted when either side is deleted (CASCADE).

## Scoring (deterministic)

- Category exact: +40
- Location overlap (normalized substring either way): +25
- Price inside [budget_min, budget_max] (open bounds allowed): +25; within 15% of a bound: +12
- Size: offer size_value >= demand size_min: +10
- Cap 100. Home highlights score ≥ 70.

## Reliability (deterministic)

Start 20. +20 phone present. +15 contact linked. +20 phone_ok. +15 verified. +10 exclusive. −15 if last_touched_at older than 14 days and not won/lost. Clamp 0–100.

## Hunt actions

Priority order:

1. Match ≥ 70 not yet in `contacting` or beyond on the offer
2. Open offer last_touched_at older than 5 days
3. Unverified offer with price ≥ 10M
4. Open demand with no match ≥ 70
5. Offer without contact and without phone

## RPCs

- `dealpro_email_for_pseudo(p_pseudo text) returns text`
- `dealpro_pseudo_taken(p_pseudo text) returns boolean`
- Trigger: on auth.users insert, create dealpro_profiles from `raw_user_meta_data.pseudo`
