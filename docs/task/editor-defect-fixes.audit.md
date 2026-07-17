# editor-defect-fixes — audit

## Phase 1 — Core removals (convertCTAToForm + GlobalButtonConfigModal de-dup)

### Files changed
1. `src/hooks/editStore/uiActions.ts`
2. `src/types/store/actions.ts`
3. `src/app/edit/[token]/components/layout/MainContent.tsx`
4. `src/app/edit/[token]/components/layout/EditLayout.tsx`

### Per-file changes

**1. `src/hooks/editStore/uiActions.ts`**
- Deleted the entire `convertCTAToForm` action (was ~460–491), including the crash site
  `(state.forms as any).formBuilder.visible = true;` (was :489).
- Trimmed the now-stale crash-history comment block (was ~430–447) that narrated the
  convertCTAToForm crash and cited `ButtonConfigurationModal :486`. The `showFormBuilder`/
  `hideFormBuilder` pair it preceded is UNTOUCHED (kept intact for Phase 2), now at ~430–441.

**2. `src/types/store/actions.ts`**
- Deleted the `convertCTAToForm: (sectionId: string, elementKey: string) => void;` type decl
  (was :180). Restored the blank separator before `// Images UI`. Nothing else touched.

**3. `src/app/edit/[token]/components/layout/MainContent.tsx`**
- Deleted the entire `case 'convert-form':` block in `executeContextualAction` (was ~318–322),
  the only call site of `convertCTAToForm`. `ElementToolbar.tsx canConvertToForm()` NOT touched.

**4. `src/app/edit/[token]/components/layout/EditLayout.tsx`**
- Deleted the `<GlobalButtonConfigModal />` mount (was :223) inside the `.app-chrome` modal-roots div.
- Deleted the now-unused import `import { GlobalButtonConfigModal } from '@/components/layout/GlobalButtonConfigModal';` (was :11).
- Cleaned the stale `.app-chrome` doc comment (was ~139) that listed `GlobalButtonConfigModal`
  among the modal roots. The canonical `GlobalModals.tsx:99` mount is UNTOUCHED.

### Re-grep confirmation (before cutting)
- `convertCTAToForm` → exactly 3 hits (uiActions.ts impl :460, actions.ts decl :180, MainContent.tsx caller :320). MATCH.
- `'convert-form'` → exactly 1 hit (MainContent.tsx :318). MATCH.
- `<GlobalButtonConfigModal` mounts → exactly 2 (EditLayout.tsx :223, GlobalModals.tsx :99), both bare no-prop. MATCH.

### Post-cut verification greps
- `convertCTAToForm` in `src/` → 0 hits. PASS.
- `'convert-form'` in `src/` → 0 hits. PASS.
- `GlobalButtonConfigModal` in `EditLayout.tsx` → 0 hits (0 mounts AND 0 imports). PASS.
  Expected survivors left in place: `GlobalButtonConfigModal.tsx` def, `GlobalModals.tsx` import + mount, `src/components/README.md` doc.
- Published-parity: `convertCTAToForm|formBuilder` across `*.published.tsx`, `LandingPagePublishedRenderer.tsx`, `componentRegistry.published.ts` → 0 hits. PASS.

### Gate results
- `npx tsc --noEmit` → GREEN (exit 0).
  - NOTE: first run reported one pre-existing phantom `TS2307: Cannot find module '@/assets/images/founder.jpg'` in `src/app/page.tsx:6` — a stale `.next/types` artifact (asset exists + is git-tracked; error also present on a clean `git stash` tree, so NOT introduced by this phase). It cleared after `npm run build` regenerated `.next/types`; the re-run of tsc returned exit 0 with zero errors.
- `npm run test:run` → GREEN. 243 files passed | 1 skipped; 4064 tests passed | 18 skipped.
- `npm run lint` → GREEN (only pre-existing `no-img-element` / `exhaustive-deps` warnings; zero errors).
- `npm run build` → GREEN (full route table emitted; `/edit/[token]` builds).

### Deviations from plan
- None substantive. The plan's tsc gate expected immediate green; the first tsc run surfaced a
  pre-existing stale-`.next` phantom unrelated to the edits (documented above, confirmed via
  `git stash`). Resolved by the build step; final tsc is clean.

### Open risks
- None from this phase. Phase 2 (formBuilder slice + dead show/hideFormBuilder duplicate sweep)
  is intentionally NOT done here; the `showFormBuilder`/`hideFormBuilder` pair in `uiActions.ts`
  and the `formBuilder` store slice remain in place for Phase 2.

---

