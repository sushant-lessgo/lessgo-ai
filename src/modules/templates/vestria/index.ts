// src/modules/templates/vestria/index.ts
// Vestria template module barrel. Aggregates the template-scoped (visual) surface
// and exposes the lazy-loaded TemplateModule contract (resolveBlock / ThemeInjector
// / SSRTokens) plugged into the template registry. GA product template —
// B2B manufacturing / trade lead-gen.

export {
  vestriaBaseTokens,
  serializeBaseTokens,
  serializeVariantOverrides,
  vestriaVariantDefs,
  defaultVestriaVariant,
  type VestriaBaseTokens,
} from './tokens';

export {
  vestriaPaletteConfigs,
  pilotEnabledPalettes,
  defaultVestriaPalette,
  serializePaletteOverrides,
  type PaletteConfig,
} from './palettes';

export {
  vestriaSectionSurfaces,
  surfaceToVar,
  getSurfaceForSection,
  type VestriaSurface,
} from './sectionRules';

export { VestriaThemeInjector } from './ThemeInjector';
export { VestriaSSRTokens } from './components/VestriaSSRTokens';

// TemplateModule contract surface (consumed via the dynamic registry).
export { VestriaThemeInjector as ThemeInjector } from './ThemeInjector';
export { VestriaSSRTokens as SSRTokens } from './components/VestriaSSRTokens';

export {
  PALETTE_IMAGE_KEYWORDS,
  getVestriaImageQuery,
} from './imageKeywords';

export { inferDefaultPalette } from './paletteSelection';

export { resolveVestriaBlock } from './resolveVestriaBlock';
// NOTE: useVestriaBlock / VestriaEditable / editPrimitives / LinkTargetPopover are
// client-only and consumed by blocks via relative imports — intentionally NOT
// re-exported here, so the barrel stays importable from server components
// (registry preload path / firewall).

// TemplateModule.resolveBlock(blockType, mode): blockType is the SECTION TYPE.
import { resolveVestriaBlock as _resolveVestriaBlock } from './resolveVestriaBlock';
export function resolveBlock(blockType: string, mode: 'edit' | 'published') {
  return _resolveVestriaBlock(blockType, mode);
}
