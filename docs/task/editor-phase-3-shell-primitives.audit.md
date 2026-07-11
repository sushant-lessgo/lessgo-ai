# editor-phase-3-shell-primitives — audit

## Phase 1 — floating-ui dep + toolbar shell + priority slim-down

### Files changed

- `package.json` — added `@floating-ui/react` dependency.
- `package-lock.json` — lockfile updated by the install.
- `src/app/edit/[token]/components/toolbars/ToolbarShell.tsx` — NEW.
- `src/hooks/useSelectionPriority.ts` — slimmed (removed lock/anchor wiring).
- `src/utils/selectionPriority.ts` — stripped TTL caches.
- `src/app/edit/[token]/components/ui/FloatingToolbars.tsx` — now just mounts the shell.
- `src/app/edit/[token]/components/toolbars/SectionToolbar.tsx` — de-authoritied.
- `src/app/edit/[token]/components/toolbars/ElementToolbar.tsx` — de-authoritied.
- `src/app/edit/[token]/components/toolbars/TextToolbarMVP.tsx` — de-authoritied.
- `src/app/edit/[token]/components/toolbars/ImageToolbar.tsx` — de-authoritied.

### What changed, per file

**package.json / package-lock.json** — `npm install @floating-ui/react` ran
successfully (`^0.27.20`); lockfile committed. (The audit warnings printed by
npm are pre-existing repo audit noise, not introduced here.)

**ToolbarShell.tsx (NEW)** — the single floating shell. One
`useSelectionPriority()` instance decides which toolbar renders (temporary direct
`switch(activeToolbar)` → component map; config extraction is phase 2). floating-ui
`useFloating` with `offset + flip + shift + arrow` middleware, `strategy: 'fixed'`,
reference bound synchronously via `elements: { reference }` (no first-frame
`{x:0,y:0}` flash). Anchor node resolved fresh via
`document.querySelector('[data-section-id=…]' / '[data-element-key=…]' /
'[data-image-id=…]')` in an effect keyed on `activeToolbar`/target ids — one
lookup per selection change, never per render. `autoUpdate` attached ONLY inside
the open-toolbar effect and torn down on close. Dismissal via floating-ui
`useDismiss` (outsidePress + escapeKey) → `clearSelection()` calling existing store
actions (`setActiveSection(undefined)`, `selectElement(null)`, the four `hide*Toolbar`
actions). No locks, debounces, or watchdog.

**useSelectionPriority.ts** — removed `useTransitionLock` + `useGlobalAnchor`
wiring and the transition-detection effect. Hook is now a thin reactive wrapper
over the pure resolver: `useShallow` selector + `getActiveToolbar` /
`getToolbarTarget`, returning `activeToolbar`, `toolbarTarget`, `editorSelection`,
`hasActiveToolbar`, `shouldShowToolbar`, and the convenience flags.
`useToolbarVisibility` and `useTextEditingState` exports KEPT but reduced to a
compiling, DEAD shape (no callers after this phase) — deleted in phase 3.

**selectionPriority.ts** — deleted `toolbarCache`, `showCache`, `CACHE_TTL`.
`getActiveToolbar` and `shouldShowToolbar` now return computed results directly.
`ToolbarType`, `EditorSelection`, and all pure fn exports retained (7 importers).

**FloatingToolbars.tsx** — reduced to `return <ToolbarShell />`. Dropped its own
`useSelectionPriority` call, the `toolbar.position || {x:0,y:0}` read, and the
vestigial `contextActions` icon placeholders. The `toolbar.position` store field
itself is untouched (phase-4 territory).

