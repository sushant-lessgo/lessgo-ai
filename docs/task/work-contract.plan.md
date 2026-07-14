# work-contract — implementation plan

**WORKDIR:** `C:\Users\susha\lessgo-ai\.claude\worktrees\work-contract` (all paths below relative to this)
**Branch:** `feature/work-contract`
**Spec:** `docs/task/work-contract.spec.md` · Tier: standard (one impl-review over whole diff at end)

## Overview

Phase A of the work vertical: freeze the agreed work-vertical facts as a typed, pure-data
CONTRACT layer so tracks C (copy engine), D (skeleton+library), E (onboarding) can build in
parallel without drift. Four freezes: (1) work-core section set + per-section element
contracts, (2) closed 8-page vocabulary + 3 named site archetypes + deterministic proposal
rule, (3) Brief 8 fact slots + two-level work-group shape (incl. required price), (4) 4
profession rows + single-source buyer-words vocabulary. No UI, no prompts, no renderers,
no wizard wiring — additive data modules + tests only; zero behavior change to existing
engines.

## Progress log

- phase 1 work-core section freeze + element contract: done (review skipped — standard tier; designKit.test.ts added to scope by orchestrator for the intended contract-source flip; tsc clean, 1224 pass/0 fail)
- phase 2 page vocabulary + site archetypes + proposal rule: done (review skipped — standard tier; tsc clean, 176 pass/0 fail; work-group auto-attachable behind PROMOTE_GROUP_MIN)
- phase 3 work facts schema + 8 slots: pending
- phase 4 profession rows + buyer-words vocabulary: pending
- phase 5 conformance test + README + full green: pending

## Design decisions (read before implementing any phase)

These resolve the tensions between the spec and the live code. They are load-bearing;
deviating from them needs an orchestrator ping.

**D1 — do NOT grow `engineCoreSections.work`.** `src/modules/engines/coreSections.ts`
is the conformance-tested template-shipping gate: `conformance.test.ts:321` asserts granth
resolves every `work` core section, and `templateMeta.test.ts:87` pins the 4-item list.
Growing it would un-ship granth (it has no header/proof/packages/contact blocks) — a
behavior change the spec forbids, and "retro-fitting existing templates" is scope-OUT.
Instead the FULL frozen work-core (must + optional) lives in a new module
(`workSections.ts`); `engineCoreSections.work` stays as-is, documented as the
conformance SUBSET (`engineCoreSections.work ⊆ workMustSections`, asserted in the phase-5
test). Templates converge on the full set in track D; the freeze is authoritative NOW.

**D2 — do NOT mutate the live `workContract` in `inputContracts.ts`.** The work wizard is
live (granth/atelier flows). Adding required fields (price!) to `workContract.fields`
changes what real users get asked — behavior change. The 8-slot freeze lands in a new
module (`workSlots.ts`) whose entries are typed as the EXISTING `ContractField` shape
(imported from `inputContracts.ts` — pure data, firewall-safe), plus an explicit
reconciliation map to today's `workContract` field ids. Track E merges them into the live
contract; phase A only freezes shape + mechanics.

**D3 — agency stays `copyEngine: 'trust'` for now.** Spec §4 lists agency as a work
profession, but re-engining the live `agency` row re-routes real agency leads through an
engine with no shipped work templates for it — not additive. Plan: agency keeps trust;
the profession-WORDING table (phase 4) carries all 4 professions including agency, so the
founder ruling later is a one-field flip. Flagged in the phase-4 human gate + open
questions.

**D4 — internal section names (the freeze, pending phase-1 human gate):**

