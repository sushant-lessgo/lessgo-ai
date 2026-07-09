# scale-08 businessType config — audit

## Phase 1 — voiceHint in config + voice re-key end-to-end

### Files changed
- `src/modules/businessTypes/config.ts`
- `src/modules/businessTypes/config.test.ts`
- `src/modules/audience/product/voice.ts`
- `src/modules/audience/product/voice.test.ts` (NEW)
- `src/modules/wizard/generation/thing.ts`
- `src/modules/wizard/generation/thing.test.ts`
- `src/modules/generation/multiPageAssembly.ts`
- `src/hooks/useWizardStore.ts`
- `src/app/api/audience/product/strategy/route.ts`
- `src/app/api/audience/product/generate-copy/route.ts`

### Per-file changes

**config.ts** — Added optional `voiceHint?: string` to `BusinessTypeEntry` (documented: plain string to avoid a config↔audience cycle; thing-engine only). Set `saas.voiceHint = 'modern-tech'`, `manufacturer.voiceHint = 'tailored-trade'`. Scrubbed the stale "Nothing in the app imports this yet" header note (now lists serve gate / wizard hydrate / voice derivation as live consumers).

**config.test.ts** — Added a test: every `copyEngine === 'thing'` entry with a `voiceHint` has a value in the ProductVoiceId union `['modern-tech','tailored-trade']`; manufacturer=tailored-trade, saas=modern-tech.

**voice.ts** — Added `productVoiceForBusinessType(key?: string|null): ProductVoiceId` — reads `businessTypes[key].voiceHint`, returns it when valid, else `'modern-tech'`. Imports `businessTypes` from config (plain module, no cycle — config imports only `@/types/brief` + goals vocab). Added a firewall note to the header.

**voice.test.ts** (NEW) — Unit: manufacturer→tailored-trade, saas→modern-tech, undefined/null→modern-tech, garbage/agency(no voiceHint)→modern-tech.

**thing.ts** — Added `businessTypeKey?: string` to `ThingGenerationInput`. `buildStrategyPayload` now sends `brief` whenever a goal OR a businessType key exists (goal + businessType merged into one brief object). `buildCopyPayload` adds `businessType: input.businessTypeKey`. `buildOnboardingData` persists `businessTypeKey`. The multipage `ob` (MultiPageOnboardingData) construction carries `businessTypeKey`. `runFanOut` copy body adds `businessType: ob.businessTypeKey ?? 'manufacturer'` (transitional fallback for in-flight resumable drafts). Did NOT touch the `isManufacturerFlow` field-remap forks (buildStrategyPayload isMfr relabel, buildCopyPayload remap, saveFC gates, effectiveFeatures) — those are Phase 2; the `isManufacturerFlow` import stays.

**thing.test.ts** — Strategy/copy mirrors extended with optional `brief.businessType` / top-level `businessType`; mirror's `brief.goal` made optional (brief can now carry businessType alone). MANUFACTURER strategy test now sets `businessTypeKey:'manufacturer'`. New asserts: strategy payload carries `brief.businessType`; brief sent with businessType-only (no goal); no brief when neither present; copy payload carries `businessType`; multipage fan-out copy body carries `businessType:'manufacturer'`.

**multiPageAssembly.ts** — Added optional `businessTypeKey?: string` to `MultiPageOnboardingData`.

**useWizardStore.ts** — `buildThingInput` passes `businessTypeKey: s.businessTypeKey ?? undefined`.

**strategy/route.ts** — Replaced the `isManufacturerFlow(data.templateId)` voice fork with `productVoiceForBusinessType(data.brief?.businessType)`. Dropped the `isManufacturerFlow` import (its only use in this route was voice); now imports `productVoiceForBusinessType` from voice.ts.

**generate-copy/route.ts** — Added `businessType: z.string().optional()` to the request schema. Replaced `templateId === 'vestria'` voice line with `productVoiceForBusinessType(businessType)`. Kept `templateId` accepted-but-unused (removed from destructure since no longer read; schema field + comment updated to say accepted-but-unused post-re-key). Updated the step-3 prompt comment.

### Step 8 — businessTypeKey population finding (HARD CHECK)
PASS. `businessTypeKey` is SET only in `useWizardStore.hydrate` (`:606`) from `brief.businessType`. The wizard hydrates from the DB Project's persisted `brief` + `templateId`, written together by `/api/brief/confirm` (`:60-68`) ONLY on a `decideServe` SERVE outcome. `decideServe` (serveGate.ts:91,136) resolves ANY template — including vestria — only when `businessType` is KNOWN (∈ businessTypes). Therefore a resolved `templateId: 'vestria'` always coexists with `brief.businessType: 'manufacturer'`, so hydrate always sets `businessTypeKey`. No vestria/manufacturer entry path can reach generation without it. Voice fallback to modern-tech cannot silently occur on a served vestria run.

