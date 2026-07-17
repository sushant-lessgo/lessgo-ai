# toolbar-standard-beta — implementation plan (rev 3, post plan-review iter 2)

- **WORKDIR:** `C:\Users\susha\lessgo-ai\.claude\worktrees\toolbar-standard-beta`
- **Branch:** `feature/toolbar-standard-beta`
- **Spec:** `docs/task/toolbar-standard-beta.spec.md` (tier: full)
- **Closed contract:** `docs/tracks/toolbarPlan.md` (anatomy + Beta/Final action list)
- **Look source:** handoff `Lessgo Editor Redesign.dc.html` — t2 (toolbar), t4 (link picker), t5 (manage-items) — built with ui-foundation primitives (merged).

## Overview

Unify every in-editor floating toolbar onto the existing dispatch spine (`useSelectionPriority` → `ToolbarShell` → `actionSets`) with the handoff-t2 anatomy `[element actions] · [Design ▾ disabled] · [Ask AI] · [⋯/Delete]`; add the buildable Beta action sets (Button/CTA, Form, Footer, Social); replace `LinkTargetPopover` with the shared t4 `LinkPicker` across all 14 mounts and add Link to Text + Button/CTA; ship t5 manage-items for Social plus form-field reorder in FormBuilder; finish with per-element Ask Lessgo AI behind a human gate. Menu, Footer-links, Image-link, Section-background, Social-orientation are DEFERRED with reasons recorded below — the shell half of the spec's Goal ships in full; the curated-action-set half ships roughly halved (see the honesty table). Edit-side only: zero changes to `.published.tsx` / `.core.tsx` / published renderers.

## Progress log

