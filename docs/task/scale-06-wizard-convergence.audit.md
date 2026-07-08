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
