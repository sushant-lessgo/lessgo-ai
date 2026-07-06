# onboarding2 — vestria mood wiring fix (audit)

Branch: `fix/vestria-mood-wiring`

## Files changed

- `src/app/edit/[token]/components/layout/EditLayout.tsx` — the ONLY file modified.

## Root cause

The diagnosis pointed at `LandingPageRenderer`, but on the `/edit` route
`LandingPageRenderer` is **not mounted at all**. The edit canvas is
`EditablePageRenderer` rendered per-section by `MainContent`; the template
ThemeInjector that owns `<html data-mood>` on `/edit` is mounted by
**`EditLayout.tsx`** (the "Mirror LandingPageRenderer" wrapper around the whole
editor shell), and that mount passed only:

```tsx
<ThemeInjector paletteId={effectivePalette} variantId={effectiveVariant}>
```

— **no `mood` prop**. `VestriaThemeInjector` therefore always received
`mood=undefined` → `resolveMood(undefined)` → `'bone'`, on load AND on live
toggle. This explains every observed symptom exactly:

- Persisted `themeValues.mood='slate'` renders `data-mood="bone"` on load
  (hydration was fine — the store had slate; the injector was never told).
- Popover toggle updates its own state (it reads the store's `themeValues`,
  which DID update via `updateMeta`) but `<html data-mood>` never changes
  (EditLayout's injector mount doesn't read `themeValues`).
- Palette/variant work on load + toggle (EditLayout passes those two).
- Palette change re-runs the injector effect with `effectiveMood` still bone
  (deps `[paletteId, variant, effectiveMood]`; mood prop forever undefined).
- Forcing `document.documentElement.dataset.mood='slate'` repaints correctly
  (the mood CSS block is present in the injected stylesheet — pure wiring bug).

Store/write/hydration paths were verified intact and needed no change:
`updateMeta({themeValues:{...,mood}})` (popover) → top-level `state.themeValues`
replace; `loadFromDraft` hydrates `state.themeValues = apiResponse.themeValues`
(loadDraft returns it top-level); `save()` sends `themeValues`; localStorage
partialize also persists it. No other writer clobbers `themeValues` (grepped
all readers/writers).

## Fix (minimal-cause branch, per task's own preference)

The task allowed a minimal fix over the first-class-field refactor if the true
cause was a wiring gap — it is. Two edits in `EditLayout.tsx`:

1. Select the mood scalar reactively (string identity — updates on both
   `loadFromDraft` hydration and the popover's `updateMeta` object replace):
   ```tsx
   const mood = useStoreState(
     state => (state.themeValues as Record<string, any> | null)?.mood as string | undefined
   );
   ```
2. Pass it to the injector mount: `mood={mood}`.

No first-class `mood` store field was added — the store's nested
`themeValues.mood` was already fully reactive (zustand `useStore`/`useStoreState`
re-render on the top-level object replace); only this one consumer failed to
read it. Persistence, publish, and preview paths untouched.

## Deviations

- Task's "Files touched" candidates named `LandingPageRenderer.tsx`,
  `VestriaThemePopover.tsx`, `persistenceActions.ts`, store types. After
  root-causing, none of those were wrong — the broken consumer was
  `EditLayout.tsx`, which the task did not list but the fix genuinely requires
  (task explicitly permits the minimal-cause fix when found). Zero edits made
  to the listed files; they were verified correct as-is.
- Recommended first-class `mood` store field NOT implemented — nested field is
  already reactive; hoisting would add sync-on-write complexity for no gain.

## Behavior verification (reasoned per task checklist)

- (a) Load with persisted `mood='slate'`: loadDraft → `loadFromDraft` sets
  `state.themeValues={mood:'slate'}` → `useStoreState` selector yields 'slate'
  → injector `data-mood="slate"`. (localStorage partialize also carries
  `themeValues`, so reloads repaint instantly pre-fetch.)
- (b) Live toggle: popover `updateMeta({themeValues:{...,mood}})` replaces the
  object → selector value flips → injector effect deps change →
  `data-mood` flips immediately. Bone↔slate both directions.
- (c) Save: unchanged — `save()` still sends `state.themeValues` (mood
  included); popover still writes mood into `themeValues`.
- (d) Reload round-trip: unchanged persistence, now-correct hydrated render.
- (e) Published export: untouched — publish route lifts
  `Project.themeValues.mood` into `PublishedPage.themeValues`;
  `VestriaSSRTokens`/`renderPublishedExport` read it as before. Edit and
  published now resolve the same value from the same source.
- (f) Non-vestria templates: `state.themeValues` is null / mood-less → prop
  `mood=undefined`; template contract (`types/template.ts`) declares optional
  `mood?: any`; non-vestria injectors ignore it (no runtime effect). Legacy
  (non-template) products hit the `VariableThemeInjector` branch — untouched.
- Token values in `vestria/tokens.ts`: untouched (wiring-only, per user).

## Test results

- `npx tsc --noEmit` — clean.
- `npm run test:run` — 51 files passed, 1 skipped (670 passed / 2 skipped).
- `npm run build` — green (first run hit a stale `.next` `/_document`
  PageNotFoundError; clean rebuild after `rm -rf .next` exits 0 — cache flake,
  unrelated to the change).

## Open risks

- None identified in code. Orchestrator should re-verify live in the browser:
  load a slate project (`data-mood="slate"` on `<html>`), toggle bone↔slate in
  the Style popover, reload, and republish once to sanity-check parity.
