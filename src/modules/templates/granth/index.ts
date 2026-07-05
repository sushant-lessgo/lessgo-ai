// src/modules/templates/granth/index.ts
// Granth template module barrel. Aggregates the template-scoped (visual) surface
// and exposes the lazy-loaded TemplateModule contract (resolveBlock / ThemeInjector
// / SSRTokens) plugged into the template registry. Writer vertical (Hindi-literary).

export {
  granthBaseTokens,
  serializeBaseTokens,
  serializeVariantOverrides,
  granthVariants,
  defaultGranthVariant,
  type GranthBaseTokens,
} from './tokens';

export {
  granthPaletteConfigs,
  pilotEnabledPalettes,
  defaultGranthPalette,
  serializePaletteOverrides,
  type PaletteConfig,
} from './palettes';

export {
  granthSectionSurfaces,
  surfaceToVar,
  getSurfaceForSection,
  type GranthSurface,
} from './sectionRules';

export { GranthThemeInjector } from './ThemeInjector';
export { GranthSSRTokens } from './components/GranthSSRTokens';

// TemplateModule contract surface (consumed via the dynamic registry).
export { GranthThemeInjector as ThemeInjector } from './ThemeInjector';
export { GranthSSRTokens as SSRTokens } from './components/GranthSSRTokens';

export {
  PALETTE_IMAGE_KEYWORDS,
  getGranthImageQuery,
} from './imageKeywords';

export { inferDefaultPalette } from './paletteSelection';

export { resolveGranthBlock } from './resolveGranthBlock';
// NOTE: useGranthBlock / GranthEditable / editPrimitives / LinkTargetPopover are
// client-only and consumed by blocks via relative imports — intentionally NOT
// re-exported here, so the barrel stays importable from server components
// (registry preload path / firewall).

// TemplateModule.resolveBlock(blockType, mode): blockType is the SECTION TYPE.
import { resolveGranthBlock as _resolveGranthBlock } from './resolveGranthBlock';
export function resolveBlock(blockType: string, mode: 'edit' | 'published') {
  return _resolveGranthBlock(blockType, mode);
}
