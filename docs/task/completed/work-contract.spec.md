---
tier: standard
tier-why: contract/data/types only (engine contracts, businessTypes rows, Brief fields, vocab table) — no renderer/store/schema.prisma/publish surface; wide readership but additive definitions
---

# work-contract — spec (phase A of the work vertical)

## Problem / why
The work vertical (workEndtoEnd.md + templatePlan T9/reshape) has three build tracks —
copy engine (C), skeleton+library (D), onboarding (E) — that must all read the SAME
facts. Today those facts exist only as agreed prose. Phase A freezes them as code-level
contracts so C/D/E can build in parallel without inventing or drifting.

## Goal
One frozen, typed contract layer: work-engine section set, page vocabulary, Brief fact
slots + work-group data shape, day-one profession rows, and the user-facing vocabulary
table. Pure definitions — when A lands, a C/D/E builder can answer every "what exists /
what's it called / what shape is it" question from code, not from chat history.

## The freezes (agreed 2026-07-14, grounded in coverage-100 findings §6)

### 1. Work-core sections
**Must (every work template designs ALL of these — designer obligation, NEVER user
obligation; user can remove any section at plan screen or editor):**
opening (hero) · work gallery (renders a group REFERENCE) · proof (shaped: default
"what clients say"/testimonials; alternate shapes logos/results — shapes are variants
of ONE proof section) · packages & prices (conviction-over-data: only 3/14 corpus work
sites show prices; ruled conversion pillar, "on request" legal) · your story
(founderNote 12/14) · how to reach (leadForm 13/14) · chrome (menu + page bottom).

**Optional:** results/outcomes (7/14 — recommended-default for designers/agencies) ·
FAQ · process · numbers/stats · seen-with/featured-in · team · project-story page
(fields frozen now, treatment later).

### 2. Page vocabulary + sitemap archetypes
Closed set, 8 page types: Home · Work · Work:[group] (promoted group pages) · Prices ·
About · Contact · Project story · Blog (attachment slot ONLY — blog is its own system).
Slugs fixed in code, never AI. Archetypes = named combos: **one-pager** (Home) ·
**compact** (Home/Work/Contact) · **standard, default** (Home/Work/Prices/About/Contact).
Optionals attach to any archetype. **Single/multi decision: system PROPOSES by
deterministic rule** (work volume, #services, prices present, new/established — clamp
philosophy like existing sitemap gate; thresholds = planner's call), **user DECIDES at
plan screen** (page cards, tap add/remove), adjustable forever (group→page promotion
post-publish).

### 3. Brief fact slots + work-group shape
8 slots (workEndtoEnd step 3): identity+where+reach · what-you-sell (= groups) ·
**price per service (exact | from-X | on-request; required)** · new/established
(branch) · dream client · praise/expect (reframed by branch) · contact method ·
language(s). Slot mechanics: auto-fill confident / one-tap confirm shaky / ask unknown.
**Work-group shape (the D1↔D2 interface): two-level, second level OPTIONAL** —
`group (service) = { name, kind: category|story, price, photos[] direct AND/OR
shoots[]/projects[] each with photos[] }`. Flat is legal per group, her choice.
Groups ≙ services ≙ prices (one spine).

### 4. Profession rows + vocabulary
List-1 seed rows (engine=work): **photographer · designer · writer · agency** — each:
wording row (galleries/projects/case-studies), dream-client chips, requiredCapabilities
(photographer→gallery). More professions = new rows on demand (serve gate catches gaps).
**Buyer-words vocabulary table = single source in code** (workEndtoEnd §buyer-words,
draft pending founder reaction on 4 flagged names): plan chips, editor labels, report
sentences all read from it. Internal terms (hero/CTA/collection) never user-facing.

## Scope OUT (non-goals)
- Any implementation: no board UI, no prompts, no blocks, no wizard screens, no picker
- Blog internals (own system; only the sitemap attachment slot)
- Forms internals (own system: builder/templates/submit/integrations — the contract only
  lets the how-to-reach section REFERENCE a form; slot 7 picks the mechanism)
- Legal/privacy pages (platform-wide chrome, owned platform-side; contract only notes
  footer carries the auto link)
- Instagram/Google-reviews ingestion; non-image media (writer text, video)
- Story-seller case-study page treatment (fields only)
- Retro-fitting existing engines/templates to these contracts

## Constraints
- Contracts are PURE DATA modules (firewall convention — no store/template imports),
  pattern: `src/modules/collections/registry.ts`, `src/modules/engines/elementContracts.ts`
- Copy firewall: nothing here may reference templateId/skeletonId
- Work-core seeded from granth/lumen (scalePlan §6) — adjust at engine level only
- Coverage-100 findings §6 = the evidence base; deviations (prices) marked conviction
- Existing `works` CollectionKey (`src/modules/collections/registry.ts`) must remain
  compatible or be consciously evolved — do not fork a parallel notion of work items

## References
- `docs/tracks/workEndtoEnd.md` — agreed product vision (acceptance-criteria source)
- `docs/tracks/templatePlan.md` — T9 skeleton ruling + A–F build order
- `docs/tracks/scalePlan.md` §6/§8 — engine core-sets, fact groups, Brief contract
- `src/modules/engines/elementContracts.ts` — existing engine contract surface to extend
- `src/modules/businessTypes/config.ts` — List-1 row shape to follow
- `src/modules/collections/registry.ts` — works/case-studies collection defs (reuse)
- `docs/research/coverage-100/findings.md` §6 — section-frequency evidence

## Open exploration questions
- Where does the existing trust/thing core-set live in code, and in what shape? Mirror it.
- Current Brief type (`@/types/brief`): extend vs work-specific fact-group shape (§8)?
- How does granth/lumen express sections today — map their names → the frozen work-core
- Does the sitemap-archetype machinery (newGeneration) already carry named combos to reuse?

## Candidate human gates
- Final work-core section list sign-off before merge (it's the freeze — cheap to read, expensive to regret)
- Vocabulary table: 4 flagged names (Your promise / Your action button / Page bottom / Seen with) need founder pick

## Acceptance criteria
- [ ] Typed work-core contract exists: must/optional sections + elements per section, pure-data module
- [ ] Page vocabulary (8 types) + 3 named archetypes + deterministic-proposal rule signature defined (thresholds stubbed OK)
- [ ] Brief: 8 slots typed with slot-mechanics metadata (auto/confirm/ask) + price shape (exact|from|on-request)
- [ ] Work-group type: two-level with optional second level, kind category|story, compatible with collections registry
- [ ] 4 profession rows live in businessTypes config with wording + chips + requiredCapabilities
- [ ] Buyer-words vocab table as single-source module, keyed by internal section name
- [ ] Conformance/test: a test asserts every must-section has an element contract, vocab covers all sections, and no contract module imports store/template code
- [ ] tsc + test:run green; zero behavior change to existing engines (contracts additive)

## Pilot / smallest slice
A IS the thin slice (pure contract). Decision gate = a dry-run review: C/D/E leads
(agents) each read only the contracts and answer "can you build from this without
asking a question?" — unanswered questions go back into the contract before merge.
