# editor-phase-3-shell-primitives — spec

Editor track phase 3 (`docs/tracks/editorPlan.md` — read it first; it is the track's WHY/decisions
record). Phases 0–2 SHIPPED 2026-07-11 (perf-04 loop kill · trust: flush-net + SaveStateChip +
throttled e2e · truth: stub controls removed). This phase is the core rebuild: **one toolbar
shell, schema-driven selection, edit primitives, delete the legacy machinery.** Run via
`/feature docs/task/editor-phase-3-shell-primitives.spec.md`.

## Why (evidence, all 2026-07-11)

Toolbar-system review + 6×-throttle benchmark (`reports/perf-editor-throttled6x-2026-07-11.md`)
found the current system is a half-migrated DOM-builder architecture:

- **3 competing positioning systems**: legacy `toolbar.position` from the store (the only one
  actually used), `useGlobalAnchor`'s registry, `utils/toolbarPositioning.ts`. Fallback when
  position missing = `{x:0,y:0}` → toolbar renders in the page corner.
- **"Global" anchor registry isn't global**: every `useToolbarVisibility` call re-runs
  `useSelectionPriority`, which instantiates its OWN `useGlobalAnchor` (own anchors state, own
  100 ms `setInterval`, own `ResizeObserver(document.body)`) + its OWN `useTransitionLock`
  (350 ms setState timers). Instances can't see each other's anchors ⇒ lookups return null ⇒
  the whole anchor system is dead weight that still runs timers.
- **Transition locks (300–350 ms lock + 100–150 ms debounce) + `toolbarWatchdog` + 
  `toolbarSingleton`** are defensive scaffolding masking selection-state instability instead of
  fixing it — the watchdog literally logs "toolbar should be visible but isn't."
- **Whole-store subscriptions in every toolbar** (no selectors): `SectionToolbar` (11 fields),
  `ElementToolbar` (×2 in one component), `TextToolbarMVP`, `ImageToolbar` (×2 incl.
  StockPhotosPanel). Open toolbar re-renders on every keystroke commit.
- Per-render `document.querySelector` + `getBoundingClientRect` in every toolbar; TTL caches
  bolted onto trivial pure functions in `utils/selectionPriority.ts`; module-global render
  counters; `logger.dev()` inside JSX.

The correction (editorPlan laws 1+3): Lessgo pages are generated from a schema we own — selection
is `{sectionId, elementKey}` store data (those fields ALREADY exist and drive everything); the
machinery around them is what gets deleted, not replaced.

## Scope

### IN — 1. One toolbar shell (`@floating-ui/react` — decided, add dependency)

- ONE floating container component owning: positioning (anchored to the selected element's DOM
  node, resolved fresh from `[data-section-id]`/`[data-element-key]` on selection change),
  flip/shift at viewport edges, arrow, dismissal (outside-click, Esc), and show/hide driven
  PURELY by the priority resolver's output. No locks, no debounces, no watchdog — if flicker
  appears, fix the state transition that causes it (find it; don't re-add a lock).
- Per-type **action sets as config**: section / element / text / image action lists render inside
  the shell. Existing action IMPLEMENTATIONS (layout swap, move/dup/delete, text formatting +
  variations, image replace/stock/edit/delete) are kept and re-mounted — this is a re-shell, not
  a feature rewrite. Every action works or doesn't exist (phase-2 law, keep enforcing).
- Keep `useSelectionPriority`'s pure priority logic (`getActiveToolbar`: text > image/form >
  element > section) as a plain function; SINGLE hook instance at the shell level; delete the TTL
  caches (the function is trivial).
- **Selector-ize everything**: every toolbar/action-set component subscribes via narrow
  `useShallow` selectors only. Acceptance is grep-clean: zero bare `useEditStore()` destructures
  in `src/app/edit/[token]/components/toolbars/**` (+ the shell).

### IN — 2. DELETE list (net-negative LOC is an acceptance criterion)

`useGlobalAnchor.ts` · `useTransitionLock.ts` · `utils/toolbarWatchdog.ts` ·
`utils/toolbarSingleton.ts` · `utils/toolbarPositioning.ts` + `hooks/useToolbarPositioning.ts` ·
selectionPriority TTL caches · `useToolbarVisibility` duplication (incl. the second unused one in
`useOptimizedEditStore.ts:227`) · legacy `toolbar.position`/`toolbar.actions` plumbing in
`FloatingToolbars` once the shell positions itself (check what else reads `toolbar.position` —
`uiActions.showToolbar` writers may simplify too; keep store-shape changes minimal, phase 4 owns
the store) · dead icon-map entries + module-global render counters + `logger.dev`-in-JSX. Scout
each deletion's references first; re-point, don't break.

### IN — 3. Edit primitives (first two + the interface)

Formalize the primitive interface (editorPlan vocabulary): a template block mounts a primitive
component per slot; primitives own ALL editing UI/behavior; blocks never implement editing.

