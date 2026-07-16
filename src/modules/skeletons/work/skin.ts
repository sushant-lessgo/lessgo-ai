// src/modules/skeletons/work/skin.ts
// The work-skeleton SKIN factory (§A). A skin is COMPILE-TIME data (baked per-id
// barrel — zero DB churn, conformance-checkable zero-markup) that supplies
// tokens/palettes/selections/variants; the skeleton owns ALL markup. The factory
// `makeWorkSkeletonModule(skin)` returns the full `TemplateModule` surface so a
// skin barrel registers through the existing template registry with zero contract
// change.
//
// PLAIN module (no 'use client'). STEP-0 (phase 3) cycle break: the `WorkSkinDef`
// type family + the stylesheet builder now live in the plain, injector-free
// `./stylesheet` module — this file imports them (and the client ThemeInjector /
// server SSRTokens factories) ONE-directionally, so there is NO import cycle
// (granth tokens.ts/palettes.ts parity). Types are re-exported here for
// back-compat with existing `./skin` importers.

import type { TemplateModule } from '@/types/template';
import { assertSkinTokens } from './tokenContract';
import { getSurfaceForSection } from './sectionRules';
import { resolveWorkBlock } from './resolveWorkBlock';
import { makeWorkThemeInjector } from './ThemeInjector';
import { makeWorkSSRTokens } from './SSRTokens';
import type { WorkSkinDef } from './stylesheet';

// Re-export the plain skin type family + serializers/builder for back-compat with
// modules that import them from './skin' (the pre-STEP-0 location).
export {
  buildWorkStylesheet,
  serializeWorkPalettes,
  serializeWorkVariants,
  type WorkSkinDef,
  type WorkPalette,
  type WorkVariantDef,
  type WorkSkinSelections,
} from './stylesheet';

/**
 * Build the full `TemplateModule` surface for a work skin. `assertSkinTokens` runs
 * at construction so a bad skin fails LOUD at load (and in phase-7 conformance) —
 * never a silent partial render.
 */
export function makeWorkSkeletonModule(skin: WorkSkinDef): TemplateModule {
  assertSkinTokens(skin);

  const ThemeInjector = makeWorkThemeInjector(skin);
  const SSRTokens = makeWorkSSRTokens(skin);

  return {
    resolveBlock: (blockType, mode, layoutName) => resolveWorkBlock(blockType, mode, layoutName),
    ThemeInjector,
    SSRTokens,
    getSurfaceForSection: (sectionType: string) =>
      getSurfaceForSection(sectionType, skin.selections.surfaceBySection),
    defaultPaletteId: skin.defaultPaletteId,
    variants: skin.variants,
    defaultVariantId: skin.defaultVariantId,
    defaultKnobs: skin.defaultKnobs,
    paletteImageKeywords: skin.imageKeywords,
    knobs: skin.knobs,
  };
}
