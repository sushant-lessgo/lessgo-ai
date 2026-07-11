/**
 * Alt-text resolution (editor phase-3, phase 4).
 *
 * PLAIN module — read by BOTH the edit renderer and the published renderer, so no
 * 'use client', no React, no hooks.
 *
 * Canonical alt store (locked 2026-07-11 law): `elementMetadata[key].alt` —
 *  - single-image slots: `alt` is a `string`.
 *  - collections: `alt` is an itemId-keyed `Record<string, string>` under the
 *    COLLECTION key (e.g. `elementMetadata.items.alt[itemId]`).
 *
 * Fallback chain: user-authored metadata alt → sibling-derived fallback (today's
 * behavior, e.g. `item.title`) → empty string. An empty-string metadata value is
 * treated as UNSET (an author clearing alt should get the sibling fallback, not a
 * forced empty alt).
 */

/**
 * Resolve the alt text for an image, applying the canonical → sibling → empty
 * fallback chain.
 *
 * @param metadataAlt     The `elementMetadata[key].alt` value: a `string` for a
 *                        single-image slot, a `Record<string,string>` for a
 *                        collection (keyed by itemId), or `undefined` if unset.
 * @param itemId          The collection item id (only meaningful when `metadataAlt`
 *                        is a record). Ignored for string/undefined metadata.
 * @param siblingFallback Today's sibling-derived alt (e.g. `item.title`).
 * @returns The resolved alt string ('' when nothing is available).
 */
export function resolveAlt(
  metadataAlt: string | Record<string, string> | undefined,
  itemId: string | undefined,
  siblingFallback: string | undefined,
): string {
  const fallback = siblingFallback && siblingFallback.length > 0 ? siblingFallback : '';

  if (typeof metadataAlt === 'string') {
    // Single-image slot. Empty string ⇒ treat as unset → fall through to sibling.
    return metadataAlt.length > 0 ? metadataAlt : fallback;
  }

  if (metadataAlt && itemId) {
    // Collection: itemId-keyed lookup. Empty/missing ⇒ fall through to sibling.
    const perItem = metadataAlt[itemId];
    if (typeof perItem === 'string' && perItem.length > 0) {
      return perItem;
    }
  }

  return fallback;
}
