// src/modules/templates/registry.ts
// Dynamic-import template registry (Phase 7.5c). Each templateId maps to a
// LOADER that import()s its module — so template code lands in its own chunk
// and NEVER in the product/main bundle. The firewall: nothing here is a static
// import of a template module; the only way in is the dynamic loader below.
//
// A module-scope cache lets sync render paths (componentRegistry.getComponent)
// read an already-preloaded module. Callers MUST preloadTemplate() before the
// first synchronous resolveBlock for a given templateId.

import type { TemplateModule, TemplateModuleLoader } from '@/types/template';
import type { TemplateId } from '@/types/service';

export const templateRegistry: Record<TemplateId, TemplateModuleLoader> = {
  hearth: async () => {
    const m = await import('@/modules/templates/hearth');
    return {
      resolveBlock: m.resolveBlock,
      ThemeInjector: m.ThemeInjector,
      SSRTokens: m.SSRTokens,
      getSurfaceForSection: m.getSurfaceForSection,
      defaultPaletteId: m.defaultHearthPalette,
      variants: m.hearthVariants,
      defaultVariantId: m.defaultHearthVariant,
      paletteImageKeywords: m.PALETTE_IMAGE_KEYWORDS,
    };
  },
  lex: async () => {
    const m = await import('@/modules/templates/lex');
    return {
      resolveBlock: m.resolveBlock,
      ThemeInjector: m.ThemeInjector,
      SSRTokens: m.SSRTokens,
      getSurfaceForSection: m.getSurfaceForSection,
      defaultPaletteId: m.defaultLexPalette,
      variants: m.lexVariants,
      defaultVariantId: m.defaultLexVariant,
      paletteImageKeywords: m.PALETTE_IMAGE_KEYWORDS,
    };
  },
  surge: async () => {
    const m = await import('@/modules/templates/surge');
    return {
      resolveBlock: m.resolveBlock,
      ThemeInjector: m.ThemeInjector,
      SSRTokens: m.SSRTokens,
      getSurfaceForSection: m.getSurfaceForSection,
      defaultPaletteId: m.defaultSurgePalette,
      variants: m.surgeVariants,
      defaultVariantId: m.defaultSurgeVariant,
      paletteImageKeywords: m.PALETTE_IMAGE_KEYWORDS,
    };
  },
  meridian: async () => {
    const m = await import('@/modules/templates/meridian');
    return {
      resolveBlock: m.resolveBlock,
      ThemeInjector: m.ThemeInjector,
      SSRTokens: m.SSRTokens,
      getSurfaceForSection: m.getSurfaceForSection,
      defaultPaletteId: m.defaultMeridianPalette,
      variants: m.meridianVariants,
      defaultVariantId: m.defaultMeridianVariant,
      paletteImageKeywords: m.PALETTE_IMAGE_KEYWORDS,
    };
  },
  techpremium: async () => {
    const m = await import('@/modules/templates/techpremium');
    return {
      resolveBlock: m.resolveBlock,
      ThemeInjector: m.ThemeInjector,
      SSRTokens: m.SSRTokens,
      getSurfaceForSection: m.getSurfaceForSection,
      defaultPaletteId: m.defaultTechPremiumPalette,
      variants: m.techPremiumVariants,
      defaultVariantId: m.defaultTechPremiumVariant,
      paletteImageKeywords: m.PALETTE_IMAGE_KEYWORDS,
    };
  },
  // Bespoke §13 — registered + renderable, but absent from the onboarding picker.
  lumen: async () => {
    const m = await import('@/modules/templates/lumen');
    return {
      resolveBlock: m.resolveBlock,
      ThemeInjector: m.ThemeInjector,
      SSRTokens: m.SSRTokens,
      getSurfaceForSection: m.getSurfaceForSection,
      defaultPaletteId: m.defaultLumenPalette,
      variants: m.lumenVariants,
      defaultVariantId: m.defaultLumenVariant,
      paletteImageKeywords: m.PALETTE_IMAGE_KEYWORDS,
    };
  },
  // GA product template (manufacturing/trade lead-gen) — selected via the
  // onboarding ?template=vestria param (product has no picker yet).
  vestria: async () => {
    const m = await import('@/modules/templates/vestria');
    return {
      resolveBlock: m.resolveBlock,
      ThemeInjector: m.ThemeInjector,
      SSRTokens: m.SSRTokens,
      getSurfaceForSection: m.getSurfaceForSection,
      defaultPaletteId: m.defaultVestriaPalette,
      variants: m.vestriaVariantDefs,
      defaultVariantId: m.defaultVestriaVariant,
      paletteImageKeywords: m.PALETTE_IMAGE_KEYWORDS,
    };
  },
  // Bespoke §13 (Writer vertical) — registered + renderable, but absent from the
  // onboarding picker. Writer projects are seeded white-glove.
  granth: async () => {
    const m = await import('@/modules/templates/granth');
    return {
      resolveBlock: m.resolveBlock,
      ThemeInjector: m.ThemeInjector,
      SSRTokens: m.SSRTokens,
      getSurfaceForSection: m.getSurfaceForSection,
      defaultPaletteId: m.defaultGranthPalette,
      variants: m.granthVariants,
      defaultVariantId: m.defaultGranthVariant,
      paletteImageKeywords: m.PALETTE_IMAGE_KEYWORDS,
    };
  },
};

const cache: Partial<Record<TemplateId, TemplateModule>> = {};

/** Load (or return cached) template module. Memoized per templateId. */
export async function preloadTemplate(id: TemplateId): Promise<TemplateModule> {
  if (!cache[id]) {
    const loader = templateRegistry[id];
    if (!loader) throw new Error(`Unknown templateId: ${id}`);
    cache[id] = await loader();
  }
  return cache[id]!;
}

/** Synchronous read of an already-preloaded module (null if not yet loaded). */
export function getLoadedTemplate(id: TemplateId): TemplateModule | undefined {
  return cache[id];
}
