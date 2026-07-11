# remove-your-inputs-panel — plan

**Branch:** `feature/remove-your-inputs-panel`
**Spec:** `docs/task/remove-your-inputs-panel.spec.md`

## Overview

Delete the dead "Your Inputs" accordion (read-only onboarding-field mirror + destructive "Change inputs & regenerate" button) from the edit page left panel, leaving Section Outline + ReviewChecklist untouched. Pure client-side UI deletion in one file, plus cleanup of the `tokenId` prop if it becomes fully unused. No renderer-pair, schema, or publish surface involved.

> Line numbers below are **pre-deletion** references from scouting. Implementer must re-locate each item **by symbol/text**, not by line number — earlier deletions shift later lines.

## Phase 1 — Delete accordion + orphaned code (single phase)

**Human gate:** none (pure UI deletion; no schema/auth/publish/prod-data).

### Goal
"Your Inputs" accordion no longer renders on `/edit/[token]`; Page tab shows Section Outline only; Review mode / collapse / resize unchanged; zero dead code left in `LeftPanel.tsx`.

### Files touched
- `src/app/edit/[token]/components/layout/LeftPanel.tsx` (edit)
- `src/app/edit/[token]/components/layout/EditLayout.tsx` (edit — only if `tokenId` prop becomes fully unused; see step 4)

### Steps
1. In `LeftPanel.tsx`, delete the accordion JSX block: the `border-t` divider immediately above it (~L302-303) through the entire accordion (~L305-377) — header/toggle, Product Description, Validated Fields, Hidden Inferred Fields, Features, and the "Change inputs & regenerate" button (`router.push(\`/onboarding/product/${tokenId}\`)`). **Keep** the wrapping `<>...</>` fragment (~L281/L378) and the Section Outline block inside it (~L282-300).
2. Delete the accordion's now-orphaned data prep and state, all in `LeftPanel.tsx`:
   - `validatedEntries` / `hiddenEntries` / `features` prep (~L217-231)
   - `const [inputsExpanded, setInputsExpanded] = useState(false);` (~L179)
   - `const onboardingData = useStoreState(state => state.onboardingData);` (~L171 — read only by the accordion; Section Outline uses `sections`, ReviewChecklist uses `useReviewState` + `sections`)
   - `const router = useRouter();` (~L168)
   - `sanitizeValue` helper (~L19-25 — only called by the accordion prep)
3. Delete now-unused imports in `LeftPanel.tsx`:
   - `useRouter` from `next/navigation` (L5)
   - `FIELD_DISPLAY_NAMES`, `HIDDEN_FIELD_DISPLAY_NAMES`, `CanonicalFieldName` from `@/types/core/index` (L7). **Remove the import line only** — these symbols are still used by other files; do NOT touch `@/types/core/index` itself.
   - If `useState`/`useEffect` (L4) remain used elsewhere in the file (resize logic etc.), keep them; drop only what's genuinely unused.
4. **Re-evaluate `tokenId`:** after steps 1–3, grep `LeftPanel.tsx` for `tokenId`. The only caller is `EditLayout.tsx:160` (`<LeftPanel tokenId={tokenId} />`).
   - If `tokenId` is now fully unused inside `LeftPanel.tsx`: remove it from `LeftPanelProps` (~L10-12), the destructure in `export function LeftPanel({ tokenId }: LeftPanelProps)` (~L167), and the pass-down in `EditLayout.tsx` (`<LeftPanel />`). If the props interface becomes empty, delete it and drop the props parameter entirely.
   - If some other use (or a lint rule) still requires it: leave it and note why in the audit.
5. Update the stale header comment at L1 (`... Section Outline + Read-only Inputs + Review Checklist`) to drop "Read-only Inputs".

### Verification
- `npx tsc --noEmit` — clean.
- `npm run test:run` — green.
- `npm run build` — green.
- Manual: open `/edit/[token]` — left panel "Page" tab renders Section Outline only (no accordion, no dangling divider/empty space); Review tab, collapse toggle, and resize handle behave as before.

## Unresolved questions
- None.