### Deviations
- Did NOT add `businessTypeKey` to the default `baseInput()` in thing.test.ts (would break the existing `'brief' absent when no intent` assert, since brief is now also emitted for businessType-only). Added it per-test instead. Conservative, in-scope.
- generate-copy: removed `templateId` from the handler destructure (unused after re-key; tsc flags unused vars). The schema field + senders are untouched — templateId remains accepted-but-unused per DECIDED note.

### Test results
- `npx tsc --noEmit`: clean.
- Targeted (`vitest run thing config voice`): 4 files, 38 tests passed.
- Full `npm run test:run`: 97 passed | 1 skipped (98 files); 1554 passed | 2 skipped (1556 tests).

### Open risks
- None for Phase 1. Legacy in-flight multipage drafts persisted before this change resume with `ob.businessTypeKey` undefined → fan-out falls back to `'manufacturer'` (correct today, the only multipage type). Documented transitional.

---

## Phase 2 — melt thing.ts forks, StyleSlot, selectBlocks, service.ts; delete manufacturerFlow.ts; grep-gate

### Files changed
- `src/modules/wizard/generation/thing.ts`
- `src/modules/wizard/generation/thing.test.ts`
- `src/components/onboarding/wizard/StyleSlot.tsx`
- `src/modules/audience/product/selectBlocks.ts`
- `src/types/service.ts`
- `src/modules/audience/product/manufacturerFlow.ts` (DELETED)
- `src/modules/businessTypes/pipelineGuards.test.ts` (NEW)
- `src/lib/schemas/understand.schema.ts` (comment scrub)
- `src/lib/schemas/scrapeWebsite.schema.ts` (comment scrub)
- `src/lib/schemas/extraction/index.ts` (comment scrub, lines 5 + 67)
- `src/lib/schemas/extraction/manufacturer.ts` (comment scrub)
- `src/app/api/v2/understand/route.ts` (comment scrub)
- `src/app/api/v2/scrape-website/route.ts` (comment scrub)
- `src/modules/audience/README.md` (comment scrub)

### Per-file changes
- **thing.ts**: removed `isManufacturerFlow` import; added `businessTypes` + `BusinessTypeKey` import. New local `isManufacturerInput(input)` derives the field-remap flag from `businessTypes[input.businessTypeKey]?.extractionSchemaKey === 'manufacturer'` — used at `buildStrategyPayload`, `buildCopyPayload`, and the images-categories pick (:464). `saveFC` hero-variant + style-reapply gates re-keyed from `isManufacturerFlow(templateId)` to the already-computed `multipageTemplate` (`isMultipage`) — scale-07 precedent (style pickers ship with the multipage pilot; capability, not businessType). Scrubbed the scale-07 comment artifact (was `templateId === 'vestria'` literal → "was the vestria hardcode").
- **thing.test.ts**: added a negative assert — `templateId:'vestria'` + `businessTypeKey:'saas'` does NOT remap (SaaS features/categories/audiences win, no whatYouMake), proving the key moved to config not template; asserted on both strategy and copy payloads.
- **StyleSlot.tsx**: `isManufacturerFlow` import → `isMultipage` (plain module, client-safe — pageArchetypes has no 'use client'); local `isMfr` renamed `showVestriaPickers = isMultipage(templateId ?? null)`.
- **selectBlocks.ts**: replaced the `templateId === 'vestria' ? … : …` ternary with a `LAYOUTS_BY_TEMPLATE` Record lookup defaulting to Meridian — dispatch-as-data, no `===` literal.
- **service.ts**: `usesTemplateModule` product branch → `PRODUCT_TEMPLATE_MODULE_IDS` membership check; `palettesForTemplate` if/else chain → `PALETTES_BY_TEMPLATE` Record with hearth default. Pure mechanical, behavior unchanged.
- **manufacturerFlow.ts**: DELETED.
- **Comment scrubs**: reworded `isManufacturerFlow(templateId)` / manufacturer-by-template mentions to reference the businessType `extractionSchemaKey` keying instead. README line 18 vestria literal softened to "for the Vestria template" (kept accurate — sectionSelection.ts, out of scope, genuinely keys on templateId).

