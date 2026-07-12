# editor-phase-4-store-finish — plan

**Branch:** `feature/editor-phase-4-store-finish` (worktree `.claude/worktrees/feature-editor-phase-4`)
**Spec:** `docs/task/editor-phase-4-store-finish.spec.md` · **Scout:** `docs/task/editor-phase-4-store-finish.scout.md`

## Overview

Collapse the editor store's **four** access layers (`useEditStore.ts` token hook, `useEditStoreLegacy.ts` façade, dead `createEditStore`/`useEditStoreCompat` shims, and the dead zero-importer compat file `useEditStoreGlobal.ts`) into one clean selector-first hook, then selector-ize the ~30 remaining bare whole-store call sites in small hot-first batches, and lock it with an ESLint rule banning bare whole-store subscriptions. Zero user-visible change; the token-scoped store factory + `storeManager` LRU, `useEditStoreApi`, static `.getState()`, and the named-op mutation discipline are all preserved untouched.

## Progress log

- phase 1 Step A dead-export removal: done (commit 25a5082a, review loops 1)
- phase 2 Step A façade unification: done (commit 14c4f3e9, review loops 1)
- phase 3 Step A import sweep + legacy delete: done (commit 91883aff, review loops 1) — 106 files swept; NOTE bare-call count = 73 (scout est ~30 undershot; Step B batches must absorb the extra — no new bare introduced)
- phase 3G HUMAN GATE A (Step-A merge + editor verify): BRANCH GREEN — merged current main (20fb7bab) in clean (0 conflicts, 0 legacy stragglers), prisma-regen + tsc + test(2508) + build + authed edit-persistence smoke all green; reported to mailbox; HOLDING for station feature→main merge before Step B
- phase 4 Step B baseline probe: pending
- phase 5 batch B1 useOptimizedEditStore: pending
- phase 6 batch B2 renderer/selection hot path: pending
- phase 7 batch B3 useEditor + SectionCRUD: pending
- phase 8 batch B4 theme surfaces: pending
- phase 9 batch B5 modals/forms: pending
- phase 10 batch B6 header/chrome/preview/dev: pending
- phase 11G HUMAN GATE B (Step-B reactivity + perf sign-off): pending
- phase 12 lint rule flip (+ HUMAN GATE C confirm): pending
- phase 13 docs close-out: pending
- phase 13G HUMAN GATE D (final merge to main): pending

---

## Design decisions (binding for all phases)

### D1. Final naming + file layout

End state — **two files, one reactive hook name**:

| File | Exports | Role |
|---|---|---|
| `src/hooks/useEditStore.ts` | `useEditStore(selector?)` (reactive context-reader, current `useEditStoreLegacy` body verbatim, incl. `globalStoreRef` set-on-render), `useEditStoreApi()` (non-reactive), static `useEditStore.getState()`, type re-exports `EditStore`, `EditStoreInstance` | THE hook — what all ~100 call sites import |
| `src/hooks/useEditStoreBootstrap.ts` (new) | `useEditStoreBootstrap(tokenId, opts)` — the current live token/SSR hook from old `useEditStore.ts`, moved verbatim (incl. the `window.__useEditStoreDebug` dev IIFE — see phase 2) | Imported ONLY by `EditProvider.tsx` |

