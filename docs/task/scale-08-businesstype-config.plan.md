# scale-08 — businessType config system: plan

**Branch:** `feature/scale-08-businesstype-config`
**Spec:** `docs/task/scale-08-businesstype-config.spec.md`

## Overview

Make "any difference between two customers lives in a list entry" true in code: re-key product voice off `businessTypes[key].voiceHint` (new field) instead of `templateId === 'vestria'`, melt the remaining `isManufacturerFlow` forks in the THING pipeline into reads of the `manufacturer` config entry, delete `manufacturerFlow.ts`, prove the pattern with two config-only entries (`photographer`, `app`), delete the dead legacy generation/IVOC surface, and lock it all with grep-gate + golden tests plus a read-only admin businessTypes panel.

Key facts confirmed in code (implementer re-verifies before editing):
- Wizard store already carries `s.businessTypeKey` (used by `buildTrustInput`, `useWizardStore.ts:499`); `buildThingInput` (`useWizardStore.ts:441`) does NOT pass it yet.
- Strategy route already accepts `brief` (BriefSchema, has optional `businessType`) — `strategy/route.ts:80`; voice fork at `:142`. Copy route inlines `templateId === 'vestria'` at `generate-copy/route.ts:156` and has NO businessType field yet.
- `isMultipage(templateId, brief?)` (`pageArchetypes.ts`) is the scale-07 precedent for melting a vestria hardcode; already used at `thing.ts:302`.
- **Spec correction:** `elementDetermination.ts` is NOT dead — live callers `src/hooks/editStore/regenerationActions.ts:5,102,290` + `ElementToggleModal.tsx:17` (editor regen). It is KEPT; only its import inside the deleted `/api/generate-landing` route goes away.
- techpremium deterministic branch (`thing.ts:443`, `templateId === 'techpremium'`) is LIVE and stays as-is this feature (flagged for a later melt).

## Progress log

- phase 1 voiceHint + voice re-key: done (commit d8179081, review loops 1, tsc+1554 tests green)
- phase 2 melt thing.ts forks + delete manufacturerFlow + grep-gate: done (commit de8db516, review loops 2, tsc+1558 tests green) — HUMAN GATE: awaiting real-regen eyeball
- phase 3 new entries photographer + app (config-only): done (commit 5da42705, review loops 1, tsc+1565 tests green; config.ts sole source change; +2 test-file fixture repoints photographer→florist)
- phase 4 dead-legacy deletion: pending
- phase 5 manufacturer golden + contract tests: done (commit 7fd949e4, review loops 1, tsc+1568 tests green; fixture-free ENTRY-payload asserts + CAPTURE=1 vestria golden wired)
- phase 6 admin businessTypes panel: pending

---

## Phase 1 — `voiceHint` in config + voice re-key end-to-end

Goal: both product voice fork sites derive `ProductVoiceId` from the businessType entry, never templateId. Client plumbs `businessTypeKey` so behavior is unchanged (vestria run still gets `tailored-trade`).