### isManufacturerFlow-reader grep (before delete)
`grep -rn "isManufacturerFlow" src/` before edits → CODE readers: `thing.ts` (import + 5 uses), `StyleSlot.tsx` (import + 1 use). All others were comments (extraction/index.ts:5,67, manufacturer.ts:7, scrapeWebsite.schema.ts:78, understand.schema.ts:17, v2 understand/scrape routes). Both code readers re-keyed before deleting the helper; post-edit grep shows zero `isManufacturerFlow` outside the guard test's own text and the config.ts:4 historical note (substring `manufacturerFlow`, not `isManufacturerFlow` — does not match the guard).

### Guard-test allowlist contents + rationale
`pipelineGuards.test.ts` walks `src/` (skips `*.test.*`, `*.md`). Asserts:
- (a) zero `isManufacturerFlow` — NO allowlist.
- (b) `templateId === 'vestria'` / `'vestria' === templateId` (regex anchored on the `templateId ===` identifier form) only in:
  - RENDER_LAYER_ALLOWLIST: `app/edit/[token]/components/ui/LayoutChangeModal.tsx` — legitimate editor UI gate (only vestria hero sections offer the hero-layout swap).
  - KNOWN_COMMENT_ARTIFACTS: `modules/audience/product/voice.ts` — a Phase-1 DOC COMMENT (line ~119) still names the old fork it replaced; voice.ts is NOT in this phase's Files-touched list, so the comment is left for a follow-up scrub. Not a live fork (the fn keys off `voiceHint`). See Deviations.
- Documented (commented, non-matching) in the test header: `thing.ts:443` `templateId === 'techpremium'` is a DELIBERATE pipeline exception (deterministic path, out of scope, future melt) — the guard keys on the `'vestria'` literal so the techpremium string never trips it. VestriaThemePopover uses `tid === 'vestria'` (different identifier) so the `templateId ===`-anchored regex skips it.

### Verification
- `npx tsc --noEmit`: clean.
- Guard + thing targeted: 2 files, 22 tests passed.
- Full `npm run test:run`: 98 passed | 1 skipped (99 files); **1558 passed** | 2 skipped (1560 tests). Regressions green: dispatch, palette-selection, structureConvergence, pageArchetypes.
- Guard test (`pipelineGuards.test.ts`): PASSED (3 asserts + sanity).

### Deviations
- **voice.ts:119 comment artifact (out of scope).** A Phase-1 doc comment in `voice.ts` still contains the literal `templateId === 'vestria'`. voice.ts is NOT in Phase 2's Files-touched list, so per the no-out-of-scope-edit rule I did not touch it. Instead I added it to a documented `KNOWN_COMMENT_ARTIFACTS` allowlist (distinct from the render-layer allowlist) so the guard stays green while being honest about the tolerated artifact. Conservative: the guard still bans the literal in every other file, and this entry is flagged for a one-line follow-up scrub. FLAGGED FOR ORCHESTRATOR: a trivial comment scrub of voice.ts:119 would let this allowlist entry be removed.

### Open risks
- None functional. The `KNOWN_COMMENT_ARTIFACTS` allowlist entry is the only debt — remove it after voice.ts:119 is scrubbed in a future phase/file-touch.

### Impl-review fix (post-review, 2026-07-09)
- Applied the one minor blocking item from impl-review.
- `voice.ts:119`: scrubbed the backtick literal `templateId === 'vestria'` from the doc comment → now reads "REPLACES the old vestria-template voice fork so voice lives in config, not template id." Comment otherwise intact; behavior-neutral.
- `pipelineGuards.test.ts`: deleted the `KNOWN_COMMENT_ARTIFACTS` block and its `&& !KNOWN_COMMENT_ARTIFACTS.has(r)` usage. Guard now filters on the render-layer allowlist only (`LayoutChangeModal.tsx`), which fully covers the remaining literals.
- VERIFY: `npx tsc --noEmit` clean; `pipelineGuards.test.ts` isolated = 3 passed; full `npm run test:run` = 98 passed | 1 skipped (99 files), 1558 passed | 2 skipped (1560 tests).

---

## Phase 3 — photographer + app entries (config-only) — DONE

### Files changed
- `src/modules/businessTypes/config.ts` — the ONLY non-test source file changed.
- `src/modules/businessTypes/config.test.ts`
- `src/modules/brief/serveGate.test.ts`
- `src/modules/templates/fit.test.ts` (scope expansion — see below)
- `src/modules/brief/classify.test.ts` (scope expansion — see below)

