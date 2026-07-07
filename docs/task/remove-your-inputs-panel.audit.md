# remove-your-inputs-panel — audit

## Files changed
- `src/app/edit/[token]/components/layout/LeftPanel.tsx`
- `src/app/edit/[token]/components/layout/EditLayout.tsx`

## LeftPanel.tsx
Prior implementer had already deleted the "Your Inputs" accordion JSX + divider and collapsed the render fragment to a single Section Outline `<div className="p-3">` (no stray `<>...</>` — step 2 already satisfied). This session finished the orphaned cleanup.

Symbols deleted:
- `sanitizeValue` helper
- `const [inputsExpanded, setInputsExpanded] = useState(false);`
- `const onboardingData = useStoreState(...)` selector
- `const router = useRouter();`
- `validatedEntries` / `hiddenEntries` / `features` data prep block
- `import { useRouter } from 'next/navigation';`
- `import { FIELD_DISPLAY_NAMES, HIDDEN_FIELD_DISPLAY_NAMES, type CanonicalFieldName } from '@/types/core/index';` (line removed only; `@/types/core/index` untouched)
- L1 header comment updated: dropped "Read-only Inputs" → now "Section Outline + Review Checklist"

Kept: `useState`/`useEffect` (still used by resize + mounted logic), `getSectionLabel`, `SECTION_ICONS`, `ReviewChecklist`, Section Outline, resize handle.

## tokenId decision
Removed. After cleanup `tokenId` had no remaining reader in LeftPanel.tsx (grep confirmed only the prop decl + destructure). Deleted `LeftPanelProps` interface entirely, changed signature to `export function LeftPanel()`, and removed the `tokenId={tokenId}` pass-down in EditLayout.tsx `<LeftPanel />`. EditLayout still passes `tokenId` to GlobalAppHeader/EditHeader/MainContent and its own props — those are untouched.

## Deviations
- Step 5 (README.md in the layout dir): no `README.md` exists in `src/app/edit/[token]/components/layout/` — N/A, nothing to update.

## Verification
- `npx tsc --noEmit` — clean (no output)
- `npm run test:run` — green (670 passed, 2 skipped; 51 files passed, 1 skipped)
- `npm run build` — succeeded

## Open risks
None. Pure client-side UI deletion; no schema/auth/publish/renderer-pair surface touched.
