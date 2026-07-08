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