### Scope expansion (approved option 1)
Adding `photographer` as a KNOWN key flips it unknown→known in
`resolveEngine`/`requiredCapabilitiesFromBrief`. Two OUT-OF-SCOPE test files hard-coded
`'photographer'` as their canonical UNKNOWN-type fixture and broke. The orchestrator
approved expanding Phase-3 Files-touched to include `fit.test.ts` + `classify.test.ts`
(test-only, intent preserved). **The Phase-3 Files-touched in the plan should be amended
to list these two test files.**

Replacement unknown-type token: **`'florist'`** — grepped across `src/` first, zero
matches, not a `businessTypeKey`, not otherwise special. Every repointed assertion keeps
its INTENT (unknown type → empty caps / tiebreaker-sourced engine); only the token changed.

### Per-file changes
**config.ts** — Added `'photographer'` + `'app'` to `businessTypeKeys` (now 8) and two
entries. `photographer`: `copyEngine:'work'`, `requiredCapabilities:['gallery']` (no shipped
template declares gallery → serve gate → demand lane, intended), `defaultStyle:'editorial-craft'`,
`extractionSchemaKey:'work'`, `likelyIntents:['enquiry','book-call','follow-social']`,
`structureDefault:'single'`, 2 wizardFields, NO voiceHint (work engine). `app`: `copyEngine:'thing'`,
`requiredCapabilities:['lead-form']`, `defaultStyle:'tech-minimal'`, `voiceHint:'modern-tech'`,
`extractionSchemaKey:'thing'`, `likelyIntents:['download-app','signup-free','waitlist']`,
`structureDefault:'single'`, 3 wizardFields. Updated header note "Six"→"Eight" + phase-3 rationale.

**config.test.ts** — "6 seed keys"→"8 seed keys" (asserts photographer+app present). New
`describe` block asserting both new entries' full shape (key/engine/caps/style/schema/voiceHint/
intents). Serveability asserts live in serveGate.test.ts (per plan step 2).

**serveGate.test.ts** — Updated the `:133` photographer manual test: now a KNOWN work type,
`missing='rungC:gallery'` only (tags length 1, no rungA — type is known; gallery gap surfaces
via the latent-cap fallback since `classificationSource` is now `'lookup'`, not `'tiebreaker'`).
Added an `app`-serveable test (serve/product), proving the config-only `app` entry rides the
existing thing pipeline with zero new code.

**fit.test.ts** — `:91-94` unknown-type fixture `'photographer'`→`'florist'`; asserts unchanged
(empty caps, `['hearth','lex','surge']` shortlist).

**classify.test.ts** — `:68-73` tiebreaker-ladder fixture and `:126-134` unknown-type test:
`'photographer'`→`'florist'`. Assertions/intent identical. The `applyBusinessTypeCorrection`
tests (`:143-167`) still start from a photographer draft and pass unchanged — the correction
output is independent of whether the starting type is known.

### In-scope judgment call (logged)
`app`'s own `download-app` intent derives the UNBACKED `store-badges` cap
(`fit.ts:66`), which would push even a serveable type to manual. That is a GOAL-level gap,
orthogonal to the businessType — so the app-serveable test uses `goalIntentGuess:'signup-free'`
(a backed intent) to isolate the businessType-serveability claim. Noted inline in the test.

### Acceptance framing (holds)
`config.ts` is the sole SOURCE change; the two extra test files are fixture-naming debt
(they had appropriated `'photographer'` as an unknown-type stand-in), NOT new code paths.
So "adding a business type touches only config + tests" holds.

### Verification
- `npx tsc --noEmit`: clean.
- Targeted (`config serveGate fit.test classify.test`): 4 files, 69 passed.
- Full `npm run test:run`: 98 passed | 1 skipped (99 files); **1565 passed** | 2 skipped (1567 tests). Up from 1558 (7 new asserts net).

### git diff --stat
```
 docs/task/scale-08-businesstype-config.audit.md | 51 ++++++++++++++++++++++
 src/modules/brief/classify.test.ts              | 15 ++++---
 src/modules/brief/serveGate.test.ts             | 28 ++++++++++--
 src/modules/businessTypes/config.test.ts        | 36 +++++++++++++++-
 src/modules/businessTypes/config.ts             | 57 ++++++++++++++++++++++++-
 src/modules/templates/fit.test.ts               |  5 ++-
```
Only non-test source file = `config.ts`. Everything else test files + this audit.

### Open risks
- None functional. `photographer` is deliberately non-serveable (gallery unbacked) → demand lane.
- Orchestrator TODO: amend plan Phase-3 Files-touched to include `fit.test.ts` + `classify.test.ts`.
