// src/modules/skeletons/work/resolveWorkBlock.ts
// Work-skeleton block dispatch — variant-aware (scale-09 `SectionEntry` shape),
// keyed by SECTION TYPE (lowercase). Each section may declare multiple LAYOUT
// variants keyed by lowercased layout name plus a `default` layout. Dispatch is
// `variants[layoutName] ?? variants[default]`, with `WorkPlaceholderBlock` as the
// fallback for an unregistered section type OR an as-yet-unbuilt variant.
//
// The registry starts EMPTY — blocks register in phases 3 (hero), 4 (pilot set),
// 6 (layout library), 7 (remaining sections). Until a section registers, every
// lookup for it falls through to the placeholder. A1 guardrail preserved: a
// foreign/unknown layout name resolves to the section's `default`, so switching
// templates never breaks on a stored layout name.

import React from 'react';
import { WorkPlaceholderBlock } from './WorkPlaceholderBlock';
import WorkHeroSlider from './blocks/Hero/WorkHeroSlider';
import WorkHeroSliderPublished from './blocks/Hero/WorkHeroSlider.published';

/** One built layout variant = an edit component + its published twin. */
export interface WorkBlockVariant {
  edit: React.ComponentType<any>;
  published: React.ComponentType<any>;
}

/** A section's variant set (scale-09). `default` names the fallback layout key. */
export interface WorkSectionEntry {
  variants: Record<string, WorkBlockVariant>;
  default: string;
}

// Keyed by section type (lowercase single tokens). Filled in phases 3/4/6/7.
// Variant keys are the LOWERCASED stored layout name (resolveWorkBlock lowercases
// the incoming layoutName before lookup). Phase 3: hero (WorkHeroSlider). The
// WorkHeroVideo slot (manifest) is declared-but-NOT-built — it has NO component,
// so it is intentionally ABSENT here.
export const WORK_BLOCK_REGISTRY: Record<string, WorkSectionEntry> = {
  hero: {
    default: 'workheroslider',
    variants: {
      workheroslider: { edit: WorkHeroSlider, published: WorkHeroSliderPublished },
    },
  },
};

export type WorkBlockMode = 'edit' | 'published';

export function resolveWorkBlock(
  sectionType: string,
  mode: WorkBlockMode = 'edit',
  layoutName?: string,
): React.ComponentType<any> | null {
  const entry = WORK_BLOCK_REGISTRY[(sectionType || '').toLowerCase()];
  if (!entry) return WorkPlaceholderBlock;

  const lc = layoutName ? layoutName.toLowerCase() : undefined;
  const variant = (lc && entry.variants[lc]) || entry.variants[entry.default];
  if (!variant) return WorkPlaceholderBlock;

  return mode === 'published' ? variant.published : variant.edit;
}
