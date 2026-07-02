'use client';

// Shared across template Editable wrappers (Hearth/Lex/Meridian/TechPremium/Surge).
// An optional element "deleted" via the section toolbar's Elements toggle is added
// to `section.aiMetadata.excludedElements`. extractLayoutContent already strips it
// from content, but blocks gate optionals with `(value || mode === 'edit')`, which
// re-shows an empty placeholder in the editor. The Editable wrappers call this and
// render null when excluded in edit mode, so toggled-off optionals also disappear
// in the editor (matching publish). Selector-scoped so it only re-renders when the
// section's excluded list changes.

import { useStore } from 'zustand';
import { useEditStoreContext } from '@/components/EditProvider';

export function useIsElementExcluded(sectionId: string, elementKey: string): boolean {
  const { store } = useEditStoreContext();
  // Editable wrappers only mount inside an EditProvider (edit/preview), so `store`
  // is present; published pages render the hook-free `.published.tsx` blocks.
  const excluded = useStore(
    store as NonNullable<typeof store>,
    (s: any) => s?.content?.[sectionId]?.aiMetadata?.excludedElements
  );
  return Array.isArray(excluded) && excluded.includes(elementKey);
}
