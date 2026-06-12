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
      surfaceAttr: 'data-hearth-surface',
      defaultPaletteId: m.defaultHearthPalette,
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
      surfaceAttr: 'data-meridian-surface',
      defaultPaletteId: m.defaultMeridianPalette,
      defaultVariantId: m.defaultMeridianVariant,
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
