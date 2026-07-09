# scale-07 — engine-owned structure convergence · PLAN (rev 2)

**Branch:** `feature/scale-07-structure-convergence`
**Spec:** `docs/task/scale-07-structure-convergence.spec.md`
**Depends:** scale-01 (coreSections/templateMeta/fit — built, unwired), scale-06 (wizard engine).

## Overview

Section lists stop being template property. A new engine-owned section grammar (engine core + Brief-required capability sections + awareness/asset ordering, generalizing the service pattern) replaces `MERIDIAN_PILOT_SECTIONS`/`VESTRIA_PILOT_SECTIONS` and the service ordering maps. A universal structure-confirm gate (7b) runs after strategy and before copy fan-out for single- and multi-page; deleting a section there deletes its copy and relaxes hard-fit. Multipage and fan-out re-key off the `multipage` capability (naayom collections path untouched), post-gen template swap goes live via `fit()`/`shortlist()` (meridian unlocked), and elementSchema's per-template layout-name keying dies — element lists come from the engine contract. This is the first runtime consumer of `Project.brief.structure` (persisted through the existing `saveDraft` partial-brief merge) and the scale-01 primitives.

**Two rollout/reality facts the implementer must hold (verified against current code):**

1. **There is NO per-engine wizard rollout flag.** `rollout.ts`/`WIZARD_ENGINES` were deleted in scale-06 phase 10; `/api/brief/confirm/route.ts:69-76` redirects EVERY engine to the unified wizard unconditionally. The only per-engine gate is `useWizardStore.slotsForEngine()` (`useWizardStore.ts:291-293`) filtering on `slotSkips` from `src/modules/engines/inputContracts.ts`. Trust users are already on the unified wizard. **Removing `'structure'` from `trustContract.slotSkips` (`inputContracts.ts:151`) IS the rollout** — once merged, every real service/trust user sees the 7b gate. Phase 4 does exactly that, deliberately (spec scope #3 wants 7b "for all"); the exposure is called out at the phase-4 gate and again at the phase-9 merge gate. See Q2.
2. **Vestria multipage is ALREADY BROKEN post-scale-06 — do not try to "preserve" it.** `setStrategy` (`useWizardStore.ts:461`) is never called anywhere in `src/`; `StructureSlot.tsx:10-15` only READS `strategy`/`sitemap` and never fires the strategy call. So both are always null when `GeneratingSlot.buildThingInput()` (`GeneratingSlot.tsx:71-72`) runs → the `if (input.strategy)` branch at `thing.ts:493` is dead → vestria falls through to the tail single-page fetch (`thing.ts:521-539`) and `runCopyAndSave`. `runFanOut` is unreachable (except DB-resume, never seeded), and the current 7b gate is cosmetic. Phase 3 RESTORES multipage fan-out; it is not a refactor of a working flow.

## Founder decisions (gates resolved 2026-07-09)

- **Q1 bespoke sections → explicit-trigger capabilities.** Mint NEW capability ids for vestria's non-mappable extras: `trust, industries, about, materials, process`. Each declared in `templateMeta.capabilitySections` by the template that renders it (vestria). They enter a NEW generation ONLY via explicit inclusion at the 7b structure gate — **do NOT add them to `requiredCapabilitiesFromBrief()` auto-inference** (no trigger rule yet; discovery-first). Nothing deleted; the 3 live pages render from stored content and are unaffected.
- **Q1 mappable sections → recommended mapping (auto-trigger OK, obvious rules):** `catalog→catalog`, `contact→lead-form`, meridian `pricing→packages`, meridian `cta→lead-form`. These MAY auto-enter via `requiredCapabilitiesFromBrief()` since their triggers are unambiguous.
- **Q2 trust 7b → accept immediate GA at merge.** Phase 4 removes trust's `structure` slotSkip; every real service/trust user sees the 7b gate at merge. Re-ack at phase-9 merge gate. No new rollout flag.
- **Q3/Q4/Q5 → proceed on planner defaults:** refresh goldens to converged lists; phase-8 element divergence = meridian list wins unless vestria adds a rendered field; swap stays same-engine only.
- **Live-page safety VERIFIED (scout):** render reads stored content; selectors run at generation time only. scalifix(surge)=SAFE (byte-identical + service not in phase-2), naayom(techpremium)=SAFE (never on vestria branch), golden-shadow(vestria)=SAFE (archetype-driven multipage, not single-page default). Convergence affects only NEW generations + some generation-time goldens.

**Scope note (new capability ids):** minting `trust/industries/about/materials/process` extends the scale-01 frozen `capabilityIds` vocabulary (`src/types/brief.ts`) — deliberate, founder-approved, discovery-driven. Phase 2 Files-touched gains `src/types/brief.ts` (+ `brief.schema.ts` if the capability enum is mirrored there).

## Progress log

- phase 1 engine-owned section grammar (behavior-preserving wiring): done (commit 84a43b5, review loops 1, ship, 1389 tests green; nit: import order, deferred — consts deleted in phase 2)
- phase 2 meridian/vestria core convergence + capability mapping: done (commit 41b61233, review loop 1, ship, 1437 tests green; interim: meridian new-gen 5-core until phase-4 step-0 Brief plumbing restores pricing/cta)
- phase 3 restore multipage fan-out + strategy-before-structure sequencing: done (commit 10372ac7, review loop 1, ship, 1449 tests green; charge-once + race-safe idempotency verified; open risks → phase 6 charge-dedup step 3b)
- phase 4 universal 7b gate (single-page mode + clamp law + trust GA): done (review loop 1, ship, 1472 tests green; module-bridge scrutinized sound; carryovers → phase 5 (route brief-passing + GeneratingSlot consolidation))
- phase 5 multipage keyed by capability (sitemap for all): pending
- phase 6 structure persistence + 7b deletion relaxes hard-fit: pending
- phase 7 template swap post-gen + meridian unlock: pending
- phase 8 element list from engine contract (kill layout-name keying): pending
- phase 9 acceptance QA + goldens: pending

---

## Phase 1 — Engine-owned section grammar (behavior-preserving wiring)

**Goal:** One module produces a section list from `(engine, brief, awareness/assets)`: frozen engine core (`engineCoreSections`) + capability-bound optionals + ordering. Generalizes the service pattern (awareness-ordered middle + capability-gated optionals + header/footer wrap). Wire both existing selectors through it with **zero output change** — template-specific extras pass through a temporary `extras` escape hatch that phase 2 deletes.

**Files touched:**
- `src/modules/engines/sectionGrammar.ts` (new)
- `src/modules/engines/sectionGrammar.test.ts` (new)
- `src/modules/audience/product/sectionSelection.ts` (edit — delegate to grammar; keep pilot lists as temporary extras input)
- `src/modules/audience/service/sectionSelection.ts` (edit — delegate to grammar; `AWARENESS_MIDDLE_ORDER`/`SURGE_MIDDLE_ORDER` become grammar ordering data)

**Steps:**
1. `sectionGrammar.ts`: pure, firewalled (no template imports). API sketch: `buildSectionList({ engine, brief?, ordering?, gates?, extras? }) → string[]`. Core from `engineCoreSections`; optionals enter only if capability required by Brief (or legacy gate flags: `hasTestimonials`, `format!=='quote-only'`, `hasClientLogos`, `hasCaseStudies` — the trust pattern from `selectServiceSections`); ordering table decides middle order; `[header, ...body, footer]` wrap where the core demands it.
2. Rewire `selectServiceSections(input)` to call the grammar with trust ordering maps + gates. Output must be byte-identical for every awareness × template × flag combo (assert in test against the current implementation's outputs, captured as fixtures).
3. Rewire `selectProductSections(opts)` to call the grammar; meridian/vestria current lists supplied via the temporary `extras` param so output is unchanged. Mark `extras` `@deprecated — removed in scale-07 phase 2`.
4. Callers (`parseStrategyProduct.ts:156`, `parseStrategyService.ts:41`, both mock generators) keep their signatures — untouched.
5. `work` engine: NOT wired (granth stays on its own path; keep work untouched).

**Equivalence fixture matrix (must be exhaustive, not spot-checks):**
- Trust default (hearth/lex): all 4 awareness states × `hasTestimonials` on/off × `format==='quote-only'` vs not.
- **Surge branch** (`sectionSelection.ts:68-96`): all 4 awareness states × `hasClientLogos` × `hasCaseStudies` × testimonials/format gates — asserting `logos`/`casestudies` gating and always-on `about`/`stats` survive verbatim.
- Product: meridian + vestria pilot lists via `extras`.

**Verification:** `npx tsc --noEmit` · `npm run test:run` (existing section-selection + wizard tests green unchanged) · new `sectionGrammar.test.ts` equivalence matrix green.

---

## Phase 2 — meridian/vestria core convergence + capability-section mapping  ✅ GATE RESOLVED

**Human gate RESOLVED (see Founder decisions above).** Concrete mapping to implement:
- New capability ids `trust, industries, about, materials, process` → declared in vestria `capabilitySections`; **explicit-trigger only** (NOT in `requiredCapabilitiesFromBrief` auto-inference).
- `catalog→catalog`, vestria `contact→lead-form` → auto-trigger OK.
- Meridian `pricing→packages`, `cta→lead-form` → auto-trigger OK.
- Add the 5 new ids to `src/types/brief.ts` `capabilityIds` (+ mirror in `brief.schema.ts` if enumerated there).

**Goal:** Same Brief ⇒ same section list under meridian and vestria (single-page). Delete the pilot lists and the phase-1 `extras` escape hatch; capability sections declared in `templateMeta.capabilitySections` are the ONLY per-template additions, and they enter only when the Brief requires the capability.

**Files touched:**
- `src/types/brief.ts` (edit — add `trust, industries, about, materials, process` to `capabilityIds`)
- `src/lib/schemas/brief.schema.ts` (edit — mirror new capability ids only if the enum is duplicated here)
- `src/modules/engines/sectionGrammar.ts` (edit — remove `extras`; capability→section resolution via templateMeta lookup passed in as data, keeping the module firewalled)
- `src/modules/audience/product/sectionSelection.ts` (edit — delete `MERIDIAN_PILOT_SECTIONS`/`VESTRIA_PILOT_SECTIONS`, pass Brief + templateMeta capabilitySections)
- `src/modules/templates/templateMeta.ts` (edit — capabilitySections entries per founder mapping: vestria gains trust/industries/about/materials/process/catalog/contact; meridian pricing/cta)
- `src/modules/templates/fit.ts` (edit — ensure `requiredCapabilitiesFromBrief` does NOT auto-infer the 5 explicit-trigger ids; catalog/lead-form/packages triggers unchanged)
- `src/modules/engines/structureConvergence.test.ts` (new — same Brief ⇒ identical section list meridian vs vestria single-page; capability-required Brief adds the capability section only where template declares it)
- `src/modules/templates/conformance.test.ts` (edit — strengthen: existing test checks block existence only; ADD assertion that every `capabilitySections` value resolves to a real block in BOTH renderers, and engine-core list convergence per template pair)
- `src/modules/prompt/mockResponseGeneratorProduct.ts` (edit only if it references the deleted constants; scout says it calls `selectProductSections` — expect no-op)
- `src/modules/audience/product/selectBlocks.ts` (edit only if the converged list surfaces sections a template's layout map lacks — expected none for thing-core since conformance is green)

**Steps:**
1. Land founder mapping in `templateMeta.capabilitySections` (+ absorb decisions documented inline).
2. Grammar: capability section appended iff Brief requires capability AND template declares evidence section; ordering per engine ordering table.
3. Delete pilot lists + `extras`; `selectProductSections` becomes a thin grammar call.
4. New convergence test + strengthened conformance assertions. Note: spec's "conformance turns red until cores converge" is aspirational vs as-built — the existing 51 tests check block existence, not list convergence, so we ADD the red-then-green assertion here rather than expecting existing red.
5. Vestria multipage page-archetype `allowedSections` untouched (multipage handled in phases 3/5); this phase converges single-page only.

**Golden blast radius (vestria single-page default shrinks 12 → core+capabilities — enumerate so impl-review can tell intended convergence diffs from regressions):**
- `src/modules/prompt/captureGolden.test.ts` fixtures (vestria section list embedded in golden output).
- `e2e/render.spec.ts` (any vestria section-presence assertions).
- Generation-contract frozen fixture (vestria shape).
Refresh deliberately; audit lists each diff with before/after section lists.

**Verification:** tsc · `npm run test:run` (conformance + convergence + dispatch regression + generation-contract green) · goldens refreshed per blast-radius list above, diffs in audit.

---

## Phase 3 — Restore multipage fan-out + strategy-before-structure sequencing

**Current-broken reality (restated so no one "preserves" it):** strategy/sitemap are never populated before the structure slot (`setStrategy` has zero callers; `StructureSlot` is read-only per its own header comment at `StructureSlot.tsx:10-15`), so `buildThingInput()` always sends `strategy:null, sitemap:null`, `thing.ts:493` never takes the multipage branch, and every vestria run degrades to single-page `runCopyAndSave` via the tail fetch (`thing.ts:521-539`). This phase makes the gate real again AND fixes sequencing in one move.

**Goal:** Strategy fetch runs when the wizard reaches the `structure` slot (populating `setStrategy`/`setSitemap`), so the gate renders real strategy + sitemap and the user's edits are what generation consumes. `GeneratingSlot` then receives non-null `strategy`/`sitemap` → the `input.strategy && input.sitemap` branch in `thing.ts` goes live → `runFanOut` is reachable again for multipage templates. GeneratingSlot becomes copy fan-out only.

**Files touched:**
- `src/hooks/useWizardStore.ts` (edit — strategy-fetch action + status state (`idle|fetching|done|error`), calling the existing `setStrategy`/`setSitemap`; `slotsForEngine` untouched this phase)
- `src/components/onboarding/wizard/StructureSlot.tsx` (edit — trigger/await strategy fetch on mount when absent, replace neutral placeholder at :75-84 with a real loading state; render real data; update the header comment — the sourcing deviation is resolved here)
- `src/modules/wizard/generation/thing.ts` (edit — extract the strategy call (incl. sitemap clamp path) into an exported `runStrategy(input)` step callable pre-gate; `runThingGeneration` keeps the `input.strategy` branch as the PRIMARY path and the tail fetch as fallback for structure-skipping flows)
- `src/modules/wizard/generation/index.ts` (edit — export/plumb `runStrategy` if the split changes the module surface)
- `src/components/onboarding/wizard/GeneratingSlot.tsx` (edit — if `runGeneration` args/flow change; `buildThingInput` already forwards store strategy/sitemap, so possibly no-op)

**Steps:**
1. Extract strategy call from `thing.ts` into `runStrategy(input)` (same payload builder, same credit charge, same clamp); on success the CALLER (wizard store action) writes `setStrategy(result)` + `setSitemap(result.sitemap)`.
2. `StructureSlot` mounts → if no strategy and status idle, kick the store's strategy-fetch action; show progress; on result render editable structure (existing edit UI is fine this phase — UX changes are phase 4).
3. Fan-out (`runFanOut`) / `runCopyAndSave` read the store's confirmed structure — a section/page absent from confirmed structure gets NO copy call.
4. Idempotency: back-navigation must not double-fetch strategy (guard on status; no second credit charge).
5. Error path: strategy fetch failure at the slot shows retry, never traps the user; credit-fail surfaces the same way GeneratingSlot does today.
6. `trust.ts`/work untouched this phase (thing engine only).

**Verification:** tsc · `npm run test:run` (wizard store + generation tests) · manual, IN ORDER: (a) FIRST re-establish that vestria multi mode reaches `runFanOut` at all — `npm run dev`, vestria onboarding shows populated structure gate, confirm, verify fan-out path executes (per-page copy calls, multipage finalContent saved); (b) THEN the deletion assertion — remove a page at the gate ⇒ no copy generated for it; (c) meridian OUTPUT unchanged; strategy now fetched at structure slot (meridian's `thing` contract has `slotSkips=[]`, so it ALSO hits the structure slot — the fetch moving pre-gate means meridian fetches strategy there too, then `input.strategy` truthy → `input.sitemap?.length` false → `runCopyAndSave`).

**Known intermediate wart (phase 3 → phase 4 window):** meridian's structure slot fetches strategy but has no single-page UI yet (archetypes empty for non-vestria) — cosmetic only, tests still green; phase 4's single-page mode fills it.

---

## Phase 4 — Universal 7b gate: single-page mode + clamp law + trust GA  ✅ GATE RESOLVED

**Human gate RESOLVED (Q2 = accept immediate GA):** remove `'structure'` from `trustContract.slotSkips` (`inputContracts.ts:151`). Every real service/trust user sees the 7b gate at merge; re-confirmed at phase-9 merge gate. No new rollout flag.

**Goal:** Structure confirm works for single-page (section list + order, required locked — hero first, CTA present where core demands; optionals toggle OFF only, no adds; default-accept in 1 tap). `clampSitemap` law extends to single-page (slugs never AI, home forced). Trust engine stops skipping the structure slot.

**Files touched:**
- `src/components/onboarding/wizard/StructureSlot.tsx` (edit — single-page mode: one section list, toggle-off optionals, locked required, no add-section in single mode, 1-tap accept)
- `src/modules/audience/product/strategy/parseStrategyProduct.ts` (edit — `clampSitemap` law generalized: single-page path clamps the flat section list — unknown dropped, dupes deduped, required forced present/ordered, slugs never from AI)
- `src/modules/audience/service/strategy/parseStrategyService.ts` (edit — trust strategy output feeds the gate; confirmed structure filters sections before copy)
- `src/modules/engines/inputContracts.ts` (edit — remove `structure` from trust `slotSkips` per gate decision above; work KEEPS the skip)
- `src/hooks/useWizardStore.ts` (edit — single-page structure state + toggles; `slotsForEngine` picks up trust change automatically)
- `src/modules/wizard/generation/trust.ts` (edit — consume confirmed structure; skipped section ⇒ no copy; strategy-before-structure pattern from phase 3 reused for trust)
- `src/hooks/useWizardStore.test.ts` or nearest wizard test file (edit — trust slot order now includes structure; single-page toggle fixtures)

**Steps:**
0. **Explicit Brief plumbing (phase-2 carryover — do NOT skip):** pass the resolved `brief` (+ derived required capabilities) into `selectProductSections` at the single-page call site `parseStrategyProduct.ts:156` (today passes `{ templateId }` only). Phase 2 made meridian `pricing`/`cta` Brief-gated capability sections; without this plumbing meridian new-gen pages stay 5-core (no pricing/cta). This step restores them: an M1/pricing Brief re-surfaces `cta`/`pricing`. Mirror for service at `parseStrategyService.ts:41` if needed.
1. Single-page gate UI: grammar-produced list rendered with required sections locked (from engine core), capability/gated optionals toggleable off, reorder within allowed bounds, "Looks good" = default accept.
2. Wire toggle-off into confirmed structure → grammar/copy prompt sees the reduced list (acceptance: testimonials off ⇒ zero testimonial copy generated).
3. Clamp: single-page confirmed list passes through the same law as multipage pages.
4. Trust: un-skip structure (per gate decision); trust engine gets its own `runStrategy`-before-slot wiring mirroring phase 3's thing wiring.
5. Acceptance fixture exercises trust via the wizard engine directly in tests regardless of the Q2 outcome (if skip stays, fixture drives `slotsForEngine('trust')` with the skip removed in-test to keep the wiring honest).

**Verification:** tsc · `npm run test:run` · new test: single-page service fixture shows 7b; toggling testimonials off ⇒ no `testimonials` section in copy payload · manual dev pass on thing single-page AND one trust flow.

---

## Phase 5 — Multipage keyed by capability, not templateId (sitemap for all)

**Goal:** `multipage` becomes a capability question. `getPageArchetypesForTemplate` vestria literal → keyed off template `multipage` capability + businessType structure default; `runFanOut`'s `explicitVestria` (`thing.ts:249`) and hardcoded `templateId:'vestria'` payloads re-keyed. Naayom collections path (`multiPageAssembly.ts`) untouched.

**Files touched:**
- `src/modules/audience/product/pageArchetypes.ts` (edit — :115-120 re-key: template declares `multipage` capability + has archetypes ⇒ return them; else null)
- `src/modules/businessTypes/config.ts` (edit — add `structureDefault: 'single' | 'multi'` to `BusinessTypeEntry` + all 6 entries; default `'single'`)
- `src/app/api/audience/product/strategy/route.ts` (edit — :121,146 detection via new key)
- `src/modules/audience/product/strategy/parseStrategyProduct.ts` (edit — :144 detection via new key)
- `src/components/onboarding/wizard/StructureSlot.tsx` (edit — :51 detection via new key; multi vs single mode chosen by capability + businessType default + Brief `structure.mode`)
- `src/modules/wizard/generation/thing.ts` (edit — :249 `explicitVestria` → multipage-capability check; :294,310,332,345,436,448,509 `templateId:'vestria'` → `input.templateId`)
- `src/modules/audience/product/pageArchetypes.test.ts` or nearest (new/edit — re-key regression: vestria still multi, meridian still single, hypothetical multipage template resolves)
- `src/app/api/audience/product/strategy/route.ts` (edit — carryover (a): forward brief + requiredCapabilities into assembly so runtime meridian regains cta/pricing)
- `src/components/onboarding/wizard/GeneratingSlot.tsx` (edit — carryover (b): forward strategy/confirmedSections via store `buildTrustInput`, then delete `trust.ts` pregate bridge)

**Phase-4 carryovers folded in (do NOT skip):**
- **(a) Complete step-0 at the ROUTE:** `src/app/api/audience/product/strategy/route.ts` must forward the resolved `brief` (+ derived required capabilities) into `assembleProductStrategy`/`selectProductSections` so RUNTIME meridian regains cta/pricing (phase 4 plumbed the selector/assembler side + tested it, but the route still passes `{templateId}` only ⇒ runtime meridian is 5-core until this lands). Add a test asserting a runtime meridian M1/packages strategy call yields cta/pricing.
- **(b) Consolidate the trust bridge:** while `thing.ts`/wizard generation is open, add the 3-line forward to `GeneratingSlot.tsx` (`strategy: s.strategy`, `confirmedSections: confirmedStructureBody(s)`) via the store's `buildTrustInput`, then DELETE the module-scoped `pregate` bridge in `trust.ts`. Add `src/components/onboarding/wizard/GeneratingSlot.tsx` to Files touched for this. Keep charge-once behavior (tests must still show exactly 1 `/strategy` call end-to-end).

**Steps:**
1. Single helper `isMultipage(templateId, brief?)` (lives beside `templateMeta`/`fit`, firewalled) = template capability ∧ (Brief `structure.mode==='multi'` ∨ businessType default); all 3 detection sites + fan-out branch call it.
2. Replace payload hardcodes with the actual `input.templateId` (today always vestria on that path — behavior identical, key honest).
3. `structureDefault` reader check (**verified at plan time**): `BusinessTypeEntry` is a plain interface (`config.ts:22-33`) with NO zod/exhaustive entry validation; 18 importers consume keys/labels/engine fields only (`entryClassify.schema.ts`, `extraction/index.ts`, `serveGate.ts`, `fit.ts`, wizard components, tests). Adding a required field compiles once all 6 entries in the same file set it; no runtime validator rejects it. Implementer re-greps `businessTypes/config` importers to confirm nothing new landed.
4. Regression: run the naayom/collections flow tests (`multiPageAssembly` path) — must be untouched; vestria multipage e2e/fixtures identical.

**Verification:** tsc · `npm run test:run` (incl. multipage/collections tests) · grep gate: zero remaining `'vestria'` literals in `thing.ts`/detection sites (audit lists survivors with justification).

---

## Phase 6 — Structure persistence + 7b deletion relaxes hard-fit

**Goal:** The user's confirmed structure is PERSISTED to `Project.brief.structure` and requirements recompute from it, not the raw Brief: user drops gallery at the gate ⇒ `gallery` leaves required capabilities ⇒ more templates eligible for swap.

**Write-path correction (vs rev 1):** `/api/brief/confirm/route.ts` is the PRE-wizard serve gate (`:57-77`) — it runs once, before the wizard exists, and cannot receive a structure the user confirms mid-wizard at 7b. It is NOT touched. The real writer is the client-side structure confirm → server via the EXISTING `saveDraft` partial-brief merge: `saveDraft/route.ts:123-128` already accepts `body.brief`, validates with `BriefSchema.partial()`, and shallow-merges over the stored brief (same pattern `thing.ts:248` uses for `brief:{goal}`). Structure is a top-level brief key, so shallow-merge replaces it cleanly.

**Schema correction (vs rev 1):** `BriefSchema.structure` today is `{mode, pages: string[]}` (`brief.schema.ts:57-62`) — page names only, NO per-section data, so it cannot carry the surviving-sections list this phase needs. Extend it (additive, optional fields — no migration; `brief` is a JSON column):
- `mode: 'single' | 'multi'` (unchanged)
- `pages` becomes **OPTIONAL** (`pages?: string[]`, kept for back-compat readers), PLUS `pageDetails?: Array<{ archetypeKey: string; slug: string; sections: string[] }>` for multi
- `sections?: string[]` for single-page confirmed list

**Why `pages` MUST go optional (blocker, not style):** `saveDraft/route.ts:124` validates with `BriefSchema.partial()`, which is SHALLOW — it makes top-level `structure` optional but does NOT relax `structure`'s inner keys. If `pages` stays required, the single-page confirm payload `{ mode:'single', sections:[...] }` (no `pages` — single-page has no page list) fails `safeParse` → `briefResult.success` false → the brief write is silently skipped by saveDraft's "never fail autosave over brief" path at `:125` → `Project.brief.structure` NEVER persists for single-page → this phase's deliverable is a no-op and phase 7's `shortlist()` reads empty structure. Making `pages` optional fixes it; existing rows stay valid either way since `classify.ts:171` writes `pages: []`. (Rejected alternative: mandate single-page confirm always sends `pages: []` — uglier, leaves the schema trap armed.)

**Files touched:**
- `src/lib/schemas/brief.schema.ts` (edit — extend `structure` per above, incl. `pages` → optional; existing rows parse unchanged since new fields optional and `classify.ts:171` rows carry `pages: []`)
- `src/modules/templates/fit.ts` (edit — add `requiredCapabilitiesFromStructure(confirmed)` deriving capability set from surviving sections/pages; `fit()`/`shortlist()` reused as-is)
- `src/components/onboarding/wizard/StructureSlot.tsx` (edit — on confirm: POST `saveDraft` with `brief: { structure }` (mode + sections / pageDetails) and recompute requirements client-side)
- `src/hooks/useWizardStore.ts` (edit — confirm action carries the saveDraft brief patch; store holds the recomputed required set)
- `src/modules/templates/fit.test.ts` (edit — drop-gallery ⇒ shortlist grows fixture; structure-schema round-trip fixture)

**Steps:**
1. Map section → owning capability via inverted `templateMeta.capabilitySections` + capability section names from grammar; core sections map to no capability.
2. Confirm handler: persist structure JSON via saveDraft brief patch (first real writer of `Project.brief.structure`); recompute + store required set.
3. Structural capabilities (multipage/bilingual) stay trust-on-declaration.
3b. **Charge-dedup (carried from phase 3 open risk):** persisting strategy/structure lets a reload-across-sessions resume the confirmed structure WITHOUT re-charging strategy credits — guard the strategy re-fetch on persisted `Project.brief.structure`/stored strategy so abandon-after-structure + reload doesn't double-charge.
4. Guard: an autosave from elsewhere must not clobber structure — saveDraft's shallow-merge only replaces `structure` when the patch includes it (verified: merge is key-wise at `saveDraft/route.ts:126-128`); note in audit.

**Verification:** tsc · `npm run test:run` (fit tests: before/after drop; brief schema parse of old `{mode,pages}` rows; single-page `{mode:'single', sections}` patch passes `BriefSchema.partial()` safeParse) · manual: confirm gate, inspect `Project.brief.structure` row in DB.

---

## Phase 7 — Template swap post-gen + meridian unlock

**Goal:** Swap shortlist = `shortlist()`/`fit()` over the site's ACTUAL sections (from phase 6 derivation) ⇒ only templates rendering every section this site has. Replace EditHeader's static locked label with a real swap popover; unlock meridian.

**Files touched:**
- `src/app/edit/[token]/components/layout/EditHeader.tsx` (edit — :36-54: remove locked-label branch :40-51; product templates route to swap-capable popover)
- `src/app/edit/[token]/components/ui/VestriaThemePopover.tsx` (edit — restore/add template switcher section, list = fit-filtered shortlist)
- `src/app/edit/[token]/components/ui/ServiceThemePopover.tsx` (edit — existing switcher list becomes fit-filtered instead of all-service)
- `src/app/edit/[token]/components/ui/TemplateSwapList.tsx` (new — shared fit-filtered switcher UI used by both popovers; reuse ServiceThemePopover's swap mechanism, don't rebuild)
- `src/modules/templates/swap.test.ts` (new — golden-style: swap meridian↔vestria on converged fixture loses zero sections, changes zero words; ineligible template absent from shortlist)

**Steps:**
1. Derive current site's section set from store layout; `requiredCapabilitiesFromStructure` → `shortlist(brief-equivalent)`; same-engine constraint enforced (engine is copy-shape, swap never crosses engines).
2. Swap action = update `templateId` (+ template default variant/palette) only; content untouched — assert zero-word-change in test by deep-equal of content before/after.
3. Meridian unlock: locked branch deleted; product non-vestria uses the same popover.
4. Dual-renderer: swap changes which blocks render — dispatch regression + conformance guarantee both renderers resolve; no block edits in this phase.

**Verification:** tsc · `npm run test:run` (swap test, dispatch regression, paletteSelection regression) · manual: edit page swap meridian→vestria→meridian, visual parity vs published preview.

---

## Phase 8 — Element list from engine contract (kill layout-name keying)

**Goal:** The §3 invariant "copy depends on engine+Brief only" becomes true in code: `getCompleteElementsMap()` stops resolving element lists via template-specific layout NAMES (`MERIDIAN_LAYOUT_NAMES`/`VESTRIA_LAYOUT_NAMES` spread into a flat record). Element list keys off (engine, sectionType); layout names remain only for block DISPLAY resolution.

**Layout-name maps SURVIVE this phase — maps NOT deleted; `selectBlocks.ts`/`registration.test.ts` untouched.** `VESTRIA_LAYOUT_NAMES`/`MERIDIAN_LAYOUT_NAMES` are still imported by `selectBlocks.ts:8` (block display resolution) and `vestria/registration.test.ts:15`. Phase 8 kills only their use as element-list KEYING; do not over-eagerly delete the maps or touch those two files.

**Editor-runtime callers — intentionally KEPT on the layout path (no engine context at editor add-section/add-element time):**
- `useElementCRUD.ts:116` calls `getLayoutElements(layoutType)` — stays on the layout path; the layout fallback in `layoutElementSchema.ts` survives for exactly this caller.
- `useSectionCRUD.ts:419` calls a LOCAL hardcoded `getRequiredElements` map defined at `:458` (NOT the module fn) — unrelated, untouched.
- `editStore/validationActions.ts:853` local `getRequiredElementsForLayout` — layout-based, local, untouched.
These are deliberate non-migrations, not misses; audit restates this.

**Files touched:**
- `src/modules/engines/elementContracts.ts` (new — per-engine section→element-list contract; seeded from today's schemas so output is identical for converged sections)
- `src/modules/sections/elementDetermination.ts` (edit — :128/:192/:224: `getRequiredElements` resolves via engine contract; layout param demoted to display-only)
- `src/modules/sections/layoutElementSchema.ts` (edit — :329 `getLayoutElements` delegated/retired for engine-covered GENERATION paths; kept as-is for work/legacy paths AND the editor callers listed above)
- `src/modules/audience/product/elementSchema.ts` (edit — meridian/vestria element unions reconciled into the engine contract; any per-template divergence for the SAME logical section is a defect to resolve here, decision documented in audit)
- `src/modules/sections/elementDetermination.test.ts` or nearest generation-contract test (edit — frozen-fixture: same Brief ⇒ same element map under meridian and vestria)

**Steps:**
1. Diff meridian vs vestria element lists per shared section; where they diverge, pick the union/superset per founder guidance if contentious (flag in audit; small deltas resolved by planner rule: contract = current meridian list unless vestria adds fields the block renders).
2. Introduce contract lookup ahead of layout-name lookup on the GENERATION path only; work engine + service legacy + editor-runtime callers fall through to old path (untouched).
3. Both renderers unaffected structurally (element schema feeds GENERATION, not render) — but goldens must be re-run since prompts see element lists.

**Verification:** tsc · `npm run test:run` (generation contract frozen-fixture, golden tests — refresh only if diff is the intended convergence, list in audit) · `DEBUG_ELEMENT_SELECTION=true` spot-check dev log for one meridian + one vestria generation.

---

## Phase 9 — Acceptance QA + goldens  ⛔ HUMAN GATE (merge)

**Goal:** Prove the spec's acceptance list end-to-end; founder signs off before merge to main. **Merge = live rollout:** this is the moment trust users get the 7b gate (phase 4) — re-confirm Q2's answer here.

**Files touched:**
- `e2e/generation.spec.ts` (edit — structure-gate step in flow if selectors changed)
- `src/modules/engines/structureConvergence.test.ts` (edit — final acceptance fixtures)
- `docs/task/scale-07-structure-convergence.plan.md` (edit — progress log)

**Steps / checklist:**
1. Same Brief ⇒ same section list meridian vs vestria single-page (test green).
2. Post-gen swap: zero sections lost, zero words changed (swap test green).
3. 7b shown for single-page service fixture; testimonials toggle-off ⇒ no testimonial copy.
4. Vestria multipage reaches `runFanOut` (restored in phase 3); page removed at gate ⇒ no copy.
5. Conformance green honestly (converged cores + capabilitySections assertions).
6. Multipage keyed by capability; naayom collections flow manually verified in dev.
7. Golden blast-radius list from phase 2 reconciled: every refreshed fixture (`captureGolden.test.ts`, `e2e/render.spec.ts`, generation-contract frozen fixture) has its diff explained in audit.
8. Dual-renderer parity spot-check via `/manual-test` P0 subset; `npm run build` green (not just next build).
9. **Human gate:** founder reviews checklist, re-acks trust-7b GA exposure, merges (plain merge, pushes manually; deploy-watcher takes over).

**Verification:** tsc · `npm run test:run` · `npm run test:e2e` (mock mode) · `npm run build`.

---

## Unresolved questions — ALL RESOLVED 2026-07-09

1. ~~Q1 vestria extras mapping~~ → RESOLVED: explicit-trigger capabilities (mint trust/industries/about/materials/process ids; catalog→catalog, contact→lead-form, pricing→packages, cta→lead-form). See Founder decisions.
2. ~~Q2 trust 7b GA~~ → RESOLVED: accept immediate GA at merge.
3. ~~Vestria golden refresh~~ → RESOLVED: refresh goldens to converged lists.
4. ~~Phase 8 element divergence~~ → RESOLVED: meridian list wins unless vestria adds a rendered field.
5. ~~Swap same-engine only~~ → RESOLVED: confirmed, cross-engine swap forbidden.
