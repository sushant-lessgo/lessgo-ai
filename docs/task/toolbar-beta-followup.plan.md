---
tier: full (ESCALATED from standard 2026-07-17)
tier-escalation: Phase 1's load-bearing e2e exposed a real regression in `src/hooks/editStore/aiActions.ts` (applyVariation writes aiMetadata onto bare-string elements → throws). Fixing it requires editing editStore internals = RISKY SURFACE → one-way escalate to full. Now: per-phase impl-review loop ×3 (not one whole-diff review at end).
process: plan-review already done (standard); from here full — per-phase impl-review ×3.
branch: feature/toolbar-beta-followup
spec: docs/task/toolbar-beta-followup.spec.md
---

# toolbar-beta-followup — plan

## Overview

Two bounded edit-side items left over from `toolbar-standard-beta` (merged `349ec689`): (1) surface Regen on the section toolbar and **prove element + section regen work behaviorally through the toolbar** against `regen-modernization`'s rewritten routes via a load-bearing mock-mode e2e (fail-fast — this is the potential live regression), plus remove the dead "Ask AI" trailing-slot comments; (2) make `LinkPicker` the **one** destination editor inside Button Settings, replacing the modal's old External-Link/Link-to-Page fields while hard-preserving the `followGoal`/`GOAL_REF` goal-following CTA path. Zero published-side files; no editStore internals edited (reads/action-calls only); no new credit events (`SECTION_REGEN=2`, `ELEMENT_REGEN=1` already fire server-side).

## Progress log

- phase 1 Regen surface + section wire + e2e: done (commit ec544679, review loops 1, ship). Caught+fixed a real regen-modernization regression (applyVariation bare-string throw). Founder-eyeball half of gate BATCHED to merge gate.
- phase 2 LinkPicker replaces ButtonSettings destination: pending

## Plan-time decisions (locked)

- **`Link.source` for the button adapter: UI-ephemeral, dropped at write.** `CTAButton` has no `source` field. Read-in: pass the current href **string** to LinkPicker (its `value: string | Link` dual-read handles legacy strings — LinkPicker.tsx:53-54, 66-69) — no fabricated `source` needed. Write-out: adapter consumes `link.dest`, discards `link.source`. Nothing persists `source` for buttons; existing `buildCtaButton`/`configFromCta`/`handleSave` persistence stays byte-identical.
- **GOAL_REF never routes through LinkPicker.** LinkPicker strips GOAL_REF by design (`toHref` returns `''`, LinkPicker.tsx:66-69) and never emits it. The `followGoal` toggle (ButtonConfigurationModal.tsx:172, detach/re-attach UI lines 550-586) and the `buildCtaButton` GOAL_REF branch (line 84-86) stay modal-level, entirely outside the swapped region.
- **Consolidation shape:** the `!followGoal` block (lines 690-947) keeps its Button-Action `RadioGroup`, but "External Link" + "Link to Page" collapse into ONE "Link" option rendered by `LinkPicker` (section anchor / page / custom URL). "Native Form" (formId + behavior, lines 778-889) and "Link with Input" (inputConfig, lines 891-946) are NOT representable in `Link` — they keep their existing radio options + controls unchanged, per scout's KEY MISMATCH note.
- **E2e assertability confirmed:** both routes short-circuit deterministically in mock mode (`NEXT_PUBLIC_USE_MOCK_GPT==='true'` or DEMO_TOKEN — regenerate-section route.ts:203,238-249 returns `generateMockSectionContent(...)`; regenerate-element analogous at :171,203-213), skipping ownership/credits. Existing authed mock-mode harness (`e2e/toolbar-dispatch.spec.ts` + `e2e/helpers/seedDraft.ts`, meridian draft) is the template. Assert content actually LANDS in the DOM (before/after text diff + mock-content substring), not just a 200.

---

## Phase 1 — Regen surface + section wire + load-bearing e2e

Fail-fast phase: wires the net-new section-toolbar Regen, removes the dead Ask-AI slot remnants, and authors the behavioral e2e that drives BOTH regen paths through the toolbar. **Fix anything the e2e exposes** in the rewritten client path.

### Files touched

