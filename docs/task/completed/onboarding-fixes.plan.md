# onboarding-fixes — implementation plan

**WORKDIR:** `C:\Users\susha\lessgo-ai\.claude\worktrees\onboarding-fixes`
**Branch:** `feature/onboarding-fixes`
**Spec:** `docs/task/onboarding-fixes.spec.md`

## Overview

Targeted fixes to the 8-step wizard (`src/components/onboarding/wizard/`, store = `useWizardStore` — NOT the legacy `useProductGenerationStore` the spec names): make every step do something real, and make AI-prefilled seeds match their field's shape. Seed fixes are prompt-side (the scrape/understand entry prompts produce `brief.facts.entry.*`; there are no hardcoded store defaults) plus one client-side numeric filter. Step fixes are wizard-component-side: skip the dead Style stub, prominent Goal skip, Structure toggles/collections/drafting-gate, honest Building-step redirect. No copy-generation-contract changes; no dual-renderer surface touched (onboarding is client-only); firewall rule holds — no template block components or `useEditStore`/`VestriaThemePopover` imports into onboarding.

## Progress log

- phase 1 seed shape — offer + proof prompts: done (commit 6b13f28f, review loops 1)
- phase 2 style step — skip when no real controls: done (commit d96eec68, review loops 1) [DECISION POINT: skip, not generalize]
- phase 3 goal step — prominent skip: done (commit 7349e36c, review loops 1)
- phase 4 structure step — toggles, collections, drafting gate: done (commit f872becd, review loops 1) [step-2 required-flag: NOT a bug, no change]
- phase 5 building step — honest finalize, no dead Continue: done (commit beb51d38, review loops 1)
- phase 6 understanding — keep niche specificity in prompts: done (commit 89de5817, review loops 1)

---

## Phase 1 — Seed shape: offer looks like an offer, proof is numeric-or-empty

**Goal:** Offer (step 4) never prefills the business name; Proof/realNumbers (step 5) prefills only claims containing an actual number, else empty (existing placeholder examples in `SlotReviewCard` already cover the empty state).

**Files touched:**
- `src/app/api/v2/scrape-website/route.ts`
- `src/app/api/v2/understand/route.ts`
- `src/hooks/useWizardStore.ts`
- `src/hooks/useWizardStore.test.ts`

**Steps:**
1. `scrape-website/route.ts` `buildScrapePrompt` (~line 74) — tighten the `offer:` line: the offer is the action/deal the VISITOR takes or gets (e.g. "Start a free 14-day trial", "Book a demo"), it must NEVER be the business or product name; if no offer is evident return `""`. Do not touch the schema (`ScrapeWebsiteExtendedSchema`) — string stays a string.
2. `understand/route.ts` `buildEntryUnderstandPrompt` (~line 70) — same anti-name guard on its `offer:` line.
3. `useWizardStore.ts` `prefillValueFor` (~line 402) — client-side numeric filter, the ONLY place the numeric-or-empty rule lives: when `field.id === 'realNumbers'` (thing engine only), keep only array entries containing a digit. Keep the filter tiny and local (helper next to `prefillValueFor`).
   - **DO NOT touch `entryPrefillDeltaPromptBlock().outcomes` in `src/lib/schemas/entryClassify.schema.ts`.** That `outcomes` field is a SINGLE SHARED entry field consumed by thing `realNumbers` (inputContracts.ts:140) AND trust `outcomes` (:172) AND work `achievements` (:205); it flows into brief facts (`classify.ts:198`, `bridge.ts:327`), trust copy gen (`wizard/generation/trust.ts:186`), palette-selection keyword scorers (hearth/lex/surge `paletteSelection.ts`), service voice (`audience/service/voice.ts:138`), and service copy prompts (`promptsService.ts:56`, `copyPrompt.ts:163`). Rewriting it to "must contain a number else []" would strip qualitative results claims from trust/work — a silent shared-field semantic regression that frozen-fixture tests will NOT catch. The prompt stays qualitative; the client filter above scoped to `realNumbers` fully satisfies the spec.
   - **Known tradeoff (not a bug):** the "contains a digit" filter drops legitimately non-numeric proof (e.g. "cut onboarding from days to minutes") and keeps numeric-adjacent non-metrics (e.g. "ISO 9001 certified"). This matches the spec's "actual numbers" intent — record in the audit so it isn't later mistaken for a defect.
4. Extend `useWizardStore.test.ts`: realNumbers prefill drops non-numeric entries, keeps numeric ones, and empty→`[]`; trust `outcomes` prefill passes through unfiltered.

