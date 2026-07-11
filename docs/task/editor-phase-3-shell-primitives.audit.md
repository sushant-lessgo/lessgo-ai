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
