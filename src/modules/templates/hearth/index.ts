// src/modules/templates/hearth/index.ts
// Hearth template module barrel. Phase 7.5b: aggregates the template-scoped
// (visual) surface. Phase 7.5c makes this the lazy-loaded TemplateModule
// (resolveBlock / ThemeInjector / SSRTokens) plugged into the template registry.

export {
  hearthBaseTokens,
  serializeBaseTokens,
  serializeVariantOverrides,
  hearthVariants,
  defaultHearthVariant,
  type HearthBaseTokens,
} from './tokens';

// Knob surface (template-factory phase 8) — hearth is the first knob-tokenized
// template. `hearthKnobs` is the TemplateModule.knobs declaration; the token map
// + shared stylesheet builder are consumed by the two renderers.
export {
  hearthKnobs,
  hearthKnobTokenMap,
  serializeHearthKnobOverrides,
  buildHearthStylesheet,
} from './tokens';

export {
  hearthPaletteConfigs,
  pilotEnabledPalettes,
  defaultHearthPalette,
  serializePaletteOverrides,
  type PaletteConfig,
} from './palettes';

export {
  hearthSectionSurfaces,
  surfaceToVar,
  getSurfaceForSection,
  type HearthSurface,
} from './sectionRules';

export { HearthThemeInjector } from './ThemeInjector';
export { HearthSSRTokens } from './components/HearthSSRTokens';

// TemplateModule contract surface (consumed via the dynamic registry).
export { HearthThemeInjector as ThemeInjector } from './ThemeInjector';
export { HearthSSRTokens as SSRTokens } from './components/HearthSSRTokens';

export {
  PALETTE_IMAGE_KEYWORDS,
  getHearthImageQuery,
} from './imageKeywords';

export { inferDefaultPalette } from './paletteSelection';

export { resolveServiceBlock } from './resolveServiceBlock';
// NOTE: useServiceBlock / HearthEditable are client-only and consumed by blocks
// via relative imports — intentionally NOT re-exported here, so the barrel stays
// importable from server components (registry preload path) without dragging a
// bare client module across the RSC boundary.

// TemplateModule.resolveBlock(blockType, mode): blockType is the SECTION TYPE
// (A1 — section-type dispatch). Forwards straight to the resolver.
import { resolveServiceBlock as _resolveServiceBlock } from './resolveServiceBlock';
export function resolveBlock(blockType: string, mode: 'edit' | 'published', layoutName?: string) {
  return _resolveServiceBlock(blockType, mode, layoutName);
}