| Spec name | Internal key | Notes / donor mapping |
|---|---|---|
| chrome: menu | `header` | granth has none (single-page); lumen `header` |
| opening | `hero` | granth/lumen `hero` |
| work gallery | `work` | already the generic showcase key (granth alias → books; lumen `portfolio`); renders a group REFERENCE (`works` collection) |
| proof (shaped) | `proof` | NEW shaped section — ONE section, shapes `testimonials` (default) · `logos` · `results`; donors: granth `praise`, lumen `logos` |
| packages & prices | `packages` | matches trust-core key; lumen `services` maps here + `services` optional |
| your story | `about` | granth/lumen `about` |
| how to reach | `contact` | lumen `contact`; vestria precedent (lead-form CTA) |
| chrome: page bottom | `footer` | granth/lumen `footer` |

Optional set: `results` · `faq` · `process` (lumen donor) · `stats` · `logos`
(standalone seen-with — deliberately ALSO a proof shape; documented) · `team` ·
`workdetail` (project-story page fields — reuses `COLLECTIONS.works.itemSectionType`
verbatim, one spine with the collections registry; treatment later).

**D5 — firewall rule for every new module:** pure data; imports allowed from other
pure-data contract modules (`@/types/brief`, `inputContracts`, `coreSections`,
`layoutElementSchema` types, `collections/registry`, `writer/elementSchema`) and zod;
NEVER from `@/stores`, `@/hooks`, React, or `@/modules/templates/*` (runtime).
`import type` is permitted (erased). No `templateId`/`skeletonId` literals anywhere.
Phase 5 tests this by source scan (strip `import type` lines, then assert no forbidden
specifiers).

**Risky surfaces:** none — every phase is additive data + tests. The only deliberate
behavior delta is phase 4's `designer` row (classifier can now resolve designers → serve
gate routes them like photographer: gallery cap → manual-onboard demand lane). That is
the intended config-only pattern (scale-08 phase 3 precedent), called out at the gate.

---

## Phase 1 — work-core section freeze + work element contract

**Human gate:** final work-core must/optional section list (D4 table) needs user sign-off
before merge — it's THE freeze. Present the list (must 8, optional 7, proof shapes 3)
when this phase lands; later phases may proceed, but the merge is blocked on this ruling.

**Goal:** typed must/optional work-core section sets + per-section element contracts
(`UIBlockSchemaV2`, must-vs-optional expressed per-element via
`ElementDef.requirement`), registered as the missing `work` entry in `elementContracts`.

**Files touched:**
- `src/modules/engines/workSections.ts` (NEW)
- `src/modules/engines/elementContracts.ts` (EDIT — register only)

**Steps:**
1. `workSections.ts` — exports:
   - `workMustSections` / `workOptionalSections` (readonly tuples of the D4 keys) +
     `WorkSectionKey` union; header comment = the freeze rationale, evidence counts
     (coverage-100 §6: founderNote 12/14, leadForm 13/14, prices 3/14 = conviction
     override, results 7/14 recommended-default for designers/agencies), and the
     granth/lumen donor mapping table.
   - `workProofShapes = ['testimonials','logos','results'] as const` +
     `defaultWorkProofShape = 'testimonials'` — shapes are variants of ONE `proof`
     section, never separate must-sections.
   - `workElementContract: Readonly<Record<string, UIBlockSchemaV2>>` — one entry per
     must + optional section. Seed from `writerElementSchema`
     (`src/modules/audience/writer/elementSchema.ts`) where a donor exists (hero, about,
     work←books, proof←praise, footer); author fresh, minimal element sets for the rest
     (header, packages, contact, results, faq, process, stats, logos, team). Per-element
     `requirement: 'required'|'optional'` encodes must-vs-optional WITHIN a section.
     `packages` elements must carry the price display slots (name/price-line per package;
     "on request" legal). `contact` = lead-mechanism reference (the section REFERENCES a
     form — forms internals scope-OUT). `work` = group-reference gallery (items come from
     the `works` collection; no forked item shape). `workdetail` (project-story) freezes
     the story-seller fields: client, problem/brief, result, photos — fields only,
     treatment later.
   - `workProofShapeContracts: Record<WorkProofShape, UIBlockSchemaV2>` — the
     `testimonials` entry IS the registered `proof` schema; logos/results shapes are
     alternates.
   - Documented invariant note: `engineCoreSections.work` is the conformance SUBSET
     (D1); do not merge the two.
