# work-contract — implementation audit

## Phase 1 — work-core section freeze + work element contract

**Status: BLOCKED at verification by an out-of-scope test collision (see below).**
Both in-scope edits are complete and tsc-clean.

### Files changed
- `src/modules/engines/workSections.ts` (NEW)
- `src/modules/engines/elementContracts.ts` (EDIT — register only)

### Per-file summary

**`src/modules/engines/workSections.ts` (NEW)** — pure-data freeze of the work-core.
Exports the must/optional section tuples + key unions, the 3 proof shapes + default,
the per-section element contract (15 entries, one per must+optional section), and the
proof-shape contract map (its `testimonials` entry IS the registered `proof` schema).
Donor sections (hero/about/proof/footer) re-seeded from `writerElementSchema` (granth)
via a lineage-preserving `fromDonor()` that blanks Hindi placeholder defaults; `work`
authored fresh as a group-REFERENCE gallery onto `COLLECTIONS.works` (no forked item
shape); `workdetail.sectionType` reuses `COLLECTIONS.works.itemSectionType` verbatim.
Header comment carries the freeze rationale, coverage-100 evidence counts, granth/lumen
donor table, the D1 subset invariant, and the D5 firewall note.

**Exact export list of `workSections.ts`:**
- `workMustSections` (readonly tuple, 8)
- `workOptionalSections` (readonly tuple, 7)
- `WorkMustSectionKey`, `WorkOptionalSectionKey`, `WorkSectionKey` (types)
- `workProofShapes` (readonly tuple, 3) · `WorkProofShape` (type) · `defaultWorkProofShape`
- `workProofShapeContracts: Record<WorkProofShape, UIBlockSchemaV2>`
- `workElementContract: Readonly<Record<string, UIBlockSchemaV2>>`

**`src/modules/engines/elementContracts.ts` (EDIT — register only)** — added
`import { workElementContract } from './workSections'`; added `work: workElementContract`
to the `elementContracts` map; updated the header "NOT covered" note to record that `work`
is now contract-covered as DATA (inert on the generation path, which stays thing-gated by
`resolveEngineSectionSchema`). Did NOT touch `THING_GENERATION_LAYOUTS`,
`resolveEngineSectionSchema`, `thingElementContract`, or any thing seeding.

### Deviations from the plan
- **Donor `work←books` mapping:** the plan lists `work←books` as a donor, but D4 also
  requires `work` to be a group-REFERENCE gallery with "no forked item shape". These
  conflict for the item collection (granth's `GranthJacketShelf.items` is a book-item
  shape). Conservative resolution: authored `work` fresh as a group-reference frame
  (`groups` collection: id/name/cover_image/href) pointing into `COLLECTIONS.works`, and
  did NOT reseed the book-item collection. Hero/about/proof/footer are reseeded from their
  granth donors as specified.

### VERIFICATION BLOCKER (out-of-scope file — reported, not edited)
`npm run test:run -- src/modules/engines src/modules/templates` → **1 failed / 1222 passed /
12 skipped.** The single failure is `src/modules/engines/designKit.test.ts:41`
("labels source per section: thing=contract, trust/work=legacy-layout"):

    AssertionError: expected 'contract' to be 'legacy-layout'

Root cause: `designKit.ts` is a SECOND consumer of `elementContracts` that the phase-1
plan did not account for (its "inert / zero behavior change" reasoning covered only
`resolveEngineSectionSchema`, which does stay thing-gated). `buildDesignKit('work')` walks
`engineCoreSections.work` (`hero·work·about·footer`) and, via `resolveSectionSchema`, now
finds a populated `elementContracts.work` for each → labels them `source: 'contract'`
instead of `'legacy-layout'`. This is the INTENDED consequence of registering the work
contract (the design-kit for work now derives from the real frozen contract, not granth's
legacy layout), so the correct fix is to update the stale test expectation
(`work → 'contract'`) — but `designKit.test.ts` is NOT on this phase's Files-touched list,
so I stopped rather than edit it.

