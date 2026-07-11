# kill-section-background-settings — plan

**Branch:** `feature/kill-section-background-settings` — implementer must verify `git branch --show-current` matches before any edit; hard-stop on mismatch.

**Spec:** `docs/task/kill-section-background-settings.spec.md`

## Overview

The section toolbar's "Background Settings" entry opens `SectionBackgroundModal`, which writes legacy `backgroundType`/`sectionBackground` data that the template render path (`usesTemplate` branch → `getSurfaceForSection()` → `data-surface`) never reads. It is dead UI on every current project. This task deletes the modal, its registry wiring in `GlobalModals`, and the toolbar action, and records the future "per-section surface override" capability in the product backlog. Zero rendering behavior change; store actions/types (`setBackgroundType`, `sectionBackground` types) stay — legacy non-template renderer paths still reference them (scope OUT per spec).

**Reference set is complete and authoritative (scout-verified): only 3 source files reference the modal.** No other caller of `showBackgroundModal` or importer of `SectionBackgroundModal` exists.

**Explicit non-change — README:** `src/app/edit/[token]/README.md` does NOT reference SectionBackgroundModal/showBackgroundModal. Its "Background" mentions are a different modal (`VariableBackgroundModal`) + the background design system. The spec's "update README if it references Background Settings" criterion resolves to **NO README CHANGE**. Do not edit it.

**Dual-renderer note:** no block `.tsx`/`.published.tsx` files are touched; both render paths already ignore the deleted data. No parity risk.

## Phases

### Phase 1 — Delete dead Background Settings UI + backlog note (single slice)

No human gate (pure UI removal; no schema/auth/publish/prod data). Merge-to-main remains the orchestrator's gate.

**Files touched:**
- `src/app/edit/[token]/components/ui/SectionBackgroundModal.tsx` — DELETE file
- `src/app/edit/[token]/components/ui/GlobalModals.tsx` — edit
- `src/app/edit/[token]/components/toolbars/SectionToolbar.tsx` — edit
- `docs/product/productBacklog.md` — edit (add backlog note)
- `docs/task/kill-section-background-settings.audit.md` — create (implementer audit)

**Steps:**
1. Confirm branch: `git branch --show-current` == `feature/kill-section-background-settings`; hard-stop otherwise.
2. `src/app/edit/[token]/components/toolbars/SectionToolbar.tsx`:
   - Remove import at `:9` — `import { showBackgroundModal } from '../ui/GlobalModals';`
   - Remove the `background-settings` action object at `:253-260` inside the `advancedActions` array (array starts `:252`). The sibling `regenerate-section` entry (`:261-270`) stays; ensure the array literal remains syntactically valid (comma cleanup).
3. `src/app/edit/[token]/components/ui/GlobalModals.tsx`:
   - Remove the `SectionBackgroundModal` import (`:3`).
   - Remove the `backgroundModal: { isOpen, sectionId }` slice from `modalState` (`:10-13`).
   - Remove `export function showBackgroundModal(...)` (`:25-28`) and `export function hideBackgroundModal(...)` (`:30-33`).
   - Remove the `SectionBackgroundModal` JSX render block (`:77-83`).
   - LEAVE untouched: the shared `useState`/`useEffect` subscription infra (`:56-72`) and the sibling modals (productsModal, seoModal, GlobalButtonConfigModal) — same registry pattern, independent.
4. Delete `src/app/edit/[token]/components/ui/SectionBackgroundModal.tsx` entirely (`git rm`).
5. `docs/product/productBacklog.md`: add a new H3 under `## Future Considerations` (`:132`), formatted in the file's bold-label prose style, adapted from the spec's "Backlog note" verbatim content:

   ```markdown
   ### Per-Section Surface Override (reimagined Background Settings)
   **Value Proposition:** Let the founder flip an individual section to a different template surface (e.g. cream/white/ink/accent) instead of the `getSurfaceForSection()` default.

   **How it works:**
   - Store as a per-section override
   - Honor in BOTH edit (`LandingPageRenderer`) and published (`LandingPagePublishedRenderer`) via the `data-surface` attribute
   - Requires a new template-contract method to enumerate a template's available surfaces (templates don't expose this today)
   - Requires a per-template picker UI

   **Why valuable:**
   - Replaces the old dead primary/neutral/custom background modal (killed 2026-07-07) with something that actually affects the template render path
   ```

   IMPORTANT: the note must NOT contain the literal strings `showBackgroundModal` or `SectionBackgroundModal` (keeps the zero-hit grep clean). The wording above complies.
6. Write `docs/task/kill-section-background-settings.audit.md` per pipeline convention.
7. Commit on the feature branch.

**Verification:**
1. Grep returns ZERO hits after edits:
   - `git grep -n "showBackgroundModal" -- src docs/product` → no matches
   - `git grep -n "SectionBackgroundModal" -- src docs/product` → no matches
   - (The spec/plan/audit files under `docs/task/` legitimately contain the strings — excluded by the path scope above.)
2. Also confirm `hideBackgroundModal` and `backgroundModal` have zero hits in `src/` (no dangling internal refs): `git grep -n "backgroundModal" -- src` → no matches.
3. `npx tsc --noEmit` — green.
4. `npm run test:run` — green.
5. Manual smoke (dev server): open `/edit/[token]`, click a section → toolbar advanced menu opens; "Background Settings" gone; `regenerate-section` and sibling modals (products, SEO, button config) still work.

## Unresolved questions

- None. Scout resolved all spec open questions (no extra callers; GlobalModals cleanup scoped; README = no change).