- **`logo`** (site-scoped): standard `<EditableLogo>` — upload/remove, wordmark fallback, ONE
  store value that header+footer derive from. Scout current logo handling ("Change Logo" control
  exists in headers today — likely per-template); converge at least ONE template (meridian or
  techpremium, whichever the naayom project uses — it's the QA target) onto the primitive as the
  proving case; others migrate with template-factory.
- **`imageCollection`**: `<EditableImageCollection slotKey min max>` — collection panel: bulk
  upload (reuse `bulkUploadImages`), drag-reorder (@dnd-kit, already a dep), remove, per-item
  **alt** + caption. Store shape: ordered list under the element key. Proving case: ONE existing
  gallery-ish block (scout: naayom Gallerypreview / vestria gallery) reads it in BOTH renderers.
  This primitive is what atelier's hero slider consumes (`docs/task/atelier-template.spec.md`) —
  its editing UI must not assume grid rendering.
- **alt-text law** (locked 2026-07-11, see editorPlan primitive table): canonical alt store =
  `elementMetadata[key].alt`; the `image`/`imageCollection` primitives write it; BOTH renderers
  read it via shared primitive/`Img` components with fallback to today's sibling-derived values.
  Wire the read side for the proving-case blocks only; the 40-block sweep belongs to
  template-factory conformance work.

### OUT

Store slicing / ops-undo / `useEditStoreLegacy` retirement (phase 4) · §5 button modal + shared
link popover + GOAL_REF (phase 5) · form-editing UX (post scale-§6) · migrating every template's
blocks to primitives (template-factory does that with conformance) · any UX-layout change (locked:
toolbars keep their current look/placement semantics — this is a re-implementation, not a
redesign) · InlineTextEditorV2 internals (stays semi-controlled; it BECOMES the `text` primitive
by wrapping, not rewriting).

## Constraints

- Dual-renderer parity for every block touched by primitives (edit `.tsx` + `.published.tsx`
  together; screenshot-compare in QA).
- Published/client boundary: primitives are editor-side; published side gets plain shared
  components (`src/modules/...` plain modules, never 'use client' imports into published
  renderers).
- InlineTextEditorV2 semi-controlled contract untouched (cursor-jump history).
- Perf gates must HOLD: idle <10% busy at 6× (currently 0.85%); `e2e/edit-persistence.spec.ts`
  stays green; no new intervals/observers that run while idle.
- Solo-founder QA budget: one manual toolbar QA pass + parity sign-off at the end (human gate).

## Acceptance

- [ ] One shell component positions/hosts all toolbars via floating-ui; anchored correctly at
      viewport edges (top section, bottom section, narrow window); no `{x:0,y:0}` corner renders.
- [ ] DELETE list fully removed; `git diff --stat` net LOC negative for `src/`.
- [ ] Grep-clean: no bare `useEditStore()` (no-selector) in toolbar/shell components; no
      `setInterval`/`MutationObserver`/`ResizeObserver` registered by toolbar system while idle.
- [ ] Toolbar QA: select section/element/text/image across ≥3 templates (meridian + hearth +
      vestria) — correct toolbar appears, all actions work, no flicker on selection transitions
      (the thing locks used to mask), Esc/outside-click dismiss.
- [ ] `logo` primitive: change/remove logo on the proving template, wordmark fallback, persists
      + publishes identically (both renderers).
- [ ] `imageCollection` primitive: bulk-add, reorder, remove, per-item alt on the proving block;
      persists; published output identical layout with correct order + alt attributes.
- [ ] `elementMetadata[key].alt` written by primitives and read by proving-case published blocks.
- [ ] Perf: idle at 6× still <10%; edit-persistence e2e green; tsc/test:run/build green.
- [ ] editorPlan.md phase-3 row marked built; audits per pipeline convention.

## Human gates

1. Plan review before implementation (standard /feature loop).
2. Toolbar behavior/look parity sign-off (founder, manual pass — editor UX must feel unchanged
   or better, never different-for-different's-sake).
3. Proving-template choice confirm if scouting finds meridian logo handling risky on the live
   naayom project.

## References

- `docs/tracks/editorPlan.md` — track doc, primitive vocabulary, laws, alt finding.
- `reports/perf-editor-throttled6x-2026-07-11.md` — benchmark + loop attribution method (reuse
  the harness for the perf acceptance).
- `docs/task/editor-trust-truth.{A-F}.audit.md` — phases 1-2 audits (commit-chain trace in D,
  autosave state map in E are directly useful).
- Toolbar file inventory (line counts, 2026-07-11): TextToolbarMVP 991 · ImageToolbar ~870 ·
  SectionToolbar ~400 · ElementToolbar 461 · AdvancedActionsMenu 395 · FloatingToolbars ~100 ·
  useSelectionPriority 292 · useTransitionLock 269 · useGlobalAnchor 424 · toolbarPositioning 446
  · selectionPriority 222 · watchdog 148 · singleton 48.
- `docs/task/template-factory.spec.md` §editor-basics — the conformance side that consumes the
  primitive interface after this phase.
- `docs/task/atelier-template.spec.md` — first consumer of `imageCollection` (hero slider).

## Unresolved questions (answer at plan time, not blockers)

1. Proving block for `imageCollection` — naayom Gallerypreview vs vestria gallery (pick by
   lowest dual-renderer risk).
2. `toolbar.position`/`showToolbar` store fields: strip now vs stub-keep until phase 4 (prefer
   strip if callers are few).
3. AdvancedActionsMenu component: still has zero live consumers after phase 2 — delete here?
   (yes unless a scout finds a consumer).
4. Does StockPhotosPanel stay a portal inside the image action set or become part of the shell's
   panel slot?
