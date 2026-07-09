// src/app/edit/[token]/components/ui/clampSectionCards.ts
// scale-09 phase 5 — PURE card-count clamp for manual block swaps.
//
// When the editor swaps a section to a SMALLER-capacity block (target
// capacity.maxCards < the section's current card count), the extra cards must be
// dropped so the copy stays coherent in the new block. Pilot policy (plan Q7):
// drop from the END — trailing cards are the "weakest" (AI orders strongest
// first). No regen; the swap is a store field change + re-render, and undo
// restores the dropped cards (the caller wraps clamp + layout change in ONE
// executeUndoableAction).
//
// This is a pure function (no React, no store) so it is unit-testable in
// isolation and callable from the selector without side effects.
//
// SHAPE: a section's card collections live as TOP-LEVEL array-valued entries in
// `content[sectionId].elements` (e.g. `elements.features`, `elements.testimonials`)
// — the published renderer spreads `...elements` straight into block props, and
// each block reads `props.<collection>` as an array. So the clamp truncates every
// top-level array element to `maxCards`; non-array elements (headline, cta_text,
// image URLs, …) are untouched.

/** Minimal shape of a section's stored content (SectionData) the clamp reads. */
export interface ClampableSection {
  elements?: Record<string, unknown>;
}

export interface ClampResult<T extends ClampableSection = ClampableSection> {
  /** New content with collection arrays truncated (or the SAME ref when no-op). */
  content: T;
  /** How many cards were dropped from the largest truncated collection. */
  droppedCount: number;
}

/**
 * The section's current "card count" = the length of its largest top-level
 * collection array. Used by the caller to decide whether a swap to a target with
 * `capacity.maxCards` needs clamping (`maxCards < sectionCardCount`).
 */
export function sectionCardCount(section: ClampableSection | null | undefined): number {
  const elements = section?.elements;
  if (!elements) return 0;
  let max = 0;
  for (const value of Object.values(elements)) {
    if (Array.isArray(value)) max = Math.max(max, value.length);
  }
  return max;
}

/**
 * Truncate every top-level collection array in the section to `maxCards`,
 * dropping from the END. Returns new content + the number of cards dropped from
 * the largest truncated collection (for the "keeps first N cards" warning).
 *
 * No-op (returns the SAME content ref, droppedCount 0) when nothing exceeds
 * `maxCards`, when there are no collections, or when `maxCards` is not a finite
 * non-negative number.
 */
export function clampSectionCards<T extends ClampableSection>(
  section: T,
  maxCards: number
): ClampResult<T> {
  const elements = section?.elements;
  if (!elements || !Number.isFinite(maxCards) || maxCards < 0) {
    return { content: section, droppedCount: 0 };
  }

  const cap = Math.floor(maxCards);
  let dropped = 0;
  let mutated = false;
  const nextElements: Record<string, unknown> = { ...elements };

  for (const [key, value] of Object.entries(elements)) {
    if (Array.isArray(value) && value.length > cap) {
      dropped = Math.max(dropped, value.length - cap);
      nextElements[key] = value.slice(0, cap);
      mutated = true;
    }
  }

  if (!mutated) {
    return { content: section, droppedCount: 0 };
  }

  return {
    content: { ...section, elements: nextElements } as T,
    droppedCount: dropped,
  };
}