- phase 1 t2 shell chrome + slots + ToolbarButton + migrate Text/Section/Image/Element: **done** (commit `4db4f754`, review loops 2 — `fix first` → playwright.config.ts registration → `ship`). Gate: tsc clean, 3546 tests pass, `e2e/toolbar-dispatch.spec.ts` 7 passed through the REAL config. Published tripwire held (`linkTargetPublished.test.tsx` byte-untouched; `uiFoundationIsolation` snapshot verified byte-identical by blob hash — its `M` status is a CRLF stat artifact, intentionally unstaged). Scope amendment: `playwright.config.ts` added to Files-touched (its `testMatch` is an allowlist — spec matched 0 tests without it). Accepted deviations: Delete NOT hoisted to shell trailing slot (pure `resolveProps` can't carry store-bound handlers → would force the behavior change phase 1 forbids; `trailing` deferred to a phase with a consumer, `designMenu` added+consumed); disabled colour `#5a5a66` not `text-gray-300` (gray-300 is brighter than enabled on the dark pill); new chrome-visibility context (SectionToolbar renders nothing mid-regen → empty pill otherwise). Known accepted semantics change: `InlineTextEditorV2.tsx:206`'s `closest('[data-toolbar-type="text"]')` guard previously NEVER matched (text toolbar tagged `"text-mvp"`) and now DOES via the shell's `data-toolbar-type` — blur onto text toolbar no longer saves/exits (likely original intent, moot due to onMouseDown preventDefault). Deferred: `ToolbarShell.tsx:159` `useEffect`→`useLayoutEffect` ordering edge. UNVERIFIED BY ANYONE → founder gate: local-state survival across shell re-renders, t2 visual fidelity by eye (white→dark pill is a large visual shift).
- phase 2 Beta action sets — Button/CTA, Form, Footer [HUMAN GATE after]: pending
- phase 3 t4 LinkPicker — build + Text/Button Link + migrate 14 mounts + delete popover: pending
- phase 4 t5 Social manage-items + form-field reorder + dead nav-editor deletion: pending
- phase 5 Ask Lessgo AI (LLM + credits) [HUMAN GATE before implementing]: pending

## Rulings (binding — orchestrator resolutions; Constraints + "no published-output change" acceptance criteria WIN over Scope-IN bullets)

1. **t4 new-tab switch → DEFERRED to Final.** `Link` has no newTab field; new-tab is derived at render (`externalLinkProps`, `src/utils/resolveCtaHref.ts:84-86`, `_blank` iff external). A stored toggle = Link type change + published renderers must read it ⇒ violates no-published-output. t4 ships the segmented TYPE control only, and MUST keep emitting `Link{dest,source}` byte-identically (`linkTargetPublished.test.tsx` must stay green untouched).
2. **t5 Footer links → DEFERRED to Final.** Footer links are not in the store at all — per-template block content, NESTED (FooterColumn.links) in meridian/techpremium but FLAT in surge (`footerDefaults.ts:5-16`), no add/update/remove/reorder actions. Wiring them = net-new store surface + published coupling. Footer keeps its existing chrome-section toolbar this slice.
3. **Menu Beta → DEFERRED to Final (replaces the old "migrate NavigationEditor" half).** Plan-review verified: `NavigationEditor.tsx` has exactly ONE importer (`NavItemToolbar.tsx`), and `NavItemToolbar` has ZERO importers in `src/` — both are DEAD CODE; `navigationConfig` is read by no renderer or block. The nav users ACTUALLY edit is per-template block content (`nav_items: {id,label,href: string|Link}` — inline label edit + LinkTargetPopover + add/remove, e.g. `MeridianNavHeader.tsx:82-107,132-176`; no reorder). A real Menu manage-items toolbar = 9 bespoke header ports ⇒ the SAME per-template fault line as rulings 2/3. This slice DELETES the dead pair (phase 4) and defers Menu. Un-defer trigger: skeleton phase-9 cutover (shared header primitives). Bar↔hamburger toggle is likewise deferred (no store field, per-template header decision, published change).
4. **t5 Form fields → local-draft reorder, restricted to published-supported types.** Two verified facts shape this: (a) `src/components/published/FormMarkupPublished.tsx:16-22` declares a NARROWER FormField union (`'text'|'email'|'tel'|'textarea'|'select'`) than the store's 10-member FormFieldType — adding radio/file/date would silently not publish; (b) FormBuilder edits fields in LOCAL `setFormData` state and saves via `updateForm` (its store field-actions were removed as dead in editor-phase-4 — audit :648,673-675), and the store's `reorderFormFields` impl `(formId,start,end)` (`formActions.ts:120`) CONTRADICTS both declared type contracts `(formId, fieldIds[])` (`src/types/store/formActions.ts:14`, `src/types/store/actions.ts:301`) — calling it through the typed store won't typecheck, and a store reorder mid-draft desyncs the local draft. **Therefore: reorder inside local `formData` + save via the existing `updateForm` path. Do NOT touch the store action; do NOT reconcile the type files; do NOT reconcile the three FormField interfaces** (own spec later). Offered add-field types filtered to the published-supported set (verify union at implement time).
5. **Image Replace/Stock → OUT (already shipped by merged media-library-picker).** `ImageToolbar` already wires Replace (:244) / Stock (:252) / renders `MediaPickerModal` (:333). Do not rebuild. Crop → keep the existing "Edit"/`SimpleImageEditor` action as-is; do NOT build a new Crop. **Image → Link → RE-DEFERRED to Final (plan-review iter-2 reversal of the earlier B3 restore): "no published-consumed image-link field exists; adding one = `<a>` wrapper + new field across 6+ `.published.tsx` = published-output change."** Code-verified: `ImageToolbar` targets any `[data-image-id]`/`<img>` node (mirrored `src/utils/hoverTarget.ts:71-83`); the blocks emitting `data-image-id` are hero/testimonial images in surge/hearth/lex (PetalFramedHero, ReviewGrid, PullQuoteWithMark, LetterOfReference), and their published twins render a bare `<img>`/CSS background with NO `<a>` wrapper and NO href prop (e.g. `hearth/blocks/Hero/PetalFramedHero.published.tsx:15,70-71`); `image_link`/`imageLink`/`image_href` = ZERO hits in `src/`; the element schema has no `href` for image elements (only `nav_items.href`). The only published-consumed image hrefs are `groups.{id}.href` in the work-skeleton gallery cores (`WorkGalleryGrid.core.tsx:59`) — already edited inline via `E.Link`+picker, atelier2-only (never served), NOT ImageToolbar targets. Un-defer trigger: an image-link field landing in the element schema + BOTH renderers — its own spec.
6. **Ask AI → FINAL PHASE, behind an explicit HUMAN GATE.** `editor-shell-redesign.spec.md:60` says post-Beta; our spec makes it Beta and governs (Ask-AI-per-element is a toolbar action). It's the heaviest piece (LLM + credits) ⇒ LAST phase, gate BEFORE implementing, phases 1–4 stand alone without it. Implementation shape when it runs: thin ADDITIVE `userGuidance` param on `/api/regenerate-element`; `assertProjectOwner` added with demo-safe placement (see phase 5 — verified: no unauth caller exists since `requireAICredits`→`requireAuth` already 401s, `planCheck.ts:208-220`, BUT the route has a `DEMO_TOKEN` mock short-circuit at :49-64 that a naive assert would break); reuse `requireAICredits`/`consumeCredits` at ELEMENT_REGENERATION cost; handle 402 INSUFFICIENT_CREDITS distinctly in the client.
7. **Scope fence:** `src/app/edit/[token]/components/toolbars/*` + `ui/FloatingToolbars.tsx` + the t4/t5 shared components + the 14 edit-side link mounts + FormBuilder + the phase-4/5 files listed. Touch NOTHING in `components/layout/*` (owned by editor-shell-redesign).

### Plan-level decisions

- **D-1 Section "Background" → DEFERRED to Final.** (Rationale corrected per plan-review B4 — the old "both renderers would need to read a new field" claim was FALSE: `styleTokens` is already threaded through BOTH renderers — `LandingPageRenderer.tsx:967`, `LandingPagePublishedRenderer.tsx:27,56,80,223` — and `serializeStyleTokens` (`src/modules/skeletons/styleTokens.ts:124`) already emits `--u-bg`; zero renderer change needed to WRITE.) **The TRUE blocker: the write has nowhere to LAND.** `data-surface` is derived as `tmpl.getSurfaceForSection(sectionType)` with NO per-section override argument (`LandingPageRenderer.tsx:523`, `LandingPagePublishedRenderer.tsx:156`; the skeleton's own override lives in `skin.selections.surfaceBySection`, `skeletons/work/skin.ts:51-52`), and the 8 served templates' blocks hardcode their CSS — none consume `var(--u-bg)`. A Background action today would visibly do nothing for every user except atelier2 (never served, `bespoke:true`). Un-defer trigger: templates consuming `--u-*` / skeleton phase-9 cutover. **Do not re-litigate on the old rationale — it was wrong; this one is code-verified.**
- **D-2 Social "Orientation" → DEFERRED to Final.** `SocialMediaConfig` (`state.ts:133-145`) has no orientation field; adding one = new store field + published renderers must read it — the exact class rulings 2/3 defer. Beta Social = Manage items only.
- **D-3 Spec's skeleton-gating rationale is STALE — corrected.** The token surface EXISTS (`src/modules/skeletons/styleTokens.ts`; `--u-*` = the Design ▾ vocabulary, persisted at `Project.themeValues.styleTokens[sectionId]`), and shared Logo/Nav primitives exist (`skeletons/work/blocks/primitives.ts:75-110`). Verdicts UNCHANGED (defer Design ▾ / Logo / Header-menu); the reason is **atelier2 is never served (`templateMeta.ts:206-221`, `bespoke:true`) ⇒ zero user value now**. Un-defer = phase-9 atelier cutover, NOT "build the token contract".
- ~~D-4~~ **removed** — repointed nothing: `NavItemToolbar` is dead code (ruling 3) and gets deleted, not repointed.

## What Beta actually delivers vs toolbarPlan's Beta columns (honesty table — goes to the founder at the phase-2 gate)

| Element | toolbarPlan Beta target | This slice ships | Gap + why deferred |
|---|---|---|---|
| **Text** | inline edit · size · B/I/U · color · align · Link · Ask AI | All existing actions in t2 shell + **Link (new, t4)** + Ask AI (gate-optional phase 5) | Ask AI only if phase-5 gate approves |
| **Button/CTA** | edit text · Link/Action · Style (primary/secondary/tertiary) · Ask AI | Edit text + **Link/Action (new, t4)** + "Style" + Ask AI (gate-optional) | "Style" = the EXISTING Button Settings panel relabeled, not a p/s/t selector, unless a store style field already exists (verify) |
| **Image** | Replace · Stock · Crop · Link · Delete | Replace/Stock (already shipped by merged media-library-picker) + Edit (existing SimpleImageEditor) + Delete, reskinned to t2 | "Crop" = existing Edit tool, not a new crop UI (ruling 5); **Link DEFERRED** — no published-consumed image-link field exists; adding one = `<a>` wrapper + new field across 6+ `.published.tsx` = published-output change |
| **Section** | Change Layout · Elements · Move · Duplicate · Delete · Background | All EXCEPT Background, in t2 shell | Background deferred — write has nowhere to land in served templates (D-1) |
| **Form** | edit fields · choose type · settings · Ask AI (labels) | Edit fields + settings dispatch through the shell + **field reorder (new)** + add-type restricted to published-supported set | Ask-AI-labels deferred to Final (fields aren't elements); type list narrowed by design (ruling 4) |
| **Footer** | manage links · background | **Nothing new** — existing chrome-section toolbar rendered in t2 shell with a "Footer" label | Links = per-template block content, no store surface (ruling 2); Background = D-1. Honest reading: a relabel |
| **Social** | manage items (platform+URL, reorder) · orientation | **Manage items (new, t5)** — add/remove/reorder/edit | Orientation deferred, no store field (D-2) |
| **Menu** | reorder · add page-link-anchor · rename · remove · bar↔hamburger | **Nothing** — dead NavigationEditor/NavItemToolbar deleted; real nav editing stays per-template inline (label + link picker + add/remove in the 9 headers, which DO gain the t4 picker) | Menu lives in per-template block content ⇒ 9 header ports = skeleton fault line (ruling 3) |

**One honest sentence:** the shell/anatomy half of the spec's Goal ships completely (one t2 shell, all seven element families dispatch through it, renegade link UI killed); the curated-action-set half ships roughly HALVED — Footer and Menu deliver no new capability, Section loses Background, Social loses Orientation, Image loses Link, Button "Style" is a relabel, Ask AI is gate-optional. What genuinely lands: t2 shell + ToolbarButton unification, form/footer/social dispatch coverage, LinkTargetPopover killed across 14 sites, Link on **Text + Button/CTA only**, Social manage-items, form-field reorder.

## Hard rules (repeat for every implementer)

- **Do NOT touch any `.published.tsx` / `.core.tsx` file or either published renderer/registry.** `src/modules/templates/linkTargetPublished.test.tsx` staying green **untouched** is the tripwire — never edit it. (Verified safe: the `editPrimitives` link mounts in atelier/vestria/granth/skeletons are edit-side only; published wrappers use `makePublishedPrimitives`, and `atelier/coreParity.test.ts` renders cores with published primitives only — the `.core.tsx` pattern is NOT a trap for this migration.)
- **`actionSets` `component` MUST stay a module-level constant** (stable element type → no remount/local-state loss; comment at `actionSets.tsx:10-15`). Never map to a locally defined component.
- Each phase edits ONLY its Files-touched list. Per-phase green gate: `npx tsc --noEmit` + `npm run test:run` (+ that phase's Playwright spec via `npx playwright test e2e/<spec>`). Before merge: full `npm run build` + `npm run lint`.
- Deterministic-QA rule: automatable checks land as Playwright specs in `e2e/` — not manual TODOs.
- t2/t4/t5 visuals come from `Lessgo Editor Redesign.dc.html` + ui-foundation primitives. Skeleton-gated items (Design ▾) render disabled/greyed, consistent with editor-shell grey-out.
- Store convention: selector for state (`useEditStore(s => s.x)`), `useEditStoreApi()` for actions/one-shot reads. (Both existing editors already follow this; it is the CLAUDE.md pattern, not a migration item.)

---

## Phase 1 — t2 shell chrome + slots + ToolbarButton + migrate Text/Section/Image/Element

**Goal:** the shell owns the t2 chrome and trailing slots; a shared `ToolbarButton` primitive replaces the four hand-rolled button implementations; the four existing toolbars render inside the new anatomy with zero behavior change.

**Steps:**
1. New `ToolbarButton.tsx` primitive (t2 look via ui-foundation): props `{icon, label, onClick, disabled?, disabledTitle?, variant?: 'default'|'danger', 'data-action': string (required)}`. Standardize disabled convention on the ElementToolbar precedent (`text-gray-300 cursor-not-allowed` + `disabledTitle`) and ADD `aria-disabled`; put `data-action` on every button (currently only SectionToolbar tags it). Include a shared divider element (replaces ad-hoc `w-px h-6 bg-gray-200`).
2. Restructure `ToolbarShell.tsx` to own the chrome: t2 container (bg/border/radius/shadow + status label area) wrapping `{toolbarBody}`, then trailing slot group: `[Design ▾ — DISABLED, title "Coming with the design system" (D-3)] · [Ask AI slot — HIDDEN until phase 5] · [⋯/Delete]`. **Chrome-wrapper constraints (verified):** (a) it must NOT set `overflow: hidden` — the variations panels are `absolute top-full left-0` SIBLINGS of each toolbar's inner div (`ElementToolbar.tsx:263-273`; `TextToolbarMVP.tsx:649,701,793`), so wrapping `{toolbarBody}` in chrome puts them INSIDE the bordered box and clipping would hide them; (b) it must NOT be `position: static` — today's positioned ancestor is the shell's floating div (`position: fixed` via floatingStyles); keep a positioned ancestor so `top-full` panels still anchor correctly. Smallest-diff alternative (implementer's choice): move the panels to a popover.
3. Extend `ActionSetEntry` in `actionSets.tsx` — keep `component` (module-level constant) + `resolveProps`; ADD trailing metadata so the shell owns the right-hand slots per type: e.g. `designMenu: 'disabled' | 'hidden'`, `trailing?: (selection, target) => { label?: string; deleteAction?: {...}; overflow?: Action[] } | null`. Do NOT convert the toolbars to fully declarative action lists this phase.
4. Strip the duplicated outer chrome (`bg-white border border-gray-200 rounded-lg shadow-lg` + status dot/label rows) from `TextToolbarMVP.tsx`, `SectionToolbar.tsx`, `ImageToolbar.tsx`, `ElementToolbar.tsx`; convert buttons to `ToolbarButton`. Preserve ALL current gating semantics exactly (`CHROME_HIDDEN_ACTIONS` stays hidden; `eligibleVariantCount>1` / `canConvertToForm()` unchanged) — only presentation unifies. Move Delete actions into the shell's trailing slot via the new metadata.
5. Per ruling 5: ImageToolbar keeps Replace/Stock (MediaPickerModal) + Edit (SimpleImageEditor) exactly as wired — reskin only; NO new Image actions this slice (Link deferred per ruling 5). Per D-1: no Section Background action.
6. New `e2e/toolbar-dispatch.spec.ts` (mock-mode, follow `render.spec.ts` patterns): for text / section / image / generic-element targets — click → exactly ONE floating shell; assert expected `data-action` set per type; Design ▾ present + `aria-disabled`; Esc dismisses.

**Files touched:**
- `src/app/edit/[token]/components/toolbars/ToolbarShell.tsx`
- `src/app/edit/[token]/components/toolbars/actionSets.tsx`
- `src/app/edit/[token]/components/toolbars/ToolbarButton.tsx` (new)
- `src/app/edit/[token]/components/toolbars/TextToolbarMVP.tsx`
- `src/app/edit/[token]/components/toolbars/SectionToolbar.tsx`
- `src/app/edit/[token]/components/toolbars/ImageToolbar.tsx`
- `src/app/edit/[token]/components/toolbars/ElementToolbar.tsx`
- `src/app/edit/[token]/components/ui/FloatingToolbars.tsx` (only if the mount needs adjusting)
- `e2e/toolbar-dispatch.spec.ts` (new)

**Verification:** `npx tsc --noEmit`; `npm run test:run`; `npx playwright test e2e/toolbar-dispatch.spec.ts`; manual dev check: text variations panel opens positioned under the toolbar and is NOT clipped by the chrome; toolbar local state survives shell re-renders (type in text toolbar, scroll, state persists).

---

## Phase 2 — Beta action sets: Button/CTA, Form, Footer

**Goal:** the remaining Beta element types (minus Social, which lands whole in phase 4) dispatch through the one shell with their curated action sets.

**Steps:**
1. **Button/CTA** (`ElementToolbar` context = button): Beta set = Edit Text · **Link/Action (rendered disabled, `disabledTitle: "Link picker lands next phase"` — enabled in phase 3)** · Style · Regenerate · Delete. Style = the existing "Button Settings" panel as the entry point, relabeled/reskinned; VERIFY whether a per-button style (primary/secondary/tertiary) field exists in the store — if not, do NOT add a store field; the settings panel IS the Style action for Beta (recorded in the honesty table).
2. **Form:** new `FormToolbar.tsx` + `actionSets['form']` entry (fills the current dead `'form'` ToolbarType — `showFormToolbar` exists but no entry, so the shell renders nothing today; note `getActionsForType` in `uiActions.ts:80-95` is metadata-only and already has a `'form'` case — it gates nothing, no change needed there). Actions: Edit fields (opens the existing FormBuilder flow — verify current trigger path and reuse) · Settings (recipient/integration — whatever FormBuilder/`updateFormSettings` already exposes; open the same modal on its settings surface). No new form capability this phase. Verify the form selection populates `sectionId`/`elementKey` so the shell's anchor resolves; if not, fix resolveProps/anchor for `form` only (no `selectionPriority.ts` priority changes).
3. **Footer:** per ruling 2 + D-1, footer keeps the chrome-section toolbar (SectionToolbar minus move/dup/delete via `CHROME_HIDDEN_ACTIONS`) — phase work = verify it renders in the t2 shell with a "Footer" label + e2e coverage. No Manage-links, no Background. (Honesty table calls this a relabel — do not oversell in the audit.)
4. **Social:** NOTHING this phase — the manage-items action + editor land together in phase 4 (wiring the old `SocialMediaEditor` first would be wire-then-swap against a to-be-deleted component).
5. Register any new action ids in the action-id registry (`src/hooks/editStore/uiActions.ts:85`) if the pattern requires it.
6. Extend `e2e/toolbar-dispatch.spec.ts`: form + footer selections each produce the one shell with the expected `data-action` set; button toolbar shows disabled Link/Action.

**Files touched:**
- `src/app/edit/[token]/components/toolbars/ElementToolbar.tsx`
- `src/app/edit/[token]/components/toolbars/FormToolbar.tsx` (new)
- `src/app/edit/[token]/components/toolbars/SectionToolbar.tsx` (footer label)
- `src/app/edit/[token]/components/toolbars/actionSets.tsx`
- `src/hooks/editStore/uiActions.ts` (action-id registry only, if needed)
- `e2e/toolbar-dispatch.spec.ts`

**Verification:** `npx tsc --noEmit`; `npm run test:run`; `npx playwright test e2e/toolbar-dispatch.spec.ts`.

> **HUMAN GATE (after phase 2):** founder QA — Text, Button/CTA, Image, Section, Form, Footer edit through the ONE shell in the t2 look; disabled states (Design ▾, Link/Action) read as intentional. **The founder is shown the "What Beta actually delivers" table above** — this gate is where the cumulative deferrals get signed off, not discovered later. Note: Link + Social manage-items + form reorder land in phases 3–4; this gate is coverage + look + deferral sign-off, not action completeness.

---

## Phase 3 — t4 LinkPicker: build, enable Text/Button Link, migrate all 14 mounts, delete LinkTargetPopover

**Goal:** one shared t4 link picker, emission-parity-proven DIFFERENTIALLY against the old popover before the swap; every mount migrated; the bespoke popover deleted; no parallel link UI left. (Build + migrate merged into one phase — `tsc` is the whole net for the swap; splitting bought nothing.)

**Steps (order matters — differential test needs both components alive mid-phase):**
1. New `src/components/editor/LinkPicker.tsx` (t4 look: segmented type control). Props = compatible superset of `LinkTargetPopover` (`{value: string|Link, sectionOptions: SectionOption[], pageOptions?, legalOptions?, socialOptions?, onChange: (link: Link)=>void, triggerClassName?}`) + optional controlled `open`/`onOpenChange` and trigger-less mode for shell-mounted use. Export (or re-export) `SectionOption`. **NO new-tab switch (ruling 1).**
2. **DIFFERENTIAL parity test** `src/components/editor/LinkPicker.test.tsx` (vitest, jsdom): declare the expected `onChange` payloads per link type as **SHARED literal constants** in the test file (section/custom-URL → `{dest, source:'manual'}`; page/legal/social → `source:'derived'` — pinning `LinkTargetPopover.tsx:99-118`). While `LinkTargetPopover` still exists, mount BOTH components with identical props, drive identical interactions per link type, and assert BOTH halves against those SAME constants (a fixture test written by the same implementer can't catch "meant `'manual'`, wrote `'derived'`"; asserting both components against one shared literal can). Also cover dual-shape `value: string|Link` acceptance. Run green BEFORE step 5.
3. Enable the Link actions: `TextToolbarMVP` Link · `ElementToolbar` Link/Action (un-disable the phase-2 placeholder) → open LinkPicker anchored within the toolbar. **Image Link = DEFERRED (ruling 5) — do NOT add a Link action to `ImageToolbar`; it is not in this phase's Files touched.** Options: build `SectionOption[]`/page/legal/social lists from the store — locate how existing call sites build them and extract/reuse; if a small hook is needed, add `toolbars/useLinkOptions.ts`. Persist via the elements' EXISTING write paths (verify which field each element's link lands in — e.g. CTA `Link` value — and reuse the existing update action; NO new store fields).
4. Swap `import { LinkTargetPopover }` → `LinkPicker` at all 14 mounts (verified list below; re-grep at implement time as authoritative). Keep each call site's callback shape UNTOUCHED (nav/footer: `onChange={(link)=>patchItem(id,{href:link})}` storing the whole Link; editPrimitives: direct `elements.cta_href` writes). These are edit-side `'use client'` files — **do not touch sibling `.published.tsx`/`.core.tsx` files.**
   - `src/modules/templates/meridian/blocks/Header/MeridianNavHeader.tsx`
   - `src/modules/templates/meridian/blocks/Footer/HairlineFooter.tsx`
   - `src/modules/templates/techpremium/blocks/Header/TechPremiumNav.tsx`
   - `src/modules/templates/techpremium/blocks/Footer/TechPremiumFooter.tsx`
   - `src/modules/templates/surge/blocks/Header/WarmNavHeader.tsx`
   - `src/modules/templates/surge/blocks/Footer/ContactFooterRich.tsx`
   - `src/modules/templates/hearth/blocks/Header/WarmNavHeader.tsx`
   - `src/modules/templates/lex/blocks/Header/LetterheadNav.tsx`
   - `src/modules/templates/lumen/blocks/Header/LumenNav.tsx`
   - `src/modules/templates/lumen/blocks/Footer/LumenFooter.tsx` (2 mounts)
   - `src/modules/templates/vestria/blocks/editPrimitives.tsx`
   - `src/modules/templates/granth/blocks/editPrimitives.tsx`
   - `src/modules/templates/atelier/blocks/editPrimitives.tsx`
   - `src/modules/skeletons/work/blocks/editPrimitives.tsx`
5. DELETE `src/components/editor/LinkTargetPopover.tsx`. In the differential test, delete ONLY the popover half (its mounts + assertions); the shared literal payload constants and the LinkPicker-side assertions stay **byte-identical** — do NOT re-record what LinkPicker emits (that would launder a regression through the conversion; the constants were validated differentially in step 2 and remain the pin).
6. Update name references: `src/components/ui/popover.tsx` (:14-16 comment), `src/components/ui/README.md` (:147,:153), `.claude/skills/manual-test/SKILL.md` (:80). Comment-only mentions elsewhere (`normalizeCtas.ts`, `parseCopy.ts`, granth/vestria `primitives.ts`/`index.ts`, `templates/README.md`, `SocialProfilesPanel.tsx`) may be updated in the same pass — comment text ONLY, zero behavior edits.
7. New `e2e/link-picker.spec.ts`: open picker from the button toolbar, choose a section anchor + an external URL, assert the rendered edit-side anchor updates.

**Files touched:**
- `src/components/editor/LinkPicker.tsx` (new)
- `src/components/editor/LinkPicker.test.tsx` (new)
- `src/app/edit/[token]/components/toolbars/TextToolbarMVP.tsx`
- `src/app/edit/[token]/components/toolbars/ElementToolbar.tsx`
- `src/app/edit/[token]/components/toolbars/useLinkOptions.ts` (new, only if extraction is needed)
- The 14 template/skeleton edit-side files listed above
- `src/components/editor/LinkTargetPopover.tsx` (DELETE)
- `src/components/ui/popover.tsx` (comment only)
- `src/components/ui/README.md`
- `.claude/skills/manual-test/SKILL.md`
- (optional, comment-only) `src/utils/normalizeCtas.ts`, `src/modules/audience/product/parseCopy.ts`, `src/modules/templates/{granth,vestria}/blocks/primitives.ts`, `src/modules/templates/{granth,vestria}/index.ts`, `src/modules/templates/README.md`, `src/components/editor/SocialProfilesPanel.tsx`
- `e2e/link-picker.spec.ts` (new)

**Verification:** `npx tsc --noEmit` (proves zero dangling imports); `npm run test:run` (differential/fixture parity test green; **`linkTargetPublished.test.tsx` green and untouched**); `npx playwright test e2e/link-picker.spec.ts`; manual dev spot-check: edit a nav item link on meridian + a CTA on atelier via the new picker.

---

## Phase 4 — t5 Social manage-items + form-field reorder + dead nav-editor deletion

**Goal:** Social gets its manage-items action + t5 editor; FormBuilder's field list gains reorder (local-draft, per ruling 4) with restricted add-types; the dead `NavigationEditor`/`NavItemToolbar` pair is deleted; `SocialMediaEditor` is replaced and deleted. **No generic `ManageItemsPanel` frame** — with Menu dropped, the two remaining consumers (Social editor, FormBuilder list) share nothing but a move-up/down pair; build `SocialItemsEditor` directly and extract a shared frame ONLY if the FormBuilder half genuinely reuses it (unlikely — its item editor is the whole existing per-field UI).

**Steps:**
1. New `src/components/editor/SocialItemsEditor.tsx` (t5 look): ordered rows over `SocialMediaConfig.items` (platform + URL item editor), move up/down (adjacent-swap → the existing `reorderSocialMediaItems` etc.; NOT @dnd-kit), add (respects the maxItems cap), remove. Port the auto-scroll+focus-on-add effect and "+ Add" dashed affordance from `SocialMediaEditor`. Selector for state, `useEditStoreApi()` for actions (the existing pattern). **No orientation (D-2).**
2. Add the Social "Manage items" toolbar action → opens `SocialItemsEditor`. Entry point: extend `ElementToolbar`'s context detection (same pattern as `canConvertToForm()`) to recognize social-item elementKeys; VERIFY whether social icons are spine-selectable (`data-element-key` present) — if not, surface Manage-items on the containing chrome-section (footer) toolbar instead and record which path was taken in the audit. Extend `e2e/toolbar-dispatch.spec.ts` for the social selection.
3. Repoint `src/components/editor/SocialProfilesPanel.tsx` (imports SocialMediaEditor) → `SocialItemsEditor`. **Prop-contract seam (must hold):** it's mounted at `GlobalModals.tsx:95` as `<SocialProfilesPanel isVisible onClose>` → `SocialMediaEditor` (`SocialProfilesPanel.tsx:26`); `GlobalModals.tsx` is deliberately NOT in this phase's files-touched, so `SocialItemsEditor` must keep the `isVisible`/`onClose` surface (or `SocialProfilesPanel` adapts internally). DELETE `src/components/social/SocialMediaEditor.tsx`.
4. **Delete dead nav-editor pair:** verify at implement time (grep) that `NavigationEditor.tsx`'s only importer is `NavItemToolbar.tsx` and that `NavItemToolbar.tsx` has ZERO importers in `src/` — **if any importer appears, STOP and flag via mailbox** (do not delete). Then DELETE `src/components/navigation/NavigationEditor.tsx` + `src/components/navigation/NavItemToolbar.tsx`; update `src/components/README.md` refs. Menu Beta = DEFERRED per ruling 3 — do NOT build replacement nav UI.
   - **Store nav surface intentionally LEFT in place:** `navigationConfig` + `updateNavItem`/`addNavItem`/`removeNavItem`/`reorderNavItems`/`setNavigationMaxItems` (`layoutActions.ts:886-1131`), `persistenceActions.ts:192-194,615`, `editDelta/capture.ts` become caller-less once the two dead editors are deleted. LEAVING them is deliberate — it's persisted saveDraft payload; removal = field-drop with its own blast radius ⇒ its own spec. Do NOT delete.
5. **FormBuilder field reorder (ruling 4 — explicit design choice):** add move up/down to FormBuilder's field list operating on LOCAL `formData` state (`setFormData` array swap), saved through the EXISTING `updateForm` path — consistent with how FormBuilder already adds/edits/removes fields. **Do NOT call the store's `reorderFormFields`** (impl/type-contract mismatch, and a store write mid-draft desyncs the local draft); do NOT add store actions; do NOT touch `src/types/store/*` or `formActions.ts`.
6. **Restrict add-field type choices** to the published-supported union — verify against `FormMarkupPublished.tsx:16-22` (`'text'|'email'|'tel'|'textarea'|'select'`) at implement time. Existing fields of unsupported types stay editable/removable; you just can't CREATE new ones. Use the STORE FormField interface (`state.ts:547`) throughout; do NOT touch `src/types/core/forms.ts` or `FormMarkupPublished.tsx`.
7. New `e2e/manage-items.spec.ts`: reorder a social item (new order in edit-side DOM; add respects cap); reorder a form field (order persists in the edit-side form after save); add-field type list offers only the restricted set.

**Files touched:**
- `src/components/editor/SocialItemsEditor.tsx` (new)
- `src/components/editor/SocialProfilesPanel.tsx`
- `src/app/edit/[token]/components/toolbars/ElementToolbar.tsx` or `SectionToolbar.tsx` (whichever hosts the Social action)
- `src/app/edit/[token]/components/toolbars/actionSets.tsx` (social action metadata, if needed)
- `src/components/forms/FormBuilder.tsx`
- `src/components/social/SocialMediaEditor.tsx` (DELETE)
- `src/components/navigation/NavigationEditor.tsx` (DELETE — after importer check)
- `src/components/navigation/NavItemToolbar.tsx` (DELETE — after importer check)
- `src/components/README.md` (refs, if present)
- `e2e/toolbar-dispatch.spec.ts` (social selection)
- `e2e/manage-items.spec.ts` (new)

**Verification:** `npx tsc --noEmit` (proves the deletions dangle nothing); `npm run test:run`; `npx playwright test e2e/manage-items.spec.ts e2e/toolbar-dispatch.spec.ts`; manual: submit-path smoke on a form with reordered fields in dev.

---

## Phase 5 — Ask Lessgo AI (per-element, credit-gated)

> **HUMAN GATE — BEFORE implementing.** Founder decides: ship Ask-AI in Beta, or rule it post-Beta (editor-shell-redesign's stance) and skip this phase entirely — phases 1–4 stand alone. The gate also covers: (a) the credit-block copy facing paying users (align with billing-beta gating message), (b) adding `assertProjectOwner` to `/api/regenerate-element` (access-control change — placement below is demo-safe and pre-verified; no legit unauthenticated caller exists since `requireAICredits`→`requireAuth` already 401s, `planCheck.ts:208-220`).

**Goal (if approved):** Ask Lessgo AI on Text + Button/CTA toolbars — free-text instruction → element regeneration → existing variations picker; credit-gated with a distinct insufficient-credits block.

**Steps:**
1. **API** (`src/app/api/regenerate-element/route.ts`) — thin ADDITIVE change only (must survive a later regen-modernization rewrite; do NOT restructure):
   - Accept optional `userGuidance: string` in the body (mirror `regenerate-section`'s naming) and fold it into the existing prompt (:70).
   - ADD `assertProjectOwner` **AFTER the `NEXT_PUBLIC_USE_MOCK_GPT` / `DEMO_TOKEN` short-circuit (route :49-64)** — the demo token (`"lessgodemomockdata"`) returns mock data before any ownership question arises and stays explicitly EXEMPT (a signed-in user on the demo token does NOT own that project; a naive assert next to the other guards breaks demo). Empty token (`token = tokenId || ""`) → REJECT with 400 before the assert (define the behavior; do not pass `''` into `assertProjectOwner`).
   - Keep the existing credit pattern: `requireAICredits(req, UsageEventType.ELEMENT_REGEN, CREDIT_COSTS.ELEMENT_REGENERATION)` up front → work → `consumeCredits` AFTER success. Same response shape.
2. **Client** (`src/hooks/editStore/aiActions.ts`, ~:543-599): pass `userGuidance` through; fix the 402 swallow at :556 — on `response.status === 402` parse `{error, code:'INSUFFICIENT_CREDITS'}` and set a distinct credit-block state/message (surface in the Ask-AI popover/toast; do NOT collapse into the generic `aiGeneration.errors` string). Keep the NON-optimistic flow: results land in `state.elementVariations`; commit on `applyVariation`; keep `trackRegen` + re-freeze on accept.
3. **UI:** enable the shell's Ask-AI trailing slot (hidden since phase 1) for `text` + `element` action sets — sparkle button → small prompt popover ("Ask Lessgo AI": free-text instruction + submit + loading via `aiGeneration` state + credit-block message surface). New `toolbars/AskAIAction.tsx`; register `'ask-ai'` in the action-id registry (`uiActions.ts:85`). Text toolbar's existing sparkle→variations remains; Ask-AI adds the instruction path.
4. **Scope cut:** Form-labels Ask-AI = OUT (form fields aren't elements — different plumbing) → Final; note in audit.
5. New `e2e/ask-ai.spec.ts` (deterministic — no real LLM): Playwright `page.route` intercepts `/api/regenerate-element` → (a) 402 `{code:'INSUFFICIENT_CREDITS'}` → distinct credit-block message renders; (b) 200 with mock variations → variations picker opens and Apply commits.

**Files touched:**
- `src/app/api/regenerate-element/route.ts`
- `src/hooks/editStore/aiActions.ts`
- `src/hooks/editStore/uiActions.ts`
- `src/app/edit/[token]/components/toolbars/AskAIAction.tsx` (new)
- `src/app/edit/[token]/components/toolbars/ToolbarShell.tsx` (un-hide slot)
- `src/app/edit/[token]/components/toolbars/actionSets.tsx` (per-type Ask-AI metadata)
- `e2e/ask-ai.spec.ts` (new)

**Verification:** `npx tsc --noEmit`; `npm run test:run`; `npx playwright test e2e/ask-ai.spec.ts`; manual dev: one real Ask-AI round-trip on text + button (credits decrement, variations apply); **manual demo check: the demo-token editor's regenerate still works signed-in**.

---

## Merge checklist (after phase 5, or after phase 4 if phase 5 is ruled out)

- Full `npm run build` + `npm run lint` green.
- All e2e specs green: `toolbar-dispatch`, `link-picker`, `manage-items` (+ `ask-ai` if built).
- `linkTargetPublished.test.tsx` green and byte-untouched (`git diff --stat` shows no published-side files).
- Founder end-to-end QA: edit → publish; published output identical (edit-side-only change).
- Merge to main = human gate (plain merge, no squash); user pushes.

## Unresolved questions

1. Honesty table verdict: Footer + Menu = nothing new this slice. Accept, or re-scope Beta?
2. Phase 5 Ask-AI: pre-decide now or at the gate? Editor-shell spec says post-Beta.
3. Button "Style" = settings-panel relabel (no store field) — acceptable for Beta?
4. Form-labels Ask-AI pushed to Final — OK?
5. D-1/D-2 deferrals (Section Background, Social orientation) — confirm, both contradict toolbarPlan Beta columns.
