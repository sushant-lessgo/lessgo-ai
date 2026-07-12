// src/modules/templates/atelier/index.ts
// Atelier template module barrel. Server-safe surface (TemplateModule contract)
// plugged into the dynamic registry. On-demand work-engine template
// (visual-portfolio; anchor customer Kundius Photography). Service audience.
//
// FIREWALL: NEVER re-export the client-only helpers (useAtelierBlock /
// AtelierEditable / editPrimitives) — blocks import those via relative paths, so
// this barrel stays importable from server components (registry preload path).

export {
  atelierBaseTokens,
  serializeBaseTokens,
  serializeVariantOverrides,
  atelierVariantDefs,
  defaultAtelierVariant,
  type AtelierBaseTokens,
} from './tokens';

// Knob surface (template-factory standard axes). `atelierKnobs` is the
// TemplateModule.knobs declaration; the token map + shared stylesheet builder are
// consumed by the two renderers. The registry loader (registry.ts) surfaces
// `knobs: m.atelierKnobs` on the loaded module (phase 11) so editor knob-switching
// reads `getLoadedTemplate('atelier').knobs`. (The render path itself threads
// `knobs` directly from `themeValues.knobs` into the injector props — it does NOT
// read `mod.knobs`.)
export {
  atelierKnobs,
  atelierKnobTokenMap,
  serializeAtelierKnobOverrides,
  buildAtelierStylesheet,
  defaultAtelierKnobs,
} from './tokens';

export {
  atelierPaletteConfigs,
  pilotEnabledPalettes,
  defaultAtelierPalette,
  serializePaletteOverrides,
  type PaletteConfig,
} from './palettes';

export {
  atelierSectionSurfaces,
  surfaceToVar,
  getSurfaceForSection,
  type AtelierSurface,
} from './sectionRules';

export { AtelierThemeInjector } from './ThemeInjector';
export { AtelierSSRTokens } from './components/AtelierSSRTokens';

// TemplateModule contract surface (consumed via the dynamic registry).
export { AtelierThemeInjector as ThemeInjector } from './ThemeInjector';
export { AtelierSSRTokens as SSRTokens } from './components/AtelierSSRTokens';

export {
  PALETTE_IMAGE_KEYWORDS,
  getAtelierImageQuery,
} from './imageKeywords';

export { inferDefaultPalette } from './paletteSelection';

export { resolveAtelierBlock } from './resolveAtelierBlock';

// TemplateModule.resolveBlock(blockType, mode): blockType is the SECTION TYPE.
import { resolveAtelierBlock as _resolveAtelierBlock } from './resolveAtelierBlock';
export function resolveBlock(blockType: string, mode: 'edit' | 'published', layoutName?: string) {
  return _resolveAtelierBlock(blockType, mode, layoutName);
}