**Verification:** `npx tsc --noEmit` + `npm run test:run` green (covers the client filter). **Prompt-string changes (steps 1–2) affect AI output only — fixture-based tests cannot assert behavior drift; manual real-LLM verification is load-bearing here:** run URL import on `npm run dev` against a real SaaS site — step 4 shows an offer-shaped phrase (not the name), step 5 shows numeric claims or empty-with-placeholder.

**Human gate:** none.

---

## Phase 2 — Style step: skip it when there are no real controls

**Goal:** No dead-click step. Decision (recorded here): **skip, don't generalize.** Only `vestria` (thing) and the trust templates have real pickers; generalizing `ProductStylePicker` to a per-template catalog is the richer fix but belongs to the templatePlan track (each new template opts in via a catalog entry). For now the style slot is dropped at runtime for thing-engine templates without controls — the working vestria + trust pickers are untouched, so removing `style` from `wizardSlots` globally is wrong.

**Files touched:**
- `src/hooks/useWizardStore.ts`
- `src/components/onboarding/wizard/StyleSlot.tsx`
- `src/hooks/useWizardStore.test.ts`

**Steps:**
1. `useWizardStore.ts` `slotsForEngine` (~line 457) — already takes `templateId` and has precedent for template-conditioned skips (work/multipage). Add: when `engine === 'thing' && templateId !== 'vestria'`, add `'style'` to the skips set. Prefer a small named helper (e.g. `thingTemplateHasStyleControls(templateId)`) exported near the slot logic so future templates flip one predicate; keep the vestria literal in ONE place shared with `StyleSlot`'s `showVestriaPickers` gate if cheap, else duplicate with a cross-reference comment.
2. `StyleSlot.tsx` `ThingStyleSlot` (~lines 213–218) — the "clean default theme" stub branch becomes unreachable; keep it as a one-line defensive fallback (or simplify) with a comment pointing at the skip in `slotsForEngine`. Do NOT delete the component or the vestria branch.
3. Confirm no downstream assumption that `style` is always present for thing: check `waterfall.ts` slotOrder usage and `GeneratingSlot`/`buildThingInput` read of `styleVariantId`/`stylePaletteId`/`styleMood` (they must tolerate null — they already do for the stub path today; verify, don't refactor).
4. Extend `useWizardStore.test.ts`: slots for `thing` + non-vestria template exclude `style`; `thing` + `vestria` include it; `trust` includes it; `work` behavior unchanged. Progress bar count (WizardShell uses `slots.length`) adjusts automatically — assert slot count in test.

**Verification:** `npx tsc --noEmit` + `npm run test:run` green; manual: meridian/techpremium product onboarding shows 7 steps with no Style step; vestria and a service (trust) run still show their pickers.

**Human gate:** none — but this is the plan's main decision point (skip vs generalize). Flag in the phase commit message; if the user prefers the generalized picker instead, this phase is replaced by a catalog-driven `ProductStylePicker` (larger scope, new plan revision).

---

## Phase 3 — Goal step: skip is obvious, no stall

**Goal:** User can't stall on step 3. Keep the F14 Continue gate (a required-but-empty param genuinely degrades the page) but make the escape hatch impossible to miss.

**Files touched:**
- `src/components/onboarding/wizard/GoalSlot.tsx`

**Steps:**
1. `GoalSlot.tsx` (~lines 190–207) — when `paramGateOpen` (required param empty, not yet skipped): promote "Skip for now" from a small gray text link inside the param box to a clearly visible secondary button (bordered, sits beside/below the param fields), with one line of explainer: "You can add the link later in the editor."
2. Add an inline blocked-state hint in the same card when `paramGateOpen` (e.g. "Add the link, or skip for now to continue") so the disabled Continue is explained where the user is looking. No `WizardShell.tsx` changes — the gate logic stays as-is.
3. Keep behavior: skipping sets `goalParamSkipped` → Continue unblocks (existing store logic, untouched).

**Verification:** `npx tsc --noEmit`; manual: pick an intent with a required param (e.g. `book-call`), leave it empty — skip button is prominent, clicking it enables Continue; filling the param also enables Continue.

**Human gate:** none.

---

## Phase 4 — Structure step: real toggles, no phantom "Products · 0 items", Continue gated while drafting

**Goal:** Optional sections actually toggle; empty "Products" collection node hidden for non-catalog businessTypes (SaaS); Continue disabled while "Drafting…" spinner shows.

**Files touched:**
- `src/components/onboarding/wizard/WizardShell.tsx`
- `src/components/onboarding/wizard/StructureSlot.tsx`
- `src/modules/collections/registry.ts`
- `src/hooks/useWizardStore.ts`
- `src/hooks/useWizardStore.test.ts`

**Steps:**
1. **Drafting gate (certain bug, do first):** `WizardShell.tsx` `gateBlocked` (~lines 151–154) currently blocks structure only on `strategyStatus === 'error'`. Add: blocked while the strategy isn't in hand — `currentSlot === 'structure' && !strategy && (strategyStatus === 'idle' || strategyStatus === 'fetching')` (mirror the exact condition `StructureSlot.tsx:374` uses to render the spinner; read `strategy` from the store in the shell). Keep the error gate.
2. **Required-flag report (STRICTLY diagnose-first — likely NOT a bug):** the assessment claimed every section shows "required". But codebase reading says section keys are ALREADY bare type keys throughout — `applyConfirmedSections`, `toggleStructureSection`, and the clamp logic all operate on bare keys today, and `lockedSectionsForEngine('thing')` (`inputContracts.ts:235`) returns bare `hero, features, cta`. Note the direction of failure: if keys were actually `hero-<uuid>`/display-name form, `lockedSet.has(sec)` would be FALSE for every section → NOTHING would be marked required — the OPPOSITE of the report. So the likely truth is a stale observation, or a page whose drafted sections happened to be all-core. Implementer: first REPRODUCE the "all required" state in dev (inspect `structureSections` vs `lockedSet` at `StructureSlot.tsx:282`). ONLY if a real key-form mismatch is confirmed, normalize at the seed point (`seedStructureFromStrategy`, `useWizardStore.ts:634`). Otherwise record "not reproduced / not a bug" in the audit and make NO code change. **Do NOT apply a speculative uuid→bare normalization without a confirmed repro — a misdirected normalization is itself a regression risk.**
3. **Collections gating:** `StructureSlot.tsx` `CollectionNodes` (~lines 232–240) unions present + `requiredCollections` + `collectionKeysForBusinessType(businessTypeKey)`, so any thing/manufacturer businessType gets an empty "Products · 0 items" node. Note: `requiredCollections` is dormant/EMPTY for every businessType today, so the manufacturer-vs-SaaS distinction can NOT hinge on it. The real discriminator is the extraction family: `businessTypes[bt].extractionSchemaKey` → `'manufacturer'` vs `'thing'` (both currently map to `['products']` in `extractionCollections`). Change: surface an EMPTY (0-item) collection node only when the businessType is catalog-shaped — implement a predicate in `src/modules/collections/registry.ts` (e.g. `emptyCollectionNodeAllowed(businessTypeKey)`) keyed on `extractionSchemaKey === 'manufacturer'` (plus any future businessType that sets `requiredCollections`), and filter in `CollectionNodes`: for the `thing` (SaaS) extraction family, empty keys don't render; keys with items always render. Update the F19 comment block (~lines 218–227) to record the new rule.
4. Extend `useWizardStore.test.ts` (or the registry's test if one exists) for: the empty-node predicate (step 3: manufacturer → allowed, SaaS thing → hidden, key-with-items → always shown), and seed normalization ONLY if step 2 confirmed + changed anything.

**Verification:** `npx tsc --noEmit` + `npm run test:run` green; manual on dev: (a) Continue is disabled while "Drafting the pages your site needs…" shows, enabled once the list renders; (b) SaaS run shows no "Collections › Products · 0 items"; manufacturer run still shows the empty Products node with `+ Add`; (c) only hero/features/cta carry the "required" chip, other sections toggle off/on and the X is enabled (or step-2 audit records "not reproduced").

**Human gate:** none.

---

## Phase 5 — Building step: honest finalize, no disabled Continue

**Goal:** After all stages go green, the user sees an explicit "opening your editor" state instead of a 5–10 s silent stall (the delay is client-side navigation into the heavy `/edit/[token]` route — no API call to remove), and the shell's permanently-disabled Continue disappears on this step.

**Files touched:**
- `src/components/onboarding/wizard/GeneratingSlot.tsx`
- `src/components/onboarding/wizard/WizardShell.tsx`

**Steps:**
1. `GeneratingSlot.tsx` — add a local `redirecting` state. On success (both the main path `~line 177` and the work-skeleton path `~line 136`): set `redirecting`, drop/shorten the 600 ms `setTimeout`, call `router.push` immediately, and render a persistent honest state under the green checklist: spinner + "Opening your editor — this can take a few seconds." (the wizard stays mounted during App Router navigation, so this shows exactly through the stall).
2. On mount (once `tokenId` known), `router.prefetch('/edit/' + tokenId)` to warm the editor route while generation runs (cuts the stall, esp. prod).
3. `WizardShell.tsx` nav (~lines 224–232) — don't render the Continue button at all when `currentSlot === 'generating'` (today it renders permanently disabled via `isLast`). Keep Back rendered per current behavior; keep the `generationError` gate logic intact for safety (it's now moot but harmless).

**Verification:** `npx tsc --noEmit` + `npm run test:run` green; manual full product generation on dev: green checklist → "Opening your editor…" spinner → editor lands; no disabled Continue visible anywhere on step 8; error and out-of-credits paths still render their existing UIs.

**Human gate:** none.

---

## Phase 6 — Understanding step: keep the niche

**Goal:** The AI's condensation (oneLiner rephrase, `summary`, `category`) preserves the founder's niche wording instead of generalizing to a broad category ("GST invoicing for Indian freelancers" must not become "your Accounting software"). Scouted: the generic phrase is AI-produced output rendered back — no literal UI string to fix; this is prompt-only.

**Files touched:**
- `src/lib/schemas/entryClassify.schema.ts`
- `src/app/api/v2/scrape-website/route.ts`
- `src/app/api/v2/understand/route.ts`

**Steps:**
1. `entryClassify.schema.ts` `entryPrefillDeltaPromptBlock` (~line 160) — `summary:` add: preserve the business's own niche/specialty words; never generalize to a broader category label. (Scope: `summary` line ONLY — the `outcomes` line in this same block is shared across engines and stays untouched per Phase 1's warning.)
2. `entryClassify.schema.ts` `entryClassificationPromptBlock` (~line 140) — `category:` require the SPECIFIC niche category in the business's own terms (e.g. "GST invoicing for Indian freelancers"), not the parent industry ("Accounting software"). Leave `businessTypeGuess` alone — it feeds `resolveEngine`/serve and MUST stay on the closed vocabulary.
3. `scrape-website/route.ts` `buildScrapePrompt` `oneLiner:` (~line 68) and `understand/route.ts` `buildEntryUnderstandPrompt` `oneLiner:` (~line 66) — add: keep the specific niche terms from the source; do not substitute broader category words.
4. No schema/enum changes anywhere; no change to engine resolution (`classify.ts` untouched) — spec's "less aggressive classification" is satisfied at the wording layer, keeping the copy-generation contract intact.

