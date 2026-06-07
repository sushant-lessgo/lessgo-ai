// src/modules/templates/hearth/index.ts
// Hearth template module barrel. Phase 7.5b: aggregates the template-scoped
// (visual) surface. Phase 7.5c makes this the lazy-loaded TemplateModule
// (resolveBlock / ThemeInjector / SSRTokens) plugged into the template registry.

export {
  hearthBaseTokens,
  serializeBaseTokens,
  type HearthBaseTokens,
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

export {
  PALETTE_IMAGE_KEYWORDS,
  getHearthImageQuery,
} from './imageKeywords';

export { inferDefaultPalette } from './paletteSelection';

export { resolveServiceBlock } from './resolveServiceBlock';
export { useServiceBlock } from './hooks/useServiceBlock';
export { HearthEditable } from './components/HearthEditable';