- `src/hooks/useEditStoreLegacy.ts` — **deleted** by end of phase 3 (thin re-export only during phase 2, for bisectability).
- `src/hooks/useEditStoreGlobal.ts` — **deleted in phase 1** (dead compat shim, zero importers in `src/`). Deleting it early is load-bearing: if it survived to phase 3, the blind import-path repoint would preserve it and its `useEditStoreWithToken` re-export (line 11, aliasing `./useEditStore`'s export) would silently re-point at the *reactive* hook after the phase-2 rename — a misleading live alias no gate catches.
- Names removed: `useEditStoreLegacy`, `useEditStoreCompat`, `useEditStoreGlobal` file (incl. its `useEditStoreWithToken` alias), deprecated `createEditStore` shim, dead `useCurrentEditStore` / `useEditStoreSelector`. The REAL factory `createEditStore` in `src/stores/editStore.ts` is untouched.
- Renaming the token hook to `useEditStoreBootstrap` resolves the name collision AND makes the lint rule trivial (bare = `useEditStore` called with zero args; the bootstrap has a different name and always takes an arg → no exemption needed).

### D2. Step-B batching (hot first, bisectable)

Order = scout HOT list. `useOptimizedEditStore.ts` gets its own batch FIRST (shared shim, ~20 bare destructures, insulates ~27 downstream refs — highest leverage, and a regression there is loud/obvious). Then render/selection, then the second aggregation shim + SectionCRUD, then three cold batches. One commit per batch.

**Aggregation shims (`useOptimizedEditStore.ts`, `useEditor.ts`): REFACTOR internals, no lint exemption.** Their wrapper hooks each pull a known slice → convert each internal bare `useEditStore()` to a `useShallow` selector of exactly the fields that wrapper exposes; stable action refs move to selector or `useEditStoreApi().getState()` per the phase-3 pattern. Downstream callers change zero lines and gain narrow subscriptions for free. Dev-only `TemplateBlocksStage.tsx` also gets fixed (cheap) rather than exempted → target exemption list = **empty**.

### D3. ESLint rule (flip ON in phase 12 only)

Repo uses legacy `.eslintrc.json` (extends `next/core-web-vitals`). Add — no plugin needed:

```json
"no-restricted-syntax": ["error", {
  "selector": "CallExpression[callee.name='useEditStore'][arguments.length=0]",
  "message": "Bare whole-store subscription banned. Pass a selector (wrap object selectors in useShallow); use useEditStoreApi()/.getState() for actions & one-shot reads."
}]
```

- Catches exactly the banned form; does not flag `useEditStore(selector)`, `useEditStoreApi()`, `useEditStore.getState()`, or `useEditStoreBootstrap(tokenId)`.
- Known blind spot (accepted): an aliased import (`useEditStore as x`) escapes the AST match — none exist today (`useEditStoreGlobal.ts`, the only aliaser, dies in phase 1); note in rule message location comment.
- Exemption mechanism: inline `// eslint-disable-next-line no-restricted-syntax -- <justification>`. Target count: 0. Any exemption an implementer adds must be surfaced at Gate C.

### D4. Reactivity + perf verification (the CRITICAL net — scout: NO automated test catches an over-narrow selector)

Layered, decided here:

1. **Primary per-batch reactivity net (DECIDED, every Step-B batch — hot AND cold):** authed `npx playwright test edit-persistence` **+** the renderProbe browser smoke on that batch's touched surfaces, on top of the static floor `npx tsc --noEmit` + `npm run test:run` + `npm run lint`. Both browser checks run **authed** — all three Clerk creds (`E2E_CLERK_USER_EMAIL`, `E2E_CLERK_USER_PASSWORD`, `CLERK_SECRET_KEY`) are confirmed present in the worktree `.env.local`. No batch ships on tsc/test/lint alone; every batch phase below lists its real-browser smoke surfaces. (Degraded-env note, one line: if a future environment lacks these creds the per-batch net degrades and the Gate-B founder `/manual-test` pass is the backstop — the default path assumes creds present.)
2. **Over-narrow-selector guard, every converted file:** the implementer reads the full component body and enumerates in the phase audit, per file, the exact fields subscribed vs every field read on the render path. Rule: selector must be WIDE enough — include every render-read field; actions/one-shot reads go to `getState()`.
3. **Agent-driven browser smoke, every batch** (per-surface, from the `/manual-test` editor-interactions checklist): `npm run dev` + `e2e/tools/renderProbe.ts` (built in phase 4, reuses `e2e/auth.setup.ts` Clerk session) drives only the surfaces the batch touched — e.g. type in hero headline and assert live DOM update; select element → toolbar appears; undo/redo; palette swap repaints; section add/move/delete; open touched modal, change value, assert UI reflects store. Each phase below lists its smoke surfaces.
4. **Perf gate (spec acceptance):** renders-per-keystroke + JS heap while typing, measured by the probe using `NEXT_PUBLIC_DEBUG_EDITOR=true` per-render console logs (count section-render logs over a 20-char typing burst) + CDP `Performance.getMetrics` heap delta. Baseline in phase 4; re-measure after phase 7 (hot paths done) and phase 10. Expect renders/keystroke ↓, heap flat.
5. **HUMAN GATE B (phase 11G):** founder runs the `/manual-test` editor-interactions pass end-to-end; agent presents perf before/after table + per-file field-enumeration audits.

### Landmines (apply to every phase)

- NO `.tsx`/`.published.tsx` block-pair edits, no renderer layout changes — this feature never touches block markup, only store-subscription lines. `LandingPageRenderer.tsx` is edited at ONE call site (line ~64), nothing else.
- NO new ad-hoc `set()` mutations; all edits keep routing through the named ops (scout §6). Do NOT "fix" the `useUniversalElements` manual-spread exception.
- Phase-3 already-selectorized sites (scout §3 DO-NOT-retouch list) are off-limits except for the mechanical import-path change in phase 3.
- No `prisma`, no schema, nothing outside `src/hooks`, `src/app/edit`, `src/app/preview`, `src/app/dev`, `src/modules` import lines, `e2e/tools`, `.eslintrc.json`, docs.

---

## Phase 1 — Step A: dead-export removal

**Goal:** delete the dead shims (layers 3 + 4) with zero call-site impact.

**Files touched:**
- `src/hooks/useEditStore.ts`
- `src/hooks/useEditStoreGlobal.ts` (**delete file outright**)

**Steps:**
1. Delete `useCurrentEditStore`, `useEditStoreSelector`, the deprecated `createEditStore(tokenId)` shim (~line 314), and the `useEditStoreCompat` re-export (~line 325) from `useEditStore.ts`. Keep the live `useEditStore(tokenId, opts)` token hook and the `EditStore`/`EditStoreInstance` type re-exports.
2. Delete `src/hooks/useEditStoreGlobal.ts` entirely — the dead 4th layer (re-exports `useEditStoreLegacy as useEditStore` + `useEditStore as useEditStoreWithToken` + both types; zero importers in `src/`, README mentions only). Do NOT defer to phase 3: the phase-3 path-repoint is deliberately blind and would keep this file alive with its `useEditStoreWithToken` alias silently re-pointed at the reactive hook post-phase-2 (see D1).
3. Confirm dead-ness first: `rg "useCurrentEditStore|useEditStoreSelector|useEditStoreCompat" src/` → only the definition file; `rg "useEditStoreGlobal|useEditStoreWithToken" src/` → only the shim itself (README hits are fine, cleaned in phase 13); `rg "createEditStore" src/` → only `stores/editStore.ts` (real factory), `stores/storeManager.ts:97`, `src/hooks/editStore/*.test.ts` (all import the REAL factory), and this shim.

**Verification:** `npx tsc --noEmit` · `npm run test:run` · `npm run lint` · the greps above return zero unexpected hits.

## Phase 2 — Step A: façade unification (mechanical)

**Goal:** one file owns the reactive hook under the clean name; legacy file becomes a thin re-export. Zero behavior change — every call site still resolves to the same function.

**Files touched:**
- `src/hooks/useEditStoreBootstrap.ts` (new)
- `src/hooks/useEditStore.ts` (rewrite)
- `src/hooks/useEditStoreLegacy.ts` (reduce to thin re-export)
- `src/components/EditProvider.tsx` (import line: `useEditStore` from `@/hooks/useEditStore` → `useEditStoreBootstrap` from `@/hooks/useEditStoreBootstrap`)

**Steps:**
1. Move the token/SSR hook body from `useEditStore.ts` verbatim into new `useEditStoreBootstrap.ts`, renamed `useEditStoreBootstrap`. **The `window.__useEditStoreDebug` dev IIFE (current `useEditStore.ts:299-307`, references `storeManager`) moves WITH it into `useEditStoreBootstrap.ts`** — it must NOT land in the reactive file. Header comment: "EditProvider-only bootstrap; do not import elsewhere."
2. Rewrite `useEditStore.ts` = current `useEditStoreLegacy.ts` body verbatim (reactive `useEditStore(selector?)`, `useEditStoreApi`, `globalStoreRef`, static `.getState()`), **plus explicit type re-exports of BOTH `EditStore` (from `@/types/store`) and `EditStoreInstance` (from `@/stores/editStore`)** — the legacy body did NOT carry these (the old bootstrap file did), so they must be added here for existing `import type` consumers to keep resolving after the phase-3 repoint. No default export in the end state — but keep one temporarily if any caller uses default import (check `rg "import useEditStore(Legacy)? from" src/`; normalize those callers in phase 3).
3. `useEditStoreLegacy.ts` → thin file: `export { useEditStore, useEditStore as useEditStoreLegacy, useEditStoreApi } from './useEditStore'` (+ default re-export if step 2 found default importers) + `@deprecated delete in phase 3` header.
4. Update `EditProvider.tsx` import (one line). NOTHING else in EditProvider changes.

**Verification:** `npx tsc --noEmit` · `npm run test:run` · `npm run lint` · `npm run build` · diff review confirms pure move/rename (impl-reviewer checks no logic lines changed; debug IIFE landed in bootstrap; both type re-exports present in `useEditStore.ts`). Quick dev-server sanity: editor loads, typing works.

## Phase 3 — Step A: import sweep + delete legacy file — **HUMAN GATE A after this phase**

**Goal:** every importer points at `@/hooks/useEditStore`; misleading names gone from the codebase.

**Files touched:** grep-defined mechanical set — **every file matching `rg -l "useEditStoreLegacy" src/` ≈ 107 code files (authoritative count; the implementer runs the grep, pastes the exact resolved list into the audit, and the impl-reviewer verifies the touched set 1:1 against that grep — any delta is a defect).** Known anchors from scout (non-exhaustive): all `src/modules/templates/**/blocks` + sharedBlocks + `useTemplateBlock`, primitives (`InlineTextEditorV2`, `EditableLogo`, `EditableImageCollection`), `LanguageToggle`, `LocaleSettings`, `useUniversalElements.ts`, `useSmartTextColors.ts`, `useOptimizedEditStore.ts`, `useEditor.ts`, `useSectionCRUD.ts`, `useModalManager.ts`, `useImageToolbar.ts`, `useElementPicker.ts`, `useElementCRUD.ts`, `useAutoSave.ts`, phase-3 toolbars (`ToolbarShell`, `TextToolbarMVP`, `SectionToolbar`, `ImageToolbar`, `ElementToolbar`), `SaveStateChip.tsx`, `useSelectionPriority.ts`, `useUndoRedo.ts`, `useResetSystem.ts`, `usePreviewNavigation.ts`, `usePaletteSwap.ts`, `LandingPageRenderer.tsx`, `EditablePageRenderer.tsx`, `SelectionSystem.tsx`, `ElementDetector.tsx`, `SectionCRUD.tsx`, all cold-batch UI files (phase 8–10 lists), `utils/ctaHandler.ts`, `GlobalAppHeader.tsx`, `modules/prompt/buildPrompt.ts` (type-only `ReturnType<typeof useEditStore.getState>`), `modules/templates/conformance.test.ts` (vi.mock path). Plus:
- `src/hooks/useEditStoreLegacy.ts` (delete)

**Steps:**
1. Find/replace import PATHS only: `from '@/hooks/useEditStoreLegacy'` (and relative variants) → `from '@/hooks/useEditStore'`. Normalize import NAMES: `useEditStoreLegacy` → `useEditStore`; default imports → named `useEditStore`. NO other line in any file changes — call sites keep their exact current form (bare or selector).
2. Update the `conformance.test.ts` `vi.mock('@/hooks/useEditStoreLegacy'…)` path to the new module.
3. Delete `src/hooks/useEditStoreLegacy.ts`. Drop any temporary default export from `useEditStore.ts` once no default importer remains.
4. Final greps: `rg "useEditStoreLegacy|useEditStoreCompat|useEditStoreGlobal" src/` → zero; `rg "from '@/hooks/useEditStore'" -l src/ | wc -l` ≈ the phase-start count (~107).

**Verification:** `npx tsc --noEmit` · `npm run test:run` · `npm run lint` · `npm run build` · authed `npx playwright test edit-persistence` · agent dev-server smoke: load editor, type in hero, undo/redo, save chip, open one toolbar + one modal.

### 🛑 HUMAN GATE A — Step-A merge + editor verification (decision gate before ANY Step B work)

Orchestrator STOPS. Founder: review the Step-A diff (should read as pure rename + deletion), merge `feature/editor-phase-4-store-finish` → main (plain merge), push, deploy-watch, and verify the editor works (quick typing/undo/toolbar/save/publish-preview pass — `/manual-test` editor-interactions subset is enough). Step B continues on the same branch only after founder confirms. If anything is off, Step A is trivially revertable (it's mechanical).

## Phase 4 — Step B: baseline probe + measurement

**Goal:** build the reusable reactivity/perf probe and record the pre-selector-ization baseline. No `src/` changes.

**Files touched:**
- `e2e/tools/renderProbe.ts` (new — NOT `*.spec.ts`, so Playwright won't auto-run it)
- `docs/task/editor-phase-4-store-finish.baseline.md` (new — numbers live here, referenced by gates)

**Steps:**
1. Probe script (node + Playwright, reuses `e2e/auth.setup.ts` Clerk session pattern — the three Clerk creds are confirmed present in the worktree `.env.local`, so the probe runs authed by default): open `/edit/[token]` on a seeded project with `NEXT_PUBLIC_DEBUG_EDITOR=true` dev server; (a) type 20 chars into `[data-element-key="headline"]`, count per-render debug console logs → renders/keystroke; (b) CDP `Performance.getMetrics` JSHeapUsedSize before/after burst → heap delta; (c) helper subcommands to drive smoke surfaces (select element, toolbar action, undo/redo, palette swap, open modal by testid/text).
2. Record baseline: renders/keystroke, heap delta, and a pass of all smoke surfaces (proves the probe itself is green pre-change).

**Verification:** probe runs green (authed) against unmodified editor; baseline numbers written to the baseline doc.

## Phase 5 — Batch B1: `useOptimizedEditStore.ts` (highest leverage)

**Goal:** convert the shared shim's ~20 bare `useEditStore()` destructures to narrow `useShallow` selectors + `useEditStoreApi()` actions — ~27 downstream refs gain narrow subscriptions with zero downstream edits.

**Files touched:**
- `src/hooks/useOptimizedEditStore.ts`

**Steps:**
1. Per wrapper hook (~30): replace bare destructure with `useShallow` object selector of EXACTLY the state fields that wrapper returns; action methods (stable refs) may stay in the selector or move to `useEditStoreApi().getState()` per phase-3 pattern (`useUndoRedo.ts` reference). Preserve each wrapper's public return shape byte-for-byte — downstream files are NOT in this phase's files-touched.
2. Audit table: wrapper hook → fields subscribed → fields in return shape (must match).
3. Grep: `rg "useEditStore\(\s*\)" src/hooks/useOptimizedEditStore.ts` → zero.

**Verification:** tsc · test:run · lint · **per-batch reactivity net (D4.1): authed edit-persistence E2E + probe smoke** on the BROAD surface set (this shim feeds many consumers): typing, selection/toolbars, undo/redo, palette swap, section add/move/delete, device toggle. Re-run renders/keystroke — record delta.

## Phase 6 — Batch B2: renderer + selection hot path

**Goal:** selector-ize the per-section render and selection-system whole-store reads (the typing-adjacent hot path).

**Files touched:**
- `src/modules/generatedLanding/LandingPageRenderer.tsx` (line ~64 `{mode}` site ONLY — line ~132 is phase-3 done, do not retouch)
- `src/app/edit/[token]/components/ui/EditablePageRenderer.tsx` (~67, ~215)
- `src/app/edit/[token]/components/selection/SelectionSystem.tsx` (~54, 56, 200, 401, 487 — 5 sites)
- `src/app/edit/[token]/components/selection/ElementDetector.tsx` (~17, 21, 157)

**Steps:**
1. Each bare site → `useShallow` selector of the exact fields read on the render path; imperative/handler reads → `useEditStoreApi().getState()`. SelectionSystem is the trap file: 5 destructures across the component — enumerate every field each one feeds before narrowing (over-narrowing here = selection silently stops updating).
2. Per-file field-enumeration audit (D4.2).
3. Grep touched files for bare calls → zero.

**Verification:** tsc · test:run · lint · **per-batch reactivity net (D4.1): authed edit-persistence E2E + probe smoke**: click-select element → toolbar appears/moves, multi-select, hover detection, type while selected, section-level select, mode toggle. Re-measure renders/keystroke + heap vs baseline (expect the visible drop here) — record.

## Phase 7 — Batch B3: `useEditor.ts` + SectionCRUD

**Goal:** finish the hot list — second aggregation shim + section CRUD content path.

**Files touched:**
- `src/hooks/useEditor.ts` (~28 aggregate destructure)
- `src/app/edit/[token]/components/content/SectionCRUD.tsx` (~108, 282, 443)

**Steps:**
1. `useEditor.ts`: same treatment as B1 — internal `useShallow` selector groups, preserve public return shape, no downstream edits (D2: refactor, not exempt).
2. SectionCRUD: three sites → narrow `{content, sections}`-scoped selectors / `getState()` for handlers.
3. Field-enumeration audit; grep zero bare in touched files.

**Verification:** tsc · test:run · lint · **per-batch reactivity net (D4.1): authed edit-persistence E2E + probe smoke**: add/duplicate/remove/move section, undo after each, content persists. **Hot-path perf checkpoint:** full probe measurement vs phase-4 baseline recorded in baseline doc (this is the number Gate B reviews).

## Phase 8 — Batch B4: theme surfaces (cold)

**Goal:** selector-ize theme pickers/popovers.

**Files touched** (base `src/app/edit/[token]/components/` — scout paths were dir-relative; the implementer resolves/verifies each exact path via `rg` at implement time and records the resolved list in the audit):
- `ui/ThemeSelector.tsx` (~8)
- `ui/ThemePopover.tsx` (~56)
- `ui/ServiceThemePopover.tsx` (~49)
- `ui/VestriaThemePopover.tsx` (~67)
- `ui/StyleBrowserModal.tsx` (~33)
- `ui/ColorPicker/SolidColorPicker.tsx` (~14)

**Steps:** convert each bare site (selector for render-read theme fields; `getState()` for the update actions `updateTheme`/`updateBaseColor`/`updateAccentColor` etc.); field audit; grep zero.

**Verification:** tsc · test:run · lint · **per-batch reactivity net (D4.1): authed edit-persistence E2E + probe smoke**: open each popover/modal, change palette/color/style, canvas repaints live, undo reverts.

## Phase 9 — Batch B5: modals + forms (cold)

**Goal:** selector-ize modal/form surfaces. Scout note: several (`SocialMediaEditor`, `SeoSettingsModal`, `ProductsModal`, `LandingGoalsModal`) only call actions → pure `useEditStoreApi()` conversions, near-zero risk.

**Files touched** (base `src/app/edit/[token]/components/` — the implementer resolves/verifies each exact path via `rg` at implement time and records the resolved list in the audit):
- `toolbars/ButtonConfigurationModal.tsx` (~143)
- `forms/FormBuilder.tsx` (~44)
- `layout/GlobalFormBuilder.tsx` (~7)
- `social/SocialMediaEditor.tsx` (~45)
- `ui/ProductsModal.tsx` (~63)
- `ui/ElementToggleModal.tsx` (~40)
- `ui/CountdownConfigModal.tsx` (~31)
- `ui/SeoSettingsModal.tsx` (~31)
- `modals/TaxonomyModalManager.tsx` (~41)
- `modals/LandingGoalsModal.tsx` (~32)
- `content/ElementPicker.tsx` (~37)

**Steps:** action-only files → `useEditStoreApi()`; files with render reads → `useShallow` selectors; field audit; grep zero.

**Verification:** tsc · test:run · lint · **per-batch reactivity net (D4.1): authed edit-persistence E2E + probe smoke**: open each touched modal, perform its primary action (link button→form, toggle element, edit SEO field, configure countdown…), assert UI reflects the change and it persists.

## Phase 10 — Batch B6: header/chrome + preview + dev (cold, last)

**Goal:** clear the tail — zero bare sites remain anywhere.

**Files touched:**
- `src/app/edit/[token]/components/layout/EditHeader.tsx` (~22)
- `src/app/edit/[token]/components/layout/EditHeaderRightPanel.tsx` (~68)
- `src/app/edit/[token]/components/layout/PageSwitcher.tsx` (~55)
- `src/app/edit/[token]/components/ui/EnhancedAddSection.tsx` (~34)
- `src/app/edit/[token]/components/ui/AddSectionButton.tsx` (~11)
- `src/app/edit/[token]/components/ui/PreviewButton.tsx` (~14)
- `src/app/edit/[token]/components/ui/DeviceToggle.tsx` (~8)
- `src/app/edit/[token]/components/ui/SaveStatus.tsx` (~8)
- `src/app/preview/[token]/page.tsx` (~63)
- `src/app/preview/[token]/privacy/page.tsx` (~39)
- `src/components/editor/PrivacyPolicyEditor.tsx` (~27)
- `src/app/dev/blocks/TemplateBlocksStage.tsx` (~168 — fixed, not exempted, per D2)

**Steps:** same conversion pattern; field audit; then the FULL sweep grep, code files only: `rg -n "useEditStore\(\s*\)" src/ -g "*.ts" -g "*.tsx"` → **zero code hits** (README/`.md`/comment examples excluded by the glob + a manual pass over any hits inside comments — each surviving hit must be a real call expression; the audit lists every hit with its disposition).

**Verification:** tsc · test:run · lint · `npm run build` · **per-batch reactivity net (D4.1): authed edit-persistence E2E + probe smoke**: header actions, page switch, device toggle, add-section, preview page renders, privacy editor loads/edits. Final probe measurement recorded.

## Phase 11G — 🛑 HUMAN GATE B: Step-B reactivity + perf sign-off

Orchestrator STOPS and presents to founder:
1. Perf table from `docs/task/editor-phase-4-store-finish.baseline.md`: renders/keystroke + heap — baseline vs post-phase-7 vs post-phase-10 (spec acceptance: renders ↓, heap flat).
2. Per-file selector field-enumeration audits (the over-narrowing evidence).
3. Probe smoke results per batch + edit-persistence E2E status.

Founder runs the `/manual-test` editor-interactions pass against `npm run dev` (the human net for what automation can't see). **Sign-off required before phase 12.** Any regression → fix within the offending batch's files-touched, re-verify, re-present.

## Phase 12 — Lint rule flip — **includes 🛑 HUMAN GATE C**

**Goal:** lock the invariant.

**Files touched:**
- `.eslintrc.json`

**Steps:**
1. Pre-flight evidence: `rg -n "useEditStore\(\s*\)" src/ -g "*.ts" -g "*.tsx"` → zero code hits (comment-only hits, if any, listed with disposition); list of inline eslint-disable exemptions (target: none).
2. **🛑 HUMAN GATE C:** present the evidence; founder confirms no legitimate whole-store consumer remains → approve flip.
3. Add the D3 `no-restricted-syntax` entry to `.eslintrc.json` `rules`.
4. `npm run lint` green; negative test: temporarily add a bare `useEditStore()` in a scratch component, confirm lint errors, remove.

**Verification:** `npm run lint` · `npx tsc --noEmit` · `npm run test:run`.

## Phase 13 — Docs close-out — **🛑 HUMAN GATE D after this phase**

**Goal:** spec's doc task + kill stale references to the dead names.

**Files touched:**
- `docs/tracks/editorPlan.md` (phase-4 row → done + summary; unresolved Q2 → "phase 3 did toolbars, phase 4 did the rest"; Q3 → "ops-undo descoped to universe/i18n; named-op discipline preserved")
- `CLAUDE.md` (State Management bullet: `useEditStoreLegacy` → `useEditStore` selector-first hook + `useEditStoreBootstrap`; note lint rule)
- `src/app/edit/[token]/README.md` (store-access section)
- `src/hooks/README.md` and `src/stores/README.md` **if they exist and mention the old names** — resolve via `rg -l "useEditStoreLegacy|useEditStoreGlobal" docs/ src/ *.md` and update every hit
- `docs/task/editor-phase-4-store-finish.baseline.md` (final numbers table, kept as the phase-4 perf record)

**Steps:** update the above; final repo-wide grep `rg "useEditStoreLegacy|useEditStoreCompat|useEditStoreGlobal|useEditStoreWithToken"` → zero outside git history/task docs.

**Verification:** `npm run lint` · `npx tsc --noEmit` · `npm run test:run` · `npm run build` all green (final pre-merge state).

### 🛑 HUMAN GATE D — final merge to main

Orchestrator STOPS. Founder merges (plain merge), pushes; deploy-watcher polls Vercel; green → branch deleted.

---

## Unresolved questions

1. Token-hook name `useEditStoreBootstrap` ok, or prefer `useInitEditStore`?
2. Step-A merge at Gate A = mid-feature deploy to prod; ok, or hold both merges to Gate D? (spec says "A merged" — plan assumes yes.)
3. Keep `e2e/tools/renderProbe.ts` in repo after phase 4 (reusable perf tool) or delete at close-out?