- `src/app/edit/[token]/components/toolbars/SectionToolbar.tsx` — add Regen action
- `src/app/edit/[token]/components/toolbars/ToolbarShell.tsx` — delete dead Ask-AI comment (lines 281-282)
- `src/app/edit/[token]/components/toolbars/actionSets.tsx` — delete Ask-AI mention from the t2-anatomy comment (lines 32-33); optionally drop the unused `'hidden'` arm of `TrailingSlotState` (line 40) IF trivially safe (`designMenu !== 'hidden'` check at ToolbarShell.tsx:267 simplifies with it) — else leave
- `src/app/edit/[token]/components/toolbars/TextToolbarMVP.tsx` — delete dead Ask-AI comment (~lines 776-778); NO functional change
- `e2e/toolbar-regen.spec.ts` — **new**, the load-bearing e2e
- `playwright.config.ts` — register the new spec in the `authed` project (testMatch is an explicit ALLOWLIST — documented trap from the parent branch: unlisted spec silently runs zero tests)
- `src/hooks/editStore/aiActions.ts` — **AUTHORIZED 2026-07-17 (contingency fired).** `applyVariation` (~L700-711): guard the `aiMetadata` write so it only runs on object-valued elements (bare-string elements — meridian's common case — currently throw `Cannot create property 'aiMetadata' on string`, breaking element-regen accept). Guard ONLY; no other logic change in this file. This edit is why the run escalated to full tier.

*Contingency history:* the e2e DID expose a regression in the rewritten client path → aiActions.ts added above (triggered full-tier escalation). If further breakage surfaces in `src/app/api/regenerate-{element,section}/route.ts`, those remain NOT pre-authorized — report before touching.

### Steps

1. **SectionToolbar Regen button.** Insert into `primaryActions` (SectionToolbar.tsx:189-324) — id `regen`, label `Regen`, icon `refresh` (the unused SVG already in the local ActionIcon iconMap, lines ~526-530). Handler: call the existing store action `regenerateSection(sectionId)` (aiActions.ts:60) — no `userGuidance`, no options; one-click, one-shot merge (image/shape-preserving merge already in aiActions.ts:127-176). Purely additive — do NOT edit aiActions.
   - Placement: after `add-element`, before `move-up` (AI action groups ahead of structural moves).
   - Disable while `aiGeneration.isGenerating` (state already read at line 338; the in-flight progress card + completion message at 337-359 already handle feedback — reuse, don't duplicate).
   - Hide on chrome sections (header/footer): add `'regen'` to `CHROME_HIDDEN_ACTIONS` — chrome isn't a copy-contract section; regen there is undefined. (Footer-only filter at line 335 untouched.)
2. **Ask-AI removal.** Delete the three dead comments (ToolbarShell, actionSets, TextToolbarMVP). Removal not greying — spec says CUT. Note `toolbar-dispatch.spec.ts` case #4 asserts Ask AI absent — stays green by construction.
3. **Author `e2e/toolbar-regen.spec.ts`** (mock mode, authed, mirrors toolbar-dispatch harness: Clerk storageState → seed meridian draft via `seedDraft` → open `/edit/<token>`):
   - **Element regen (text toolbar):** select a stable text element (meridian hero `headline`, per toolbar-dispatch precedent). Capture current text. Click the sparkle (`TextToolbarMVP.tsx:402 handleSparkle` → `regenerateElementWithVariations(sectionId, elementKey, 5)` → `POST /api/regenerate-element` → `state.elementVariations`, current copy prepended at index 0). Assert the variations UI appears with >1 option; pick a NON-zero variation; assert `applyVariation` (aiActions.ts:680) actually writes — the element's DOM text now equals the picked variation and differs from the original.
   - **Section regen (section toolbar):** select a section, capture element text(s). Click the new Regen action → assert in-flight state (progress card) → assert regenerated mock content LANDS: section element text changed and matches the deterministic `generateMockSectionContent` output (pin a substring of the mock generator's output, checked at impl time — assert content, not just endpoint response).
   - Also assert the Button/CTA Regenerate path is still present (`ElementToolbar.tsx:109 handleRegenerate` — same `regenerateElementWithVariations` call; a `data-action` presence assertion suffices, no second full flow needed).
   - Ignore the legacy `regenerateElement` stub (aiActions.ts:451) — unused mock, not under test.
4. **Fix what the e2e exposes** (via the contingency protocol above), re-run until green.

### Verification

- `npx tsc --noEmit` clean; `npm run test:run` green; `npm run lint` green; `npm run build` green.
- `npm run test:e2e` — new `toolbar-regen.spec.ts` green in mock mode; existing `toolbar-dispatch.spec.ts` + `link-picker.spec.ts` still green.
- Manual sanity: Regen visible on body-section toolbars, absent on header/footer, disabled mid-generation.

### 🚧 HUMAN GATE

Spec candidate gate: **Regen e2e green (element + section)** + founder eyeball — Regen works live on the text toolbar and the section toolbar against `npm run dev` (real routes exercised at least once, not only mock). Do not start phase 2 until passed.

---

## Phase 2 — LinkPicker replaces Button Settings destination + goal-CTA preservation

### Files touched

- `src/components/toolbars/ButtonConfigurationModal.tsx` — swap destination fields for LinkPicker; export/extract the adapter
- `src/components/toolbars/buttonCtaAdapter.ts` — **new**, pure adapter functions (plain module, no `'use client'` — published/client-boundary hygiene, though nothing published imports it)
- `src/components/toolbars/buttonCtaAdapter.test.ts` — **new**, vitest for adapter + GOAL_REF preservation

### Steps

1. **Extract the adapter** (`buttonCtaAdapter.ts`, pure functions):
   - `configToPickerValue(config): string` — current href for LinkPicker's dual-read `value`: `config.type==='page'` → `pathSlug`; `'link'` → `config.url ?? ''`; else `''`.
   - `applyPickerLink(config, link: Link): ButtonConfig` — `link.dest.kind==='page'` → `{...config, type:'page', pathSlug}`; else → `{...config, type:'link', url: resolveDestination(link.dest)}`. **Drops `link.source`** (locked decision). Never receives GOAL_REF (LinkPicker can't emit it).
   - Move (or re-export) `buildCtaButton` + `configFromCta` here if needed for the test — behavior byte-identical, no logic change.
2. **Swap the modal's destination region** (the `!followGoal` block, lines 690-947):
   - RadioGroup: replace the "External Link" (699-706) + "Link to Page" (728-738) options with one "Link" option; keep "Native Form" + "Link with Input" options as-is.
   - Delete the URL `Input` (764-776) and the page `Select` (743-761); render `LinkPicker` in their place when the "Link" radio is active: `value={configToPickerValue(config)}`, `onChange={(link) => setConfig(prev => applyPickerLink(prev, link))}`, `sectionOptions` from `buildSectionLinkOptions` (same source as the other 15 mounts), `pageOptions` from the modal's existing `pageOptions` mapped to `SectionOption` shape. Omit legal/social options (parity with the replaced fields; adding them is free upside, implementer's call).
   - Radio state mapping: "Link" radio selected when `config.type` is `'link'` OR `'page'` (both now live behind LinkPicker); switching radios preserves existing `setConfig` semantics.
   - Form controls (formId select, behavior radio, Create New Form) + link-with-input controls: UNTOUCHED.
   - `handleSave` (~371-399), `buildCtaButton`, `configFromCta`, legacy `buttonConfig` sibling write, `elementMetadata[…].cta` persistence: UNTOUCHED — the adapter feeds the existing `config` shape so the whole persistence path is unchanged by construction.
   - `followGoal` toggle + GOAL_REF (550-586, 84-86): UNTOUCHED, outside the swapped region.
3. **Preservation test** (`buttonCtaAdapter.test.ts`):
   - Goal-following: `buildCtaButton(config, 'primary', /*followGoal*/ true)` → exactly `{ role:'primary', dest:'GOAL_REF' }` regardless of picker-set url/pathSlug; and GOAL_REF still resolves via the render path (`normalizeCtas.ts:157` `goalToDestination` → non-empty `cta_href` for a representative goal) — pins the fragile F23-adjacent behavior.
   - Adapter round-trips: external url → `{type:'link', url}` → CTAButton `{kind:'external'}`; page pick → `{type:'page', pathSlug}` → `{kind:'page'}`; section anchor → `{kind:'section'}`; `source` never persisted.
   - Detach→re-attach: `followGoal` false→picker sets dest→true again ⇒ save is GOAL_REF (picker residue doesn't leak).
4. No LinkPicker.tsx changes — its emission contract is pinned by `LinkPicker.test.tsx`; the dual-read `value` API already covers this mount. The DISABLED `link-action` placeholder on `ElementToolbar.tsx:194-233` stays as-is (greyed placeholder ruling; not this spec's target — the "beside" being killed is inside the modal).

### Verification

- `npx tsc --noEmit`; `npm run test:run` (new adapter test + existing `LinkPicker.test.tsx` green); `npm run lint`; `npm run build`.
- `npm run test:e2e` — `link-picker.spec.ts` + `toolbar-regen.spec.ts` + `toolbar-dispatch.spec.ts` still green.
- Manual: Button Settings shows ONE destination editor; form + link-with-input flows unchanged; primary CTA defaults to follow-goal; detach → LinkPicker → save → reopen prefills correctly (configFromCta round-trip).

### 🚧 HUMAN GATE

Founder eyeball (spec candidate gate): after consolidation, a **goal-following CTA still follows the page goal** live (change the goal → primary button re-points), and a detached CTA set via LinkPicker lands the right href. Merge gate follows per branch rules.

---

## Post-phase

Single whole-diff impl-review (standard tier). Confirm acceptance checklist: zero published files in `git diff --stat`, no new credit events, Ask-AI comments gone.

## Unresolved questions — RESOLVED by orchestrator (unattended rulings, from spec)

1. **Regen on header/footer → HIDE via `CHROME_HIDDEN_ACTIONS`** (plan default). The greyed-placeholder ruling is for capabilities that don't-exist-yet-but-are-meaningful; regen on chrome (footer/header) is not-applicable (chrome isn't a copy-contract section), not pending — so hide, don't grey.
2. **Collapse "External Link"+"Link to Page" into ONE "Link" option behind LinkPicker → YES.** That single unified destination editor IS the consolidation the spec asks for.
3. **Legal/social options in the modal LinkPicker → NO, strict parity.** Spec says LinkPicker *replaces* the destination section, not expands it. Emit only section/page/URL (what the replaced fields did). Adding new button-destination kinds is out of scope + widens the adapter's resolve surface.
4. **Drop unused `'hidden'` `TrailingSlotState` arm → NO, leave it.** Keep the diff minimal; only remove the dead Ask-AI comments. Don't touch the `TrailingSlotState` type.
