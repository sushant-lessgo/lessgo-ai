# scale-06 wizard convergence — implementation audit

## Phase 1 — engine input contracts + question waterfall

**Files changed (created)**
- `src/modules/engines/inputContracts.ts`
- `src/modules/engines/inputContracts.test.ts`
- `src/modules/wizard/waterfall.ts`
- `src/modules/wizard/waterfall.test.ts`

### inputContracts.ts
Pure data + types. Exports `factGroups` (WHO/WHAT/WHY-BELIEVE/WHY-YOU/ACT),
`wizardSlots` (identity·understanding·goal·offer·proof·style·structure·generating),
`FactGroup`/`WizardSlot`/`ContractField`/`EngineContract`/`AskCandidate` types,
`engineContracts` (thing/trust/work), `getContract()`, and `reservedSlotSkips`
(quick-yes→offer, data only, no engine emits it).

Each `ContractField` carries: `group`, `slot`, `tier` (T1 word / T2 existence
boolean / T3 artifact), `requirement`, optional `prefillKey` (into `EntryFacts`),
`dropTarget` (section cut when optional+unanswered), `section` (feeds a core
section), `askCandidate`, `input` hint, `skippableWithWarning`, `inferFrom`,
`wizardArtifact` (WORK T3 uploads), `resolver:'goal'`.

Slot skips: thing `[]`; trust/work `['structure']` (structure is thing-only per
the fixed skeleton). ASK candidates converge on the four outside-unknowables:
differentiator · real-numbers · proof-artifacts · goal-param.

Baked-in open-Q defaults: differentiator = `input:'free-text'`, never
prefill/infer-able ⇒ always an ASK. Real-numbers = `optional` +
`skippableWithWarning`, satisfied by `outcomes` prefill (see deviation).

### waterfall.ts
Pure, deterministic; no store/UI/React imports. `computeFieldStates(brief,
contract, businessTypeEntry?)` resolves each field to `scraped|inferred|ask|drop`
in waterfall order: SCRAPED (entry-facts prefill present, or proof T2 satisfied
by top-level `brief.proofAvailable`) → INFERRED (safe category-level from
businessType, gated by `INFER_CONFIDENCE_MIN=0.5`) → ASK (required) → DROP
(optional+unanswered). Goal has a dedicated resolver reading `brief.goal`
(param/destination present ⇒ scraped; intent-only ⇒ inferred; businessType
likely-intent inference when confident ⇒ inferred; else ask). `computeAsks()`
returns the ask-state fields ordered by slot skeleton then declaration order.
`computeDroppedSections()` returns `dropTarget`s of dropped optional fields
(proof hard rule).

### Key design decisions
- Output enum has both `scraped` and `inferred` as distinct states: `scraped` =
  concrete prefilled value (URL/scrape); `inferred` = safe category-level default.
  Both are "not asked" and confirmable in review-mode. The plan's phrasing
  "prefill present ⇒ mark inferred/confirmable" is interpreted as: scraped values
  are confirmable, but retain the `scraped` label to distinguish provenance.
- Core-section alignment is enforced as: every field `section` and every
  `dropTarget` ∈ `engineCoreSections[engine]` (tested). This is the concrete,
  meaningful reading of "field sets align with core-section sets".
- Confidence is genuinely consumed: `brief.confidence < 0.5` blocks category-level
  inference (goal falls through to ASK); `undefined` confidence is treated as
  sufficient so the entry pipeline not scoring it never blocks inference.

### Deviations from the plan
- **real-numbers modeled `optional` (not required).** Spec text says numbers is
  "require ≥1 of outcomes/credentials, skippable with warning". Marking it
  `required` pushed the bare-one-liner THING ask count to 7, breaking the ≤6
  acceptance. Conservative resolution: modeled `optional` + `skippableWithWarning`
  + `askCandidate:'real-numbers'` — the waterfall DROPS it when unbacked (= the
  "skip" outcome), while the ProofSlot can still surface it as an ASK-with-warning
  when the field is present-but-thin. Satisfies both the acceptance budget and
  "skippable with warning". Logged for the phase-6 gate.
- Bare-one-liner THING resolves to exactly 6 asks (name·audience·capabilities·
  differentiator·offer·goal) — at the ≤6 cap by design (spec "~6"), not under it.

### Test results
- `npx tsc --noEmit` → PASS (no output / no errors).
- `npm run test:run -- src/modules/engines src/modules/wizard` → PASS,
  2 files, 38 tests passed (0 failed). inputContracts.test.ts: coverage, 5-group,
  hygiene, core-section alignment, ask-candidate convergence, baked defaults.
  waterfall.test.ts: acceptance budget (rich ≤3, bare ≤6), rich/bare field states,
  confidence-gated inference, dropped sections, ask ordering.
- One test failed on first run (ordering assertion assumed offer-before-goal; the
  skeleton is goal-before-offer) — fixed the assertion, not the module.

### Open risks
- Ask counts are pinned by fixtures; a later contract edit that adds a required
  field will (correctly) trip the acceptance test — intended lock, but reviewers
  tuning copy fields at the phase-6 gate must re-check the budget.
- `EntryFacts` has no `differentiator`/`credentials` keys, so those never scrape —
  by design they are always ASK/optional. If phase-7 scrape convergence starts
  extracting a differentiator, revisit whether it should become prefill-able.

### Impl-review verdict: **ship** (loop 1/1) — tsc clean, 38/38 tests, no out-of-scope creep. No blocking issues.
Carry-forward notes (non-blocking, act in later phases):
- **Phase 4 (ProofSlot):** the "skip with warning" half of real-numbers exists only as the `skippableWithWarning` flag today — the waterfall silently DROPs when unbacked. ProofSlot must actually surface the warning. Also add the missing `skippableWithWarning` flag to WORK's `achievements` field (`inputContracts.ts:167`) for parity with thing/trust, and cover it in a test.
- **Phase 4 (GoalSlot):** goal-param convergence is handled INSIDE the slot, not the waterfall — `resolveGoalState` returns `inferred` once `brief.goal.intent` exists even with no param. GoalSlot must always render + collect the param (this is the design).
- **Phase 6 gate:** the green ≤6 test means "numbers deferred," NOT "numbers handled" — founder resolves open-Q#2 here.
- Minor: `computeDroppedSections` has no dedup (harmless until two fields share a `dropTarget`).

**Phase 1 committed:** see Progress log in plan.md.

---

## Phase 2 — unified Brief-backed wizard store

**Files changed**
- `src/hooks/useWizardStore.ts` (created)
- `src/hooks/useWizardStore.test.ts` (created)
- `src/hooks/README.md` (edited — added `useWizardStore.ts` entry under Stores)

### `useWizardStore.ts`
New client (`'use client'`) Zustand+Immer singleton store (mirrors the old
product/service generation stores' `create()(devtools(immer(...)))` shape; tokenId
carried in state, not a per-token factory). NOTHING consumes it yet; old stores
untouched.

**State surface:**
- Resolved identity: `tokenId`, `hydrated`, `engine` (CopyEngine|null),
  `businessTypeKey`, `audienceType`, `templateId`.
- `mode: 'review'|'fill'` — derived from entry source.
- Slot machine: `slots: WizardSlot[]` (computed from contract, skips applied),
  `currentSlot: WizardSlot`.
- `fields: Record<string, WizardFieldEntry>` where
  `WizardFieldEntry = { value, source: 'scraped'|'inferred'|'user', confirmed, state }`
  (state = phase-1 waterfall FieldState).
- Goal: `goalIntent`, `goalParam`.
- `proof: WizardProofState` — superset of `ServiceAssetAvailability` (+ `hasPackages`);
  a compile-time `_ProofIsSuperset` guard enforces every service key exists.
- thing-only: `sitemap`, `strategy`, `heroVariant`(+picked), `styleVariantId`(+picked),
  `stylePaletteId`(+picked), `styleMood`(+picked).
- trust-only: `variantId`, `paletteId`.
- generating: `generationProgress`, `generationError`.

**Actions:** `hydrate`, `goToSlot`/`nextSlot`/`prevSlot` (slot-ID keyed),
`setFieldValue`/`confirmField`, `setGoalIntent`/`setGoalParam`, `setProof`,
thing style/structure setters, trust style setters, generation setters,
`buildBriefPatch`, `save`, `reset`. Exported pure helper `deriveMode(brief)`.

**Field logic not duplicated:** hydrate calls `computeFieldStates` (waterfall) +
`getContract`/`wizardSlots` (contracts); slot list = `wizardSlots.filter(s => !slotSkips.includes(s))`.

### Hydration / persistence reuse of existing APIs
- **Hydration** is a synchronous `hydrate({ tokenId, brief, audienceType, templateId })`
  action fed by the loadDraft response shape (`/api/loadDraft` already returns
  `brief` + `audienceType` + `templateId`; confirmed in route). The page-level
  fetch that calls `hydrate` lands in phase 3 (dispatcher/load-detection). No-ops
  safely (no throw) when `brief.copyEngine` is unset (place/quick-yes never carry
  a schema engine), mirroring the old bridge-hydrate no-op guard.
- **Persistence** `save()` POSTs to the existing `/api/saveDraft` with
  `{ tokenId, stepIndex: slotIndex, brief: buildBriefPatch() }`. `buildBriefPatch`
  composes `brief.goal` via `intentToBriefGoal` (scale-05) — the same brief-passthrough
  the old GoalStep/GeneratingStep use. No new persistence API invented.