**SectionToolbar / ElementToolbar / TextToolbarMVP / ImageToolbar** — removed
`useToolbarVisibility` imports+calls and the outer visibility-gate components;
removed `calculateArrowPosition` imports (`toolbarPositioning.ts`) and all own
arrow rendering; dropped the `position`/`contextActions` props and the
`position:fixed` self-positioning wrappers (main bar is now a static child of the
shell's floating container). Action/formatting internals untouched.

### Decisions / deviations

- **Line numbers drifted** from the plan hints (earlier edits shortened files);
  used grep/Read to locate each edit. No semantic difference.
- **Secondary panels** (element/text variations dropdowns, image upload
  progress/error) were repositioned from `position:fixed @ position.{x,y}` to
  `position:absolute; top:100%` relative to the shell's floating container — the
  conservative way to keep them attached to the bar now that the shell owns
  placement. UX placement (below the bar) is preserved.
- **ImageToolbar StockPhotosPanel** stays a `createPortal` (per plan Q4). Its
  coordinate now comes from `toolbarRef.current.getBoundingClientRect()` at
  open-time (`getPanelAnchor()`) instead of the removed `position` prop —
  read only while the panel is open, not per idle render.
- **ImageToolbar `targetElement`** (used to seed SimpleImageEditor src/alt) was
  incidentally removed with the arrow calc; re-added as a plain
  `document.querySelector('[data-image-id]')` lookup (SSR-guarded). Caught by tsc.
- **ElementToolbar** self-gate `if (toolbar?.type === 'image'|'form') return null`
  removed (the shell no longer renders ElementToolbar when image/form is active),
  and the now-unused `toolbar` store destructure with it — satisfies "toolbars
  must not gate their own render."
- **Text-toolbar dismissal**: `clearSelection()` early-returns when
  `activeToolbar === 'text'` so the shell never clobbers InlineTextEditorV2's own
  blur + pending-content flush (semi-controlled contract left untouched).
- Pre-existing unused `logger` import in `selectionPriority.ts` left in place
  (out of the intended edit; compiled before, compiles now).

### Verification

- `npx tsc --noEmit` — GREEN (one iteration fixed the `targetElement` reference).
- `npm run test:run` — GREEN: 135 files passed / 1 skipped; 2091 tests passed / 3 skipped.
- Grep (a) `useToolbarVisibility` under `toolbars/**` — ZERO.
- Grep (b) `useSelectionPriority(` under `toolbars/**` — exactly ONE call site,
  `ToolbarShell.tsx:80` (other hit is a comment). Internal callers inside
  `useSelectionPriority.ts` remain (deleted in phase 3), as expected.
- Grep (c) `ToolbarShell.tsx` — no `setInterval`/`MutationObserver`/`ResizeObserver`;
  `autoUpdate` appears only inside the open-toolbar effect.

### Open risks (for the human toolbar-QA gate)

- Outside-click dismissal now flows through floating-ui `useDismiss`; needs a
  manual pass to confirm selecting a new element/section doesn't flicker and that
  clicking empty canvas deselects (MainContent's old `clearSelection` was a no-op stub).
- Secondary-panel absolute repositioning + stock-photos ref-anchor are visual —
  verify in dev that variations dropdown and stock panel land in the right spot
  at viewport edges.
- floating-ui `flip`/`shift` behavior at top/bottom sections and narrow windows is
  untested by automation (manual gate item).

### Phase 1 — review fixes

Fixed 3 items in `src/app/edit/[token]/components/toolbars/ToolbarShell.tsx` (only file touched).

**BLOCKING — active toolbar remounted on every shell re-render (state loss).**
Root cause: `ToolbarBody` was a component defined inside the render body
(`const ToolbarBody = () => {...}`) and rendered as JSX (`<ToolbarBody/>`). A new
function reference was created each render → element type differed every render →
React unmounted+remounted the whole toolbar subtree, resetting local `useState`
(ImageToolbar `showStockPhotos`/`showUploader`/`showEditor`/`isUploading`,
variations dropdowns). Triggered constantly by the full-store sub (Nit 1) and by
floating-ui `autoUpdate` calling `update()` on scroll/resize while open.
Fix: replaced the local component with an inline `switch` that assigns the
concrete `<SectionToolbar/>`/`<ElementToolbar/>`/`<TextToolbarMVP/>`/`<ImageToolbar/>`
element to a `toolbarBody` const, then renders `{toolbarBody}` directly. Element
identity is now stable across re-renders — no remount, local UI state survives
scroll and stock-panel open.

**Nit 1 — full-store subscription.** `const store = useEditStore()` (commented
"read once") was actually a full-store subscription re-rendering the shell on
every mutation. Replaced with a narrow `useShallow` selector pulling only the
dismissal/selection actions used by `clearSelection`
(`setActiveSection`, `selectElement`, `hideSectionToolbar`, `hideElementToolbar`,
`hideFormToolbar`, `hideImageToolbar`). Actions are stable refs → no re-render on
store mutation. Updated `clearSelection` to call the destructured actions.

**Nit 2 — stray empty bubble for `form`.** `getActiveToolbar` can return `'form'`
(sets open/hasActiveToolbar true) but the switch has no `form` case → default null
body, previously still mounting the floating container with a bare `FloatingArrow`.
Added a guard: after the switch, `if (!toolbarBody) return null;` — no floating
container / arrow renders when there is no matching body. Matches prior
FloatingToolbars behavior (nothing for `form`).

Untouched: anchor-resolution effect, autoUpdate open-only/teardown, dismissal
semantics (text-toolbar early-return guard for InlineTextEditorV2), all other
phase-1 files.

**Verification:**
- `npx tsc --noEmit` — green (no output).
- `npm run test:run` — green: 135 files passed / 1 skipped; 2091 tests passed / 3 skipped.
- grep `<ToolbarBody` in ToolbarShell.tsx — only a comment mention remains; no JSX usage.
- grep `useEditStore()` in ToolbarShell.tsx — none; shell sub is now a `useShallow` selector.

## Phase 2 — action sets as config + selector-ize all toolbar store access

### Files changed

- `src/app/edit/[token]/components/toolbars/actionSets.tsx` — NEW: the per-type toolbar registry.
- `src/app/edit/[token]/components/toolbars/ToolbarShell.tsx` — consumes `actionSets` instead of the phase-1 inline switch.
- `src/app/edit/[token]/components/toolbars/SectionToolbar.tsx` — selector-ized store sub.
- `src/app/edit/[token]/components/toolbars/ElementToolbar.tsx` — selector-ized store sub.
- `src/app/edit/[token]/components/toolbars/TextToolbarMVP.tsx` — selector-ized store sub + hygiene.
- `src/app/edit/[token]/components/toolbars/ImageToolbar.tsx` — selector-ized BOTH store subs + hygiene.

### actionSets config shape

`actionSets: Partial<Record<NonNullable<ToolbarType>, ActionSetEntry>>` with the 4
renderable types (`section`/`element`/`text`/`image`). Each entry:
`{ component: React.ComponentType<any>, size: 'sm'|'md'|'lg', resolveProps(selection, target) => Record<string,unknown> | null }`.
`component` is a module-level import reference; `resolveProps` is a pure function
turning the current `EditorSelection` + resolver `ToolbarTarget` into the concrete
props each toolbar needs, or `null` when the selection can't satisfy it. `form`/null
are intentionally absent → the shell's lookup misses and renders nothing (preserves
the phase-1 empty-bubble guard). `size` is metadata (width-class hint) — no functional
gating today; carried per the plan's `{ component, size }` shape.

### How the shell keeps stable element identity

`ToolbarShell` looks up `entry = actionSets[activeToolbar]`, computes
`toolbarProps = entry.resolveProps(editorSelection, toolbarTarget)`, guards
`if (!entry || !toolbarProps) return null;`, then renders
`React.createElement(entry.component, toolbarProps)`. Because `entry.component` is a
module-level constant, the produced element's TYPE is stable across shell re-renders
for a given `activeToolbar` — React reconciles in place, no unmount/remount, so the
toolbar's local `useState` (ImageToolbar's `showStockPhotos`/`showEditor`/`isUploading`,
variations dropdowns) survives (the perf-04 silent state-loss class stays fixed). This
matches the phase-1 review-fix intent (stable type, not a locally-defined component).
The empty-bubble guard is preserved by the `!entry || !toolbarProps` early return.