2. `elementContracts.ts` — import `workElementContract`, add `work: workElementContract`
   to the `elementContracts` map. Do NOT touch `THING_GENERATION_LAYOUTS`,
   `resolveEngineSectionSchema`, or the thing seeding — the resolver is gated by the
   thing layout set, so the `work` entry is inert at runtime (zero behavior change).
   Update the header "NOT covered" note (work is now contract-covered as DATA; the
   generation path still resolves via layouts until track C).

**Verification:** `npx tsc --noEmit` green; `npm run test:run -- src/modules/engines src/modules/templates` green (proves conformance/templateMeta/structureConvergence untouched).

---

## Phase 2 — page vocabulary + site archetypes + proposal rule

**Goal:** closed 8-page-type vocabulary with fixed slugs, 3 named whole-site archetypes,
and the deterministic single-vs-multi proposal-rule signature (thresholds stubbed).

**Files touched:**
- `src/modules/engines/workPages.ts` (NEW)

**Steps:**
1. `workPageTypeKeys = ['home','work','work-group','prices','about','contact','project-story','blog'] as const`
   + `WorkPageTypeKey` union.
2. `WorkPageDef` = `PageArchetypeDef` (import **type-only** from
   `@/modules/audience/product/pageArchetypes` — value import would drag templateMeta;
   type import is erased and firewall-clean) extended with `{ parametric?: true }`.
   `workPageTypes: Record<WorkPageTypeKey, WorkPageDef>`:
   - Fixed `pathSlug` in code, never AI: home `/`, work `/work`, work-group
     `/work/[group]` (`parametric: true` — promoted group pages; slugs derive from the
     user's group names via existing slugging, never AI), prices `/prices`, about
     `/about`, contact `/contact`, project-story `/work/[group]/[item]` (`parametric`,
     archetype keys reuse `COLLECTIONS.works` — `work-detail`/`work-catalog`), blog
     `/blog` (ATTACHMENT SLOT ONLY — carries `allowedSections: []` + a comment that blog
     is its own system; the vocab only reserves the slot).
   - `allowedSections`/`requiredSections`/`defaultSections` drawn from phase-1
     `WorkSectionKey`s (body-only; header/footer chrome excluded, matching the
     pageArchetypes convention).
3. `workSiteArchetypes: Record<'one-pager'|'compact'|'standard', readonly WorkPageTypeKey[]>`
   = one-pager `['home']` · compact `['home','work','contact']` · standard (default)
   `['home','work','prices','about','contact']`; `defaultWorkSiteArchetype = 'standard'`.
   Optionals (work-group promotions, project-story, blog) attach to any archetype.
4. Proposal rule (clamp philosophy, mirrors `clampSitemap` in
   `strategy/parseStrategyProduct.ts` — system PROPOSES, user DECIDES at plan screen):
   ```ts
   interface WorkStructureSignals { workItemCount: number; groupCount: number; pricesPresent: boolean; established: boolean; }
   interface WorkStructureProposal { archetype: WorkSiteArchetypeKey; pages: WorkPageTypeKey[]; promotedGroupCount: number; }
   function proposeWorkSiteStructure(signals: WorkStructureSignals): WorkStructureProposal
   ```
   Deterministic, zero AI. Thresholds = exported named consts explicitly marked
   `// STUB — planner's call, tune at track-E pilot` (e.g. `ONE_PAGER_MAX_ITEMS`,
   `STANDARD_MIN_GROUPS`). Output invariants (enforced in code, tested phase 5): pages ⊆
   closed vocab, `home` always first, archetype ∈ the 3 names, blog/project-story never
   auto-proposed.

**Verification:** `npx tsc --noEmit` green; module imports clean under vitest (covered fully in phase 5).

---

## Phase 3 — work facts schema (Brief) + 8 slots

**Goal:** the D1↔D2 interface: zod value shapes for the 8 fact slots incl. the required
price shape and the two-level work-group, plus the slot table with mechanics metadata —
without touching the live wizard contract (D2).

**Files touched:**
- `src/lib/schemas/workFacts.schema.ts` (NEW)
- `src/modules/engines/workSlots.ts` (NEW)

**Steps:**
1. `workFacts.schema.ts` (zod, mirrors `brief.schema.ts` idiom; pure — zod only):
   - `WorkPriceSchema`: `{ mode: 'exact'|'from'|'on-request', amount?: number, currency?: string }`
     + refinement: `amount` required unless `mode === 'on-request'` ("on request" is a
     legal answer; price itself is REQUIRED per group).
   - `WorkPhotoRefSchema`: `{ id, url?, alt?, cover? }` (reference shape only — ingestion
     pipeline is scope-OUT).
   - `WorkSubItemSchema` (internal name `items` = shoots/projects — profession wording
     layer renames, phase 4): `{ name, photos: WorkPhotoRef[], client?, problem?, result? }`
     (story fields optional; align with phase-1 `workdetail` fields).
   - `WorkGroupSchema`: `{ name, kind: 'category'|'story', price: WorkPrice, photos?: WorkPhotoRef[], items?: WorkSubItem[] }`
     — second level OPTIONAL; flat (photos only) is legal per group. Comment: groups ≙
     services ≙ prices, one spine; a group projects onto the `works` CollectionKey
     (`COLLECTIONS.works` reused verbatim, never forked).
   - `WorkFactsSchema` — the 8 slots as one object:
     1 `identity: { name, location?, reach? }` · 2 `groups: WorkGroup[]` · 3 price =
     inside each group (slot exists as a distinct ASK step; value lives on the group) ·
     4 `establishment: 'new'|'established'` (BRANCH) · 5 `dreamClient` · 6 `praise`
     (verbatim strings; for `new` sellers semantically "what to expect" — reframe is
     wording-layer) · 7 `contactMethod: 'whatsapp'|'booking'|'form'` · 8
     `languages: string[]`. All optional at the zod level except shape validity
     (requiredness is slot-mechanics, not parse failure — matches Brief's all-optional
     philosophy). Storage note: lives at `brief.facts.work`; export
     `getWorkFacts(facts: Record<string, unknown> | undefined): WorkFacts | null`
     (safeParse accessor, mirrors `EntryFacts` usage).
2. `workSlots.ts` — the slot table, REUSING existing shapes (no reinvention):
   - `workSlotIds` (8 ids) + `WorkSlotDef = { id; field: ContractField; mechanics: 'auto-confident'|'confirm-shaky'|'ask-unknown' (default resolution posture — the runtime resolver stays `resolveFieldState()` in src/modules/wizard/waterfall.ts, referenced not duplicated); neverSilent?: true; branch?: true; factsPath: string (key into WorkFacts) }`.
   - `field` entries typed as `ContractField` (import from `./inputContracts`): correct
     `group` (5 fact groups all covered), `slot`, `tier`, `requirement` — price slot
     `requirement: 'required'`, contactMethod `neverSilent: true` (one-tap confirm from
     region+profession default, never guessed), establishment `branch: true`, languages
     auto-from-location + confirm-when-ambiguous.
   - `workSlotReconciliation: Record<WorkSlotId, { existingFieldId?: string }>` mapping
     onto today's `workContract` ids (name/oneLiner→identity, theWork→groups,
     praise→praise, whatYouTakeOn→dreamClient(nearest), …; price/establishment/
     contactMethod/languages = `undefined` → NEW, wired by track E). Header comment
     states D2 explicitly: the live `workContract` is intentionally NOT modified here.