Steps:
1. `config.ts`: add optional `voiceHint?: string` to `BusinessTypeEntry` (documented: product copy-voice id consumed by the thing engine; plain string to avoid a config→audience import cycle — validated by test). Set `manufacturer: 'tailored-trade'`, `saas: 'modern-tech'`. Trust/work entries omit (service voice stays archetype-keyed via `selectServiceVoice` — already firewall-correct, unchanged this feature). Scrub the stale "Nothing in the app imports this yet" header note.
2. `voice.ts`: add `productVoiceForBusinessType(key?: string | null): ProductVoiceId` — `businessTypes[key]?.voiceHint` when it's a valid `ProductVoiceId`, else `'modern-tech'`. Plain module, no cycle (config imports only `@/types/brief` + goals vocabulary).
3. `thing.ts`: add `businessTypeKey?: string` to `ThingGenerationInput`. `buildStrategyPayload` sends `brief: { ...(goal), ...(businessType) }` whenever either exists (today brief is sent only when a goal exists). `buildCopyPayload` adds `businessType: input.businessTypeKey`. `runFanOut` copy body adds `businessType: ob.businessTypeKey ?? 'manufacturer'` (fan-out is multipage-only = manufacturer today; documented transitional fallback for in-flight resumable drafts). `buildOnboardingData` persists `businessTypeKey` so resume-from-DB carries it.
4. `multiPageAssembly.ts`: add optional `businessTypeKey` to `MultiPageOnboardingData`.
5. `useWizardStore.ts` `buildThingInput`: pass `businessTypeKey: s.businessTypeKey ?? undefined`.
6. Strategy route: replace the `isManufacturerFlow(data.templateId)` voice fork (`:142-144`) with `productVoiceForBusinessType(data.brief?.businessType)`; drop the `isManufacturerFlow` import.
7. Copy route: add `businessType: z.string().optional()` to `GenerateProductCopyRequestSchema`; replace `:156` with `productVoiceForBusinessType(businessType)`. **DECIDED (open-Q2): KEEP the `templateId` field accepted-but-unused** — voice (`:156`) was its only functional consumer, and `:200`'s comment already confirms `templateId` never reaches the prompt (firewall). Do not drop it from the schema or senders this feature; just update the whitelist/`:200` comment to state it's accepted-but-unused post-re-key.
8. Implementer verification step (before edits land): grep where `businessTypeKey` is SET in the wizard store and confirm the vestria/manufacturer wizard path always populates it (serve-gate/classify path). If any vestria entry path can reach generation without it, stop and flag — voice would silently fall back to modern-tech.
9. Tests: `thing.test.ts` — vestria-shaped inputs now set `businessTypeKey: 'manufacturer'`; assert strategy payload carries `brief.businessType`, copy payload + fan-out body carry `businessType`. `config.test.ts` — every `copyEngine === 'thing'` entry with a `voiceHint` has a valid `ProductVoiceId` value; manufacturer = `tailored-trade`. New unit for `productVoiceForBusinessType` (manufacturer→tailored-trade, saas/undefined/garbage→modern-tech) in a `voice.test.ts` or inside config.test.

**Files touched:**
- `src/modules/businessTypes/config.ts`
- `src/modules/businessTypes/config.test.ts`
- `src/modules/audience/product/voice.ts` (+ `src/modules/audience/product/voice.test.ts` if created)
- `src/modules/wizard/generation/thing.ts`
- `src/modules/wizard/generation/thing.test.ts`
- `src/modules/generation/multiPageAssembly.ts`
- `src/hooks/useWizardStore.ts`
- `src/app/api/audience/product/strategy/route.ts`
- `src/app/api/audience/product/generate-copy/route.ts`

**Verification:** `npx tsc --noEmit`; `npm run test:run -- thing config voice promptBranch` (targeted) then full `test:run`. Mock-mode wizard run (meridian) unchanged.

---

## Phase 2 — melt thing.ts forks, StyleSlot, selectBlocks, service.ts; delete `manufacturerFlow.ts`; grep-gate test

Goal: zero `isManufacturerFlow` in src; `templateId === 'vestria'` only in render-layer allowlist. Enforced by a new guard test.

