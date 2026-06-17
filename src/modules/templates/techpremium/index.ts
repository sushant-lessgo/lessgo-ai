// src/modules/templates/techpremium/index.ts
// TechPremium template module barrel — the lazy-loaded TemplateModule surface
// (resolveBlock / ThemeInjector / SSRTokens / getSurfaceForSection / defaults)
// plugged into the template registry. Mirrors meridian/index.ts.

export {
  techPremiumBaseTokens,
  serializeBaseTokens,
  type TechPremiumBaseTokens,
} from './tokens';

export {
  techPremiumPaletteConfigs,
  serializePaletteOverrides,
  defaultTechPremiumPalette,
  type TechPremiumPaletteConfig,
} from './palettes';

export { serializeVariantOverrides, techPremiumVariants } from './variants';

export {
  techPremiumSectionSurfaces,
  surfaceToVar,
  getSurfaceForSection,
  type TechPremiumSurface,
} from './sectionRules';

// TemplateModule contract surface (consumed via the dynamic registry).
export { TechPremiumThemeInjector as ThemeInjector } from './ThemeInjector';
export { TechPremiumSSRTokens as SSRTokens } from './components/TechPremiumSSRTokens';

export { PALETTE_IMAGE_KEYWORDS, getTechPremiumImageQuery } from './imageKeywords';

// Default variant id for the registry loader (canonical home: types/product).
export { defaultTechPremiumVariant } from '@/types/product';

// NOTE: ThemeInjector is client-only ('use client'); it is re-exported above for
// the TemplateModule contract, but the registry preloads this barrel from a server
// component. React tolerates a client component referenced from a server module as
// long as it isn't invoked there — matches the Meridian/Hearth pattern.

// TemplateModule.resolveBlock(blockType, mode): the renderer dispatches by SECTION
// TYPE, so `blockType` is the section type ('hero', 'features', …).
import { resolveTechPremiumBlock } from './resolveTechPremiumBlock';
export function resolveBlock(blockType: string, mode: 'edit' | 'published') {
  return resolveTechPremiumBlock(blockType, mode);
}
