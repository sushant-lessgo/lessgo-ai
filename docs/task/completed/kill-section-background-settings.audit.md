# kill-section-background-settings — implementation audit

Branch: `feature/kill-section-background-settings` (verified before any edit).

## Files changed

- `src/app/edit/[token]/components/ui/SectionBackgroundModal.tsx` — DELETED
- `src/app/edit/[token]/components/ui/GlobalModals.tsx` — edited
- `src/app/edit/[token]/components/toolbars/SectionToolbar.tsx` — edited
- `src/hooks/editStore/uiActions.ts` — edited
- `docs/product/productBacklog.md` — edited
- `docs/task/kill-section-background-settings.audit.md` — created (this file)

## Per-file detail

- **SectionBackgroundModal.tsx** — deleted entirely (`git rm`). Dead UI: wrote legacy `backgroundType`/`sectionBackground` that the template render path (`getSurfaceForSection()` → `data-surface`) never reads.
- **GlobalModals.tsx** — removed the modal import, the `backgroundModal` slice from `modalState`, `showBackgroundModal()`/`hideBackgroundModal()`, and the JSX render block. Shared subscription infra (`useState`/`useEffect`/EventTarget) and sibling modals (productsModal, seoModal, GlobalButtonConfigModal) untouched.
- **SectionToolbar.tsx** — removed the `showBackgroundModal` import and the `background-settings` object from `advancedActions`; `regenerate-section` entry intact, array valid.
- **uiActions.ts** — removed the inert `'background-settings'` string from `getActionsForType('section')`'s returned list; no other action ids touched. NOTE: this was an orchestrator-added cleanup beyond the original 3-file plan (reviewer-surfaced inert leftover string).
- **productBacklog.md** — added "Per-Section Surface Override (reimagined Background Settings)" H3 as the first entry under `## Future Considerations`, exactly per the plan's markdown (bold-label style; no literal `showBackgroundModal`/`SectionBackgroundModal` strings so verification greps stay clean).

## Deviations

- None besides the pre-authorized `uiActions.ts` addition noted above.

## Verification results

- `git branch --show-current` → `feature/kill-section-background-settings` ✓
- `git grep -n "showBackgroundModal" -- src docs/product` → ZERO hits ✓
- `git grep -n "SectionBackgroundModal" -- src docs/product` → ZERO hits ✓
- `git grep -n "background-settings" -- src docs/product` → ZERO hits ✓
- `git grep -n "backgroundModal" -- src docs/product` → ZERO hits ✓
- `npx tsc --noEmit` → green (no output) ✓
- `npm run test:run` → green: 51 test files passed, 1 skipped; 670 tests passed, 2 skipped ✓

## Open risks

- Manual smoke (plan step: open `/edit/[token]`, confirm toolbar advanced menu opens without "Background Settings"; siblings still work) not runnable in this environment — recommend during merge-gate QA. Risk is low: change is pure removal, tsc/tests green.
