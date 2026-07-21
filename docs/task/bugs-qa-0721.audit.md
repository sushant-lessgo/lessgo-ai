# bugs-qa-0721 — implementation audit

## B1 — Preview mode still editable (toolbars hidden, affordances live)

**Files changed**

- `src/modules/skeletons/work/blocks/editPrimitives.tsx`
- `src/modules/templates/granth/blocks/editPrimitives.tsx`
- `src/modules/templates/vestria/blocks/editPrimitives.tsx`
- `src/app/edit/[token]/components/editor/InlineTextEditorV2.tsx`
- `src/modules/skeletons/work/blocks/Gallery/WorkGalleryGrid.tsx`
- `src/modules/skeletons/work/blocks/Proof/WorkProofTestimonials.tsx`
- `src/modules/templates/vestria/blocks/Hero/VestriaTailoredHero.tsx`
- `src/modules/skeletons/work/previewAffordances.test.tsx` (NEW — regression test)
- `src/modules/templates/blockMocks/harness.ts` (comments only)
- `docs/task/bugs-qa-0721.audit.md` (this file)

### What changed, per file

**`src/modules/skeletons/work/blocks/editPrimitives.tsx`**
- `WorkEditCtx` gains `mode?: 'edit' | 'preview'`, populated by ONE `useEditStore(s => s.mode)`
  subscription inside `useWorkEditCtx` (perf constraint honoured — no per-primitive subscription;
  hundreds of `Txt` nodes per page).
- `Editable` gains an `editable` prop. When false it returns the same `<Tag>` with
  `data-section-id` / `data-element-key` and the visible copy (`dangerouslySetInnerHTML` for the
  HTML case) — no `InlineTextEditorV2`, no button-select branch.
- `Img`: `wk-img-edit` span (Replace / ↥ Image / Remove) and `<MediaPickerModal>` render only when
  not preview. Wrapper `<div>` + `<img>`/placeholder unchanged.
- `Link`: `<LinkPicker>` (the `wk-link-edit__btn` trigger) dropped in preview; the `wk-link-edit`
  wrapper span + children stay (`renderParity.work.test.tsx` asserts that class at preview mode).
- `List`: preview branch renders items only — no `wk-list-x`, no `wk-list-add`, and no injected
  `position:relative` on list/item wrappers (those exist purely to anchor the absolute controls).
- `Toggle`: preview returns `{children}` only.
- `EDIT_AFFORDANCE_STYLES` untouched (CSS hiding was explicitly NOT the fix).

**`src/modules/templates/granth/blocks/editPrimitives.tsx`** — same shape: `mode` on
`GranthEditCtx`, one subscription in `useGranthEditCtx`; `Txt` stops hard-coding `mode="edit"` and
passes the real mode to `GranthEditable` (which already has a static path for non-edit); `Img`
drops `gr-img-edit`; `Link` drops `LinkPicker`; `List` drops `gr-list-x` / `gr-list-add`.

**`src/modules/templates/vestria/blocks/editPrimitives.tsx`** — same; additionally the preview
`List` branch is placed BEFORE the `reorderable || imageField` branch, so the
`EditableImageCollection` chrome (drag handles, add/remove, caption inputs) never renders in
preview; `Img` also drops the `vs-img-alt` alt-text input in preview.

**`src/app/edit/[token]/components/editor/InlineTextEditorV2.tsx`** — defense in depth. Reads
`mode` via one narrow selector; when `'preview'` it renders the element with no `contentEditable`,
no `onClick`/`onFocus`/`onBlur`/`onKeyDown`/`onPaste`, no `tabIndex`, no `role="textbox"`. Keeps
`ref` (so the existing imperative content-paint effect still paints — it runs whenever
`!isEditing`), `data-section-id`, `data-element-key`, className and style. This closes the symptom
for any future caller that forgets to gate.

**`WorkGalleryGrid.tsx`** — `manageSlot` is `undefined` in preview → no "Manage photos →" link.

**`WorkProofTestimonials.tsx`** — `editable={mode !== 'preview'}` → in preview an empty proof band
is omitted entirely (matches published) and the "Add a client testimonial" hint never renders.

**`VestriaTailoredHero.tsx`** — `<FullBleedMediaChrome>` gated on `mode !== 'preview'`.

