# Feature Specification: Deal Hunter Core

**Feature Branch**: `001-deal-hunter-core`

**Created**: 2026-08-25

**Status**: Draft

**Input**: User description: "Treat flow.md into a V1 private uniperson DealPro mobile app: capture commercial opportunities in seconds, match them to buyer demands, track commissions, keep a CRM of directory contacts, and surface the next money-making actions. No apporteur network yet."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Capture an opportunity in seconds (Priority: P1)

The owner sees an ad (WhatsApp, Facebook, TikTok, Telegram, street sign) and dumps it into DealPro: paste text or a link, dictate a voice note, or snap a photo. The app stores the raw capture immediately, then extracts category, price, location, size, phone, seller name, and description. The owner can confirm or edit, attach a directory contact, and save. The save produces an Offer with a default commission (3%) and verification state Unverified.

**Why this priority**: Without inventory there is nothing to match and nothing to hunt.

**Independent Test**: Paste “Terrain 1500 m² à Bingerville, 40 millions”, save, and find Offer #n with category, price, location, and potential commission.

**Acceptance Scenarios**:

1. **Given** the owner is on any main screen, **When** they tap Capture, paste an ad, and save, **Then** an Offer exists with raw text intact, timestamp, source, and extracted fields the owner can edit.
2. **Given** extraction fails, **When** they save with a title and a price, **Then** the Offer still exists and the raw text is kept.
3. **Given** they attach a phone-directory person who is not yet in Contacts, **When** they save, **Then** that person appears in Contacts and is linked to the Offer.
4. **Given** they leave the capture without saving, **Then** nothing is written as a confirmed Offer.

---

### User Story 2 - Register a demand (Priority: P1)

The owner records a buyer: what they want, where, budget min/max, size/quantity constraints, and a linked contact. The demand is matchable immediately.

**Why this priority**: Matching requires both sides. Offers without demands are a list.

**Independent Test**: Create “Client cherche terrain Cocody/Bingerville, 30–50M, min 1000 m²” and see it on Demandes with its contact.

**Acceptance Scenarios**:

1. **Given** the owner opens Demandes and saves a demand with category, zone, and budget, **Then** the demand appears in the list and is eligible for matching.
2. **Given** they attach a directory contact not yet in Contacts, **When** they save, **Then** the contact is created and linked.
3. **Given** budget max is below budget min, **When** they try to save, **Then** the save is rejected with a clear message.

---

### User Story 3 - See the hunt at a glance (Priority: P1)

Home is a commercial cockpit, not a feed. It shows potential commissions, pipeline value, open offers, open demands, new matches, and a ranked “Trouve-moi de l’argent” list of the next actions (call this seller, present this offer to that buyer, relance this contact, verify this listing).

**Why this priority**: The owner must feel the hunting machine on day one.

**Independent Test**: Seed one offer, one compatible demand, and one stale unverified offer; open Home and verify money totals, the match, and at least one recommended action.

**Acceptance Scenarios**:

1. **Given** offers with prices and commission rates exist, **When** Home opens, **Then** potential commission and pipeline value match those offers that are not lost/won.
2. **Given** a match above the visible threshold exists, **When** Home opens, **Then** it appears in the matches block with score and both sides named.
3. **Given** no data exists, **When** Home opens, **Then** zeroes are honest and Capture is the primary action.
4. **Given** the owner taps “Trouve-moi de l’argent”, **When** actions exist, **Then** they see a ranked list with a reason for each action.

---

### User Story 4 - Automatic matching (Priority: P1)

When an offer or a demand is saved or updated, the app scores compatible pairs (category, location overlap, price vs budget, size vs minimum). Matches at or above 70% are highlighted. The owner can open a match and see why it scored that way.

**Why this priority**: This is the product’s core intelligence.

**Independent Test**: Offer “Terrain Bingerville 40M, 1500 m²” vs demand “Terrain Cocody/Bingerville 30–50M, min 1000 m²” produces a high score; a car demand against that terrain does not.

**Acceptance Scenarios**:

1. **Given** a compatible offer and demand, **When** either is saved, **Then** a match exists with a score and an explanation (category, zone, price, size).
2. **Given** category differs, **When** matching runs, **Then** no high match is created between those two.
3. **Given** the owner opens a match, **When** they view it, **Then** they see both records and the reasons, not only a percentage.

---

### User Story 5 - Contacts as living files (Priority: P1)

The Contacts screen lists people the owner works with. Each contact can come from the phone directory or be created by hand. Linking a directory person to an offer or demand upserts them here. Opening a contact shows linked offers and demands.

**Why this priority**: Constitution VI. Deals close with people.

**Independent Test**: Attach “Marie” from the directory to an offer; open Contacts and find Marie with that offer listed.

**Acceptance Scenarios**:

1. **Given** a directory contact is attached to an offer, **When** Contacts is opened, **Then** that person exists with name and phone when the directory provided it.
2. **Given** the same directory person is attached to a demand later, **When** Contacts is opened, **Then** there is still one contact, now linked to both.
3. **Given** the owner creates a contact by hand, **When** they save name + phone, **Then** it appears and can be attached to future offers.

