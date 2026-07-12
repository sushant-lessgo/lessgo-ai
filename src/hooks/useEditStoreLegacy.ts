/**
 * @deprecated delete in phase 3.
 *
 * Thin re-export shim kept only for bisectability during phase 2 — the ~107
 * existing `useEditStoreLegacy` importers keep resolving until the phase-3
 * import sweep repoints them at `./useEditStore`.
 */
export { useEditStore, useEditStore as useEditStoreLegacy, useEditStoreApi } from './useEditStore';
