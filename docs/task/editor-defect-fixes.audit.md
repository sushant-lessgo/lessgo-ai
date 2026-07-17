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
