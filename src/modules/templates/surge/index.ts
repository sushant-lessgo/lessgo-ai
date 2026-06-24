// src/modules/templates/surge/index.ts
// Surge template module barrel. Aggregates the template-scoped (visual) surface
// and exposes the lazy-loaded TemplateModule contract (resolveBlock / ThemeInjector
// / SSRTokens) plugged into the template registry.

export {
  surgeBaseTokens,
  serializeBaseTokens,
  serializeVariantOverrides,
  surgeVariants,
  defaultSurgeVariant,
  type SurgeBaseTokens,
} from './tokens';

export {
  surgePaletteConfigs,
  pilotEnabledPalettes,
  defaultSurgePalette,
  serializePaletteOverrides,
  type PaletteConfig,
} from './palettes';

export {
  surgeSectionSurfaces,
  surfaceToVar,
  getSurfaceForSection,
  type SurgeSurface,
} from './sectionRules';

export { SurgeThemeInjector } from './ThemeInjector';
export { SurgeSSRTokens } from './components/SurgeSSRTokens';

// TemplateModule contract surface (consumed via the dynamic registry).
export { SurgeThemeInjector as ThemeInjector } from './ThemeInjector';
export { SurgeSSRTokens as SSRTokens } from './components/SurgeSSRTokens';

export {
  PALETTE_IMAGE_KEYWORDS,
  getSurgeImageQuery,
} from './imageKeywords';

export { inferDefaultPalette } from './paletteSelection';

export { resolveServiceBlock } from './resolveServiceBlock';
// NOTE: useServiceBlock / SurgeEditable are client-only and consumed by blocks
// via relative imports — intentionally NOT re-exported here, so the barrel stays
// importable from server components (registry preload path).

// TemplateModule.resolveBlock(blockType, mode): blockType is the SECTION TYPE.
import { resolveServiceBlock as _resolveServiceBlock } from './resolveServiceBlock';
export function resolveBlock(blockType: string, mode: 'edit' | 'published') {
  return _resolveServiceBlock(blockType, mode);
}
