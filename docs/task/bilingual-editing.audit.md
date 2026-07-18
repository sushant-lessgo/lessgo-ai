# bilingual-editing — implementation audit

## Phase 1 — re-mount locale controls + bilingual gate

**Files changed**
- `src/app/edit/[token]/components/layout/EditHeader.tsx`
- `src/app/edit/[token]/components/editor/LocaleSettings.tsx`
- `src/app/edit/[token]/components/editor/LanguageToggle.tsx`

### `EditHeader.tsx`
What changed:
- Added imports:
  ```ts
  import { LanguageToggle } from '../editor/LanguageToggle';
  import { LocaleSettings } from '../editor/LocaleSettings';
  ```
- Rewrote the top-of-file "LANGUAGES CONTROL — REMOVED (decision 8b)" note → new
  "LANGUAGES CONTROLS — RE-MOUNTED by bilingual-editing (Kundius blocker), superseding
  8b" note. States both controls self-hide via `isMultiLocale(localeConfig)` so
  single-locale projects (~99%) still render nothing (8b dead-weight rationale preserved
  by the gate, not by absence). Kept the regen-lock pointer sentence verbatim
  ("The regen locale-lock in EditHeaderRightPanel is UNAFFECTED…").
- Rendered the two controls inside `EditorDesignControls`'s existing `flex items-center
  gap-2` div, AFTER `designControls`, in the plan's order:
  ```tsx
  return (
    <div className="flex items-center gap-2">
      {designControls}
      <LanguageToggle />
      <LocaleSettings />
    </div>
  );
  ```
- Updated the `EditorDesignControls` docstring (was "The i18n controls that used to sit
  beside it were removed") to describe the re-mounted, self-hiding locale controls. This
  is a same-file comment correction beyond the plan's literal step-2 scope; logged under
  Deviations.

### `LocaleSettings.tsx`
What changed:
- Import: added `isMultiLocale` to the existing `@/lib/i18n/localeContent` import
  (same module `LanguageToggle` uses) — `import { SUPPORTED_LOCALES, isMultiLocale } from
  '@/lib/i18n/localeContent';`.
- Added the bilingual self-hide AFTER all hooks (useEditStoreApi, useEditStore selector
  for `localeConfig`, useState, useRef, useEffect) and before the derived consts, so
  rules-of-hooks hold:
  ```tsx
  // Gated per bilingual-editing spec: adding a 2nd locale to a single-locale
  // project is config/white-glove, not a UI flow — so this settings control only
  // appears once a project is already multi-locale.
  if (!isMultiLocale(localeConfig)) return null;
  ```
  `localeConfig` is already read via a store selector (`useEditStore((s) => s.localeConfig)`
  at line 35) — selector-style, not bare `useEditStore()`. Mirrors `LanguageToggle`.
- Token pass on the trigger button className only: `rounded-md` → `rounded-app-ctl-sm`,
  `border-gray-200` → `border-app-hairline`, `text-gray-700`/`text-gray-500` →
  `text-app-icon-muted`, `hover:bg-gray-50` → `hover:bg-app-hairline`. `border-transparent`
  unchanged. No DOM/layout change; the `isMulti` ternary is preserved as-is.

### `LanguageToggle.tsx`
What changed:
- Token pass on the pill-group container className only:
  `rounded-md` → `rounded-app-ctl-sm`, `border-gray-200` → `border-app-hairline`,
  `bg-gray-50` → `bg-app-track` (the segmented-control track fill, per tailwind config
  `app.track #f1f1f5`; it is in the same family as `BAR_CTL_CLASS`, which uses
  `data-[state=open]:bg-app-track`). Inner pill-button classes left untouched (plan scopes
  the swap to the container only). No behavioral/DOM change; the existing self-hide
  (`if (!isMultiLocale(localeConfig)) return null`) was already present.

### Token-swap decision
The plan's illustrative token list was `border-app-hairline`, `hover:bg-app-hairline`,
`text-app-icon-muted`, `rounded-app-ctl-sm`. All four applied. One value not in that list
was needed for `LanguageToggle`'s container resting fill (`bg-gray-50`): chose `bg-app-track`
(#f1f1f5) because the container is a segmented control and `app-track` is documented as the
"segmented-control track" token and is part of the `BAR_CTL_CLASS` family — the semantically
exact, non-guessed equivalent. All referenced app-* utilities confirmed present in
`tailwind.config.js` (`app.hairline` #f2f2f5, `app.icon-muted` #6b6b76, `app.track` #f1f1f5,
`radius.app-ctl-sm` 9px).

### Deviations from plan
- Updated the `EditorDesignControls` JSDoc in `EditHeader.tsx` (beyond the literal step-2
  edit of the top note) because it still claimed the i18n controls "were removed" — leaving
  it would be actively false after this change. Same file, comment-only, conservative.
- No behavioral or structural changes were made; `!isMulti` branch of the LocaleSettings
  trigger is now effectively unreachable (self-hide guarantees multi-locale before render)
  but was left intact to avoid a behavior/DOM change, per plan step 4.

### Test / gate results
- `npx tsc --noEmit`: the only error is `src/app/page.tsx(6,26): TS2307 Cannot find module
  '@/assets/images/founder.jpg'` — pre-existing and unrelated (the asset file exists on
  disk; this is the documented stale `.next/types` image-declaration phenomenon, not caused
  by any of my three files, none of which touch page.tsx or image typing). My three files
  produce no tsc errors.
- `npx eslint` on the three files: clean, no output. In particular the `no-restricted-syntax`
  bare-`useEditStore()` ban is satisfied — `LocaleSettings` reads `localeConfig` via a
  selector.
- Full `npm run build` NOT run (that is the phase-2 gate).
- Component mount verification: `LanguageToggle` and `LocaleSettings` are each imported
  once and rendered exactly once, inside `EditorDesignControls`.

### For the impl-reviewer
- `LocaleSettings` is mounted in the top bar beside `LanguageToggle`, NOT in a "Settings
  modal" as the spec's letter reads. This is sanctioned by plan decision 4 (no Settings
  modal exists; it's a self-contained popover; mounting it in a menu row would require a
  controlled-open rewrite, violating "reuse as-is"). Flagged for the founder at the phase-1
  human gate.