### The 7 selector conversions (fields each `useShallow` selector pulls)

1. **TextToolbarMVP.tsx** (was `useEditStore()`): `updateElementContent`,
   `regenerateElementWithVariations`, `elementVariations`, `applyVariation`,
   `hideElementVariations`, `setVariationSelection`, `aiGeneration`, `announceLiveRegion`,
   `activeLocale`, `localeConfig`. (`setFormattingInProgress` stays imperative via
   `getState()` — deliberately unsubscribed, unchanged.)
2. **SectionToolbar.tsx** (was `useEditStore()`): `content`, `sections`, `sectionLayouts`,
   `announceLiveRegion`, `aiGeneration`, `showLayoutChangeModal`, `audienceType`, `templateId`.
3. **ElementToolbar.tsx** (was ONE `useEditStore()` — the plan's second ~:45 sub was
   already consolidated into this single one by phase-1 edits; grep confirmed only one
   bare sub present): `regenerateElementWithVariations`, `elementVariations`,
   `applyVariation`, `hideElementVariations`, `setVariationSelection`, `content`,
   `announceLiveRegion`, `setSection`, `selectElement`, `activeLocale`, `localeConfig`.
   Dropped `updateElementContent` (destructured but never used).
4. **ImageToolbar.tsx main component** (was `const store = useEditStore()`):
   `updateElementContent`, `uploadImage`, `hideElementToolbar`, `tokenId`,
   `uploadImageFromObjectUrl` (via `(s as any)` cast, same as before). Dropped
   `audienceType` (destructured but unused in the main component; StockPhotosPanel reads
   it via its own sub).
5. **ImageToolbar.tsx StockPhotosPanel** (was `useEditStore()`): `audienceType`,
   `templateId`, `paletteId`. Stays a `createPortal` per plan Q4 — only its store access
   was narrowed.

None of the components changed WHAT they do — only how they subscribe. No visibility
re-resolution was reintroduced: `useSelectionPriority(` has exactly ONE caller among
toolbars/ component files (`ToolbarShell.tsx`).

### Hygiene: removed vs kept

Removed:
- `ImageToolbar.tsx`: two `logger.dev(...)` calls rendered inside JSX (the `🖼️
  ImageToolbar JSX rendering now!` fragment child and the `🎨 Rendering stock photos
  portal` fragment child).
- `TextToolbarMVP.tsx`: module-global render counter `let globalRenderCount = 0;` plus
  the per-render `const currentRender = ++globalRenderCount;` and
  `const renderTime = Date.now();` (both unused). Also the `logger.dev('TextToolbarMVP
  cleanup completed')` in the unmount effect (debug noise; the plan's ~:503 hint drifted —
  the only `logger.dev` in the file was this cleanup log).

Kept (judged load-bearing — noted per instruction):
- `ImageToolbar.tsx` `getPanelAnchor()` → `toolbarRef.current?.getBoundingClientRect()`:
  reads the toolbar bar's live position to place the StockPhotosPanel PORTAL (which is
  attached to `document.body`, NOT positioned by the shell per Q4). Runs only while the
  panel is open, not per idle render. FUNCTIONAL, kept.
- `ImageToolbar.tsx` `targetElement` = `document.querySelector([data-image-id=…])`: seeds
  SimpleImageEditor with current src/alt (per phase-1 audit). FUNCTIONAL, kept.
- `ImageToolbar.tsx` delete-image `document.querySelector([data-image-id=…]).remove()`:
  immediate DOM feedback on delete. FUNCTIONAL, kept.
- `TextToolbarMVP.tsx` querySelector/getComputedStyle in the format-detection effect and
  `applyFormatInternal`/`handleApplyVariation`: read/write element formatting, not
  positioning. FUNCTIONAL, kept.
- No `logger.dev` in SectionToolbar/ElementToolbar; no module-global counters elsewhere.

### Verification

