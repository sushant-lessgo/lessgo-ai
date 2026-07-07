# `src/stores/` — Editor store engine

The token-scoped Zustand store that backs the visual editor, plus its lifecycle
manager and a small standalone theme store. This is the "engine"; the hooks that
consume it live in `src/hooks/` (see `src/hooks/README.md`).

---

## `editStore.ts` — token-scoped store factory
`createEditStore(tokenId)` builds one isolated Zustand instance **per project
token** (replacing the former single global store). Middleware chain:
`devtools → subscribeWithSelector → persist → immer`.

- **State** comes from `createInitialState(tokenId)`: layout (sections /
  sectionLayouts / spacing / theme / globalSettings), content, the multi-page axis
  (`pages` / `currentPageId` / `chrome`), UI (selection, toolbars, modals,
  AI-generation status), forms & images, meta
  (audienceType / templateId / variantId / paletteId / themeValues /
  onboardingData), persistence metrics, and the CSS-variable slice.
- **Actions** are composed from the slice creators in
  `../hooks/editStore/*` (`coreActions`, `contentActions`, `aiActions`,
  `persistenceActions`, `generationActions`, `uiActions`, `formsImageActions`,
  `layoutActions`, `cssVariableActions`, `regenerationActions`, `pageActions`)
  plus a few token-specific actions defined inline (`reset`, `getTokenId`,
  `updateOnboardingData`, …).
- **Persistence:** `persist` writes a `partialize`d subset (template identity +
  sections/content/pages/theme/forms/meta/CSS-vars) to `localStorage` under a
  per-token storage key (`getStorageKey`). Template identity is persisted so
  first-paint rehydration engages the template gate instead of flashing
  "Layout Component Missing". Corrupted storage is caught and cleared;
  `onRehydrateStorage` re-asserts the tokenId.

`EditStore` / `SectionData` types come from `@/types/store`.

## `storeManager.ts` — singleton instance manager
`EditStoreManager` (exported as `storeManager`) creates, caches, and evicts store
instances. LRU cache of **max 3** stores in memory (older ones dropped from memory
but kept in localStorage); tracks the current token, runs periodic memory +
storage-maintenance cleanup, and handles token switches / preloading.
`getEditStore(tokenId)` is the single creation entry point — used by the
`useEditStore(tokenId)` hook and `EditProvider`.

## `useThemeStore.ts` — standalone landing-preview theme store
A tiny, **separate** global Zustand store (`primary` / `background` / `muted`
hex colors) that emits `--landing-*` CSS variables via `getFullTheme()` (with
darken/lighten/contrast helpers). Independent of the editor store and the template
token systems; used for lightweight color theming of a landing preview.

---

## Relationship to `useEditStoreLegacy` (migration status — verified)

There is **no separate "legacy store"**. The editor store *is* the token-scoped
factory here. `src/hooks/useEditStoreLegacy.ts` is a thin **hook wrapper** that
pulls the current instance from `EditProvider` context — so components read the
per-token store without passing a tokenId. Consumption (verified by grep):

- `useEditStoreLegacy` (as `useEditStore`): ~100+ call sites — the actual editor
  API used across `src/app/edit/`, toolbars, template blocks, and both renderers.
- `useEditStore(tokenId)` (SSR-safe token hook in `src/hooks/useEditStore.ts`):
  used by `EditProvider` to establish the context.
- `createEditStore` here: called only by `storeManager`.

So the token-scoped migration is **complete at the store layer**; only the hook
name still says "Legacy". `useEditStoreGlobal.ts` re-exports the same wrapper.