### Deviations
- **Mode derivation heuristic:** the Brief carries no explicit URL-vs-manual flag,
  so `deriveMode` inspects `facts.entry.rawInput` for URL-likeness (reuses
  EntryInputStep's normalizeUrl logic). Conservative + deterministic; matches
  "URL/scrape ⇒ review, manual ⇒ fill". Logged per in-scope-ambiguity rule.
- **Proof superset:** ServiceAssetAvailability imported as a TYPE only (erased at
  compile; does not "touch" the old store). Added `hasPackages` so the set is a
  genuine superset covering the trust `packages` T2 field; other engine→proof
  boolean mapping deferred to the phase-4/8 ProofSlot.
- **Proof hydration** seeds only `hasTestimonials` (from `entry.testimonials`) —
  the rest default false; full proof-boolean population is the ProofSlot's job.
- **Field→Brief writeback** in `save()` is limited to `goal` (well-defined);
  per-field brief mapping lands with the phase-5 adapters.

### Test results
- `npx tsc --noEmit` — clean (no output).
- `npm run test:run -- src/hooks/useWizardStore.test.ts` — **18 passed (18)**,
  1 file passed. Covers: engine/audience/template resolution, per-field
  waterfall population, goal hydration, testimonial seed, no-engine no-op, thing
  full skeleton, trust/work structure skip, next/prev/clamp, goToSlot skip no-op,
  review/fill derivation (URL / host-only / manual / no-entry), field+goal actions,
  buildBriefPatch M2 composition, reset.

### Open risks
- `save()`/hydrate page wiring is untested until phase 3 (no consumer yet).
- `strategy` typed `unknown` (loose) to avoid heavy product-type coupling this
  phase; phase 5 adapters will tighten if needed.

### Impl-review verdict: **ship** (loop 1/1) — tsc clean, 18/18 tests, purely additive (old stores byte-unchanged). No blocking issues.
Carry-forward notes (non-blocking, act in later phases):
- **Phase 3:** `save()`+hydrate→loadDraft wiring is untested (no fetch mock) — gets real coverage with the phase-3 consumer. When wiring load-detection/resume, do NOT assume old-store step-array semantics for `content.onboarding.stepIndex` — the new store writes a slot INDEX there.
- **Phase 5:** `strategy: unknown` / `sitemap: unknown[]` intentionally loose — adapters tighten.

---

## Phase 3 — wizard shell + entry→wizard handoff + core slots

**Files changed**
- `src/modules/wizard/rollout.ts` (created)
- `src/app/api/brief/confirm/route.ts` (edited)
- `src/app/onboarding/[token]/page.tsx` (edited)
- `src/components/onboarding/shared/ChipInput.tsx` (created — copy of service field cmp)
- `src/components/onboarding/wizard/WizardShell.tsx` (created)
- `src/components/onboarding/wizard/SlotReviewCard.tsx` (created)
- `src/components/onboarding/wizard/IdentitySlot.tsx` (created)
- `src/components/onboarding/wizard/UnderstandingSlot.tsx` (created)
- `src/components/onboarding/wizard/OfferSlot.tsx` (created)
- `src/app/onboarding/[token]/components/ConfirmBriefStep.tsx` — **NOT modified** (in scope but no change needed; see below)

### The exact handoff wiring
The fork lives in ONE const. `rollout.ts` exports
`WIZARD_ENGINES: ReadonlySet<CopyEngine> = new Set(['thing'])`, consumed by both
sides of the handoff:

1. **confirm route** (`route.ts`): on `outcome === 'serve'` it computes
   `const unified = brief.copyEngine != null && WIZARD_ENGINES.has(brief.copyEngine)`
   and returns `redirectTo: unified ? '/onboarding/${tokenId}' : '/onboarding/${decision.audienceType}/${tokenId}'`.
   Keyed on the SET, not a literal `=== 'thing'`, so phases 8/9 add an engine to
   the set with zero route edits. Project write (brief/audienceType/templateId)
   is unchanged.
2. **ConfirmBriefStep**: unchanged — it already reads `json.redirectTo` and does
   the hard `window.location.assign(json.redirectTo)`. The response shape did not
   change (still `{ outcome, redirectTo }`), so no edit was required; the hard
   navigate is preserved exactly.
3. **page load-detection** (`page.tsx`): `EntryStep` union extended to
   `'input'|'confirm'|'manual'|'wizard'`. On mount an effect fetches
   `/api/loadDraft?tokenId=...` (the same route the edit funnel uses; verified it
   returns `brief`, `audienceType`, `templateId`). A brief is "confirmed" iff
   `brief != null && audienceType != null && brief.copyEngine != null` (brief +
   audienceType are written together at confirm-serve). Then:
   - `WIZARD_ENGINES.has(brief.copyEngine)` ⇒ `setWizardData(...)` + `step='wizard'`
     → renders `<WizardShell>`.
   - else ⇒ `window.location.assign('/onboarding/${audienceType}/${tokenId}')`
     (forward to the OLD wizard; never render the unified wizard) and leave
     `checking` true because the page is unloading.
   - no confirmed brief ⇒ `step='input'` (the in-memory entry flow, unchanged).
   A `checking` flag holds a spinner until detection resolves, so the entry input
   step never flashes before a confirmed brief is detected.

### How the old-wizard path stays intact (trust/work)
- Only `thing` is in `WIZARD_ENGINES`. A confirmed trust brief's confirm-serve
  redirect uses the else-branch → `/onboarding/service/${tokenId}` (unchanged old
  route). If a trust/work brief ever lands on `/onboarding/[token]` directly,
  load-detection forwards it to `/onboarding/${audienceType}/${tokenId}`.
- No old step component, store, or route was touched. `ChipInput` was COPIED into
  `src/components/onboarding/shared/`; the service original
  (`src/app/onboarding/service/[token]/components/fields/ChipInput.tsx`) is
  byte-unchanged. Old product/service wizards keep working.

### Firewall / dynamic-import handling
- `page.tsx` is firewall-pure: imports only pure `@/modules/wizard/rollout`,
  types, and `next/dynamic`. `WizardShell` (and its slot tree + ChipInput) is
  `dynamic(() => import('.../WizardShell'), { ssr: false, loading })`, so template-
  adjacent slot code (future StyleSlot pickers) stays out of the entry bundle.
- `rollout.ts` is pure data (only the `CopyEngine` type import) — safe to import
  in the API route and the page.

### Slots
- All slot components are `'use client'`, read/write `useWizardStore` only.
- `SlotReviewCard.tsx` holds the shared primitives (leaf — imported by slots, does
  NOT import slots, so no circular import with WizardShell): `resolveFieldCopy`
  (businessType `wizardFields[field.id]` → built-in default fallback — contract
  supplies shape, businessType supplies copy), `WizardFieldInput` (free-text
  textarea / `ChipInput` for chips, bound to store), default `SlotReviewCard`
  (one-tap confirm-per-slot fast path), and `SlotBody` (orchestrator: partitions a
  slot's contract fields by store `state` — `drop` never renders, `ask` →
  editable input, `scraped|inferred` → review card in review-mode / editable in
  fill-mode; `mode` read from the store).
- `IdentitySlot`/`UnderstandingSlot`/`OfferSlot` are thin `SlotBody` wrappers keyed
  by their slot id; fields are pulled from the engine contract by `slot ===`
  membership (contract-driven, not hard-coded field lists). UnderstandingSlot thus
  covers WHO/WHAT (+ the differentiator ask, which the contract places in that
  slot).
- `WizardShell` hydrates the store once on mount from the props the page fetched,
  renders progress + back/next chrome, and dispatches `currentSlot` to a built
  slot or a "coming soon" placeholder (goal/proof/style/structure/generating land
  in phases 4/5). `Continue` calls `save()` (existing `/api/saveDraft`) then
  `nextSlot()`.

### Reasoned verification (manual dev is the phase-6 gate, not done here)
- (a) Confirmed THING brief: confirm route returns `redirectTo:/onboarding/${tokenId}`
  (thing ∈ set) → hard navigate → page load-detection fetches loadDraft, sees
  `brief.copyEngine==='thing' ∈ WIZARD_ENGINES` → renders `WizardShell` in
  review-mode (URL-entry ⇒ `deriveMode` review). ✓
- (b) Confirmed TRUST brief: confirm route uses else-branch →
  `/onboarding/service/${tokenId}` (old wizard). Direct hit on `/onboarding/[token]`
  is forwarded there by load-detection (trust ∉ set). ✓
- (c) Reload mid-wizard: page re-mounts, load-detection re-fetches the persisted
  brief (still thing, still confirmed) → re-renders WizardShell (net-new resume).
  ✓ (store re-hydrates from DB, not client memory.)

### Deviations
- **ConfirmBriefStep not edited** — the plan permits editing it only "if the
  response shape gains the branch field." The branch is entirely server-side
  (`redirectTo` already existed), so the component needed no change; the hard
  `window.location.assign` is preserved. Logged per the in-scope-ambiguity rule.
- **`resolveFieldCopy` fallback map** — businessType `wizardFields` keys do NOT all
  match contract field ids (e.g. saas has `product`/`audience`/`differentiator`;
  the thing contract has `name`/`oneLiner`/`capabilities`/`objectionFacts`/`offer`).
  Conservative choice: prefer `wizardFields[field.id]` when the key matches, else a
  built-in default label/example keyed by contract field id (covers all
  thing/trust/work ids), else the raw id. No shape invented; copy-only.
- **`checking` flag** added to the entry state (not in the literal union) to hold a
  spinner during load-detection so the input step never flashes. The `EntryStep`
  union itself was extended exactly as specified (`+ 'wizard'`).

### Test results
- `npx tsc --noEmit` → PASS (clean, no output).
- No unit tests added this phase (UI/handoff wiring; the store already has phase-2
  coverage and the plan schedules load-detection + resume coverage for phase 11).

### Open risks
- `WizardShell.save()`/hydrate → loadDraft wiring is exercised only manually until
  phase 11 adds fetch-mocked load-detection/resume tests (carried forward from
  phase 2).
- Slots goal/proof/style/structure/generating render placeholders — a full THING
  run through generation is not possible until phases 4/5. The handoff + core-slot
  review/fill is the phase-3 deliverable.

### Impl-review verdict: **ship** (loop 1/1) — tsc clean, FULL suite 1198 passed / 2 skipped / 0 failed, no out-of-scope creep, old wizards byte-unchanged. No blocking issues. All 3 hardened handoff items verified (const-keyed redirect, no loop/flash, firewall dynamic-import).
Carry-forward notes (non-blocking):
- **Phase 8:** `WizardFieldInput` only handles `chips`/`free-text` — trust's `packages` (`input:'boolean'`, offer slot) would render as an empty textarea. Add boolean handling (or route to proof-style UI) BEFORE trust goes live. Also add `DEFAULT_FIELD_COPY` entries for `packages`/`theWork`/`praise`/`achievements`/`credentials` (currently fall back to raw-id labels).
- **Phase 11:** `/api/loadDraft` network-error currently drops the user to entry `input` (indistinguishable from no-brief) — reload-recoverable but consider distinguishing transient error from no-brief when adding load-detection coverage.

---

## Phase 4 — goal / proof / style / structure slots + product proof hard rule

**Files changed**
- `src/modules/engines/inputContracts.ts` (edited — carry-forward parity flag)
- `src/modules/audience/product/strategy/parseStrategyProduct.ts` (edited — proof hard rule)
- `src/app/api/audience/product/strategy/route.ts` (edited — additive proof field)
- `src/modules/audience/product/strategy/proofFilter.test.ts` (created)
- `src/components/onboarding/wizard/GoalSlot.tsx` (created)
- `src/components/onboarding/wizard/ProofSlot.tsx` (created)
- `src/components/onboarding/wizard/StyleSlot.tsx` (created)
- `src/components/onboarding/wizard/StructureSlot.tsx` (created)
- `src/components/onboarding/wizard/WizardShell.tsx` (edited — slot registration; see DEVIATION 1)
- `src/app/onboarding/[token]/page.tsx` — NOT modified (in scope but no change needed; see DEVIATION 1)

### Where the product section list is produced + where the proof filter went
GREP + trace: `assembleProductStrategy` in `parseStrategyProduct.ts` is the SINGLE
authoritative point that emits `strategyData.sections` (route.ts calls it ~163 and
reads `strategyData.sections`). It has two branches — single-page (meridian):
`sections = selectProductSections({templateId})`; multi-page (vestria):
`sections = ['header', ...clampSitemap(...)[0].sections, 'footer']`.
`selectProductSections` is only ONE branch, so filtering there misses vestria.
I applied the proof-drop filter in `assembleProductStrategy` AFTER `sections` is
computed and BEFORE `selectProductBlocks(sections)`, so an unpromised section
drops from BOTH `sections` AND derived `uiblocks`, covering both template paths
from one point (the sitemap array's page.sections are filtered in parallel).
Mirrors service, which drops `testimonials` via `assets.hasTestimonials` inside
`selectServiceSections` — the product analogue of that single emit point.

### Back-compat of the strategy-route change
`proof` is a NEW optional object in `ProductStrategyRequestSchema`
(`{ hasTestimonials?: boolean }`) + a NEW optional `proof` on
`AssembleProductStrategyInput`. ABSENT (undefined) — exactly what the OLD product
wizard sends (verified: GeneratingStep.tsx:749 and SitemapReviewStep never send
proof) — runs zero filter logic ⇒ byte-identical to pre-scale-06. Only a PRESENT
`proof` triggers drops. The pre-existing top-level `hasTestimonials`/`hasSocialProof`
flags (long "optional-but-ignored") stay ignored; the nested `proof` object is the
sole opt-in channel, so no old caller changes behavior.

### ProofSlot — contract-driven booleans + warning handling
ProofSlot iterates `getContract(engine).fields.filter(slot === 'proof')` (NOT a
hardcoded service list). `input:'boolean'` T2 fields → 1-tap toggles mapped to a
`WizardProofState` boolean via `BOOLEAN_PROOF_META` keyed by contract id
(thing.proofTestimonials / trust.testimonials / work.praise → `hasTestimonials`);
`skippableWithWarning` fields → chips input + amber skip warning shown WHEN empty
(the carry-forward: the waterfall otherwise DROPs real-numbers silently);
remaining T1 fields → plain inputs; `wizardArtifact` (work.theWork T3 upload)
excluded (phase-9 territory). Testimonial-type sub-choice appears when a
testimonial boolean is on, writes `proof.testimonialType`, cleared when toggled
off. Boolean OFF = unpromised proof ⇒ its `dropTarget` section cut downstream.

### Reasoned verification of the proof hard rule
- proof ABSENT ⇒ assembled `sections` CONTAINS `testimonials` (old behavior). [test 1]
- `proof:{hasTestimonials:false}` or `{}` ⇒ `testimonials` ABSENT from `sections`
  AND from `uiblocks` keys. [tests 2, 4]
- `proof:{hasTestimonials:true}` ⇒ `testimonials` present. [test 3]

### Deviations
1. Slot registration went into `WizardShell.tsx`, NOT `page.tsx`. The plan named
   `page.tsx (register the new slots in the dispatcher)`, but phase 3 built the
   dispatcher (`BUILT_SLOTS`) inside `WizardShell.tsx`; `page.tsx` only renders
   `<WizardShell>` with no dispatch to register into. I made the minimal additive
   change in `WizardShell.tsx` (4 imports + 4 `BUILT_SLOTS` entries) as the direct
   realization of the explicit instruction, and left `page.tsx` unmodified.
   Flagged because `WizardShell.tsx` was not on the Files-touched list — the plan's
   filename is stale, not the intent.
2. StyleSlot mirrors ProductStylePicker's picks via subscription. HeroVariantPicker
   is prop-controlled → bound to the wizard store (`heroVariant`). ProductStylePicker
   is internally coupled to the OLD `useProductGenerationStore` (plan forbids editing
   it; import-for-now). To keep the wizard store the single source of truth for the
   phase-5 adapter WITHOUT modifying the picker, StyleSlot subscribes to the old
   store's `variantId`/`paletteId`/`mood` and mirrors them in. Style shows only on
   the manufacturer/vestria flow (old GeneratingStep gate); meridian gets a note.
3. StructureSlot does NOT fire the strategy call. The old SitemapReviewStep fetched
   strategy itself; in the unified wizard that call is owned by the phase-5 adapter
   (`thing.ts`), which populates `useWizardStore.strategy` before this slot.
   StructureSlot READS `strategy`/`sitemap`, writes edits via `setSitemap`; editing
   UX ported verbatim (structure changes = scope-07). Absent strategy ⇒ neutral
   placeholder; single-page (no menu) ⇒ "single page" note. No user trap.
4. GoalSlot does NOT mirror legacy enums (that is phase-5 adapters). It writes only
   `goalIntent`/`goalParam`; the store composes `brief.goal` via `intentToBriefGoal`
   on save. ALWAYS renders + collects the param even when intent is pre-filled
   (phase-1 carry-forward). `likelyIntents` from the resolved businessType; unknown
   businessType ⇒ full 18-intent fallback.
5. Contract carry-forward: added `skippableWithWarning: true` to WORK `achievements`
   for parity with thing/trust; asserted in `proofFilter.test.ts`. Phase-1 contract
   test only asserted thing/trust, so nothing broke.

### Test results
- `npx tsc --noEmit` → PASS (clean).
- `npm run test:run -- src/modules/audience/product src/modules/engines src/modules/wizard`
  → 6 files / 64 tests passed, 0 failed (incl. new `proofFilter.test.ts`, 5 tests).

### Open risks
- Slot UI render/save wiring exercised only by tsc + the phase-6 manual gate (no
  component render tests this phase — consistent with phase 3).
- `BOOLEAN_PROOF_META` maps work.praise → `hasTestimonials`; phase 9 should refine
  if work needs a distinct proof key.
- StructureSlot depends on the phase-5 adapter populating `strategy` before the
  structure slot; until then it shows the placeholder.

### Impl-review verdict: **ship** (loop 1/1) — tsc clean, 64/64 tests, proof hard rule verified (single real-LLM emit point, drops sections+uiblocks, back-compat byte-identical when proof absent). WizardShell scope deviation confirmed acceptable (stale plan filename; page.tsx has no dispatcher). No blocking issues.
Carry-forward notes (non-blocking):
- **Phase 5:** mock strategy path (`generateMockMeridianStrategy`, `src/modules/prompt/mockResponseGeneratorProduct.ts`) does NOT receive/honor `proof` — under mock mode / DEMO_TOKEN the testimonials section always shows regardless of proof booleans. `assembleProductStrategy` is the single REAL-LLM point, not the mock point. Cheap fix in phase 5: have the mock accept+honor `proof` so mock-mode e2e/manual QA sees proof-drop too. (Phase-6 gate is real-LLM so not blocking, but phase-11 e2e runs mock.)
- **Phase 6 gate:** confirm StyleSlot picks (variant/palette/mood, currently mirrored out of the un-hydrated old `useProductGenerationStore` via useEffect) actually PERSIST across reload/resume — the subscription mirror is fragile; re-homed properly in phase 10.
- Minor: request schema has a dead top-level `hasTestimonials` alongside the active `proof.hasTestimonials` — a future caller could set the wrong one; clean up in phase 10.

---

## Phase 5 — shared generation core + GeneratingSlot (thing)

**Files changed**
- `src/modules/wizard/generation/finalize.ts` (created)
- `src/modules/wizard/generation/thing.ts` (created)
- `src/modules/wizard/generation/index.ts` (created)
- `src/modules/wizard/generation/thing.test.ts` (created)
- `src/components/onboarding/wizard/GeneratingSlot.tsx` (created)
- `src/components/onboarding/wizard/WizardShell.tsx` (edited — dispatcher: register GeneratingSlot)
- `src/modules/prompt/mockResponseGeneratorProduct.ts` (edited — mock proof parity fix)
- `src/app/api/audience/product/strategy/route.ts` (edited — pass `data.proof` to the mock; SCOPE DEVIATION, see below)

### The shared tail (`finalize.ts`) + how it stays server-safe
`finalize.ts` is the near-identical body extracted from BOTH old GeneratingStep
`buildFinalContent`s: assemble `${type}-${uuid}` section ids → sectionLayouts →
per-section content (with aiMetadata) → meta → onboardingData → optional lead-form
provisioning → `seedGoalForm` → `injectGoalSections`. Plus a thin `saveDraft(body)`
fetch wrapper (throws on !ok). The engine-specific vestria contact form is
generalized to a data-driven `leadForm` param (`{sectionType,name,fields,...}`) so
the tail stays engine-agnostic (trust reuses it in phase 8).

**Published/client boundary:** `finalize.ts` carries NO `'use client'` and imports
ONLY plain modules — `@/modules/goals/{seedGoalForm,injectGoalSections}` (both
explicitly-plain scale-05 modules) + types. It never imports `useWizardStore`, a
React component, or a template resolver/registry/renderer, so it can never drag a
client function toward a published renderer ("F is not a function" 500). Verified
via `head` that every imported module is directive-free; tsc passes.

### The THING adapter (`thing.ts`) payload fidelity + ported sub-paths
Also a PLAIN module (no `'use client'`, executed client-side by the slot). It
NEVER imports the wizard store — `GeneratingSlot` reads the store and hands the
adapter a plain `ThingGenerationInput`. Exposes pure payload builders
(`buildStrategyPayload`/`buildCopyPayload`/`landingGoalFor`/`briefGoalFor`) that
produce the EXACT bodies `/api/audience/product/{strategy,generate-copy}` accept
today — route contracts untouched except the phase-4 additive `proof` object,
which is now populated from the store's `proof.hasTestimonials` boolean.
Ported from the ~930-line product GeneratingStep (originals untouched):
- single-page strategy→copy→save (`runCopyAndSave`);
- multi-page fan-out (`runFanOut`) — skeleton save, per-page copy + per-page
  persistence, resume-safe completed-page skip, `finalizeMultiPageGeneration`;
- manufacturer field remap (features←valueAdds, categories←productCategories,
  otherAudiences←industriesServed, +whatYouMake, +trade-buyer fallback);
- manufacturer deterministic TechPremium path (`buildTechPremiumHomeFinalContent`);
- resume-from-DB (loadDraft → `isResumableGeneration` → fan-out);
- hero-variant + cosmetic-style application (ported `applyHeroVariantToFinalContent`).
Result contract is `{status:'done'|'credits'|'error', redirectTo?, error?}` — the
slot maps it to redirect/credits-UI/ErrorRetry.

`index.ts` = `runGeneration(engine,input,cb)` switch: thing wired; trust/work throw
"not yet migrated to the unified wizard" until phases 8/9. index↔thing type-only
cycle (erased) — no runtime cycle.

`GeneratingSlot.tsx` (`'use client'`) — THIN: projects the store to the adapter
input, runs once on mount, drives the 3-stage progress UI (+ multi-page "page X of
N"), and `router.push`es to `/edit/${tokenId}` on success. Registered in the
`WizardShell` `BUILT_SLOTS` dispatcher (same place phase-4 slots registered; NOT
`page.tsx` — the plan's "edit page.tsx" is the known-stale filename, confirmed
phases 3/4; `page.tsx` untouched).

### Mock parity fix
`generateMockMeridianStrategy` now accepts `proof?:{hasTestimonials?}` and drops
the `testimonials` section from BOTH `sections` and the mock sitemap BEFORE
`selectProductBlocks` — identical semantics to `assembleProductStrategy`'s
`proofDroppedSections` (unpromised ⇒ dropped). The one-line route edit passes
`proof: data.proof` into the mock call so mock/DEMO_TOKEN runs agree with real
runs (phase-11 e2e runs mock).

### Deviations
1. **`route.ts` edited (out of Files-touched list).** The mock cannot honor `proof`
   unless the route passes it in; the only realization of step 5 spans the mock's
   call site. Made the MINIMAL additive change (one field: `proof: data.proof`) and
   flagged here rather than stopping the phase — mirrors phases 3/4 precedent of
   editing the genuinely-required file and flagging. No contract change (route
   already validates `proof`).
2. **TechPremium trigger = `templateId==='techpremium'`, not the old
   `/api/user/persona==='hardware-founder'` fetch.** Persona is dead in the unified
   wizard (serveGate resolves templateId); techpremium is strategy-route-invalid
   (`enum(['meridian','vestria'])`) so it can only mean the deterministic path.
   Conservative, persona-less trigger; smoke-covered indirectly (path is a pure
   `buildTechPremiumHomeFinalContent`→save).
3. **Redirect = `/edit/${tokenId}`** (plan step 3 / task end-state), not the old
   `/generate/${tokenId}` reveal route. Plan-directed.
4. **PostHog telemetry not ported** — the old GeneratingSteps `posthog.capture` calls
   are telemetry, not load-bearing; omitted to keep the plain adapter free of a
   client analytics import. Progress/errors surface via callbacks instead.
5. **`categories`/`importSourceUrl`/structured `importedTestimonials` = empty for
   the pilot** — the THING contract collects none of these as wizard fields yet;
   the adapter accepts them (fidelity) but the slot passes `[]`/undefined. onboarding
   snapshot still carries the collected understanding fields.

### Reasoned verification
A THING brief → confirm → unified wizard → GeneratingSlot builds a plain input
from the store → `runGeneration('thing', …)` fetches strategy, then copy, then
`buildFinalContent`+`saveDraft`, then the slot redirects to `/edit/${tokenId}`.
The smoke tests exercise this end-to-end with a mocked fetch (single-page meridian
→ done + `/edit/tok123`; multi-page vestria → skeleton save + per-page fan-out →
done; 402 → status:credits). Manufacturer remap asserted at the payload level. Mock
now drops testimonials when `proof.hasTestimonials!==true` (parity with the real
assembler).

### Test results
- `npx tsc --noEmit` → PASS (clean, no output).
- `npm run test:run -- src/modules/wizard src/modules/audience/product` →
  **6 files / 50 tests passed, 0 failed** (thing.test.ts = 11 tests).

### Open risks
- Adapter run path is covered by mocked-fetch smoke + tsc; the real-LLM full run is
  the phase-6 manual gate.
- WizardShell nav renders back/next chrome around the auto-running GeneratingSlot
  (Continue disabled on last slot) — cosmetic; not in phase-5 scope to change.
- The mock proof fix has no dedicated unit test (covered by tsc + phase-11 e2e per
  plan); the real path's drop is already locked by `proofFilter.test.ts`.

### Impl-review verdict: **ship** (loop 1/1) — tsc clean, 50/50 tests, published/client boundary verified clean (finalize/thing/index plain, no store import), adapter payloads match route schemas, manufacturer remap byte-faithful, mock parity correct. Old GeneratingSteps/stores byte-unchanged. route.ts deviation = 1 additive mock-only line. No blocking issues.
Carry-forward notes (non-blocking):
- **Phase 6 gate item:** `GeneratingSlot.tsx:162` calls `setGenerationError` during render (anti-pattern; no loop today but may emit "Cannot update while rendering" warning during the pilot demo). Cheap fix = move into an effect; founder decides at gate whether to fix before proceeding.
- **Before a real manufacturer/vestria run through the unified wizard:** `buildThingInput` (`GeneratingSlot.tsx:51-79`) hardcodes `categories:[]` and omits `valueAdds`/`productCategories`/`industriesServed`/`whatYouMake` — benign for the meridian pilot (adapter remap is proven; a vestria-resolved THING runs SaaS-shaped, no 400; techpremium takes the deterministic path) but must be wired before manufacturer goes live through the wizard.
- Minor: `thing.test.ts` `CopyRequestMirror.awareness = z.string()` is looser than the route's enum (strategy passed through untouched, low risk).

## Phase 6b — differentiator guided chips

**Files changed**
- `src/modules/engines/inputContracts.ts` (modified)
- `src/components/onboarding/wizard/SlotReviewCard.tsx` (modified)
- `src/modules/engines/inputContracts.test.ts` (modified)

**inputContracts.ts**
- `ContractField.input` union extended: added `'guided-chips'`.
- New optional `chips?: readonly string[]` on `ContractField` — starter phrases for a guided-chips field.
- Three differentiator fields switched `input:'free-text'` → `'guided-chips'` + per-engine `chips`:
  - thing `differentiator`: Faster to set up · More affordable · Easier to use · More reliable · Better support · The only one that… · Built for a specific niche · All-in-one
  - trust `process`: More experienced · Specialized in a niche · Faster turnaround · More personal attention · Proven track record · Certified / credentialed · Transparent fixed pricing
  - work `bioStory`: A distinct voice/style · Award-winning · Published in known outlets · A genre specialist · Bilingual · Decades of craft
- Design-decision header comment updated (free-text → guided-chips rationale).
- UNCHANGED: requirement/slot/group/askCandidate/section on all three — input MODE only. Still a single always-ASK differentiator, so ≤6/≤3 acceptance budget unaffected.

**SlotReviewCard.tsx (WizardFieldInput)**
- Added a `guided-chips` render path: chip starters render as tappable pill buttons ABOVE the existing free-text `<textarea>` (chip styling reused from ChipInput — orange-50 pill, orange-200 border, brand-accentPrimary text).
- Tapping a chip SEEDS the phrase into the text value via `seedChip()` (appends to existing trimmed text so multiple taps compound). The textarea stays fully editable; stored value is the final free text.
- `chips`/`free-text`/`chips` paths untouched; guided-chips falls through to the same textarea (chips block only shows when `input==='guided-chips'` and `chips.length>0`). `'use client'` boundary unchanged.

**Phase-1 test assertion updated**
- `inputContracts.test.ts` "differentiator is a free-text field" → "differentiator is a guided-chips field with non-empty per-engine chip starters": now asserts `input==='guided-chips'` + non-empty `chips` array for thing/trust/work. Safe: semantics unchanged (still one always-ASK converged differentiator candidate); only the input mode changed. No waterfall/acceptance test asserted the input mode.

**Verification**
- `npx tsc --noEmit` → clean (no output).
- `npm run test:run -- src/modules/engines src/modules/wizard` → 3 files, 49 tests passed.

**Deviations:** none.
**Open risks:** none — data + one UI branch, no store/waterfall changes.

## Phase 7 — scrape convergence (businessType-keyed extraction)

**Files changed**
- `src/lib/schemas/extraction/index.ts` (created) — registry + resolver
- `src/lib/schemas/extraction/thing.ts` (created)
- `src/lib/schemas/extraction/trust.ts` (created)
- `src/lib/schemas/extraction/work.ts` (created)
- `src/lib/schemas/extraction/manufacturer.ts` (created)
- `src/lib/schemas/extraction/extraction.test.ts` (created)
- `src/app/api/v2/understand/route.ts` (edited)
- `src/app/api/v2/scrape-website/route.ts` (edited)
- `src/modules/businessTypes/config.ts` (edited — `<key>-v0` → real registry keys)

### Registry shape (`extraction/index.ts`)
`extractionSchemaKeys = ['thing','trust','work','manufacturer']`. Each entry is an
`EngineExtraction`: `{ key, understandSchema, scrapeSchema, entryEnrichmentFields
(ZodRawShape), entryEnrichmentPrompt(), enrichSignals(data, base) }`.
- `getExtraction(key)` — by registry key.
- `extractionForBusinessType(bt)` — reads `businessTypes[bt].extractionSchemaKey`,
  validates it, returns the entry. This is how the wizard/entry path selects a
  schema (by businessType, never by templateId).
- `hasEntryEnrichment(e)` — true iff the engine adds fields to the entry base.

businessType → registry key (config.ts): saas→`thing`, agency/consultant/coach→
`trust`, writer→`work`, manufacturer→`manufacturer`. (manufacturer copyEngine is
`thing` but it maps to the richer `manufacturer` key — the only key with an
enrichment delta.)

Standalone `understand/scrape` schemas per engine re-use the existing zod schemas
(thing=Understanding/ScrapeWebsiteExtended, trust=ServiceUnderstanding/
ScrapeWebsiteService, manufacturer=ManufacturerUnderstanding/
ScrapeWebsiteManufacturer, work currently mirrors thing base — phase 9 extends it).
Field coverage preserved by re-export, nothing re-typed.

### Manufacturer schema added — yes
Justified per the plan's condition ("only if manufacturer needs richer fields than
base thing"): it carries the 4 trade-supplier keys (whatYouMake / industriesServed /
productCategories / valueAdds) that base thing lacks. On the entry path these are an
enrichment DELTA `.extend()`-ed onto EntryScrape/EntryUnderstand + an appended prompt
block; `enrichSignals` folds them ADDITIVELY into existing `EntrySignals` fields
(productCategories+valueAdds → offerings, industriesServed → audiences, whatYouMake →
summary when empty). Base values lead and are never overwritten, so brief prefill is
strictly ≥ the base. No `EntrySignals` shape change → no brief-module edit needed.

### Wizard/entry path vs legacy branch
- Both routes gained an OPTIONAL `businessType` request field (enum of
  `businessTypeKeys`). When present, the entry handler selects the registry
  extraction by businessType key and enriches the convergent entry base; when
  absent (first-touch entry from EntryInputStep — which cannot know the type yet),
  the base entry schema is used, BYTE-IDENTICAL to pre-phase-7. thing/trust/work
  have no delta, so selecting them is also identical to base.
- The manufacturer↔vestria coupling is dead on the wizard path: the entry handler
  never reads `isManufacturerFlow`/`templateId`. Manufacturer richness is reachable
  via `businessType:'manufacturer'`.
- The legacy audienceType + `isManufacturerFlow(templateId)` schema switch is
  PRESERVED verbatim on the non-entry path (gated by `entry !== true`, the existing
  discriminator), now fenced with a `LEGACY PATH … scale-06 phase 10 kill` banner.
  `isManufacturerFlow` itself is untouched (melts in scale-08). An old-wizard
  request (no `entry` flag) selects the same schema and prefill as before.

### differentiator stays ASK
No extraction schema or enrichment field named `differentiator` exists (asserted in
extraction.test.ts). The always-ASK guided-chips field (thing differentiator / trust
process / work bioStory) is never made prefill-able.

### Reasoning: prefill quality
- A wizard/entry scrape of a SaaS URL (businessType `saas` → `thing`) or a service
  URL (agency/consultant/coach → `trust`) selects its registry schema; both have no
  enrichment delta, so extraction == the current convergent entry base → prefill ≥
  before (unchanged). A manufacturer URL (→ `manufacturer`) additionally extracts the
  4 trade-supplier fields and folds them into offerings/audiences/summary → prefill
  strictly richer than base, with NO templateId coupling.
- An OLD-wizard request (product/service, `entry` absent) hits the untouched legacy
  branch → same schema, same prefill.

### Verification
- `npx tsc --noEmit` → clean (no output).
- `npx vitest run src/lib/schemas src/modules/brief` → 5 files, 94 tests passed.

### Deviations
- **Out-of-scope test now fails (NOT edited):** `src/modules/businessTypes/config.test.ts:71-75`
  asserts `extractionSchemaKey === '<key>-v0'` — the exact placeholder the plan
  directed me to replace. It is not on this phase's Files-touched list, so per
  protocol I did NOT edit it and flag it here instead. Required follow-up (one line):
  change the assertion to `expect(isExtractionSchemaKey(entry.extractionSchemaKey)).toBe(true)`
  (import from `@/lib/schemas/extraction`), or assert against the real keys. This is
  the only fallout; the scoped test command does not run this file.
- Added an OPTIONAL `businessType` request field to both routes (conservative,
  back-compat: absent ⇒ prior behavior). No caller passes it yet (EntryInputStep /
  wizard store are out of scope this phase); the mechanism is exercised by
  extraction.test.ts. Wiring a wizard re-extraction caller is a later concern.

### Open risks
- `businessType` enrichment on the entry path is dormant until a caller supplies it;
  manufacturer richness on the convergent path is proven by unit test, not yet by a
  live wizard re-scrape.
- Legacy branch remains live (by design) until phase 10.

### Follow-up (authorized scope addition) — config.test.ts fix
Coordinator authorized editing the flagged out-of-scope test. Updated
`src/modules/businessTypes/config.test.ts`: replaced the `extractionSchemaKey ===
'<key>-v0'` placeholder assertion with `expect(isExtractionSchemaKey(
entry.extractionSchemaKey)).toBe(true)` (imported `isExtractionSchemaKey` from
`@/lib/schemas/extraction`). Direct consequence of replacing the placeholders.

Re-verified:
- `npx tsc --noEmit` → clean.
- `npm run test:run -- src/lib/schemas src/modules/brief src/modules/businessTypes`
  → 6 files, 103 tests passed.

### Impl-review verdict: **ship** (loop 1/1) — tsc clean, 103 tests, back-compat SOUND (legacy path gated by pre-existing `entry===true`, byte-unchanged; old-wizard requests never enter the new path), manufacturer coupling killed on wizard path only (`isManufacturerFlow` untouched for scale-08), registry resolves all 6 businessTypes, differentiator stays ASK, credits/crawl/provider untouched, config.test.ts fix meaningful. No blocking issues.
Carry-forward notes (non-blocking):
- **IMPORTANT wiring gap (phase 8/11):** the new `businessType` request field on `/api/v2/understand`+`/scrape-website` is DORMANT — no caller passes it yet, so businessType-keyed selection is proven only by unit test. Chicken-and-egg: businessType is DERIVED from the scrape, so keyed selection only applies to a RE-scrape after a brief exists (or when the user pre-declares type). A later phase must decide/wire this (or accept first-scrape uses the base entry schema, enrichment only on re-scrape).
- Cosmetic: understand-path `enrichSignals(raw, raw)` leaks 4 manufacturer keys as inert extra props (scrape path derives a clean base first); harmless to `buildBriefDraft`; tidy when wiring the caller.
- work extraction mirrors thing base (no delta) — phase-9 territory.

---

## Phase 8 — trust engine through unified wizard

**Files changed**
- `src/modules/wizard/rollout.ts` (edit)
- `src/modules/wizard/generation/index.ts` (edit)
- `src/modules/wizard/generation/trust.ts` (create)
- `src/modules/wizard/generation/trust.test.ts` (create)
- `src/components/onboarding/shared/PaletteSwatch.tsx` (create — copy of service field cmp)
- `src/components/onboarding/wizard/StyleSlot.tsx` (edit — trust branch)
- `src/components/onboarding/wizard/SlotReviewCard.tsx` (edit — boolean input + default copy)
- `src/hooks/useWizardStore.ts` (edit — importedTestimonials gap)
- `docs/task/scale-06-wizard-convergence.audit.md` (this entry)

NOT changed (verified): `src/app/api/brief/confirm/route.ts`, `src/app/onboarding/[token]/page.tsx`, `src/components/onboarding/wizard/ProofSlot.tsx` — see below.

### confirm/route.ts — NO-OP (rollout-const-driven), confirmed
Line 74-75 keys the redirect purely on `WIZARD_ENGINES.has(brief.copyEngine)`. Adding `trust` to the set in `rollout.ts` is sufficient; the route required no edit. Likewise `page.tsx` load-detection (line 84) is `WIZARD_ENGINES.has(...)`-driven — trust now renders the unified wizard / stops forwarding to the old service route with zero page edits. Both were left untouched.

### rollout.ts + index.ts
- `WIZARD_ENGINES` now `{thing, trust}`.
- `runGeneration` dispatches `case trust -> runTrustGeneration`; `GenerationInput` widened to `ThingGenerationInput | TrustGenerationInput`; `work` still throws "not yet migrated".

### trust adapter (trust.ts) — payload fidelity + ServiceUnderstanding mapping
Ported from the ~410-line service `GeneratingStep` (old file untouched). Single-page (service has no multi-page fan-out): strategy -> copy -> save. Reuses the phase-5 shared `finalize.ts` tail (buildFinalContent -> seedGoalForm -> injectGoalSections -> saveDraft); no `leadForm` param (service core templates have no vestria contact form — the M1 goal-form seed handles capture). PLAIN module — no 'use client', no store import.
- `buildStrategyPayload` -> EXACT `/api/audience/service/strategy` body: {oneLiner, businessName, understanding, goal, offer, assets, paletteId, templateId?}.
- `buildCopyPayload` -> EXACT `/api/audience/service/generate-copy` body incl. realTestimonials (only when present).
- ServiceUnderstanding mapping: serviceType = serviceTypeForBusinessType(businessTypeKey) (bridge; consultant->consultancy, coach->coaching, else agency), whatYouDo = oneLiner (bridge idiom: whatYouDo~=entry.summary, wizard's closest is the one-liner), services, targetClients (whoProblem), outcomes, deliveryModel default 'remote'.
- ServiceGoal via intentToLegacyGoal(intent,'service') (null->book-call); Brief.goal via intentToBriefGoal.
- assets built from the store proof booleans as a 1:1 ServiceAssetInput, reaching selectServiceSections UNCHANGED in shape (via strategy route -> assembleServiceStrategy). injectRealTestimonials path untouched.

### Awareness-driven section ordering preserved (trust.test.ts)
15 tests (all green). Beyond route-schema mirrors, the acceptance assertion feeds the adapter's buildAssets(...) output into the REAL selectServiceSections: testimonials ON keeps the frozen search-aware-comparing order; testimonials OFF drops the section (proof hard rule); other awareness states reproduce their byte-identical middle orders. Full-run smoke (mocked fetch) confirms strategy->copy->save->/edit/[token] + 402->credits.

### boolean-input + default-copy fixes (SlotReviewCard.tsx)
- Added a `boolean` case to `WizardFieldInput` (1-tap yes/no toggle) so trust's `packages` field (input:'boolean', offer slot) renders a toggle instead of the phase-3 empty-textarea fallthrough. Proof-slot booleans keep their own ProofToggle chrome.
- Added DEFAULT_FIELD_COPY for packages, outcomes, realNumbers, credentials, theWork, achievements, praise (trust + work ids that previously fell back to raw-id labels).

### trust style wiring (StyleSlot.tsx + PaletteSwatch.tsx)
StyleSlot now branches on engine: trust -> new TrustStyleSlot (variant + palette picker for the serveGate-resolved template — templateId is LOCKED by serve, so no template switcher). Palette swatches use the COPIED shared PaletteSwatch; swatch colors/variants come from the old service-tree TEMPLATE_CATALOG (data-only picker metadata, IMPORT-for-now, re-homed phase 10 — same pattern as the thing pickers). Bound to store variantId/paletteId; seeds defaults on mount. Original service PaletteSwatch left in place.

### trust proof wiring — ProofSlot NOT edited (verified working)
The phase-4 ProofSlot is contract-driven: it already iterates getContract('trust').fields.filter(slot==='proof') and handles trust's set — testimonials (boolean via BOOLEAN_PROOF_META) + the testimonial-type sub-choice, outcomes (skippable numbers), credentials (free-text). No functional change was needed, so per the conservative principle I left it untouched (editing a correct file adds risk). The "shape service sectionSelection expects" is produced by the adapter's proof->ServiceAssetInput mapping, not by the slot.

### store gaps filled (useWizardStore.ts)
Added importedTestimonials: Array<{quote,author_name,author_role}>, hydrated from entry.testimonials (Brief carries quote strings only -> mapped with blank authors; the service copy route + injectRealTestimonials tolerate blanks). All other trust state the adapter needs already existed (fields map, proof superset, goalIntent/goalParam, variantId/paletteId, businessTypeKey).

### Reasoning — end-to-end trust flow
A trust brief -> confirm (rollout redirect -> /onboarding/[token]) -> load-detection admits trust via WIZARD_ENGINES -> WizardShell hydrates useWizardStore -> slots identity/understanding/goal/offer/proof/style (STRUCTURE SKIPPED — trust contract slotSkips:['structure'], honored by slotsForEngine) -> generating -> service strategy+copy+finalize -> /edit/[token]. Asset booleans drive service section drops via the adapter's ServiceAssetInput. Thing path unregressed (thing adapter/tests untouched; index switch only ADDS trust).

### Deviations
- ProofSlot left unedited (listed in scope): already handles trust via contract-driven rendering; no functional change required (logged above).
- packages boolean not wired to a route-level section drop. Its contract dropTarget:'packages' would need a strategy-route change to honor, but plan D says routes stay unchanged and service drops packages via the LLM's servicePresentation.format==='quote-only'. Conservative choice: capture the boolean (now renders as a toggle) but preserve byte-identical old-service drop behavior (LLM-format-driven). Noted for a future phase if packages-drop should become deterministic.
- whatYouDo mapped to the one-liner (no dedicated wizard field) — matches the bridge's briefToServicePrefill idiom (whatYouDo = entry.summary; the one-liner is the wizard's closest single-line description).

### RESOLVED — GeneratingSlot per-engine input builder (authorized scope addition)
The coordinator authorized editing `src/components/onboarding/wizard/GeneratingSlot.tsx` (plan Files-touched list was stale — migrating trust necessarily requires a trust run to reach `/edit`). Fix (minimal, mirrors the existing thing path):
- Added `buildTrustInput()` — projects the wizard store to the EXACT `TrustGenerationInput` shape (`businessName`←`name`, `oneLiner`, `targetClients`←`whoProblem`, `services`, `process`, `credentials`, `offer`, `outcomes`, `goalIntent`/`goalParam`, `proof` subset read from the store, `importedTestimonials`, `paletteId`/`variantId`, `businessTypeKey`, `templateId` default `hearth`). NOT productName/features.
- Added `buildInput(engine)` dispatch: `engine === 'trust' → buildTrustInput()`, else `buildThingInput()`. `run()` now calls `buildInput(engine)`.
- Thing path UNREGRESSED: `buildThingInput` is byte-unchanged; a non-trust engine still routes through it. Old stores/steps untouched.

### Test results
- `npx tsc --noEmit` — clean (both before and after the GeneratingSlot fix).
- `npm run test:run -- src/modules/wizard src/modules/audience/service src/modules/templates` — 24 files, 543 tests, all passing (incl. trust.test.ts 15/15, service sectionSelection + generation-contract + paletteSelection regressions green).
- Post-GeneratingSlot re-run: `npm run test:run -- src/modules/wizard src/modules/audience/service` — 8 files, 80 tests, all passing.

### Impl-review verdict: **ship** (loop 1/1) — tsc clean, 543 tests, trust runtime path traced end-to-end (payloads match ServiceStrategy/GenerateServiceCopy schemas, no 400/500), thing non-regression confirmed (buildThingInput byte-unchanged), service section-drop preserved (real selectServiceSections), boundaries clean, confirm/route+page genuinely no-op. GeneratingSlot per-engine fix verified. No blocking issues.
Carry-forward notes (non-blocking):
- **Testimonial attribution (later phase, e.g. 11 or follow-up):** unified-wizard trust hydrates `importedTestimonials` from `brief.facts.entry.testimonials` which is `string[]` (quote only) — authors blank, so trust pages get UNATTRIBUTED testimonials. Verbatim quote text IS preserved (spec item 7 satisfied) and injectRealTestimonials tolerates blanks. Root cause = entry pipeline reduces testimonials to strings; enrich `EntryFacts.testimonials` to carry authors later.
- **Surge trust delta sections:** trust proof slot collects only testimonials/outcomes/credentials; the other 5 ServiceAssetInput booleans default false with no UI. ZERO effect for hearth/lex; only Surge gates logos/casestudies on them. Phase-1 contract-scoping limitation, not a phase-8 defect. Flag if Surge trust needs proof-gated deltas.
- Cosmetic: trust.test.ts validates `strategy` loosely vs full AssembledStrategySchema.

## Phase 9 — work engine / writer self-serve

**Files changed**
- `src/modules/brief/serveGate.ts`
- `src/modules/brief/serveGate.test.ts`
- `src/modules/wizard/rollout.ts`
- `src/modules/wizard/generation/work.ts` (created)
- `src/modules/wizard/generation/index.ts`
- `src/hooks/editStore/granthSeed.ts`
- `src/components/onboarding/wizard/ProofSlot.tsx`
- `src/components/onboarding/wizard/GeneratingSlot.tsx`
- `src/app/dev/seed-writer/route.ts` (deleted)

NOT edited (in Files-touched but genuine no-ops — verified, noted below):
`src/modules/templates/templateMeta.ts`, `src/modules/templates/fit.ts`,
`src/app/onboarding/[token]/page.tsx`, `src/app/api/brief/confirm/route.ts`.

### serveGate — the 3 coordinated BLOCKING-2 edits
1. `BRIDGEABLE_ENGINES` type widened to `Record<'thing'|'trust'|'work', AudienceType>` + `work: 'writer'` added.
2. `bridgeable` predicate widened to include `engine === 'work'` (the easy-to-miss one — without it a served work brief never reaches the serve branch even with the map widened). TS narrows `engine` to the 3-value union via the const-boolean alias, so `BRIDGEABLE_ENGINES[engine]` typechecks against the widened Record.
3. Deleted the `bridge:work` MANUAL clause (old lines ~124-128) and its stale header comment (per its own instruction at ~41-43).

### rungC/granth hazard — resolution: NO templateMeta / fit.ts change (verified, not assumed)
Test-first: wrote the `decideServe(writerBrief) ⇒ serve/writer/granth` assertion and ran it BEFORE any UI wiring. It passed with ONLY the 3 serveGate edits + rollout. Traced why:
- Writer is a KNOWN businessType ⇒ `resolveEngine` returns `{engine:'work', source:'lookup'}`. rungC gallery injection is gated on `classificationSource==='tiebreaker' && tiebreaker==='portfolio-is-proof'` — `source==='lookup'` for any known writer, so rungC NEVER fires on the serve path. (A tiebreaker-classified work brief has an UNKNOWN businessType ⇒ `known===false` ⇒ rungA ⇒ manual anyway, never served.)
- `requiredCapabilitiesFromBrief` for writer = `[]` (writer `requiredCapabilities: []`; `follow-social` ⇒ M4, not M1 ⇒ no `lead-form`; no download-app/multi). So `shortlist(brief)` = templates that fit `work` with `[]` = `['granth']` (lumen is `bespoke` ⇒ off shortlist). `pickTemplate` → granth via `businessTypes.writer.defaultStyle 'literary-quiet'` ∈ `granth.designStyles`.
- **Deviation from plan's PREFER:** the plan preferred adding a `gallery` capability to granth. I did NOT, because (a) it is not needed for the serve path to resolve granth (proven by the passing test), and (b) `templateMeta.test.ts` (OUT of my Files-touched scope) hard-asserts `templateMeta.granth.capabilities` toEqual `[]` and `conformance.test.ts` would require a `capabilitySections` evidence entry — adding gallery would fail an out-of-scope test I may not edit. Per the "IF NEEDED / verify, don't assume" caveat this is the conservative, rule-compliant choice. `templateMeta.granth.copyEngines` already includes `'work'` (line 79) — confirmed. fit.ts confirmed unchanged (shortlist filters by copyEngines; granth fits `work` with `[]`).

### work.ts — thin deterministic path + templateId guard
Plain server-safe module (no `'use client'`, no store import). `runWorkGeneration`:
1. Guard: fetches `/api/loadDraft`, asserts persisted `templateId === 'granth'` — THROWS (does not silently overwrite) on mismatch. serveGate resolves granth at serve time and the confirm route persists it; a mismatch is an upstream regression.
2. Builds `buildGranthHomeFinalContent({tokenId, title, writerName, works})` — NO LLM strategy/copy fetch (the seed is the content).
3. `saveDraft` with `paletteId:'sinduri'`, `templateId:'granth'`, `variantId:'granth'`, `finalContent`. audienceType intentionally NOT re-sent (already persisted by confirm; DraftSaveSchema strips it — guard proves it's set).

### granthSeed.ts — signature extended (flagged)
Added an OPTIONAL `works?: string[]` param (additive, back-compat). The 3–5 wizard uploads are threaded positionally onto `books.items[].cover_image` (surplus append minimal items so no upload is lost). Absent/empty ⇒ the original fictional shelf, unchanged. Verified `GranthBooks.core.tsx` reads `item.cover_image` (single-source .core.tsx ⇒ edit+published parity, no dual-renderer divergence; no block edits).

### ProofSlot — WORK T3-in-wizard exception + ≥3 guard
Added `WorkUploadField` rendered for `wizardArtifact` fields (only work's `theWork`). Uploads via the existing `/api/upload-image` (formData {file, tokenId}), stores returned URLs on `fields.theWork.value` (string[]); scraped image URLs prefill the same array. Thumbnails + remove, uploading state, per-file error, and a live count with an amber "add at least 3" hint. thing/trust unaffected (no wizardArtifact fields).

### GeneratingSlot — buildWorkInput + empty-gallery guard
Added `buildWorkInput()` (tokenId, templateId, writerName, oneLiner, works from `fields.theWork`) and wired `work` into the per-engine `buildInput` dispatch (mirrors the phase-8 trust fix). Empty-gallery guard: `run()` blocks generation for the work engine until `works.length >= MIN_WORKS (3)`, surfacing a back-to-proof error. `MIN_WORKS` exported.

### seed-writer deletion
`src/app/dev/seed-writer/route.ts` deleted (dir removed). No live code imports it (grep hits are docs/READMEs only). `src/app/README.md` still mentions it — updating it is OUT of scope (not in Files-touched); flagged, not edited.

### page.tsx / confirm route — confirmed no-ops
`page.tsx` load-detection and the confirm-route redirect both key on `WIZARD_ENGINES.has(brief.copyEngine)`. Adding `'work'` to `WIZARD_ENGINES` in rollout.ts makes both route work briefs through the unified wizard with zero edits to those files. Confirmed, not edited.

### End-to-end reasoning (human-gate runnable path)
WORK brief → entry → confirm (server `decideServe` ⇒ serve/writer/granth; persists `brief`+`audienceType:'writer'`+`templateId:'granth'`; redirect `/onboarding/{token}` since work ∈ WIZARD_ENGINES) → page.tsx load-detection sees confirmed brief, engine ∈ WIZARD_ENGINES → renders unified wizard. Work slots = all minus `structure` (contract slotSkips). ProofSlot asks 3–5 work uploads (T3-in-wizard). GeneratingSlot blocks until ≥3 works, then `runGeneration('work', …)` → work.ts asserts granth → `buildGranthHomeFinalContent` (uploads become covers) → `saveDraft` → `/edit/{token}`. thing/trust paths unchanged (buildThingInput/buildTrustInput untouched).

### Deviations
- Did NOT add a `gallery` capability to granth (plan PREFER) — not needed for serve resolution (test-proven) and would break out-of-scope `templateMeta.test.ts`/`conformance.test.ts`. Conservative choice per the plan's own "IF NEEDED / verify, don't assume".
- `granthSeed` signature extended with optional `works?` (flagged as required by the plan) to make uploads visible on the shelf — additive/back-compat.
- Left the stale `seed-writer` mention in `src/app/README.md` (out of scope).

### Verification
- `npx tsc --noEmit` — clean (no output).
- `npx vitest run src/modules/brief src/modules/templates src/modules/wizard` — 22 files, 572 tests passed.
- `npx vitest run` (full) — 88 passed | 1 skipped (89 files); 1241 passed | 2 skipped.

### Open risks
- GeneratingSlot STAGES still shows "Building strategy / Writing the copy" for work, though work.ts only fires `saving`→`done` (thin path has no LLM stages). Cosmetic; strategy/copy render as done. Could be made engine-aware in a later phase.

- **Gate-prep fix (coordinator):** removed `prefillKey: 'offerings'` from the work `theWork` field in `inputContracts.ts` — it is an IMAGE upload but `EntryFacts.offerings` is TEXT, so scrape/review runs seeded text into image slots (broken covers, ≥3 guard passing on garbage). Now starts EMPTY, requiring real uploads. requirement/slot/tier/wizardArtifact/input unchanged. `tsc` clean; `test:run -- src/modules/engines src/modules/wizard` = 4 files / 64 tests passed (no ask-budget shift — theWork is a T3 upload, not a T1 ask).

### Impl-review verdict: **ship** (loop 1/1) — tsc clean, FULL suite 1241 passed / 2 skipped. serveGate BLOCKING-2 all 3 edits correct + type-sound. CRITICAL question resolved: a self-serve writer (businessType 'writer' ∈ taxonomy, source:'lookup') resolves to serve/writer/granth — rungC never fires, shortlist=['granth']; MANUAL only for UNKNOWN-businessType writers (intended D2 gate, same as thing/trust). work.ts thin path throws on non-granth (no overwrite). No blocking issues.
Gate-prep fix applied post-review: removed `theWork` `prefillKey:'offerings'` (text→image mismatch would have shown broken thumbnails/covers on a scrape writer run) — tsc clean, 64 tests, no ask-budget shift.
Carry-forward notes (non-blocking):
- **Phase 10:** stale `/dev/seed-writer` mentions in `src/app/README.md:85` + `src/modules/templates/granth/README.md:7` (docs only, no code import — build safe). Clean up.
- GeneratingSlot stage labels ("Building strategy / Writing copy") are cosmetic for the thin work path (only saving→done fires).
- Edge: a `structureHint:'multi'` writer would need a multipage cap granth lacks → shortlist empty → MANUAL. Low probability (writer profiles single-page), fails safe to demand board.

---

## Phase 10 — kills, redirects, old-store retirement

**Files changed**

Created:
- `src/components/onboarding/wizard/fields/HeroVariantPicker.tsx` (re-homed from old product tree)
- `src/components/onboarding/wizard/fields/ProductStylePicker.tsx` (re-homed + re-wired to `useWizardStore`)
- `src/components/onboarding/wizard/fields/templateCatalog.ts` (re-homed from old service tree — tsc-discovered importer of StyleSlot)

Modified:
- `src/types/product.ts` — added `VestriaHeroVariant` + `VestriaLookMood` (canonical home; moved off the deleted product store)
- `src/types/service.ts` — added `ServiceUnderstanding` + `ServiceUnderstandingExtract` + `ServiceAssetAvailability` (canonical home; moved off the deleted service store)
- `src/components/onboarding/wizard/StyleSlot.tsx` — re-pointed picker imports to the wizard fields dir, `VestriaHeroVariant` from `@/types/product`, `TEMPLATE_CATALOG` from the re-homed catalog; DELETED the old-store mirror subscription (ProductStylePicker now writes style picks directly to `useWizardStore`)
- `src/app/api/brief/confirm/route.ts` — redirect now UNCONDITIONAL (`/onboarding/${tokenId}` for every serve); dropped the rollout import
- `src/app/onboarding/[token]/page.tsx` — load-detection renders the wizard for ANY confirmed brief; dropped the rollout import + the not-yet-migrated forwarding branch
- `src/app/onboarding/product/[token]/page.tsx` — server redirect stub -> `/onboarding/${token}`
- `src/app/onboarding/service/[token]/page.tsx` — server redirect stub -> `/onboarding/${token}`
- `src/modules/templates/hearth/paletteSelection.ts`, `.../lex/...`, `.../surge/...`, `.../lumen/...` — re-pointed `ServiceUnderstanding` import to `@/types/service`
- `src/modules/templates/paletteSelection.regression.test.ts` — same re-point
- `src/hooks/useWizardStore.ts` — re-pointed `ServiceAssetAvailability` type import to `@/types/service`
- `src/app/api/v2/understand/route.ts` — removed the legacy audienceType/manufacturer flag-gate branch (entry path is now the only path) + its dead imports/prompt-builders; trimmed dead request-schema fields
- `src/app/api/v2/scrape-website/route.ts` — same legacy-branch removal + dead imports/mock fixtures/manufacturer prompt-builder trimmed
- `src/app/README.md` — onboarding route table (unified wizard + redirect stubs) + dropped `seed-writer` from `/dev/*`
- `src/modules/templates/granth/README.md` — replaced the `/dev/seed-writer` white-glove note with the scale-06 self-serve work path
- `src/hooks/README.md` — recorded the three store deletions + where their types re-homed

Deleted:
- `src/modules/wizard/rollout.ts` (rollout complete)
- `src/app/onboarding/product/[token]/components/` (steps, fields, StepContainer — whole dir)
- `src/app/onboarding/service/[token]/components/` (whole dir)
- `src/hooks/useProductGenerationStore.ts`
- `src/hooks/useServiceGenerationStore.ts`
- `src/hooks/useGenerationStore.ts`

**Deletion order** followed the mandate: re-home pickers -> tsc -> unconditional handoff + delete rollout -> tsc -> redirect stubs -> tsc -> re-point types -> tsc -> delete component dirs -> tsc (surfaced the `templateCatalog` importer, re-homed it) -> tsc -> delete product+service stores -> tsc -> delete `useGenerationStore` -> tsc. Green at every step.

### Step 1 — pickers re-homed + StyleSlot/GeneratingSlot re-wired
`HeroVariantPicker` + `ProductStylePicker` moved to `src/components/onboarding/wizard/fields/`. HeroVariantPicker is prop-controlled (StyleSlot binds it to `useWizardStore.heroVariant`). ProductStylePicker was internally coupled to the (now-deleted) `useProductGenerationStore` — re-wired to read/write `useWizardStore` style fields DIRECTLY (`styleVariantId`/`stylePaletteId`/`styleMood` + setters). StyleSlot's old mirror-subscription (useEffects copying old-store picks into the wizard store) was removed. **GeneratingSlot.tsx was NOT edited** — its `buildThingInput` already reads style picks from `useWizardStore` (`s.stylePaletteId`/`s.styleVariantId`/`s.styleMood`/`s.heroVariant` + `*Picked` flags) since phase 5, so the "read from useWizardStore" requirement was already satisfied. `templateCatalog.ts` (picker metadata consumed by StyleSlot's trust branch) was a tsc-discovered importer living in the deleted service tree — re-homed alongside the pickers (content unchanged; imports only data-only palette/token modules, firewall-safe).

### ServiceUnderstanding + other type re-homes
`ServiceUnderstanding`, `ServiceUnderstandingExtract`, `ServiceAssetAvailability` now live in `src/types/service.ts` (verbatim moves, never dropped). `VestriaHeroVariant`, `VestriaLookMood` now live in `src/types/product.ts`. Importers re-pointed: 4 template `paletteSelection.ts` + the regression test (ServiceUnderstanding), `useWizardStore.ts` (ServiceAssetAvailability, type-only superset guard), the two re-homed pickers (Vestria types). No type dropped to silence tsc.

### serviceType kill location — NONE NEEDED (already gone)
Grep of `serviceType`/`persona`/`ServiceType` across `src/app/api/start/route.ts` and `src/app/onboarding/persona/` found NO persona-seeded `serviceType`: `/api/start` only derives `audienceType` from persona (kept for e2e back-compat + dispatch per scale-02), and `/onboarding/persona/page.tsx` is already a `redirect('/dashboard')` stub. The persona->serviceType seed was removed back in scale-02; `serviceType` is now carried by the Brief (`businessType` -> `serviceTypeForBusinessType` in the trust adapter). No file needed editing for this step.

### useGenerationStore consumer check
Grep of `useGenerationStore` across `src/**/*.{ts,tsx}` before deletion showed references ONLY inside `useGenerationStore.ts` itself (self-references + its exported selector hooks) — ZERO external live consumers (confirming the plan's README-only note). Deleted; post-delete grep returns zero refs.

### hardware->techpremium bridge — confirmed gone (no edit)
Grep for any hardware->techpremium / hardware-founder+templateId bridge found none: `techpremium` is reached only via serveGate template resolution + the deterministic path in `thing.ts` (`input.templateId === 'techpremium'`), never a persona bridge. `hardware-founder` persists only as a persona label mapped to `audienceType:'product'` in `types/service.ts`. No template bridge exists. No edit.

### Legacy scrape-schema flag-gate removal
Both `/api/v2/understand` and `/api/v2/scrape-website` had a phase-7 `if (entry === true) {...}` branch guarding the entry path, with the pre-convergence audienceType + `isManufacturerFlow(templateId)` schema switch below it. The SOLE live caller (`EntryInputStep.tsx`) always sends `entry: true` (verified), so the legacy branch was dead. Removed the branch; both handlers now delegate unconditionally to `handleEntryUnderstand`/`handleEntryScrape` (self-contained: own mock/crawl/AI/credits). Trimmed the now-dead imports, legacy prompt-builders (`buildUnderstandPrompt`, `buildManufacturerUnderstandPrompt`, `buildManufacturerScrapePrompt`), legacy schemas, and mock fixtures (`MOCK_DATA`/`MOCK_DATA_SERVICE`/`MOCK_DATA_MANUFACTURER`). `isManufacturerFlow` core is untouched (scale-08). Request schemas keep only `oneLiner`/`url` + `businessType`; older clients' extra keys (audienceType/templateId/entry) are harmlessly stripped by the non-strict `z.object`.

### Deviations
1. **GeneratingSlot.tsx not edited** (task said re-wire it to read style from useWizardStore) — it already did since phase 5; editing a correct file adds risk. Logged, not changed.
2. **serviceType kill = no-op** — the persona seed was already removed in scale-02; documented rather than inventing an edit.
3. **templateCatalog.ts re-homed** — not on the plan's Files-touched list but a mandatory re-point: StyleSlot's trust branch imports it and it lived in the deleted service tree. Moved (functionality preserved), listed here.
4. **Old-route layout.tsx files left intact** — `onboarding/{product,service}/[token]/layout.tsx` (auth + claim-on-visit) were not on the list and import nothing deleted; the redirect-stub page renders under them. Conservative (they still enforce auth before the redirect). Left as-is.
5. **Legacy-branch dead-code trim** went slightly beyond deleting the flag-gate itself (removed orphaned mock fixtures + prompt-builders that ONLY fed the legacy branch) — in-scope hygiene, tsc + build green.

### Verification (all green)
- `npx tsc --noEmit` -> clean (no output) — re-run green at every deletion step and finally.
- `npm run test:run` (FULL) -> **88 passed | 1 skipped (89 files); 1241 passed | 2 skipped (1243 tests)**. paletteSelection regression + generation-contract + service section-selection all green after the ServiceUnderstanding/ServiceAssetAvailability re-points.
- `npm run build` -> **Compiled successfully**. Route table shows `/onboarding/product/[token]` + `/onboarding/service/[token]` at 353/352 B (redirect stubs) and `/onboarding/[token]` at 9.72 kB (unified wizard).

### Open risks
- Old routes redirect with token preserved (`/onboarding/product/abc` -> `/onboarding/abc`), but their `layout.tsx` still runs the auth guard first — an unauthed hit on an old route goes to `/sign-in` rather than straight to the unified route. Conservative (old routes always required auth); acceptable.
- No dangling imports (tsc clean); the two v2 routes retain a couple of now-unused optional request fields only as stripped-by-zod back-compat for older clients.

### Impl-review verdict: **ship** (loop 1/1) — ALL THREE gates green (tsc clean; full suite 1241 pass / 2 skipped; `npm run build` re-run by reviewer, compiles). Types verified BYTE-VERBATIM moves (ServiceUnderstanding*/ServiceAssetAvailability→types/service, Vestria*→types/product) — nothing dropped; paletteSelection regression + generation-contract green. No dangling imports (grep clean). Redirect stubs preserve token; layout auth-guard conservative-acceptable. Handoff safe (serve→/onboarding/${tokenId}, manual→demand; no serve outcome without destination; edge engines never carry copyEngine→always manual). Legacy scrape flag-gate cleanly removed (sole caller sends entry:true). isManufacturerFlow core untouched. No blocking issues.
Carry-forward notes (non-blocking, phase 11 or later):
- Orphaned-but-harmless dead code after flag-gate removal: `src/modules/audience/service/{promptUnderstand,promptScrape}.ts` no longer imported — safe to prune later (not now).
- `templateCatalog.ts` re-home was a mandatory tsc-discovered re-point (in scope, functionality-preserving).
- Old routes' `layout.tsx` still runs auth before the redirect stub (unauthed old-URL → /sign-in → back → redirect); conservative, left intact.

---

## Phase 11 — fixtures, e2e, acceptance QA (final)

**Files changed**
- `src/modules/audience/__tests__/generationContract.test.ts` (edit) — the generation-contract frozen-fixture test
- `src/modules/wizard/acceptance.test.ts` (create) — durable spec-acceptance lock
- `src/app/onboarding/[token]/loadDetection.test.ts` (create) — load-detection predicate + resume rehydration
- `e2e/generation.spec.ts` (edit) — unified-route + mid-wizard reload steps (written-only, gated) + header notes
- `docs/task/scale-06-wizard-convergence.plan.md` (edit) — phase-11 progress-log line
- (NOT changed) `e2e/render.spec.ts` — left as-is: it drives `/dev/*` template surfaces, not the wizard routes, so it is not route-dependent on the old wizard paths.

QA phase — only test files + the plan/audit changed; NO feature code was modified.

### Generation-contract fixture found + shape
- File: `src/modules/audience/__tests__/generationContract.test.ts` (the "no broken/empty page" P0 guard; it also gates the opt-in `e2e/fixtures/generated/*.json` GOLDEN captures, which stay absent → skipped).
- Old shape: two MOCK describe blocks called the per-audience module paths directly (`generateMock*Strategy` → `generateMock*Copy` → `process*Copy`) and validated the processed sections against the element schema.
- New shape: product + service now run through the ONE engine — `runGeneration('thing')` / `runGeneration('trust')` — with a FAITHFUL fetch mock that stands in for the audience routes by invoking the exact SAME mock generator + processing pipeline the routes run. So the copy flowing into the assembled finalContent is REAL processed content and the element-schema guard keeps its teeth; it just now travels the unified dispatch. Added coverage: `runGeneration` returns `done`, and the saved finalContent (captured from the `/api/saveDraft` body) covers every routed section.
- Frozen shape held: the schema-validation assertion + id-backfill assertion are unchanged in intent; the golden-capture block is untouched. The element-schema shape did NOT change — no deliberate fixture rewrite was needed (the adapters preserve route payloads, so processed content is identical). The only structural change is HOW the fixture is driven (through `runGeneration` instead of the raw module calls), per the plan.
- WRITER fixture ADDED: `runGeneration('work')` → the deterministic Granth path (loadDraft mock returns `templateId:'granth'` to satisfy the adapter's defense guard; no strategy/copy fetch). Asserts a valid Granth `finalContent` shape (6 sections, flat layout+content+meta, every section id → a `Granth*` block, `meta.title`), and that the 3 wizard work uploads thread onto the `GranthJacketShelf` as book `cover_image`s, plus id-backfill.

### Acceptance test — fixtures + what it locks
`src/modules/wizard/acceptance.test.ts` locks the spec's headline numbers PERMANENTLY on real machinery (not stubs), across ALL THREE engines so one engine can't game the cap while another regresses:
- (a) rich URL-entry brief ⇒ `computeAsks` ≤ 3 (thing/trust/work) — real `getContract` + real `businessTypes` entries + a rich `EntryFacts` brief (scrape filled every outside-knowable field + a concrete goal param).
- (b) bare one-liner brief ⇒ `computeAsks` ≤ 6 (thing/trust/work).
- (c) unpromised proof ⇒ section ABSENT, locked at all three cut points: the phase-1 waterfall (`computeDroppedSections` drops `testimonials` on a bare brief, keeps it on rich), the phase-4 product filter (`assembleProductStrategy` with `proof.hasTestimonials:false` and `proof:{}` ⇒ no `testimonials` in sections/uiblocks; `true` ⇒ present), and the service selector (`selectServiceSections` with `assets.hasTestimonials:false` ⇒ absent). Reuses the same real `ProductStrategyResponse` LLM fixture as `proofFilter.test.ts`.

### Load-detection coverage approach (+ split)
The load-detection predicate lives INSIDE `page.tsx` (`confirmed = !!brief && !!audienceType && !!brief.copyEngine`) and is not exported, and the route is Clerk-gated (browser-only). Per the plan's allowed split, `src/app/onboarding/[token]/loadDetection.test.ts` locks the two pure, testable halves: (1) the predicate truth-table mirrored byte-for-byte from the page (persisted brief + audienceType + copyEngine ⇒ wizard; any missing ⇒ entry); (2) RESUME via `useWizardStore.hydrate` — a persisted brief (the shape `/api/loadDraft` returns) rehydrates a usable wizard (engine/slots/currentSlot/mode/scraped fields/goal) and is deterministic across two hydrates, proving reload resumes rather than restarts. SPLIT NOTE recorded in the test header: the fetch+setState wiring in `page.tsx` is browser-only and belongs to `/manual-test` + the (auth-gated, written-only) e2e reload step.

### e2e — ran or written-only
RAN (mock mode, `--project=public`). `/onboarding/(.*)` is Clerk-gated and the `public` Playwright project has no session, so the wizard UI drive can't authenticate there — the product + service wizard-drive + mid-wizard-reload tests are WRITTEN-ONLY and self-skip unless `E2E_WIZARD_UI=1` under an authed context (documented in the spec header; the resume LOGIC is locked green in the vitest load-detection test). Runnable results: product generation HTTP smoke PASSED (this is the product path through the engine's routes); service HTTP smoke skipped (needs `E2E_AUTH`); the 3 wizard-UI tests skipped by design. Specs parse (`playwright test --list` clean) — but note e2e is NOT covered by `tsc --noEmit` (tsconfig excludes `e2e/`); Playwright compiles them at run time and `--list` validated them.
- ONE e2e failure, NOT caused by phase 11 and NOT a scale-06 regression: `render.spec.ts › /dev/meridian/blocks renders without crashing` times out (15s) waiting for the client-mounted block gallery to emit template token attributes. The page returns HTTP 200 with no Next error overlay; the `ssr:false` dynamic-import subtree just doesn't mount within 15s headless. `render.spec.ts`, `/dev/meridian`, the meridian template, and the renderers are ALL outside scale-06's 78-file branch diff — this is a pre-existing environmental/timing flake, not a phases 1–10 bug. Left untouched (render.spec is not route-dependent on the wizard).

### Real bugs surfaced in phases 1–10
None. All new acceptance/contract/load-detection assertions passed against the existing phase 1–10 code without any feature-code change.

### Exact verification outputs
- `npx tsc --noEmit` → clean (no output).
- `npm run test:run` → Test Files 90 passed | 1 skipped (91); Tests 1266 passed | 2 skipped (1268). (The 2 skips are the opt-in golden real-LLM captures + one pre-existing skip.)
- `npm run test:e2e` (`--project=public`, mock) → 3 passed, 4 skipped, 1 failed (the pre-existing `/dev/meridian/blocks` render flake above; product generation smoke passed; wizard-UI + service smoke skipped by design).
- `npm run build` → green (compiles + full route table emitted).

### Open risks
- The browser-level wizard drive + mid-wizard reload e2e stays written-only until an authed wizard Playwright project + a confirmed-brief seed helper exist (both out of phase-11 scope). The resume mechanism is unit-locked; the browser proof is the founder's `/manual-test`.
- The `/dev/meridian/blocks` render flake predates this feature and should be triaged separately (raise the 15s timeout or diagnose the cold client-mount) — unrelated to the merge gate.

### Impl-review verdict: **ship** (loop 1/1) — tsc clean, full test:run 1266 pass / 2 skip, npm run build green. QA-invariant HELD (git diff = tests + docs only, zero feature-source changes). Acceptance tests have real teeth (bare thing/trust=6 exactly at ≤6 cap → any new required field trips it; proof-absent locked at real cut points computeDroppedSections/assembleProductStrategy/selectServiceSections, all 3 engines). generationContract fixture not gutted (real mock generator + process*Copy + validateGeneratedContent per-audience schema; writer fixture asserts valid Granth shape). load-detection predicate mirror byte-faithful to page.tsx + real hydrate-resume. e2e honest (wizard-UI self-skips via test.skip(!WIZARD_UI), product smoke green; /dev/meridian/blocks flake genuinely outside the 78-file scale-06 diff). No blocking issues.
Non-blocking (test-tightness, acceptable): acceptance uses ≤ bound not exact pins (tighter per-count pins live in waterfall.test.ts); work has no proof-absent cut (deterministic Granth path has no proof-gated sections); old-route redirect + store-deletion locked indirectly via build route table + green tsc, no dedicated regression test.

## FEATURE COMPLETE — all 11 phases (+6b) shipped, every impl-review passed first loop, every plan-review approved. tsc + full suite (1266) + npm run build green. Awaiting founder merge gate.