- `npx tsc --noEmit` — GREEN (no output).
- `npm run test:run` — GREEN: 135 files passed / 1 skipped; 2091 tests passed / 3 skipped.
- ACCEPTANCE grep `rg "useEditStore(Legacy)?\(\s*\)" toolbars/` — ZERO hits.
- `useSelectionPriority(` among toolbars/ component files — exactly ONE call site
  (`ToolbarShell.tsx:78`; the other hit is a comment on :4). No second authority added.
- `setInterval|MutationObserver|ResizeObserver` under toolbars/ — ZERO hits (none added).

### Open risks

- Behavior is unchanged by design; the manual toolbar-QA gate (phase 3) still covers
  select/flip/dismiss/edge cases. `useShallow` object selectors re-render only when a
  pulled field changes by shallow-equality — actions are stable refs, so typing in one
  element no longer re-renders another element's open toolbar (the phase-2 manual check).

## Phase 3 — DELETE list (dead toolbar machinery)

### Files changed

Deleted (8):
- `src/hooks/useGlobalAnchor.ts` (incl. its re-exported `useToolbarPositioning`)
- `src/hooks/useTransitionLock.ts`
- `src/hooks/useToolbarPositioning.ts` (compat shim)
- `src/utils/toolbarSingleton.ts`
- `src/utils/singletonAnchorRegistry.ts`
- `src/utils/toolbarPositioning.ts` (incl. `calculateArrowPosition`)
- `src/app/edit/[token]/components/toolbars/AdvancedActionsMenu.tsx`
- `src/hooks/useAdvancedActionsMenu.ts`

Edited (3):
- `src/hooks/useOptimizedEditStore.ts` — removed the duplicate `useToolbarVisibility` (:227) and its `toolbar.actions` reader `useToolbarAvailableActions` (:237/:241).
- `src/hooks/useSelectionPriority.ts` — removed the dead `useToolbarVisibility` and `useTextEditingState` exports (kept the `useSelectionPriority` hook + its `.lastSelectionKey` debug prop; `ToolbarType` import still used by the `shouldShowToolbar` helper).
- `src/utils/README.md` — removed stale references to the four now-nonexistent files in the "Editor selection & toolbars" list.

### Scout results (live-importer check before each delete)

- The six util/hook files: only importer of any was `singletonAnchorRegistry.ts` importing `AnchorInfo` from `useGlobalAnchor.ts` — both deleted together. Zero external live importers (`rg 'from @/utils/toolbarPositioning|toolbarSingleton|singletonAnchorRegistry|@/hooks/useGlobalAnchor|useTransitionLock|useToolbarPositioning'` → only that one intra-deleted hit).
- `calculateArrowPosition` — only self-defined in the deleted `toolbarPositioning.ts`.
- `useToolbarVisibility` (both defs) / `useTextEditingState` / `useToolbarAvailableActions` — zero callers repo-wide (definitions only).

### AdvancedActionsMenu hook decision: DELETED (not type-inlined)

`useAdvancedActionsMenu.ts`'s ONLY consumer was `AdvancedActionsMenu.tsx` (the component being deleted); no other consumer exists → per plan step 2 "if NONE, delete the hook too." Deleted the hook. The `AdvancedActionItem`/`AdvancedActionGroup` types had no other reader, so no inlining was needed.

### Store untouched (Q2)

`showToolbar`/`hideToolbar`/`toolbar.position` store fields + writers left intact; `toolbar.position` remains vestigial (phase-4 territory). `useToolbarState`/`useEditMode` in `useOptimizedEditStore.ts` are now unused-internally but left as exported (out of scope; may have external readers).

### Verification

- `npx tsc --noEmit` — GREEN (no output).
- `npm run test:run` — GREEN: 135 files passed / 1 skipped; 2091 tests passed / 3 skipped.
- `npm run build` — GREEN (includes buildPublishedCSS + buildAssets steps; full route table compiled).
- All-symbols grep across `src/` (`useGlobalAnchor|useTransitionLock|useToolbarPositioning|toolbarSingleton|singletonAnchorRegistry|calculateArrowPosition|toolbarWatchdog|AdvancedActionsMenu|useToolbarVisibility|useTextEditingState|useAdvancedActionsMenu`) — ZERO code hits. Only 3 remaining hits, all documentation, all in `src/hooks/README.md` (a stale table listing `useToolbarPositioning.ts`, `useAdvancedActionsMenu.ts`, `useTransitionLock.ts`, `useGlobalAnchor.ts`). That README is NOT on the phase-3 Files-touched list, so it was left untouched — see Deviations/open item.
- `git diff main --stat -- src/`: **19 files changed, 460 insertions(+), 2796 deletions(-)** → net **-2336 LOC** (acceptance: negative — MET). (Counts include phases 1–2 which are committed on this branch.)

### Deviations

- `src/utils/README.md`: plan step 4 named only the `toolbarWatchdog` mention, but the same "Editor selection & toolbars" line listed three other files I deleted (`singletonAnchorRegistry.ts`, `toolbarPositioning.ts`, `toolbarSingleton.ts`). Conservatively removed all four dead references (in-scope file) so the README doesn't point at nonexistent files.

### Open items / risks