---

### User Story 6 - Verification and pipeline (Priority: P2)

The owner moves an offer through verification (unverified → phone confirmed → verified → exclusive) and through a pipeline (captured → contacting → visit → negotiation → closing → won / lost). Reliability score updates from those facts. Won deals contribute to collected commissions.

**Why this priority**: Stops wasting time on ghosts; starts tracking real money.

**Independent Test**: Mark an offer phone-confirmed then verified; score rises; mark won with collected commission; dashboard collected amount increases.

**Acceptance Scenarios**:

1. **Given** an unverified offer, **When** the owner confirms the phone, **Then** state becomes phone confirmed and reliability increases.
2. **Given** an offer in pipeline, **When** they mark it won, **Then** it leaves open pipeline value and adds to collected commissions if an amount is set.
3. **Given** an offer not relanced for 5 days while still open, **When** hunt actions are computed, **Then** a relance action appears.

---

### Edge Cases

- Pasted text is empty or not an ad: save is blocked unless a title or price is provided.
- Two directory contacts with the same phone: upsert into one in-app contact.
- Offer price is 0 or missing: potential commission is 0; match score penalizes price fit.
- Demand has no max budget: price fit uses min only, or skips price if both bounds empty.
- Location strings differ in spelling (“Bingerville” vs “Bingervile”): match may be weaker; owner can still link manually later (manual link is V2; V1 is automatic only).
- Gemini is unavailable: owner captures by hand; a visible error explains extraction failed.
- Directory permission denied: attach-from-directory explains why and still allows manual contact creation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Owner MUST be able to sign in and sign up privately (email + pseudo + password). Data is scoped to that owner.
- **FR-002**: Owner MUST be able to capture an offer from pasted text/link, with optional voice note and photo, in one screen.
- **FR-003**: Raw capture MUST be stored even when extraction succeeds.
- **FR-004**: Extracted fields MUST include category, title, price, currency, location, size, phone, seller name, description when present in the source.
- **FR-005**: Every offer MUST store commission rate (default 3%) and a computed potential commission.
- **FR-006**: Owner MUST be able to create, edit, list, and delete offers and demands.
- **FR-007**: Owner MUST be able to attach one primary contact from the phone directory or from in-app Contacts to an offer or a demand.
- **FR-008**: Attaching a directory contact that is not in Contacts MUST create it.
- **FR-009**: Contacts screen MUST list in-app contacts and show linked offers and demands.
- **FR-010**: Saving or updating an offer or demand MUST recompute matches for that owner.
- **FR-011**: A match MUST expose score (0–100) and an explanation of contributing factors.
- **FR-012**: Home MUST show potential commissions, pipeline value, match count, and ranked hunt actions.
- **FR-013**: “Trouve-moi de l’argent” MUST rank at most the top actions for today with a human-readable reason.
- **FR-014**: Offers MUST support verification states and pipeline states defined in the data model.
- **FR-015**: Taxonomy MUST include at least: Immobilier, Automobile, Agriculture, BTP, Industrie, Commerce, B2B, Opportunités.
- **FR-016**: Product copy MUST be French.
- **FR-017**: V1 MUST NOT include multi-apporteur sharing or platform commission splits.

### Key Entities

- **Owner**: the single authenticated user of this private app.
- **Offer**: a sell-side opportunity with raw capture, structured fields, money, verification, pipeline, and optional contact.
- **Demand**: a buy-side need with constraints and optional contact.
- **Contact**: a person in the owner’s CRM, possibly mirrored from the phone directory.
- **Match**: a scored pair of one offer and one demand, with explanation.
- **Hunt action**: a suggested next step derived from offers, demands, matches, and recency.

## Success Criteria *(mandatory)*

- **SC-001**: A new offer from a pasted 2-line ad can be confirmed and saved in under 10 seconds of owner interaction after paste.
- **SC-002**: A compatible offer/demand pair is visible as a match on Home without a separate “run matching” button.
- **SC-003**: Home money totals match the sum of open offers’ prices and potential commissions within rounding to the nearest FCFA.
- **SC-004**: Attaching a directory person to an offer always results in that person existing in Contacts on the next visit to that screen.
- **SC-005**: 100% of high matches (≥70) show at least one written reason the owner can understand without training.
- **SC-006**: With no network to the extraction service, the owner can still save a manual offer and a manual demand.

## Assumptions

- V1 is uniperson and private, like Perso.
- Default commission rate is 3% and is editable per offer.
- Match visibility threshold on Home is 70%; all matches remain listed on the Matches surface.
- Currency default is XOF (FCFA).
- Relance staleness is 5 days without an update on an open offer.
- Voice and photo in V1 store a pointer / short transcript field; heavy OCR of documents can improve later.
- Same Supabase project as Perso is acceptable if DealPro tables are isolated by prefix and RLS.

## Out of Scope (V2)

- Network of apporteurs and split commission sheets
- Public marketplace
- Share-sheet OS extension as a first-class capture path (paste remains V1)
- Multi-tenant teams, CRM reporting packs, paid plans
