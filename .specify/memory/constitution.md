<!--
Sync Impact Report
- Version change: (none) → 1.0.0
- Modified principles: initial ratification (DealPro, not Perso)
- Added sections: Core Principles (I–X), Product Constraints, Development Workflow, Governance
- Removed sections: none
- Deferred TODOs: none
-->

# DealPro Constitution

## Core Principles

### I. Capture Must Stay Under Ten Seconds
An opportunity MUST be savable from a pasted link, pasted ad text, a
voice note, or a photo in under 10 seconds of owner effort. Structured
fields MAY be completed later. If capture requires a long form before
the first save, the flow is non-compliant and MUST be redesigned.

**Rationale**: An apporteur works in WhatsApp, in the street, and in
offices. Friction kills inventory.

### II. The Original Trace Is Sacred
Raw capture (pasted text, link, voice transcript, photo pointer,
timestamp, GPS) MUST be stored as a fact. AI extraction, categories,
match scores, and reliability scores MUST be stored separately and MUST
never overwrite the original. Deleting an interpretation MUST leave the
raw capture intact.

**Rationale**: A bad parse must never erase the ad you actually saw.

### III. Match Before Browse
The product is a hunting and matching machine, not a classifieds list.
Every offer and every demand MUST be matchable. The home surface MUST
lead with money (potential commissions), hot matches, and the next
actions that make money today. A scrollable dump of ads without scores
is non-compliant as the primary screen.

**Rationale**: Inventory without a buyer is noise. Buyers without
inventory are noise. The join is the product.

### IV. Money Is A First-Class Field
Every offer MUST carry a price, a commission rate (or amount), and a
computed potential commission. The dashboard MUST show open pipeline
value, potential commissions, closed deals, and collected commissions.
Guessed money MUST be visually distinct from confirmed money.

**Rationale**: The owner hunts commissions, not listings.

### V. Reliability Is Explicit
Every offer MUST have a verification state (unverified, phone
confirmed, verified, exclusive) and a reliability score derived from
checkable facts (contact, availability, mandate, recency). The product
MUST NEVER present an unverified ad as a sure deal.

**Rationale**: Time wasted on fake ads is the real cost.

### VI. Contacts Are The CRM, Not A Sidecar
A person from the phone directory MUST be linkable to an offer, to a
demand, and to the in-app Contacts screen. If a directory contact is
attached and does not yet exist in Contacts, the app MUST create that
contact. An offer or demand without a reachable human is incomplete.

**Rationale**: Deals close with people, not with cards.

### VII. One-Person Privacy First
V1 is a sovereign private tool for a single owner. Multi-apporteur
sharing, public marketplace, social graphs, and platform-split
commissions are out of constitution until an amendment explicitly
allows them. Owner data MUST NOT leak into logs, crash reports, or
model prompts without redaction rules in the plan.

**Rationale**: A deal book is a high-value, high-trust object.

### VIII. Nucleus First
Implementation MUST follow published phases. V1 is the uniperson hunt
OS: capture, offers, demands, contacts, matching, commissions,
follow-ups, and “find me money”. V2 is the apporteur network and
split commissions. A later-phase capability MUST NOT block or inflate
V1.

**Rationale**: Building the network first produces an empty cathedral.

### IX. Honest Intelligence
AI MAY extract, classify, score, and rank. It MUST cite the fields it
used. It MUST NOT invent a phone number, a price, or a match that
cannot be explained. When extraction fails, the owner keeps the raw
text and fills by hand.

**Rationale**: A lying assistant destroys trust faster than no
assistant.

### X. Spec Before Code
Work on DealPro MUST follow Spec-Driven Development: constitution →
specify → clarify (if needed) → plan → tasks → analyze → implement →
converge. If code and spec diverge, the spec is updated first or the
code is brought back into spec.

**Rationale**: This product is a long-lived commercial OS; drift is
expensive.

## Product Constraints

- **Audience**: a single owner (V1). Network of apporteurs is V2.
- **Primary client**: mobile. Capture is defined by the phone, not by
  a future web console.
- **Declared stack**: Expo, Tamagui, Supabase. Gemini for extraction
  and ranking. Additional tools MAY be added in a plan only if they
  serve a specified user need.
- **UI lineage**: Perso for sidebar, type, buttons, and in-tab cards.
  Zo for tab bar, balloon/gradient language, and home KPI flow.
- **Language**: product copy is French-first.
- **Currency**: FCFA is the default; captured currency MUST be
  preserved.
- **Taxonomy**: not limited to real estate. Categories are a universal
  commercial taxonomy (immobilier, auto, agriculture, BTP, industrie,
  commerce, B2B, opportunités).
- **Device access**: contacts, camera, microphone, location, and
  notifications are in V1 as thin slices, matching Perso.
- **Secrets**: API keys MUST live in env files, never in `flow.md`
  or committed source.

## Development Workflow

1. Change product behavior only through an active feature spec under
   `specs/`.
2. Keep `flow.md` as the source vision document. Specs treat it; they
   do not replace it silently.
3. Prefer one independently testable user story per increment.
4. UI work MUST be verified on a real mobile flow (open, capture,
   match, retrieve), not only a static screen.
5. Do not add a settings jungle. Prefer one capture path, one match
   path, one hunt path.
6. Tests MUST cover offer integrity (price, commission, contact),
   demand constraints, match scoring, and contact upsert from the
   directory.

## Governance

This constitution supersedes informal notes, chat decisions, and
motivational feature lists when they conflict.

- **Amendments**: change this file, bump the version (MAJOR for
  principle removal/redefinition, MINOR for new principle/section,
  PATCH for wording), update Last Amended, and record a Sync Impact
  Report comment.
- **Compliance**: plans, specs, and PRs MUST state how they honor
  Capture, Original Trace, Match Before Browse, Money, Reliability,
  Contacts, Privacy, Nucleus First, and Honest Intelligence.
- **Exceptions**: a later-phase feature MAY be prototyped only as a
  clearly labeled spike that does not merge into the V1 data model as
  a silent requirement.
- **Guidance**: executable requirements live in `specs/`; this file
  states non-negotiable rules only.

**Version**: 1.0.0 | **Ratified**: 2026-08-25 | **Last Amended**: 2026-08-25