- `src/hooks/README.md` still lists 4 deleted files (`useToolbarPositioning.ts`, `useAdvancedActionsMenu.ts`, `useTransitionLock.ts`, `useGlobalAnchor.ts`) in its hook table. It is OUT OF SCOPE (not on Files-touched, no `toolbarWatchdog` mention) and non-breaking (doc-only). Flagged for a follow-up doc edit; not touched this phase.
- `e2e/edit-persistence.spec.ts` NOT run — requires a live dev server + Clerk auth session/browser not available in this headless agent environment; deferred to the human toolbar-QA gate (spec gate 2).
- 6× idle-CPU throttle trace is browser-manual — deferred to the human toolbar-QA gate per instruction.

---

## Phase 4 — edit-primitive interface (types + shared modules scaffold)

Additive TYPES + shared-modules scaffold. Zero behavior change; no existing code re-pointed.

### Files changed

- NEW `src/modules/editing/primitiveTypes.ts` — primitive contract (plain, published-safe, no `'use client'`).
- NEW `src/modules/editing/altText.ts` — `resolveAlt` fallback resolver (plain, read by both renderers).
- NEW `src/modules/editing/altText.test.ts` — Vitest unit tests for `resolveAlt`.
- `src/types/core/content.ts` — extended `SectionData.elementMetadata` (additive optional `alt`).

### primitiveTypes.ts exported shapes

- `PrimitiveKind = 'text' | 'image' | 'imageCollection' | 'logo' | 'button' | 'link' | 'collection' | 'form'` — full closed vocabulary per editorPlan §"The edit-primitive vocabulary" table (broader than the 4-kind guess in the task brief; followed editorPlan, which lists all 8 slot-level primitives — section-level/site-level are toolbar surfaces, not slot primitives, so excluded).
- `PrimitiveSlot = { kind: PrimitiveKind; min?: number; max?: number; aspect?: string }` — a template's per-slot declaration (templates DECLARE, primitives IMPLEMENT).
- `ImageCollectionItem = { id: string; url: string; alt?: string; caption?: string }`.
- `Surface = 'light' | 'dark'` — target render surface (header=light, footer=dark); `resolveLogo` consumes it in phase 5.
- `LogoValue = { url?: string; darkUrl?: string; wordmark?: string }` — models the founder light/dark requirement: `url` = light-surface asset (header), `darkUrl` = optional dark-surface asset (footer falls back to `url` when unset), `wordmark` = text fallback. TYPE ONLY this phase; expressive enough for either an explicit-dark-field or CSS-treatment persistence mechanism (decided at phase-5 gate) without a breaking change.

### elementMetadata extension diff

Before:
`elementMetadata?: Record<string, { buttonConfig?: any; cta?: CTAButton }>;`

After (additive `alt?` only; buttonConfig/cta untouched):
`elementMetadata?: Record<string, { buttonConfig?: any; cta?: CTAButton; alt?: string | Record<string, string> }>;`

`string` = single-image slot alt; `Record<string,string>` = itemId-keyed map keyed by the COLLECTION key (e.g. `elementMetadata.items.alt[itemId]`). Canonical alt store per the locked 2026-07-11 law. Purely additive + optional → all ~26 buttonConfig readers keep working (tsc green confirms).

### resolveAlt signature + fallback rules

`resolveAlt(metadataAlt: string | Record<string,string> | undefined, itemId: string | undefined, siblingFallback: string | undefined): string`

Rules:
1. `metadataAlt` is a non-empty string → return it (single-image slot).
2. `metadataAlt` is a string and empty → treat as UNSET, fall through to sibling.
3. `metadataAlt` is a record + `itemId` given + `metadataAlt[itemId]` non-empty → return it.
4. record with missing/empty per-item value, or no `itemId` → fall through to sibling.
5. sibling fallback used when non-empty; else final fallback `''`.

Empty-string metadata (author cleared alt) is treated as unset by design so the sibling fallback (e.g. `item.title`) applies rather than forcing an empty alt.

### Verification

- `npx tsc --noEmit` — GREEN (no errors; confirms elementMetadata change is purely additive).
- `npm run test:run` — GREEN: 136 files passed / 1 skipped; 2098 tests passed / 3 skipped. New `altText.test.ts` (7 cases: string wins, record+itemId, missing itemId, empty string metadata, empty per-item, no-meta+no-fallback→'', undefined+sibling) all pass.

### Deviations

- `PrimitiveKind` includes the full 8-kind vocabulary from editorPlan (text/image/imageCollection/logo/button/link/collection/form), not just the 4 kinds named as a minimum in the task brief. The brief said "check editorPlan for the full set and include what it lists" — followed editorPlan. Section-level/site-level rows are toolbar surfaces (not slot primitives) so excluded from the kind union.

### Open risks

- None. Additive contract only; no consumer wired yet (phases 5/6 consume it).

---

## Phase 5 — `logo` primitive + techpremium proving case

### Files changed

