// src/modules/templates/lumen/index.ts
// Lumen template module barrel. Aggregates the template-scoped (visual) surface
// and exposes the lazy-loaded TemplateModule contract (resolveBlock / ThemeInjector
// / SSRTokens) plugged into the template registry.

export {
  lumenBaseTokens,
  serializeBaseTokens,
  serializeVariantOverrides,
  lumenVariants,
  defaultLumenVariant,
  type LumenBaseTokens,
} from './tokens';

export {
  lumenPaletteConfigs,
  pilotEnabledPalettes,
  defaultLumenPalette,
  serializePaletteOverrides,
  type PaletteConfig,
} from './palettes';

export {
  lumenSectionSurfaces,
  surfaceToVar,
  getSurfaceForSection,
  type LumenSurface,
} from './sectionRules';

export { LumenThemeInjector } from './ThemeInjector';
export { LumenSSRTokens } from './components/LumenSSRTokens';

// TemplateModule contract surface (consumed via the dynamic registry).
export { LumenThemeInjector as ThemeInjector } from './ThemeInjector';
export { LumenSSRTokens as SSRTokens } from './components/LumenSSRTokens';

export {
  PALETTE_IMAGE_KEYWORDS,
  getLumenImageQuery,
} from './imageKeywords';

export { inferDefaultPalette } from './paletteSelection';

export { resolveLumenBlock } from './resolveLumenBlock';
// NOTE: useLumenBlock / LumenEditable / editLang are client-only and consumed by
// blocks via relative imports — intentionally NOT re-exported here, so the barrel
// stays importable from server components (registry preload path).

// TemplateModule.resolveBlock(blockType, mode): blockType is the SECTION TYPE.
import { resolveLumenBlock as _resolveLumenBlock } from './resolveLumenBlock';
export function resolveBlock(blockType: string, mode: 'edit' | 'published') {
  return _resolveLumenBlock(blockType, mode);
}