**Orchestrator decision needed:** authorize a one-line expectation update in
`src/modules/engines/designKit.test.ts` (move `work` from the `legacy-layout` group to a
`contract` assertion), OR direct an alternative (e.g. gate the `work` registration).

### tsc
`npx tsc --noEmit` — no errors in touched files. (Pre-existing, unrelated repo error:
`src/app/page.tsx(6,26): Cannot find module '@/assets/images/founder.jpg'` — asset import,
outside this phase.)

### Open risks
- `elementContracts.work` is registered but inert on the generation path; confirm no other
  `elementContracts` consumers assume `work` absent (only designKit found so far).

---

## Phase 1 — RESOLUTION (blocker cleared, orchestrator-approved)

The orchestrator amended Phase 1's Files-touched to add `src/modules/engines/designKit.test.ts`
and confirmed `designKit.ts` is a pure build-time derivation generator (`npm run kit:generate`),
NOT in the runtime generation/render/publish path — so flipping work's design-kit source to
`contract` is the intended, designed behavior of registering `elementContracts.work`.

### Files changed (this resolution)
- `src/modules/engines/designKit.test.ts` (EDIT — test expectation update + one new mirror test)

**`designKit.test.ts`** —
1. `it('labels source per section: ...')`: renamed to "thing/work=contract, trust=legacy-layout";
   moved `work` from the `legacy-layout` assertion group to the `contract` group (thing+work loop
   asserts `'contract'`; trust asserts `'legacy-layout'`). Minimal, one-test change.
2. Added `it('work sections carry every slot from the LIVE work elementContract ...')` — a clean
   parallel to the existing thing derive-from-live test: for each work core-section, the kit's
   slot keys equal `getAllElements(elementContracts.work![sectionType])`. Passes as-is.

### Final verification (worktree, next-env.d.ts now present)
- `npx tsc --noEmit` — fully clean, no output.
- `npm run test:run -- src/modules/engines src/modules/templates` —
  **Test Files 31 passed (31) · Tests 1224 passed | 12 skipped (1236) · 0 failed.**

---

## Phase 2 — page vocabulary + site archetypes + proposal rule

### Files changed
- `src/modules/engines/workPages.ts` (NEW)

### Summary (3 lines)
Pure-data freeze of the work vertical's PAGE layer, sibling to `workSections.ts`. Exports
the closed 8-page vocabulary with FIXED in-code slugs (2 parametric), the 3 named
whole-site archetypes + default, and the deterministic (zero-AI) `proposeWorkSiteStructure`
proposal rule mirroring clampSitemap's propose-then-user-decides philosophy. Firewall-clean:
`import type` only from pageArchetypes (VALUE import would drag templateMeta), value imports
limited to workSections (type-only) + collections/registry.

### Full export list of `workPages.ts`
- `workPageTypeKeys` (readonly tuple, 8) · `WorkPageTypeKey` (type)
- `WorkPageDef` (interface — `PageArchetypeDef` + `parametric?: true`)
- `workPageTypes: Record<WorkPageTypeKey, WorkPageDef>` (fixed slugs; blog = attachment slot, `allowedSections: []`)
- `WorkSiteArchetypeKey` (type) · `workSiteArchetypes: Record<WorkSiteArchetypeKey, readonly WorkPageTypeKey[]>` · `defaultWorkSiteArchetype = 'standard'`
- `WorkStructureSignals` (interface) · `WorkStructureProposal` (interface) · `proposeWorkSiteStructure(signals): WorkStructureProposal`
- Stubbed thresholds: `ONE_PAGER_MAX_ITEMS` · `STANDARD_MIN_GROUPS` · `PROMOTE_GROUP_MIN`

### Stubbed threshold consts (placeholder values, `// STUB — planner's call, tune at track-E pilot`)
- `ONE_PAGER_MAX_ITEMS = 3`
- `STANDARD_MIN_GROUPS = 3`
- `PROMOTE_GROUP_MIN = 2`

