# `src/hooks/` — Hooks & State Stores

Custom React hooks plus the Zustand+Immer stores that back onboarding, the
editor, and the generation flows. The editor's core store now lives in
`src/stores/` (token-scoped factory + manager); the hooks here either *wrap* that
store or hold their own independent slices.

> **See also** `src/stores/README.md` (editStore factory, storeManager,
> useThemeStore) and `src/hooks/editStore/` (the slice action-creators the
> factory composes).

---

## Stores

### `useOnboardingStore.ts`
Global (non-token) Zustand store for the **onboarding field pipeline**: `oneLiner`,
`confirmedFields` (canonical-name → value/confidence), `validatedFields`
(`Partial<InputVariables>`), `hiddenInferredFields`, AI features, and
`forceManualFields`. Feeds validation/market-insights and the edit-time field
modals. Uses `devtools` (no persist).

### `useEditStoreLegacy.ts` — **the active editor store hook**
Despite the name, this is the primary editor-state API (~100+ call sites across
`src/app/edit/`, toolbars, template blocks, renderers). It reads the
**token-scoped** store instance from `EditProvider` context (see
`src/stores/editStore.ts`) so callers need no tokenId. Re-exported as
`useEditStore` (both from this file and from `useEditStoreGlobal.ts`); most call
sites write `import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy'`.
`useEditStoreLegacy.getState()` gives static (non-reactive) access to the
last-mounted store. State surface: sections/layouts/spacing, `content`, multi-page
`pages`/`currentPageId`/`chrome`, theme + design tokens, UI (selection, toolbars,
modals), forms/images, meta (audienceType/templateId/variantId/paletteId), and
persistence/auto-save.

### Generation-flow stores (one per route family)
- `useGenerationStore.ts` — the original `/create` product flow (10 steps incl.
  vibe / IVOC research / uiblock selection). Onboarding-era; still active.
- `useProductGenerationStore.ts` — lean **Meridian/Vestria** product onboarding
  (`/onboarding/product/[token]`): oneLiner → understanding → goal → offer →
  sitemap (multi-page only) → generating. Also holds imported testimonials and
  the non-blocking vestria variant/palette/mood picks.
- `useServiceGenerationStore.ts` — **service** onboarding
  (`/onboarding/service/[token]`): oneLiner → understanding → goal → offer →
  assets → style (Hearth palette) → generating → complete.

All three are plain `create()` + `devtools` + `immer` stores (no persist), keyed
to their wizard's step array.

### `useModalManager.ts`
Field-edit modal orchestration for the editor: a modal queue over
`CanonicalFieldName`s; bridges `useOnboardingStore` (field values) and the editor
store (`useEditStoreLegacy`).

---

## Editor helper hooks (consume the token-scoped store)

| Hook | Role |
|------|------|
| `useEditor.ts` | High-level editor actions/facade |
| `useAutoSave.ts` | Debounced draft auto-save (`/api/saveDraft`) |
| `useStatePersistence.ts` | Load/persist wiring around the store |
| `useContentSerializer.ts` | Serialize editor content for save/publish |
| `useSectionCRUD.ts` / `useElementCRUD.ts` | Add/remove/reorder sections & elements |
| `useElementPicker.ts` / `useUniversalElements.ts` | Element insertion + universal-element schema |
| `useSelectionPriority.ts` / `useSelectionPreserver.ts` | Selection resolution & preservation |
| `useToolbarPositioning.ts` | Floating-toolbar placement |
| `useImageToolbar.ts` / `useButtonConfigModal.ts` / `useAdvancedActionsMenu.ts` | Per-widget toolbar/menu state |
| `useSmartTextColors.ts` | Contrast-aware text color resolution |
| `useOptimizedEditStore.ts` | Selector-based reads to cut re-renders |
| `usePerformanceMonitor.ts` | Dev render/timing instrumentation |
| `useTransitionLock.ts` / `useGlobalAnchor.ts` | Interaction guards / anchor tracking |

## Standalone hooks
- `useCSRFToken.ts` — fetches/holds the CSRF token for mutating API calls.
- `useReviewState.ts` — element-verification / "Getting started" setup-guide state (curated auto-checked tasks + AI-invented `needs_review` markers), derived from live content. Not testimonials.
- `useSimplifiedOnboarding.ts` — simplified onboarding helper.

---

## `src/hooks/` vs `src/stores/`

- **`src/stores/`** owns the *editor store engine*: `editStore.ts` (the
  token-scoped factory — the real Zustand instance), `storeManager.ts` (per-token
  LRU cache), `useThemeStore.ts` (small landing-preview color store).
- **`src/hooks/`** owns the *onboarding/generation stores* and every hook that
  reads/mutates the editor store. `useEditStore.ts` here is the SSR-safe
  token-aware hook (`useEditStore(tokenId)`); `useEditStoreLegacy.ts` /
  `useEditStoreGlobal.ts` are the context-based no-token wrappers used everywhere.

The "token-scoped" migration is effectively **complete at the store layer** — the
global store is gone; every editor call resolves to a per-token instance. Only the
*hook naming* still carries the transitional "Legacy" label.