**Verification:** `npx tsc --noEmit` green; quick zod fixture check deferred to phase-5 test (flat group parses; two-level parses; `exact` without amount rejects).

---

## Phase 4 — profession rows + buyer-words vocabulary

**Human gate (two rulings before merge):**
(a) the 4 flagged vocab names need the founder's pick — **Your promise** (hero) ·
**Your action button** (CTA) · **Page bottom** (footer) · **Seen with / featured in**
(logos); ship the draft names marked `flagged`, gate confirms/renames.
(b) agency-engine ruling (D3): agency stays trust in this plan — confirm, or direct a flip/new row.

**Goal:** 4 day-one profession rows with wording + chips + requiredCapabilities, and the
single-source buyer-words table keyed by internal section name.

**Files touched:**
- `src/modules/businessTypes/config.ts` (EDIT — add `designer`)
- `src/modules/brief/bridge.ts` (EDIT — one mapping line)
- `src/modules/engines/workVocabulary.ts` (NEW)

**Steps:**
1. `config.ts` — add `'designer'` to `businessTypeKeys` + entry (mirror photographer's
   config-only pattern): `copyEngine: 'work'`, `requiredCapabilities: ['gallery']`
   (visual portfolio; serve gate routes to demand lane exactly like photographer until a
   gallery-capable template ships — honest non-serve, intended), `defaultStyle:
   'editorial-craft'`, `extractionSchemaKey: 'work'`, `structureDefault: 'multi'`,
   `likelyIntents: ['enquiry','book-call','follow-social']`, 2–3 `wizardFields` with
   designer-worded labels/examples. Existing rows (writer/photographer/agency) untouched.