### Key modelling notes / in-scope decisions
- Page slugs fixed in code: home `/`, work `/work`, work-group `/work/[group]` (parametric),
  prices `/prices`, about `/about`, contact `/contact`, project-story `/work/[group]/[item]`
  (parametric), blog `/blog`.
- `project-story.key` reuses `COLLECTIONS.works.itemArchetypeKey` (`'work-detail'`) verbatim
  (one collections spine, never a fork) — the only value import needed at runtime.
- allowedSections/requiredSections/defaultSections are body-only WorkSectionKeys (header/footer
  chrome excluded, per pageArchetypes convention).
- Proposal rule invariants enforced in code (tested phase 5): pages ⊆ closed vocab (`work-group`
  is the only optional auto-inserted, and it IS in the vocab), `home` always first (archetype
  lists start with home by construction), archetype ∈ the 3 names, blog + project-story never
  auto-proposed. `promotedGroupCount` inserts a `work-group` page after `work` when it clears
  `PROMOTE_GROUP_MIN`.

### Deviations from the plan
- None material. The plan's proposal-rule invariant list said "blog/project-story never
  auto-proposed" but was silent on `work-group`; I treated `work-group` as an auto-attachable
  optional (it is in the closed vocab, unlike a fork) and gate its insertion behind
  `PROMOTE_GROUP_MIN`. Conservative and inside the stated invariants (pages ⊆ vocab). Logged here.

### Verification
- `npx tsc --noEmit` — fully clean, no output.
- `npm run test:run -- src/modules/engines` — Test Files 4 passed (4) · Tests 176 passed (176) · 0 failed.

### Open risks
- Thresholds are placeholders; the shape (`WorkStructureSignals` fields, one-pager/compact/
  standard tiering) is a phase-A judgement pending track-E pilot data.

---

## Phase 3 — work facts schema (Brief) + 8 slots

**Status: COMPLETE. tsc clean; scoped tests green; ad-hoc zod sanity passed then deleted.**

### Files changed
- `src/lib/schemas/workFacts.schema.ts` (NEW)
- `src/modules/engines/workSlots.ts` (NEW)

### `src/lib/schemas/workFacts.schema.ts`
Pure zod value shapes for the 8 work fact slots + accessor. Mirrors `brief.schema.ts`
(all-optional, shape-not-gate) and `getEntryFacts` (safeParse accessor). Storage documented
at `brief.facts.work`.

Exports:
- `WorkPriceSchema` — `{ mode: 'exact'|'from'|'on-request', amount?: number, currency?: string }`
  with a `.refine()`: `amount` required unless `mode === 'on-request'` (path `['amount']`).
- `WorkPhotoRefSchema` — `{ id, url?, alt?, cover? }` (reference-only; ingestion scope-OUT).
- `WorkSubItemSchema` — `{ name, photos: WorkPhotoRef[], client?, problem?, result? }`
  (second-level `items`; story fields align with phase-1 `workdetail`).
- `WorkGroupSchema` — `{ name, kind: 'category'|'story', price: WorkPrice, photos?, items? }`
  (second level optional; flat legal).
- `WorkFactsSchema` — object of 7 top-level keys (price lives on the group, not top-level):
  `identity{ name, location?, reach? }` · `groups: WorkGroup[]` · `establishment: 'new'|'established'` ·
  `dreamClient` · `praise: string[]` · `contactMethod: 'whatsapp'|'booking'|'form'` · `languages: string[]`.
  All optional.
- Types: `WorkPrice`, `WorkPhotoRef`, `WorkSubItem`, `WorkGroup`, `WorkFacts` (all `z.infer`).
- `getWorkFacts(facts: Record<string, unknown> | undefined): WorkFacts | null` — reads
  `facts.work`, safeParse, never throws.

### `src/modules/engines/workSlots.ts`
The slot table + reconciliation onto the live `workContract`. D2 header comment: the live
`workContract` in inputContracts.ts is intentionally NOT modified. `mechanics` is a default
posture; runtime resolution stays `resolveFieldState()` in wizard/waterfall.ts (referenced,
not duplicated).