**Verification:** `npx tsc --noEmit` + `npm run test:run` green (generation-contract fixtures unaffected — prompts only). **This phase is entirely prompt-string changes: fixture-based tests cannot assert AI behavior drift, so manual real-LLM verification is load-bearing, not optional:** enter a niche one-liner (and a niche site URL) → Understanding step summary/category retain the niche wording across 2–3 runs.

**Human gate:** none.

---

## Cross-phase notes

- Pilot batch = phases 1–4 (spec's smallest slice); phases 5–6 = second pass.
- **Shared-file collision (deliberate, kept separate):** Phases 1 and 6 BOTH edit `scrape-website/route.ts` and `understand/route.ts` (P1 = offer anti-name guard; P6 = oneLiner niche preservation — different prompt lines). Kept as two phases because phase 6 needs real-LLM quality eyeballing while phase 1 is shape-mechanical. Each implementer should expect prior edits in these files and rebase-read current file state before editing; the edits are line-disjoint. `entryClassify.schema.ts` is phase 6 ONLY (phase 1 no longer touches it).
- Nothing here touches published renderers, schema/migrations, auth, or publish paths — no human gates. Merge to main remains the standing human gate.
- Firewall: any template-data import added in onboarding must be data-only (`tokens.ts`/`palettes.ts` pattern); never `useEditStore`, `VestriaThemePopover`, or block components. Phase 2's chosen path adds no template imports at all.

## Unresolved questions

1. Style step: OK to SKIP for non-vestria product templates (7 steps) vs generalize picker now? Plan assumes skip; generalize = bigger scope.
2. Goal: keep Continue gate + prominent skip (planned) vs Continue always active? Planned option preserves F14 intent.
3. Structure required-flags: if phase-4 diagnosis can't reproduce "all required", accept as-is + audit note?