2. `bridge.ts` — add `designer` to `BUSINESS_TYPE_TO_SERVICE_TYPE` (Partial record; map
   → `'agency'`, same as photographer per `bridge.test.ts:58`). No other consumer needs
   edits: serveMatrix/playback/z.enum routes iterate `businessTypeKeys`;
   `businessTypes` Record exhaustiveness is satisfied by the new entry; tests that pin
   counts derive them from `businessTypeKeys` (verify in this phase's test run).
3. `workVocabulary.ts` — single source, from workEndtoEnd.md §buyer-words (verbatim
   draft):
   - `WorkVocabEntry = { userLabel: string; description: string; flagged?: true }` and
     `workVocabulary: Record<string, WorkVocabEntry>` keyed by INTERNAL name — one entry
     per phase-1 `WorkSectionKey` (must + optional, incl. proof shapes `testimonials`/
     `logos`/`results` and `workdetail`) PLUS the non-section internals the table names:
     `featuredWork`, `ctaButton`, `map`, `socialLinks`, `menu`. `flagged: true` on the 4
     gate-(a) names. Rules from the doc in the header (second person; visitor-benefit
     names; internal terms never user-facing; groups wear the user's names; one rename =
     one edit here).
   - `WorkProfession = 'photographer'|'designer'|'writer'|'agency'` +
     `professionWording: Record<WorkProfession, { workItem; workGroup; processLabel; groupFallbackLabel }>`
     (shoot/project/piece/case study · galleries/projects/collections/case studies ·
     "how a shoot works" etc.) — includes `agency` NOW regardless of D3 so the wording
     layer is ruling-proof.
   - `dreamClientChips: Record<WorkProfession, readonly string[]>` (5–8 per profession,
     pre-narrowed seed chips; same chips idiom as `ContractField.chips`).
   - Firewall note: keyed by profession/businessType KEY strings, no import of
     `businessTypes` (avoids config↔vocab coupling; phase-5 test asserts key alignment
     instead).

**Verification:** `npx tsc --noEmit` green; `npm run test:run -- src/modules/businessTypes src/modules/brief src/modules/collections` green (designer row passes shape/serve-matrix/classify invariants).

---

## Phase 5 — conformance test + README + full green

**Goal:** the acceptance-criterion test that makes the contract self-verifying, plus doc
touch-up; whole-suite green.

**Files touched:**
- `src/modules/engines/workContract.test.ts` (NEW)
- `src/modules/engines/README.md` (EDIT)

**Steps:**
1. `workContract.test.ts` — asserts:
   - **Element coverage:** every `workMustSections` key (and every optional key) has an
     entry in `workElementContract`; `elementContracts.work` is registered and === it;
     every proof shape has a contract.
   - **Subset invariant (D1):** `engineCoreSections.work ⊆ workMustSections`.
   - **Vocab coverage:** `workVocabulary` has an entry (userLabel + description) for
     every must + optional section key and every proof shape; exactly the 4 agreed names
     carry `flagged`; `professionWording`/`dreamClientChips` cover all 4 professions and
     the work-engine businessType keys (`writer`,`photographer`,`designer`) each have a
     wording row.
   - **Pages:** `workPageTypes` covers exactly the 8 keys; slugs are the fixed strings;
     all `allowedSections`/`requiredSections`/`defaultSections` ⊆ `WorkSectionKey`s;
     each archetype's pages ⊆ vocab with `home` first; `proposeWorkSiteStructure` is
     deterministic + clamped at boundary signals (tiny fixtures: bare-minimum → one-pager,
     rich+prices → standard; blog/project-story never proposed).
   - **Facts:** zod fixtures — flat group parses; two-level (items with photos) parses;
     `kind` union enforced; `exact`/`from` price without amount rejects, `on-request`
     without amount passes; 8 slot ids unique, every slot's `field` validates against
     `factGroups`/`wizardSlots`, price slot required, contactMethod `neverSilent`,
     `factsPath`s resolve into `WorkFactsSchema.shape`.
   - **Firewall:** read the source of the 5 new/edited contract modules
     (`workSections.ts`, `workPages.ts`, `workSlots.ts`, `workVocabulary.ts`,
     `workFacts.schema.ts`) with `fs`; strip `import type` lines; assert no specifier
     matching `@/stores`, `@/hooks`, `react`, `@/modules/templates/`, and no
     `templateId`/`skeletonId` literals.
   - **Zero-behavior sentinel:** `resolveEngineSectionSchema` still returns `null` for a
     granth layout name and unchanged schemas for a thing layout;
     `engineContracts.work.fields` ids unchanged from today's nine (pins D2).
2. `README.md` (engines dir) — add the four new modules + one-line invariants (D1 subset
   rule, D2 slot-table-not-wizard, vocab single-source).

**Verification:** `npx tsc --noEmit` + `npm run test:run` (FULL suite) + `npm run lint` — all green. This is the whole-diff gate before the single impl-review.

---

## Acceptance-criteria map

| Spec criterion | Phase |
|---|---|
| Typed work-core must/optional + elements per section, pure data | 1 |
| 8 page types + 3 archetypes + deterministic proposal signature | 2 |
| 8 slots typed w/ mechanics + price shape | 3 |
| Work-group two-level, kind category\|story, collections-compatible | 3 (+1 `workdetail`) |
| 4 profession rows w/ wording + chips + requiredCapabilities | 4 (agency = wording row + D3 ruling) |
| Buyer-words single-source keyed by internal section name | 4 |
| Conformance test (coverage + vocab + firewall) | 5 |
| tsc + test:run green, zero behavior change | every phase; full gate 5 |

## Open questions for the orchestrator/user

1. **Agency engine:** keep `agency` = trust (plan default, D3), flip to work, or add a
   separate work-engine row (e.g. `creative-studio`)? Blocks nothing until phase-4 gate.
2. **4 flagged vocab names:** confirm/rename Your promise · Your action button · Page
   bottom · Seen with (phase-4 gate).
3. **Work-core list sign-off:** must = header·hero·work·proof·packages·about·contact·footer,
   optional = results·faq·process·stats·logos·team·workdetail — OK? (phase-1 gate).
4. `designer` requiredCapabilities: `['gallery']` (routes designers to demand lane like
   photographer) vs `[]` (serveable today, weaker portfolio guarantee)?
5. Standalone `logos` optional section AND `logos` proof shape both exist — accept the
   deliberate duplication or fold seen-with into proof-only?
6. Slot-3 price: modeled per-group inside `groups` (one spine) with a distinct slot
   entry — OK, or want a separate top-level `prices` fact too?