Exports:
- `workSlotIds` (8) + `WorkSlotId` union.
- `WorkFactsPath = keyof WorkFacts | 'groups[].price'` (price sentinel).
- `WorkSlotDef { id; field: ContractField; mechanics: 'auto-confident'|'confirm-shaky'|'ask-unknown'; neverSilent?: true; branch?: true; factsPath: WorkFactsPath }`.
- `workSlots: readonly WorkSlotDef[]` (8 entries).
- `workSlotReconciliation: Record<WorkSlotId, { existingFieldId?: string }>`.

`field` entries typed as `ContractField` (imported type-only from `./inputContracts`), correct
group/slot/tier/requirement. Price slot `requirement: 'required'`; contactMethod carries
`neverSilent: true` (on the slot def, not the field — `ContractField` has no such key);
establishment `branch: true`.

### 8-slot → existing-field reconciliation table
| Slot id | mechanics | field group/slot/tier/req | existingFieldId (live workContract) |
|---|---|---|---|
| identity | auto-confident | WHO/identity/T1/required | `name` (+ `oneLiner` folds in; `name` = anchor) |
| groups | confirm-shaky | WHAT/understanding/T1/required | `theWork` (nearest — T3 upload gallery) |
| price | ask-unknown | WHAT/offer/T1/**required** | — NEW (adding a live price field = D2 behavior change) |
| establishment | confirm-shaky, branch | WHY-YOU/understanding/T1/optional | — NEW |
| dreamClient | confirm-shaky | WHO/understanding/T1/optional | `whatYouTakeOn` (audiences, nearest) |
| praise | confirm-shaky | WHY-BELIEVE/proof/T2/optional | `praise` (1:1) |
| contactMethod | confirm-shaky, neverSilent | ACT/goal/T1/required | — NEW (today the generic `goal` resolver) |
| languages | auto-confident | WHO/identity/T1/optional | — NEW |

### Zod refinement behavior
`WorkPriceSchema`: parse rejects `{ mode: 'exact' }` / `{ mode: 'from' }` with no `amount`;
accepts them with `amount`; accepts `{ mode: 'on-request' }` alone. Verified in the ad-hoc check.

### Deviations
- `WorkFactsSchema` has 7 top-level keys, not 8: slot 3 (price) has no top-level key — its value
  lives on each group (`WorkGroup.price`) per spec §3, while remaining a distinct ASK step in
  `workSlots.ts`. In-scope judgement, matches the plan's "price = inside each group" note.
- `neverSilent`/`branch` live on `WorkSlotDef`, not on the `ContractField` (which has no such
  fields). Matches the plan's WorkSlotDef shape.
- `field.section` set to work-core section names (work/packages/proof/contact) as documentation;
  omitted where none applies (identity/establishment/dreamClient/languages/contactMethod's is
  `contact`). No current test iterates workSlots' sections, so no `⊆ engineCoreSections` collision.

### Verification
- `npx tsc --noEmit` — clean (no output).
- `npm run test:run -- src/modules/engines src/lib/schemas` — Test Files 7 passed (7) · Tests 224 passed (224) · 0 failed.
- Ad-hoc zod sanity (throwaway `sp_check.test.ts` in src/lib/schemas, deleted after): flat group
  parses, two-level group parses, `exact` price w/o amount rejects, on-request w/o amount ok,
  `getWorkFacts` reads `facts.work` + returns null on undefined, full 8-slot facts parse —
  6 passed (6). File removed; `git status` shows only the two NEW modules untracked.

### Open risks
- Slot mechanics + group/tier assignments are phase-A judgement (no runtime consumer yet);
  track E may retune when wiring into the live contract. The committed conformance test (phase 5)
  will pin invariants; a real test file is deliberately NOT added here (phase 5 owns it).

---

## Phase 4 — profession rows + buyer-words vocabulary

### Files changed
- `src/modules/businessTypes/config.ts` (EDIT — added `designer` key + entry)
- `src/modules/brief/bridge.ts` (EDIT — one mapping line for `designer`)
- `src/modules/engines/workVocabulary.ts` (NEW — single-source buyer-words vocab)

### Per-file summary

**config.ts** — added `'designer'` to `businessTypeKeys` (between `photographer` and
`app`) and a config-only `BusinessTypeEntry` mirroring photographer:
- `copyEngine: 'work'`, `requiredCapabilities: ['gallery']` (unbacked → serve gate routes
  to demand lane, intended honest non-serve), `defaultStyle: 'editorial-craft'` (verified
  a valid `DesignStyle` — no deviation), `extractionSchemaKey: 'work'`,
  `structureDefault: 'multi'`, `likelyIntents: ['enquiry','book-call','follow-social']`
  (mirrors photographer, all valid `GoalIntent`s).
- 3 `wizardFields`: `work` ("What do you design?"), `approach` ("How would you describe
  your approach?"), `offer` ("What is the offer / next step?") — designer-worded.
- Existing writer/photographer/agency/other rows untouched.

**bridge.ts** — added `designer: 'agency'` to `BUSINESS_TYPE_TO_SERVICE_TYPE` (same as
photographer's fallback, bridge.test.ts:58). No other consumer edits needed — the Record
is `Partial`, serveMatrix/serveGate/z.enum iterate `businessTypeKeys`.

**workVocabulary.ts** (NEW, pure data, zero runtime imports — firewall D5):
- `WorkVocabEntry { userLabel; description; flagged? }` + `workVocabulary: Record<string,
  WorkVocabEntry>` keyed by INTERNAL name.
- `WorkProfession = 'photographer'|'designer'|'writer'|'agency'` + `professionWording`
  Record (workItem/workGroup/processLabel/groupFallbackLabel) — all 4 professions incl.
  agency NOW (ruling-proof per D3).
- `dreamClientChips: Record<WorkProfession, readonly string[]>` — 7 chips each profession.

### workVocabulary key list (25 keys)
MUST sections: header, hero*, work, proof, packages, about, contact, footer*
OPTIONAL sections: results, faq, process, stats, logos*, team, workdetail
Proof shapes: testimonials (logos/results reuse the section entries — documented in-file)
Non-section internals: featuredWork, ctaButton*, map, socialLinks, menu

`flagged: true` on EXACTLY 4 (the merge-gate names, marked * above):
- hero → "Your promise"
- footer → "Page bottom"
- logos → "Seen with / featured in"
- ctaButton → "Your action button"

### professionWording coverage
photographer (shoot/galleries/"How a shoot works"/Galleries), designer
(project/projects/"How a project works"/Projects), writer (piece/collections/"How working
together works"/Collections), agency (case study/case studies/"How an engagement
works"/Case studies).

### dreamClientChips coverage
photographer, designer, writer, agency — 7 seed chips each (within 5–8 range).

### Deviations
- None on values. `defaultStyle: 'editorial-craft'` and the three `likelyIntents` are all
  valid enum members (verified against `designStyles` / `goalIntents`) — no substitution
  needed.

### Verification
- `npx tsc --noEmit` — CLEAN (no output).
- `npm run test:run -- src/modules/businessTypes src/modules/brief src/modules/collections src/modules/engines`
  → 327 passed, 1 FAILED.

### Open risk / orchestrator call (out-of-scope test)
The one failure is `src/modules/businessTypes/config.test.ts:15` — a HARDCODED
`expect(keys).toHaveLength(8)` (title: "has exactly the 8 seed keys…"). The adjacent
derive-from-source assertion (`expect(keys).toEqual([...businessTypeKeys].sort())`, line
14) PASSES. `config.test.ts` is NOT in this phase's Files-touched list, so per the plan
("a test that hardcodes the businessType count… may need the orchestrator's call; report
it, don't guess-edit an out-of-scope test") it is left unedited. Fix required: bump `8→9`
on line 15 and update the test title/`toContain('designer')` — orchestrator's decision.

### Deferred to merge human gate (do NOT block)
- (a) the 4 flagged vocab names shipped as DRAFT (`flagged: true`).
- (b) agency stays `copyEngine: 'trust'` (D3) — agency present only as a wording row.

### Phase 4 follow-up — test count fix (orchestrator-approved, Files-touched amended)
`src/modules/businessTypes/config.test.ts` added to this phase's scope by the coordinator
(designer row is a spec acceptance criterion → stale hardcoded count MUST become 9):
- line ~15: `toHaveLength(8)` → `toHaveLength(9)`; test title "8 seed keys" → "9 seed keys
  … + designer"; added `expect(keys).toContain('designer')`. Minimal — no other edits.

FINAL verification (WORKDIR):
- `npx tsc --noEmit` — CLEAN.
- `npm run test:run -- src/modules/businessTypes src/modules/brief src/modules/collections src/modules/engines`
  → **328 passed / 0 failed** (12 files).

---

## Phase 5 — conformance test + README + full green

**Status: in-scope work COMPLETE + green. Whole-suite gate BLOCKED by ONE stale
out-of-scope test that is phase-4 fallout (reported to orchestrator, not edited).**

### Files changed
- `src/modules/engines/workContract.test.ts` (NEW)
- `src/modules/engines/README.md` (EDIT — added the work-vertical freeze section: 4 new
  modules + D1 subset / D2 slot-table-not-wizard / vocab single-source invariants; noted
  `workFacts.schema.ts` lives in `src/lib/schemas`)
- `src/modules/audience/product/pageArchetypes.test.ts` (EDIT — orchestrator-amended
  Files-touched; stale `MULTI_DEFAULTS` set + designer, see cross-phase fixup below)

### `workContract.test.ts` — assertion groups (30 tests, all pass)
1. **Element coverage (3):** every must+optional key ∈ `workElementContract`;
   `elementContracts.work` === `workElementContract`; every proof shape has a
   `workProofShapeContracts` entry (sectionType `'proof'`) and default (`testimonials`)
   === the registered `proof` schema.
2. **D1 subset (1):** `engineCoreSections.work ⊆ workMustSections`.
3. **Vocab coverage (4):** `workVocabulary` names every must+optional key + every proof
   shape (non-empty userLabel + description); EXACTLY `{ctaButton, footer, hero, logos}`
   carry `flagged`; `professionWording`/`dreamClientChips` cover all 4 professions; the
   work-engine businessType keys resolve to exactly `{designer, photographer, writer}` and
   each has a wording row.
4. **Pages (5):** `workPageTypes` = exactly the 8 keys; slugs are the fixed strings;
   allowed/required/default sections ⊆ WorkSectionKeys; each archetype is a page-vocab list
   with `home` first; `proposeWorkSiteStructure` deterministic, bare-minimum → one-pager
   `['home']`, rich+prices → standard, and across 5 fixtures pages ⊆ vocab / home-first /
   never blog|project-story.
5. **Facts (9):** flat group parses; two-level (items+photos) parses; `kind` union enforced;
   exact/from price w/o amount rejected, on-request w/o amount passes; `getWorkFacts` safe-
   reads `facts.work`; 8 slot ids unique; every slot field.group ∈ factGroups & field.slot ∈
   wizardSlots; price slot required + contactMethod neverSilent; every factsPath resolves
   into `WorkFactsSchema.shape` (`'groups[].price'` sentinel → `groups`).
6. **D5 firewall (5, one per module):** reads each of the 5 modules with `fs` (workSections/
   workPages/workSlots/workVocabulary via `__dirname`; workFacts.schema via
   `../../lib/schemas`), strips block+line comments (so firewall-note prose can't false-
   match), collects value-import specifiers only (skips `import type`, multiline-aware),
   asserts none match `@/stores`, `@/hooks`, `react`(/), `@/modules/templates/`, and no
   `templateId`/`skeletonId` in the comment-stripped source.
7. **Zero-behavior sentinel (3):** `resolveEngineSectionSchema('GranthArchedHero')` === null;
   `resolveEngineSectionSchema('TerminalHero')` === `thingElementContract.hero`;
   `engineContracts.work.fields` ids === today's nine (name/oneLiner/whatYouTakeOn/theWork/
   genresStyle/bioStory/achievements/praise/goal). Pins D2.

### In-scope decisions
- Comment-stripping in the firewall scan: the 5 modules' own firewall NOTES contain the
  words "templateId / skeletonId" and "@/modules/templates" in prose. Stripping comments
  before the literal scan (and checking value-imports only for specifiers) is the
  conservative reading of "no `templateId`/`skeletonId` literals" — it tests the CODE, not
  the documentation. Logged here.
- Proof-shape testimonials asserted as the SAME object reference as `workElementContract.proof`
  (`toBe`), matching phase-1's stated invariant.

### Verification (WORKDIR)
- `npx tsc --noEmit` — **CLEAN** (no output).
- `npx eslint src/modules/engines/workContract.test.ts` — exit 0, clean.
- `npm run lint` (full) — **exit 0**; only pre-existing warnings remain (`@next/next/no-img-element`
  across techpremium/vestria blocks, one `react-hooks/exhaustive-deps` in `ph-provider.tsx`) —
  NONE from the new/edited files.
- `npm run test:run` (FULL suite) — **1 failed | 2848 passed | 15 skipped (2864)**.
  - New `workContract.test.ts` alone: **30 passed / 0 failed**.

### Cross-phase blocker (NOT fixed — outside work-contract module set, reported)
The one failure is `src/modules/audience/product/pageArchetypes.test.ts:139`
("businessTypes structureDefault … manufacturer + photographer are multi"):
`expected 'multi' to be 'single'` for key `designer`.

Root cause = **phase-4 fallout**, not a phase-5 change: phase 4 (commit b98b62ce) added the
`designer` businessType row with `structureDefault: 'multi'`, but this test's hardcoded
`MULTI_DEFAULTS = new Set(['manufacturer','photographer'])` (line 134) was never updated, so
it now asserts `designer` should be `'single'`. Phase-4 verification only ran
`businessTypes/brief/collections/engines`, so `audience/product` was never re-run — the break
has been latent on the branch since phase 4. Same class as the phase-1 (designKit.test.ts) and
phase-4 (config.test.ts) stale-test escalations the orchestrator authorized by amending
Files-touched.

`pageArchetypes.test.ts` is outside Phase 5's Files-touched AND outside the work-contract
module set → per the hard rule I did NOT edit it. **One-line fix** = add `'designer'` to
`MULTI_DEFAULTS` (line 134) + update the it-title. Reported in the shared mailbox
(`work-contract.md`); awaiting orchestrator ruling to amend Files-touched or handle directly.

### Cross-phase fixup — RESOLVED (orchestrator-approved, Files-touched amended)
The orchestrator confirmed the `designer` row is correct (`structureDefault: 'multi'`, mirrors
photographer) and the hardcoded test set was stale; amended Phase 5 Files-touched to add
`src/modules/audience/product/pageArchetypes.test.ts`.

- `src/modules/audience/product/pageArchetypes.test.ts` (EDIT) — line 134
  `MULTI_DEFAULTS` set: added `'designer'` (with a one-line comment noting the mirror);
  updated the it-title to "manufacturer + photographer + designer are multi". Minimal — no
  other edits.

### FINAL verification (WORKDIR, after the fixup)
- `npx tsc --noEmit` — **CLEAN** (exit 0, no output).
- `npm run test:run` (FULL suite) — **2849 passed | 15 skipped | 0 failed (2864)**, 166 files.
- `npm run lint` (full) — **exit 0**; only pre-existing `react-hooks/exhaustive-deps` +
  `@next/next/no-img-element` warnings remain, none from touched files.

### Open risks
- None. Full suite green; no product-code defect. Whole-diff gate passes.