Steps:
1. `thing.ts`: derive the remap flag from config — `const isMfr = businessTypes[input.businessTypeKey as BusinessTypeKey]?.extractionSchemaKey === 'manufacturer'` (the field remap valueAdds→features / industriesServed→otherAudiences / productCategories→categories / whatYouMake IS the manufacturer extraction-schema shape, so this key is honest). Applies at `buildStrategyPayload` (:141), `buildCopyPayload` (:173), `effectiveFeatures`, and the images-categories pick (:439/:522).
2. `thing.ts` `saveFC` (:312, :315): re-key hero-variant + style re-apply gates from `isManufacturerFlow(...)` to the already-computed `multipageTemplate` (scale-07 precedent — style pickers ship with the multipage vestria pilot; capability question, not businessType).
3. `StyleSlot.tsx` (:138): re-key `isMfr` to `isMultipage(templateId ?? null)` (plain-module import, client-safe). Rename local to `showVestriaPickers`/similar for honesty.
4. `selectBlocks.ts` (:22): replace the ternary with a data lookup, e.g. `const LAYOUTS_BY_TEMPLATE: Record<string, Record<string, string>> = { vestria: VESTRIA_LAYOUT_NAMES }` defaulting to `MERIDIAN_LAYOUT_NAMES` — template dispatch as data, no `===` literal.
5. `src/types/service.ts`: `usesTemplateModule` (:84) → membership check against a const array of product template ids; `palettesForTemplate` (:340-349) → `Record<TemplateId, readonly string[]>` lookup with hearth default. Pure mechanical; no behavior change.
6. Delete `src/modules/audience/product/manufacturerFlow.ts`. Remove import from `thing.ts`. Field-drop discipline: grep ALL `isManufacturerFlow` readers first (known set: thing.ts, StyleSlot.tsx, strategy route [gone in phase 1]) — no other code readers may remain.
7. Comment/doc scrub (comment-only mentions): `src/lib/schemas/understand.schema.ts:17`, `src/lib/schemas/scrapeWebsite.schema.ts:78`, `src/lib/schemas/extraction/index.ts:5,67` (TWO live `isManufacturerFlow` mentions — both must be scrubbed or the guard test's zero-`isManufacturerFlow` assert fails), `src/lib/schemas/extraction/manufacturer.ts:7`, `src/app/api/v2/understand/route.ts:241`, `src/app/api/v2/scrape-website/route.ts:324`, `src/modules/audience/README.md:18` — reword to reference businessType keying. **Also `src/modules/wizard/generation/thing.ts:297`** — a live scale-07 artifact comment containing the literal `templateId === 'vestria'` (`"was \`templateId === 'vestria'\`"`); reword to drop the literal (e.g. "was the vestria hardcode") or the guard test (step 8) will match it. thing.ts is already in Files touched.
8. New grep-gate guard test `src/modules/businessTypes/pipelineGuards.test.ts`: walk `src/` with `fs` (skip `*.test.*`, `*.md`), assert (a) zero occurrences of `isManufacturerFlow`, (b) `templateId === 'vestria'` (and `'vestria' === templateId`) only in an explicit render-layer allowlist (`src/app/edit/[token]/components/ui/LayoutChangeModal.tsx`; extend only if implementer finds other genuine render-layer dispatch). **techpremium exception — make it explicit and visible:** the guard test must contain a commented, named allowlist entry documenting that `thing.ts`'s `templateId === 'techpremium'` (:443) is a deliberate pipeline exception (deterministic path, out of scope this feature, future melt candidate) — so the acceptance "no pipeline `templateId===`" gap is intentional, not an oversight. The guard keys on the literal `'vestria'`, so the techpremium string doesn't trip it; the comment records why it's allowed to exist. **Scope note:** this guard enforces the `'vestria'` literal half of acceptance (the vestria/manufacturer hack) plus the `isManufacturerFlow` ban — NOT a general `templateId===` ban; `htmlGenerator.ts:115`, `PageSwitcher.tsx:76`, and techpremium remain deliberately outside the guard.
9. `thing.test.ts`: add a negative assert — vestria `templateId` WITHOUT `businessTypeKey: 'manufacturer'` does NOT remap fields (proves the key moved to config, not template).

**Files touched:**
- `src/modules/wizard/generation/thing.ts`
- `src/modules/wizard/generation/thing.test.ts`
- `src/components/onboarding/wizard/StyleSlot.tsx`
- `src/modules/audience/product/selectBlocks.ts`
- `src/types/service.ts`
- `src/modules/audience/product/manufacturerFlow.ts` (DELETE)
- `src/modules/businessTypes/pipelineGuards.test.ts` (NEW)
- Comment-only: `src/lib/schemas/understand.schema.ts`, `src/lib/schemas/scrapeWebsite.schema.ts`, `src/lib/schemas/extraction/index.ts` (lines 5 AND 67), `src/lib/schemas/extraction/manufacturer.ts`, `src/app/api/v2/understand/route.ts`, `src/app/api/v2/scrape-website/route.ts`, `src/modules/audience/README.md`

**Verification:** `npx tsc --noEmit`; full `npm run test:run` (dispatch + palette-selection + structureConvergence + pageArchetypes regressions must stay green); new guard test green.

**HUMAN GATE:** user eyeballs a real (non-mock) regen of a Vestria/Golden-Shadow project (voice = tailored-trade, remapped fields, hero/style picks applied, multipage fan-out) AND a meridian SaaS run (byte-equivalent quality, modern-tech) before phase 4 deletions proceed.

---

## Phase 3 — prove the pattern: `photographer` + `app` entries (config-only)

Goal: two new business types added by touching ONLY the config module + tests.

Steps:
1. `config.ts`: extend `businessTypeKeys` with `'photographer'`, `'app'`. Entries:
   - `photographer`: `copyEngine: 'work'`, `requiredCapabilities: ['gallery']` (no shipped template declares gallery → serve gate fails → MANUAL-ONBOARD/demand lane, which is the intended acceptance), `defaultStyle: 'editorial-craft'`, `extractionSchemaKey: 'work'`, `likelyIntents: ['enquiry', 'book-call', 'follow-social']`, `structureDefault: 'single'`, 2 wizardFields.
   - `app`: `copyEngine: 'thing'`, `requiredCapabilities: ['lead-form']`, `defaultStyle: 'tech-minimal'`, `voiceHint: 'modern-tech'`, `extractionSchemaKey: 'thing'`, `likelyIntents: ['download-app', 'signup-free', 'waitlist']`, `structureDefault: 'single'`, 2–3 wizardFields.
   (Both intent ids + the `gallery` capability verified to exist in the frozen vocabularies — `goals/vocabulary.ts:61,64`, `types/brief.ts:26`.)
2. `config.test.ts`: assert both entries' shape; assert photographer is NOT serveable (gallery unbacked) and app IS serveable — put the serveability asserts wherever serve-gate tests live (`src/modules/brief/serveGate` test file if present, else config.test importing the gate).
3. Run FULL suite: the key-iterating tests (`extraction.test.ts`, `classify.test.ts`, `structureConvergence.test.ts`, `pageArchetypes.test.ts`, `entryClassify` menu) auto-cover new keys — any failure means a hidden non-config coupling, which is exactly what this phase exists to smoke out. Fix belongs in config, not new code paths.

**Files touched:**
- `src/modules/businessTypes/config.ts`
- `src/modules/businessTypes/config.test.ts`
- (serve-gate test file only if that's where serveability asserts land — no non-test src file may change; that's the acceptance)

**Verification:** `npx tsc --noEmit`; full `npm run test:run`. `git diff --stat` shows only config + test files.

---

## Phase 4 — dead-legacy deletion (verify-then-delete) — **HUMAN GATE**

Goal: legacy generation + IVOC surface gone; build green; bundle sheds dead code. Discipline: for EVERY file below, re-grep importers immediately before deleting; a file with a surviving importer is kept and noted in the audit.

Steps:
1. Delete `/api/generate-landing`: `src/app/api/generate-landing/route.ts`. Then re-check its now-possibly-orphaned imports:
   - DELETE if 0 remaining importers (expected): `src/modules/prompt/buildStrategyPrompt.ts`, `src/modules/prompt/PromptForm.tsx`, `src/modules/prompt/PromptPage.tsx` (PromptPage imported by no app route — verified).
   - **KEEP `src/modules/prompt/buildPrompt.ts` — do NOT delete.** It has 3 LIVE importers beyond the deleted route: `src/hooks/editStore/contentActions.ts:3` (`buildFullPrompt`/`buildSectionPrompt`/`buildElementPrompt`), `src/hooks/editStore/regenerationActions.ts:4` (`buildFullPrompt`), `src/app/api/regenerate-section/route.ts:2` (`buildSectionPrompt`). Only `buildStrategicCopyPrompt` + `generateCardRequirementsReport` inside it go dead. OPTIONAL: after grep-confirming no other caller, prune just those two now-dead exports from the file — but keep the file. (Same KEEP-not-delete class of error as `elementDetermination`; caught in review.)
   - KEEP (expected surviving importers — verify): `parseAiResponse.ts`, `parseStrategyResponse.ts`, `mockResponseGenerator.ts` (regenerate-* routes), and **`src/modules/sections/elementDetermination.ts` — KEEP unconditionally** (live editor-regen callers; spec's delete instruction is wrong, noted in Overview).
2. Delete IVOC/inference legacy: `src/app/api/market-insights/route.ts`, `src/app/api/validate-fields/route.ts`, `src/lib/tavily.ts`, `src/lib/ivocExtractor.ts`. **Before deleting the two routes, grep-confirm no live UI/menu button or client `fetch` still hits them** (`fetch('/api/market-insights'`, `fetch('/api/validate-fields'`) and that no dashboard/onboarding action references them — a dangling button would 404. Also grep `CREDIT_COSTS.IVOC_RESEARCH` (and any `IVOC_RESEARCH` reader) to confirm no live credit-gated action invokes these routes. Then grep that the routes' imports (`generateFeatures`, `inferHiddenFields`, mock generators, `validateInferredFields` re-export) don't orphan-break other consumers; delete newly-orphaned inference helpers only if 0 importers remain (else keep).
3. Delete `src/app/onboarding/persona/page.tsx` (already a `redirect('/dashboard')` stub). Do NOT touch `/api/user/persona`, `User.persona`, `PersonaPrompt.tsx`.
4. `src/middleware.ts`: remove rate-limit entries `:19` (`/api/generate-landing`), `:25` (`/api/market-insights`), `:26` (`/api/validate-fields`).
5. `IVOCCache`: keep prisma model + table (open-Q lean = keep 1 release; no migration this feature). Keep `CREDIT_COSTS.IVOC_RESEARCH` (inert config constant) unless implementer confirms 0 readers and removal is free.
6. techpremium: no code change — already `retired: true` in catalogs (`templateMeta.ts:118`) and still live-dispatched by thing.ts. Nothing to do; confirm only.
7. README/doc updates for everything deleted: `src/modules/prompt/README.md`, `src/app/api/README.md`, `src/lib/README.md`, `src/modules/inference/README.md`, `src/modules/mock/README.md`, `src/hooks/README.md`, and `CLAUDE.md` (generate-landing pipeline description, market-insights/validate-fields mentions, tavily/ivocExtractor rows, API route list).

**Files touched (deletes):**
- `src/app/api/generate-landing/route.ts`
- `src/modules/prompt/buildStrategyPrompt.ts`, `src/modules/prompt/PromptForm.tsx`, `src/modules/prompt/PromptPage.tsx` (NOT `buildPrompt.ts` — kept, 3 live importers; optionally prune 2 dead exports)
- `src/app/api/market-insights/route.ts`, `src/app/api/validate-fields/route.ts`
- `src/lib/tavily.ts`, `src/lib/ivocExtractor.ts`
- `src/app/onboarding/persona/page.tsx`
- (+ any inference/mock helpers proven 0-importer after the above — audit lists them)

**Files touched (edits):**
- `src/middleware.ts`
- `src/modules/prompt/README.md`, `src/app/api/README.md`, `src/lib/README.md`, `src/modules/inference/README.md`, `src/modules/mock/README.md`, `src/hooks/README.md`, `CLAUDE.md`

**Verification:** `npx tsc --noEmit`; full `npm run test:run`; **`npm run build` green** (not just next build — published-CSS/assets steps included). Manual: `/api/generate-landing`, `/api/market-insights`, `/api/validate-fields` return 404 on dev; editor element-regen (ElementToggleModal path) still works — proves elementDetermination keep was right.

**HUMAN GATE:** user signs off on the deletion set + green build before merge of this phase (irreversible-ish surface removal; prod routes disappearing).

---

## Phase 5 — manufacturer golden + contract tests

Goal: acceptance tests — Golden-Shadow-shaped manufacturer run regenerates through the ENTRY (no templateId key in its pipeline path); adding `app` provably touched only config.

Steps:
1. `captureGolden.test.ts`: add a manufacturer/vestria capture case (manufacturer-shaped input incl. `businessTypeKey: 'manufacturer'`, vestria template) → freezes `e2e/fixtures/generated/vestria.json` when run with `CAPTURE=1` (real LLM — human-run step, not CI).
2. `generationContract.test.ts`: add the vestria/manufacturer key to the `SCHEMAS` map (:363-377 GOLDEN block) so the fixture revalidates when present. Add frozen-fixture-free contract asserts: (a) manufacturer entry input → `buildStrategyPayload`/`buildCopyPayload` carry remapped fields + `brief.businessType`/`businessType`, no `whatYouMake` leakage on saas; (b) `businessTypeKey: 'app'` input produces a payload shape identical to saas (proves app rides existing pipeline with zero new code).
3. Confirm the phase-2 guard test + these contract tests together cover the spec's acceptance greps.

**Files touched:**
- `src/modules/audience/__tests__/captureGolden.test.ts`
- `src/modules/audience/__tests__/generationContract.test.ts`
- `e2e/fixtures/generated/vestria.json` (NEW — generated artifact, only when user runs `CAPTURE=1`)

**Verification:** full `npm run test:run` green without the fixture; user optionally runs `CAPTURE=1` capture (1 real LLM call) and re-runs contract suite to freeze + validate the manufacturer golden. Eyeball fixture quality (tailored-trade voice present).

---

## Phase 6 — admin: read-only businessTypes panel

Goal: demand board shows which business types exist, their engine/capabilities, and which are serveable vs missing capabilities (first real consumer of the config outside the pipeline).

Steps:
1. `src/app/admin/page.tsx`: add a new `<section>` sibling to the existing demand tables (:378-438 area): one row per `businessTypes` entry — key, label, copyEngine, requiredCapabilities, structureDefault, voiceHint, and serveability (reuse the serve-gate/fit helpers with a minimal `{ businessType: key }` brief to compute serveable-template-or-missing-capabilities; render missing caps highlighted). Server component, `isAdmin`-gated already; read-only (editing entries stays a code deploy — frozen-enum philosophy).
2. No new route, no client JS.

**Files touched:**
- `src/app/admin/page.tsx`

**Verification:** `npx tsc --noEmit`; manual: load `/admin` as admin — photographer shows missing `gallery`, app/saas/manufacturer show serveable, table renders with 8 entries.

---

## Landmine checklist (applies to all phases)

- No block components change → dual-renderer parity untouched; still, phase-2 StyleSlot/selectBlocks edits must not import anything from a `'use client'` module into server paths (voice helper + config stay plain modules).
- No schema changes → no migrations (IVOCCache table deliberately kept).
- `npm run build` (not `next build`) is the phase-4 gate.
- Field-drop regression discipline: every delete/re-key preceded by a fresh grep of ALL readers (paletteSelection/golden-style keyword scorers burned us before).

## Revision log

- **rev2 (plan-review round 2):** (1) Phase-2 scrub now covers BOTH `isManufacturerFlow` mentions in `extraction/index.ts` (`:5,67`) — `:67` would otherwise trip the guard test. (2) Fixed cosmetic ref `audience/README.md:23`→`:18`. (3) Guard-test description now states it enforces the `'vestria'` literal + `isManufacturerFlow` ban, not a general `templateId===` ban (htmlGenerator/PageSwitcher/techpremium deliberately out).
- **rev1 (plan-review round 1):** (1) `buildPrompt.ts` moved DELETE→KEEP — 3 live importers (contentActions/regenerationActions/regenerate-section); only 2 internal exports die. (2) Phase-2 comment scrub now includes `thing.ts:297` (live `templateId === 'vestria'` literal that would trip the guard test). (3) Guard test now explicitly documents the `templateId==='techpremium'` (thing.ts:443) pipeline exception. (4) Open-Q2 resolved: keep `generate-copy` `templateId` accepted-but-unused. (5) Phase-4 adds a grep-confirm-no-dangling-UI/`IVOC_RESEARCH` step before deleting market-insights/validate-fields routes.

## Unresolved questions

1. IVOCCache table: confirm keep-dormant-1-release (no migration this feature)?
2. ~~`generate-copy` `templateId` param: keep or drop?~~ **RESOLVED: keep accepted-but-unused** (firewall-safe; only consumer was voice; see phase-1 step 7).
3. Service voice: OK to leave `selectServiceVoice` archetype-keyed (no voiceHint wiring) this feature?
4. photographer `defaultStyle: 'editorial-craft'` + app `'tech-minimal'` — agree?
5. Fan-out resume fallback `businessType ?? 'manufacturer'` for legacy in-flight multipage drafts — acceptable transitional?
6. techpremium `templateId === 'techpremium'` deterministic branch stays this feature — melt later under which track?
