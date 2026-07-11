// src/modules/templates/lex/index.ts
// Lex template module barrel (template #2, trust/professional). Lazy-loaded via
// the template registry — keep this importable from server components (no bare
// client modules re-exported across the RSC boundary).

export {
  lexBaseTokens,
  serializeBaseTokens,
  serializeVariantOverrides,
  lexVariants,
  defaultLexVariant,
  type LexBaseTokens,
} from './tokens';

export {
  lexPaletteConfigs,
  pilotEnabledPalettes,
  defaultLexPalette,
  serializePaletteOverrides,
  type LexPaletteConfig,
} from './palettes';

export {
  lexSectionSurfaces,
  surfaceToVar,
  getSurfaceForSection,
  type LexSurface,
} from './sectionRules';

export { LexThemeInjector } from './ThemeInjector';
export { LexSSRTokens } from './components/LexSSRTokens';

// TemplateModule contract surface (consumed via the dynamic registry).
export { LexThemeInjector as ThemeInjector } from './ThemeInjector';
export { LexSSRTokens as SSRTokens } from './components/LexSSRTokens';

export {
  PALETTE_IMAGE_KEYWORDS,
  getLexImageQuery,
} from './imageKeywords';

export { inferDefaultPalette } from './paletteSelection';

export { resolveServiceBlock } from './resolveServiceBlock';
// NOTE: useLexBlock / LexEditable are client-only and consumed by blocks via
// relative imports — intentionally NOT re-exported here.

// TemplateModule.resolveBlock(blockType, mode): blockType is the SECTION TYPE
// (A1 — section-type dispatch). Forwards straight to the resolver.
import { resolveServiceBlock as _resolveServiceBlock } from './resolveServiceBlock';
export function resolveBlock(blockType: string, mode: 'edit' | 'published', layoutName?: string) {
  return _resolveServiceBlock(blockType, mode, layoutName);
}