**`blockMocks/harness.ts`** — comments only: the stale "`mode:'preview'` makes the Editable
wrappers render the static path" claim now states the real, now-universal contract (classic + work
/ granth / vestria: static markup, markers kept, zero affordance).

### Deviations from the plan

1. **granth/vestria `Img` wrapper `position:relative` dropped in preview** (plan only called this
   out for `List`). Same rationale: that inline style exists solely to anchor the absolute
   `gr-img-edit` / `vs-img-edit` overlay, and the published wrapper has no such style — keeping it
   would leave preview ≠ published. Conservative in-scope call, logged here.
2. **`vestria` `List` preview branch placed before the `EditableImageCollection` delegation.** The
   plan's file list covered it but not the ordering; without it an imageCollection slot would keep
   its full drag/add/remove chrome in preview.
3. **Assertion ORDER in the new test** was changed after the first red run: with the
   `inline-text-editor-v2` check first, every case aborted before reaching the click, so the
   headline symptom was never exercised. The click-then-assert now runs FIRST.
4. Nothing outside the Files-touched list was edited. `unifiedModeSelector.ts`, the 6 classic
   templates, all `.published.tsx`, the published registry/renderer and the `EDIT_AFFORDANCE_STYLES`
   blocks were left alone as instructed.

### Regression test — proof it bites

`src/modules/skeletons/work/previewAffordances.test.tsx` (cloned setup from
`renderParity.work.test.tsx`: hoisted vanilla store + the two per-file `vi.mock`s, `createRoot` +
`act()` so effects run). Store seeded by `createHarnessStore([...BLOCK_MOCKS.atelier, PROOF_EMPTY])`
(`mode:'preview'`), plus test-local stubs for `setTextEditingMode` / `showToolbar` / `hideToolbar`
so a PRE-FIX run fails on the assertion rather than on a TypeError.

Per atelier section: click + focus every `[data-element-key]` node inside `act()` → no
`[contenteditable="true"]`; no `inline-text-editor-v2`; no `[role="textbox"]`; `.wk-list-x`,
`.wk-list-add`, `.wk-img-edit`, `.wk-link-edit__btn`, `.wk-toggle-edit`, `[data-wk-manage-photos]`,
`[data-wk-proof-empty]` all null; `[data-section-id]` still present. Plus: empty proof band absent;
visible copy still renders (positive control 2); and a `mode:'edit'` re-mount still shows
`.wk-list-add` + `inline-text-editor-v2` (positive control 1).

**Pre-fix run** (sources restored to `HEAD` via `git show`, test unchanged):

```
Test Files  1 failed (1)
      Tests  26 failed | 3 passed (29)

AssertionError: preview text became editable on click: expected <p contenteditable="true" …(9)></p> to be null
AssertionError: preview text became editable on click: expected <span …(10)></span> to be null    (×many)
AssertionError: expected <div class="wk-proof__empty" …(2)></div> to be null
```

**Post-fix run:** `Test Files 1 passed (1) · Tests 29 passed (29)`.

### Green gate

- `npm run test:run` → **294 passed | 1 skipped (295 files); 4717 passed | 15 skipped (4732 tests)**.
  `renderParity.work.test.tsx`, `__tests__/kundiusPages.test.tsx` and `templates/conformance.test.ts`
  all stayed green (markers + copy preserved in the preview branch).
- `npx tsc --noEmit` → 1 error, **pre-existing and environmental**, unrelated to this change:
  `src/app/page.tsx(6,26): TS2307: Cannot find module '@/assets/images/founder.jpg'`. The asset
  exists; the worktree simply has no `next-env.d.ts` / `.next` (never ran `next dev|build` here),
  which is what declares image modules. No other TS errors.

### Open risks

- **Manual QA still owed** for the non-work families: granth and vestria have no preview-affordance
  test of their own (no `BLOCK_MOCKS` entries), so their fix is verified by code shape + `tsc` only.
- **Anchors still navigate in preview** — pre-existing behaviour on every template, explicitly out
  of scope.
- **`GranthEditable` / `VestriaEditable` static path** was already correct; only the hard-coded
  `mode="edit"` at the call site changed. If any granth/vestria block relied on the edit-only
  element-exclusion behaviour (`isElExcluded` returns null only when `mode === 'edit'`), preview
  will now render an excluded element as static markup — matching how those templates already
  behaved in the published renderer.