- `src/modules/editing/resolveLogo.ts` — NEW. Plain surface-aware logo resolver (no 'use client').
- `src/modules/editing/resolveLogo.test.ts` — NEW. 8 unit tests (both surfaces, dark to light fallback, legacy logo_image fallback, wordmark, empty-string-as-unset).
- `src/app/edit/[token]/components/primitives/EditableLogo.tsx` — NEW. 'use client' logo editing primitive (two upload slots + removes).
- `src/types/store/state.ts` — added `globalSettings.logoUrlDark?: string`.
- `src/types/store/actions.ts` — added `setLogoUrlDark` to the actions type.
- `src/hooks/editStore/layoutActions.ts` — added `setLogoUrlDark` action mirroring `setLogoUrl`.
- `src/modules/templates/techpremium/blocks/Header/TechPremiumNav.tsx` — logo render via `resolveLogo('light')` + `EditableLogo` affordance.
- `src/modules/templates/techpremium/blocks/Header/TechPremiumNav.published.tsx` — logo render via `resolveLogo('light')`, globalSettings from `props.content`.
- `src/modules/templates/techpremium/blocks/Footer/TechPremiumFooter.tsx` — logo render via `resolveLogo('dark')` + `EditableLogo` affordance.
- `src/modules/templates/techpremium/blocks/Footer/TechPremiumFooter.published.tsx` — logo render via `resolveLogo('dark')`, globalSettings from `props.content`.

### Gate decision implemented — MECHANISM A (separate dark asset)

New JSON field `globalSettings.logoUrlDark` (no Prisma migration). Footer resolves `logoUrlDark -> logoUrl -> legacy logo_image -> wordmark`; header resolves `logoUrl -> legacy logo_image -> wordmark`.

### setLogoUrlDark choice

Chose the parallel `setLogoUrlDark` action mirroring `setLogoUrl` (the lower-risk option, not generalizing `setLogoUrl` with a variant param). It sets `state.globalSettings.logoUrlDark = url` inside the same immer `set`. Empty string clears (resolveLogo treats '' as unset, falls back to `logoUrl`), matching the existing `setLogoUrl`/`clearLogo` discipline. Typed in `src/types/store/actions.ts` next to `setLogoUrl`.

### resolveLogo return shape + fallback chains

Return: `{ kind: 'image'; url: string } | { kind: 'wordmark'; text: string }` — the block renders `<img>` for `image`, its mk-span + wordmark for `wordmark`. Empty/non-string values are unset (`firstNonEmpty`).

- `surface === 'light'` (header): `globalSettings.logoUrl` -> `sectionContent.logo_image` -> wordmark.
- `surface === 'dark'` (footer): `globalSettings.logoUrlDark` -> `globalSettings.logoUrl` -> `sectionContent.logo_image` -> wordmark.

`sectionContent` carries `{ logo_image, wordmark }`; each block maps its own text field into `wordmark` (header uses `logo_text`, footer uses `wordmark`). Alt text stays block-computed (`logo_text`/`wordmark` || 'Logo') so parity with today is exact.

### globalSettings persistence confirmation

`globalSettings` is serialized as a WHOLE object, so `logoUrlDark` rides the existing path automatically — CONFIRMED:
- Save/publish payload: `export()` (`persistenceActions.ts:588`) emits `globalSettings: state.globalSettings` at the top level of `exportData`. `save()` and `/api/publish` both send this object; a new field is included with zero payload-path edits.
- Reload: `loadFromDraft`/`applySnapshot` (`persistenceActions.ts:178-181`) does `Object.assign(state.globalSettings, payload.globalSettings)` — restores `logoUrlDark` with the rest.
- No Prisma migration (Project.content / globalSettings is JSON).

### How globalSettings reaches the published blocks

