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
`forceManualFields`. Feeds the edit-time field modals. Uses `devtools` (no persist).

### `useEditStore.ts` — **the active editor store hook** (selector-first)
The primary editor-state API (~100+ call sites across `src/app/edit/`, toolbars,
template blocks, renderers). It reads the **token-scoped** store instance from
`EditProvider` context (see `src/stores/editStore.ts`) so callers need no tokenId.
**Always call with a selector** — `useEditStore(s => s.field)` (wrap object selectors
in `useShallow`); bare `useEditStore()` whole-store subscription is **banned by ESLint**
(`no-restricted-syntax` in `.eslintrc.json`). Use `useEditStoreApi()` (non-reactive
store API) / `useEditStore.getState()` (static, last-mounted store) for actions and
one-shot reads. `EditProvider` alone bootstraps the token-scoped instance via
`useEditStoreBootstrap.ts` (import it nowhere else). State surface: sections/layouts/spacing,
`content`, multi-page `pages`/`currentPageId`/`chrome`, theme + design tokens, UI
(selection, toolbars, modals), forms/images, meta (audienceType/templateId/variantId/
paletteId), and persistence/auto-save. (editor-phase-4 collapsed the old four access
layers — `useEditStoreLegacy`/`useEditStoreGlobal`/dead compat shims — into this one hook.)

### Generation-flow stores
The old per-route generation stores — `useGenerationStore.ts` (the original
`/create` product flow), `useProductGenerationStore.ts`, and
`useServiceGenerationStore.ts` — were **deleted in scale-06 phase 10** when the
product/service wizard fork was retired. Their surviving types were re-homed:
`ServiceUnderstanding` / `ServiceUnderstandingExtract` / `ServiceAssetAvailability`
→ `src/types/service.ts`; `VestriaHeroVariant` / `VestriaLookMood` →
`src/types/product.ts`. Everything now goes through `useWizardStore` below.

### `useWizardStore.ts` — **unified Brief-backed wizard store** (scale-06)
Single source of truth for the ONE wizard that serves every engine — the
convergence target that replaced the product/service fork.
Resolves `engine`/`businessTypeKey`/`audienceType`/`templateId` from the confirmed
`Brief` + serveGate result. Its **slot machine is keyed by slot IDs** (not indices):
the slot list is computed from the engine contract (`getContract`,
`src/modules/engines/inputContracts.ts`) with per-engine skips applied (trust/work
skip `structure`); `goToSlot`/`nextSlot`/`prevSlot` operate on ids. Per-field state
(`{ value, source: scraped|inferred|user, confirmed, state }`) comes from the pure
phase-1 waterfall (`src/modules/wizard/waterfall.ts`) — **not duplicated here**.
`mode: 'review' | 'fill'` is derived from the entry source (URL/scrape ⇒ review,
manual one-liner ⇒ fill). Goal reuses scale-05 (`goalIntent`/`goalParam` +
`intentToBriefGoal`); proof booleans are a superset of `ServiceAssetAvailability`.
Hydrates from `Project.brief` (same loadDraft path as the entry funnel) and
persists via the existing `/api/saveDraft` (no new persistence API). `'use client'`;
imports only pure helpers + types (firewall-clean — no template/renderer imports).

### `useModalManager.ts`
Field-edit modal orchestration for the editor: a modal queue over
`CanonicalFieldName`s; bridges `useOnboardingStore` (field values) and the editor
store (`useEditStore`).

---

## Editor helper hooks (consume the token-scoped store)

| Hook | Role |
|------|------|
| `useEditor.ts` | High-level editor actions/facade |
| `useAutoSave.ts` | Debounced draft auto-save (`/api/saveDraft`) |
| `useContentSerializer.ts` | Serialize editor content for save/publish |
| `useSectionCRUD.ts` / `useElementCRUD.ts` | Add/remove/reorder sections & elements |
| `useElementPicker.ts` / `useUniversalElements.ts` | Element insertion + universal-element schema |
| `useSelectionPriority.ts` / `useSelectionPreserver.ts` | Selection resolution & preservation (priority = pure resolver; the `ToolbarShell` owns positioning/visibility since editor phase-3) |
| `useImageToolbar.ts` / `useButtonConfigModal.ts` | Per-widget toolbar/menu state |
| `useSmartTextColors.ts` | Contrast-aware text color resolution |
| `useOptimizedEditStore.ts` | Selector-based reads to cut re-renders |

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
  reads/mutates the editor store. `useEditStore.ts` here is the context-based
  no-token reactive hook used everywhere (selector-first — see above);
  `useEditStoreBootstrap.ts` is the SSR-safe token-aware bootstrap
  (`useEditStoreBootstrap(tokenId)`) imported **only** by `EditProvider`.

The "token-scoped" migration is **complete** — the global store is gone; every
editor call resolves to a per-token instance. As of editor-phase-4 the transitional
"Legacy"/"Global" hook names are also gone: one `useEditStore` selector-first hook,
one `useEditStoreBootstrap`.
