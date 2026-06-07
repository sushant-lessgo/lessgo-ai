// src/modules/service/design/index.ts
// Barrel for Hearth design module.

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

export { HearthThemeInjector } from './HearthThemeInjector';

export {
  SERVICE_IMAGE_KEYWORDS,
  PALETTE_IMAGE_KEYWORDS,
  getServiceImageQuery,
} from './imageKeywords';

export { inferDefaultPalette } from './paletteSelection';