## Phase 2 — Dead-code sweep (formBuilder slice + dead show/hideFormBuilder duplicates)

### Files changed
1. `src/types/store/state.ts`
2. `src/stores/editStore.ts`
3. `src/hooks/editStore/persistenceActions.ts`
4. `src/hooks/editStore/uiActions.ts` (comment-only; pair KEPT — see decision)

`formActions.ts` (LIVE pair) and `GlobalFormBuilder.tsx` were NOT touched (confirmed absent
from `git diff`).

### Precondition re-grep results
- `state.forms.formBuilder` / `.formBuilder.visible` / `forms.formBuilder`: before edits, the
  ONLY hits were the dead writers — `persistenceActions.ts:818,823` (the `showFormBuilder`/
  `hideFormBuilder` duplicate), plus the type decl `state.ts:524` and the init `editStore.ts:296`.
  No live reader anywhere. Safe to sweep.
- `GlobalFormBuilder.tsx:8-22` reads only `formBuilderOpen` + `editingFormId` + `hideFormBuilder`
  (the LIVE formActions pair) — NOT the `formBuilder` slice. Left untouched.
- `showFormBuilder`/`hideFormBuilder` impls found in THREE creators: `persistenceActions.ts:816`
  (spread first, dead), `uiActions.ts:430` (dead-shadowed), `formActions.ts:137/144` (spread last,
  LIVE). Matches the plan's composition model.

### Per-file changes
1. **`src/types/store/state.ts`** — deleted the `formBuilder: { visible; editingField;
   editingFormId; fieldLibrary }` type block from `FormsSlice` (was ~523-529) plus its
   `// Form Builder State` comment. `FormFieldType` import remains used (line ~541/549).
2. **`src/stores/editStore.ts`** — deleted the `formBuilder` init object (was ~296-301) from the
   forms-slice initial state. Spread order at :417/419/420 (persistence → ui → formsImage)
   unchanged; formActions still spread LAST.
3. **`src/hooks/editStore/persistenceActions.ts`** — deleted the dead duplicate `showFormBuilder`/
   `hideFormBuilder` pair (was ~816-824) that wrote the phantom
   `(state.forms as any).formBuilder.visible`. This was the last remaining writer of the slice.
4. **`src/hooks/editStore/uiActions.ts`** — pair KEPT (see decision). Added a 4-line comment above
   `showFormBuilder` (now ~430) marking it dead-shadowed-by-formActions / kept-because-UIActions-
   type-requires-it. No behavioral change.

### Decision on the uiActions pair: KEPT (not swept)
The plan's primary instruction was SWEEP, with a documented fallback. Checked: `createUIActions`
has explicit return type `: UIActions` (uiActions.ts:100), and `UIActions` DECLARES
`showFormBuilder`/`hideFormBuilder` (actions.ts:178-179). `actions.ts` is OUT of Phase 2 scope, so
deleting the pair from `uiActions.ts` alone would make `createUIActions` no longer satisfy
`UIActions` → tsc failure. Fallback applies verbatim: keep the pair + one-line comment. Confirmed
empirically — `npx tsc --noEmit` is green WITH the pair kept. Two impls (uiActions kept +
formActions live) legitimately remain post-phase; the plan's "exactly ONE impl each" verification
line is known-inverted (flagged by plan-review). Runtime behavior is unchanged: formActions' pair
still wins (spread last).

### Gate results (all PASS)
- **Grep-clean**: `formBuilder.visible` / `forms.formBuilder` / `.formBuilder` slice refs → 0 hits
  in `src/`. (`formBuilderOpen` / `GlobalFormBuilder` / `showFormBuilder` remain — LIVE, correct.)
- **git diff scope**: only the 4 files above (+ pre-existing uncommitted plan.md progress-log line
  from Phase 1, not mine). `formActions.ts` + `GlobalFormBuilder.tsx` show no change.
- **`FormBuilder.test.tsx`**: green (part of test:run below).
- **`npx tsc --noEmit`**: EXIT 0.
- **`npm run test:run`**: 243 files passed | 1 skipped; 4064 tests passed | 18 skipped. EXIT 0.
- **`npm run lint`**: EXIT 0 (only pre-existing `<img>`/exhaustive-deps warnings).
- **`npm run build`**: EXIT 0 (full route table emitted; middleware built).

### Open risks
- None. The kept uiActions pair is dead-shadowed but type-required and runtime-inert; a future
  phase touching `actions.ts` could remove both the `UIActions` decl and this impl to reach the
  "one impl each" ideal, but that is out of this phase's scope.