The published renderer (`LandingPagePublishedRenderer`) passes `content={content}` to every block, and the publish `content` object carries `globalSettings` at its root (from `export()`'s top-level `globalSettings`; `renderPublishedExport` flattens `content.content` into root but leaves `globalSettings` intact). So the published blocks read `props.content?.globalSettings` — NO new prop threaded through the renderer/htmlGenerator/export (all out of Files-touched). The edit blocks read `useEditStore((s) => s.globalSettings)` directly (site-scoped store; works on all pages in the editor).

### Edit vs published diffs per block (parity proof)

Logo render is identical logic in both renderers (same `resolveLogo` call, same markup):

- Header — image branch: `<img className="tp-brand__img" src={logo.url} alt={logo_text||'Logo'} loading="eager" decoding="async" />`; wordmark branch: `tp-brand__mk` span + wordmark (`tp-brand__wm`). Edit's wordmark is a `TechPremiumEditable` (contentEditable) span, published's is a static `tp-brand__wm` span — same tag/class, pre-existing pattern. Edit adds the edit-only `<EditableLogo surface="light">` affordance (published has none — same as the old `tp-logo-edit` span was edit-only).
- Footer — image branch: `<img className="tp-footer__img" src={logo.url} alt={wordmark||'Logo'} loading="lazy" decoding="async" />`; wordmark branch: `tp-footer__mk` span + wordmark. Edit adds `<EditableLogo surface="dark">` (edit-only, replacing the old `tp-flogo-edit` span).

The image-vs-wordmark decision is made ONLY by `resolveLogo`, called identically on both sides, so it is structurally impossible to diverge on the choice.

### Back-compat reasoning (naayom safety)

A techpremium project with ONLY the legacy per-section `logo_image` (no `globalSettings.logoUrl`/`logoUrlDark`) resolves to that image on BOTH surfaces via the chain's `sectionContent.logo_image` fallback, byte-identical `<img>` to pre-phase-5. Header alt = `logo_text||'Logo'`, footer alt = `wordmark||'Logo'` unchanged. If no image and no globalSettings, falls to the wordmark exactly as before. The live logo can never blank. Covered by two dedicated tests (light + dark legacy fallback) and the empty-string tests.

### EditableLogo affordance behavior

- Primary "Logo" slot (writes `logoUrl` via `setLogoUrl`, remove via `clearLogo`) shown on BOTH surfaces.
- Optional "Logo on dark background" slot (writes `logoUrlDark` via `setLogoUrlDark`, remove clears it) shown ONLY on the dark surface (footer) — the only place the dark asset matters. Keeps the header UX one-button (unchanged feel).
- Upload reuses store `uploadImage(file)` with NO targetElement, returns the permanent https URL (writes nothing to per-section content), then `setLogoUrl`/`setLogoUrlDark` + `save()`. `imageWriteGuard` still blocks data:/blob:. Template class names are passed in via `classNames` so the primitive stays template-agnostic while matching each block's chrome CSS (`tp-logo-edit*` / `tp-flogo-edit*`, unchanged).

### Deviations

- Wordmark editing stays block-level (the existing `TechPremiumEditable` in each block), NOT moved into `EditableLogo`. Rationale: the primitive is template-agnostic and cannot host the template-styled `TechPremiumEditable` contentEditable without coupling, and moving it risks edit/published parity. The primitive owns the novel image-upload editing (two slots); the wordmark fallback remains editable inline exactly as before. Conservative, parity-preserving.
- Legacy per-section `logo_image` removal is no longer exposed in the UI. The old edit affordance had a "remove" that cleared the per-section `logo_image`; `EditableLogo` manages only the site-scoped `globalSettings` values. Legacy `logo_image` is now a read-only migration fallback (shadowed the moment a site logo is uploaded). Acceptable per the "site-scoped ONE value" law; the live logo cannot blank.
- Dark-slot labels use generic text ("Change dark logo" / "Dark-bg logo") vs the footer's former "Change" — clearer, minor.

### Verification

- `npx tsc --noEmit`: green.
- `npm run test:run`: green — 137 files, 2106 passed / 3 skipped (incl. new `resolveLogo.test.ts`, 8 passed).
- `npm run build`: green (published-CSS + assets + full next build).
- Boundary grep: `EditableLogo` imported by exactly the two edit-side blocks (`TechPremiumNav.tsx`, `TechPremiumFooter.tsx`) + its own file; ZERO `.published.tsx` importers (only a doc-comment mention in `resolveLogo.ts`).
- Manual/live browser verification (change logo, dark-bg logo, remove, legacy-only unchanged, publish parity) — DEFERRED to the founder's manual human-gate pass (cannot run live here).

### Open risks

- Multipage subpages do not receive `globalSettings` on the published path. `renderPublishedExport` builds subpage `subFlat` as `{ ...sub.content, forms, legalPages }` — no `globalSettings` (that file is OUT of this phase's Files-touched, so not edited). Effect: on the ROOT published page the new site logo shows in header+footer; on SUBPAGE published headers/footers `props.content.globalSettings` is undefined, so resolveLogo falls back to the legacy per-section `logo_image` (or wordmark). naayom is multipage, so a newly-uploaded site logo would appear on the homepage but NOT on subpages until a small follow-up threads `globalSettings` into `subFlat`. Recommend a one-line follow-up in `renderPublishedExport.ts` (add `globalSettings: contentData.globalSettings` to `subFlat`). Back-compat is unaffected (subpages fall to today's `logo_image`, byte-identical). Flagged for founder + orchestrator.
- Edit renderer is unaffected by the above (store is site-scoped, so all pages show the site logo in the editor); the gap is published-subpage only.

### Phase 5 — review fix (subpage globalSettings)

**Files changed:** `src/lib/staticExport/renderPublishedExport.ts`

Blocking defect: multipage published subpages built a fresh `subFlat` object without `globalSettings`, so subpage headers/footers fell back to the legacy per-section logo while the root rendered the new `globalSettings.logoUrl` — an editor-right/published-wrong divergence.

Fix (purely additive, one field into both `subFlat` literals):
- Line 253 (main subpage loop): added `globalSettings: contentData.globalSettings,`
- Line 366 (locale-variant subpage loop): added `globalSettings: contentData.globalSettings,`

Source expression: `contentData.globalSettings` — same root object the root page renders via `content: contentData` (line 174), so root and subpages now read identical globalSettings. Legacy pages with no root globalSettings get `undefined` → byte-identical fallback to per-section logo.

Verification:
- `npx tsc --noEmit` — green (no output).
- `npm run test:run` — green (2106 passed | 3 skipped, 137 files).
- `npm run build` — green (published-export path compiled).
- Grep confirms BOTH construction sites (lines 253, 366) include `globalSettings: contentData.globalSettings`.

Deviations: none. Open risks: none — additive, back-compat preserved.

## Phase 6 — imageCollection primitive + alt law (vestria catalogue grid)

**Files changed:**
- `src/types/store/actions.ts` — added `setItemAlt` to `ContentActions`.
- `src/hooks/editStore/contentActions.ts` — implemented `setItemAlt` action.
- `src/modules/templates/vestria/blocks/primitives.ts` — extended `VestriaListProps` with `reorderable?`, `imageField?`, `captionField?`.
- NEW `src/app/edit/[token]/components/primitives/EditableImageCollection.tsx` — shared 'use client' collection chrome (bulk upload · drag-reorder · add-blank · remove · optional caption).
- `src/modules/templates/vestria/blocks/editPrimitives.tsx` — E.List delegates to the chrome for imageCollection slots; E.Img gains alt input; `VestriaEditCtx`+`useVestriaEditCtx` extended with `getItemAlt`/`setItemAlt`; new affordance CSS.
- `src/modules/templates/vestria/blocks/publishedPrimitives.tsx` — `makePublishedPrimitives({ elementMetadata })`; published E.Img resolves alt via `resolveAlt`.
- `src/modules/templates/vestria/blocks/Catalog/VestriaCatalogueGrid.core.tsx` — E.List declares `reorderable imageField="image"`.
- `src/modules/templates/vestria/blocks/Catalog/VestriaCatalogueGrid.published.tsx` — forwards `props.elementMetadata` into the factory.
- NEW `src/hooks/editStore/setItemAlt.test.ts` — 5 unit tests for the alt store path.
- `docs/tracks/editorPlan.md` — phase-3 row marked BUILT.

**Single-editor proof (E.List → EditableImageCollection).** The vestria core edits `items`
solely via the injected `E.List`. E.List now branches: when the slot declares
`reorderable`/`imageField` it renders `EditableImageCollection` and the legacy add/remove
branch is NOT reached (`return` before it) — exactly one editor for the collection. Every
mutation (bulk-add, reorder, remove, add-blank, caption) flows through the single injected
`onChange={(next) => ctx.updateCollection(collectionKey, next)}` whole-array write. No second
store path was introduced. The chrome is `'use client'` and is imported ONLY by
`editPrimitives.tsx`; it is never mounted by a wrapper/core/published renderer (LAW comment in
the file).

**setItemAlt store path.** `setItemAlt(sectionId, collectionKey, itemId, alt)` writes
`content[sectionId].elementMetadata[collectionKey].alt[itemId]` (the phase-4 itemId-keyed map
under the COLLECTION key). It is additive: it never touches the items array or sibling
metadata (buttonConfig/cta), and marks the draft dirty. Add/remove/reorder/bulk-add need no
new store op — they ride the existing whole-array write.

**elementMetadata → published E.Img (forwarding chain).**
`LandingPagePublishedRenderer.extractContentFields` already spreads the section's
`elementMetadata` into block props → `VestriaCatalogueGrid.published.tsx` reads
`props.elementMetadata` and passes it to `makePublishedPrimitives({ elementMetadata })` →
published E.Img parses its `elementKey` (`items.<id>.image`, same parser as edit) and renders
`alt = resolveAlt(elementMetadata?.[coll]?.alt, itemId, altProp)`. Edit E.Img resolves alt the
same way from the store-backed `ctx.getItemAlt`, so edit and published are byte-identical. The
`alt` prop (`item.title`) is the sibling fallback in both.

**Alt ownership (deviation from the plan's dual mention).** The plan listed a per-item alt
input in BOTH the chrome (step 2) and E.Img (step 3). To keep a single alt editor, I put the
alt input ONLY in E.Img (colocated with the image it describes; also serves single-image
slots). The chrome renders NO alt input. Caption (a per-item, whole-array item field) stays in
the chrome, gated on a declared `captionField`. These write two distinct stores (alt →
elementMetadata; caption → item) with one writer each — no conflict.

**Contract deviation.** Added `captionField?: string` to `VestriaListProps` (plan step 1
enumerated only `reorderable`/`imageField`). Additive + optional; needed so the chrome's
declared-caption support is reachable end-to-end. The catalogue grid does not declare it, so
behavior is unchanged there.

**@dnd-kit containment.** First @dnd-kit integration in `src/`, fully contained in
`EditableImageCollection.tsx` (`DndContext` + `SortableContext` + `useSortable`,
`PointerSensor`+`KeyboardSensor`, `arrayMove`, `rectSortingStrategy`). Sensors/listeners are
active only while the collection is mounted in the editor and a drag is in progress; a
dedicated drag handle (`.vs-ic-drag`, `touch-action:none`, `distance:6` activation) carries
the listeners so inline text/image editing is not hijacked. Idle-observer grep confirms zero
`setInterval`/`MutationObserver`/`ResizeObserver` outside the contained dnd-kit usage.

**Verification.**
- `npx tsc --noEmit` — green.
- `npm run test:run` — green (2111 passed | 3 skipped, 138 files; +5 new setItemAlt tests).
- `npm run build` — green (published path compiled — parity/boundary intact).
- Boundary grep: `EditableImageCollection` imported ONLY by `editPrimitives.tsx`; zero hits in
  `*.published.tsx` / `publishedPrimitives.tsx` / `*.core.tsx`.
- Single-writer grep: all vestria `items` writes go through `ctx.updateCollection` (E.Img src,
  legacy add/remove, delegated onChange) — no second write path.
- Idle-observer grep: clean (no timers/observers outside dnd-kit, active only during drag).

**Deferred (founder manual pass):** live bulk-add (multi-file) · drag-reorder · remove ·
per-item alt → reload persists → publish shows correct ORDER + `alt` attributes · min(4)/max(8)
enforcement. Code is correct + parity-identical by construction (single-source core; edit vs
published differ only by injected primitive impl).

**Open risks:** none structural. Bulk upload appends `{ id, [imageField]: url }` items with no
other item fields populated (code/title/category/glyph empty) — expected; the author fills them
via the inline text primitives after upload.
