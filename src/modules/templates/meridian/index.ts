// src/modules/templates/meridian/index.ts
// Meridian template module barrel — the lazy-loaded TemplateModule surface
// (resolveBlock / ThemeInjector / SSRTokens / getSurfaceForSection / defaults)
// plugged into the template registry. Mirrors hearth/index.ts.

export {
  meridianBaseTokens,
  serializeBaseTokens,
  type MeridianBaseTokens,
} from './tokens';

export {
  meridianPaletteConfigs,
  meridianLightPaletteConfigs,
  serializePaletteOverrides,
  defaultMeridianPalette,
  type MeridianPaletteConfig,
} from './palettes';

export { serializeVariantOverrides, meridianVariants } from './variants';

export {
  meridianSectionSurfaces,
  surfaceToVar,
  getSurfaceForSection,
  type MeridianSurface,
} from './sectionRules';

// TemplateModule contract surface (consumed via the dynamic registry).
export { MeridianThemeInjector as ThemeInjector } from './ThemeInjector';
export { MeridianSSRTokens as SSRTokens } from './components/MeridianSSRTokens';

export { PALETTE_IMAGE_KEYWORDS, getMeridianImageQuery } from './imageKeywords';

// Default variant id for the registry loader (canonical home: types/product).
export { defaultMeridianVariant } from '@/types/product';

// NOTE: ThemeInjector is client-only ('use client'); it is re-exported above for
// the TemplateModule contract, but the registry preloads this barrel from a
// server component. React tolerates a client component referenced from a server
// module as long as it isn't invoked there — matches the Hearth pattern.

// TemplateModule.resolveBlock(blockType, mode): A1 dispatches by SECTION TYPE,
// so `blockType` is the section type ('hero', 'features', …). Meridian's resolver
// is now section-type-keyed, so pass it straight through.
import { resolveMeridianBlock } from './resolveMeridianBlock';
export function resolveBlock(blockType: string, mode: 'edit' | 'published', layoutName?: string) {
  return resolveMeridianBlock(blockType, mode, layoutName);
}