- These are editor-chrome components; there is NO `.published.tsx` twin (plan decision 5) —
  the dual-renderer parity rule does not apply.
- No store, persistence-route, or renderer files were touched.

---

## Phase 2 — visibility + reset regression tests, full green gate

**Files changed**
- `src/app/edit/[token]/components/editor/localeControls.visibility.test.tsx` (NEW)
- `src/hooks/editStore/i18nStoreState.test.ts` (extended — existing cases untouched)

TEST CODE ONLY. No production-code edits. No product gap surfaced — the reset lives
in `persistenceActions.ts:467-468` and is reachable via the same `loadFromDraft` entry
the file's existing hydrate cases already use, so no plan amendment was needed.

### `localeControls.visibility.test.tsx` (new)
Copied the real-store harness from `SocialItemsEditor.test.tsx` verbatim: real
`createEditStore`; `vi.mock('@/hooks/useEditStore')` re-points `useEditStore`
(via zustand `useStore`) + `useEditStoreApi` at the live instance; `react-dom/client`
+ `act`, no @testing-library. `IS_REACT_ACT_ENVIRONMENT=true`. Cases:
- **(a) bilingual → both render:** `localeConfig {en,nl}` → `LanguageToggle` renders
  exactly the pills `["EN","NL"]` (queried inside `role="group"[aria-label="Editing
  language"]`) AND `LocaleSettings` renders its globe trigger
  (`button[aria-haspopup="dialog"]`, `title="Languages"`, non-null).
- **(b) single-locale → nothing:** `localeConfig {en}` → mounting BOTH together yields
  `container.innerHTML === ""`.
- **(b2) null config → nothing:** `localeConfig = null` → same empty-container assertion
  (legacy project).
- **(c) interaction — REAL store, not theatre:** bilingual, click the `NL` pill →
  asserts `store.getState().activeLocale === 'nl'` (the genuine `setActiveLocale`, not a
  mock) AND that `aria-pressed` moved off EN onto NL after the re-render. A no-op
  `setActiveLocale` or a detached handler fails on the store-state assertion — this is a
  real mutation check per the inert-assertion lesson, not an endpoint/handler-fired check.

### `i18nStoreState.test.ts` (extended)
Added a new `describe('reset-on-load (activeLocale re-derive)')` block BEFORE the
existing `hydrate` block; all prior cases left intact. Uses the same store-level
`loadFromDraft` entry the existing hydrate/back-compat cases use — no fetch theatre.
- **Reset + lossless round-trip:** seed bilingual (`beforeEach` = `CONFIG_EN_NL`),
  `setActiveLocale('nl')`, author an NL overlay via `updateElementContent`, then round-trip
  through the real persistence shape — `export()` (exactly what `save()` ships) fed back
  as a fresh `loadFromDraft` (the reset path, `persistenceActions.ts:467-468`). Asserts
  `activeLocale === 'en'` (re-derived to defaultLocale, NOT the persisted `nl`) AND the
  `nl` overlay survived (`localeContent.nl[HERO].headline === 'Hallo'`) AND base copy
  untouched. Real export→load, no mocked fetch.
- **No-config fallback:** park store in `activeLocale='nl'`, then `loadFromDraft` with NO
  `localeConfig` → `localeConfig` null and `activeLocale` falls back to `'en'` (not the
  stale `nl`).

### Real vs. theatre notes
- Visibility (c) and both store cases assert REAL store state after driving the genuine
  action/entry point — not that a handler fired or a mock was pinned.
- The reset test round-trips through the actual `export()` → `loadFromDraft` pair rather
  than mocking a load response, so it exercises the real reset line and proves the overlay
  is lossless end-to-end.

### Deviations from plan
- None. Files-touched honored exactly; no production code touched.

### Green gate — verbatim results (run from WORKDIR)
- **`npm run test:run`:** PASS — `Test Files 247 passed | 1 skipped (248)`,
  `Tests 4186 passed | 18 skipped (4204)`. (Targeted pre-run of just the two files:
  `Test Files 2 passed (2)`, `Tests 32 passed (32)`.)
- **`npx tsc --noEmit`:** the ONLY error is the known pre-existing
  `src/app/page.tsx(6,26): TS2307 Cannot find module '@/assets/images/founder.jpg'` — the
  documented stale `.jpg`-import typing artifact. Persists after `rm -rf .next` (it is a
  standalone-tsc moduleResolution quirk, not a `.next/types` staleness), but the asset
  exists on disk, `page.tsx` is unmodified (not in `git status`), there are NO other tsc
  errors, and `next build` (which regenerates its own types) compiles it fine. Not ours —
  neither test file produces any tsc error.
- **`npm run lint`:** PASS (exit 0) — only pre-existing `@next/next/no-img-element` +
  `react-hooks/exhaustive-deps` WARNINGS in unrelated template/provider files; zero errors,
  none in either test file (bare-`useEditStore()` ban satisfied — the harness selector-mocks it).
- **`npm run build`:** PASS (exit 0) — full build incl. published-CSS + assets steps; all
  routes compiled. Confirms the standalone-tsc JPG error is inert for the real build.
