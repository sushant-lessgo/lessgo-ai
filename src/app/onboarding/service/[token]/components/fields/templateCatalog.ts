// Onboarding-local template picker catalog (Phase 11b).
// Aggregates the lightweight, blocks-free picker metadata (labels, palette
// swatch colors, variants, default-palette inference) for every live service
// template. Onboarding is NOT in the firewall-gated dirs, so static template
// imports here are allowed (unlike the editor, which reads via getLoadedTemplate).
// Imports target palettes.ts / tokens.ts / paletteSelection.ts directly — NOT the
// index barrels — so the React block chunks are never pulled in.

import type { TemplateId } from '@/types/service';
import { templateLabels, templateBlurbs, palettesForTemplate } from '@/types/service';

import {
  hearthPaletteConfigs,
  pilotEnabledPalettes as hearthEnabled,
} from '@/modules/templates/hearth/palettes';
import { hearthVariants } from '@/modules/templates/hearth/tokens';
import { inferDefaultPalette as inferHearthPalette } from '@/modules/templates/hearth/paletteSelection';

import {
  lexPaletteConfigs,
  pilotEnabledPalettes as lexEnabled,
} from '@/modules/templates/lex/palettes';
import { lexVariants } from '@/modules/templates/lex/tokens';
import { inferDefaultPalette as inferLexPalette } from '@/modules/templates/lex/paletteSelection';

import {
  surgePaletteConfigs,
  pilotEnabledPalettes as surgeEnabled,
} from '@/modules/templates/surge/palettes';
import { surgeVariants } from '@/modules/templates/surge/tokens';
import { inferDefaultPalette as inferSurgePalette } from '@/modules/templates/surge/paletteSelection';

export interface PaletteSwatchColors {
  accent: string;
  accentDeep: string;
  wash?: string;
}

export interface TemplateCatalogEntry {
  id: TemplateId;
  label: string;
  blurb: string;
  /** All palette ids for the template (display order). */
  palettes: readonly string[];
  /** Currently selectable palette ids. */
  enabled: readonly string[];
  /** Swatch colors per palette id. */
  swatch: (paletteId: string) => PaletteSwatchColors;
  variants: { id: string; label: string; blurb?: string }[];
  /** Deterministic default palette for an understanding payload. */
  inferDefaultPalette: (understanding: any) => string;
}

// Service-only: Meridian is a product template (not offered in service
// onboarding), so the catalog is partial over TemplateId — only service
// templates have an entry. Consumers fall back to hearth for any non-service id.
export const TEMPLATE_CATALOG: Partial<Record<TemplateId, TemplateCatalogEntry>> = {
  hearth: {
    id: 'hearth',
    label: templateLabels.hearth,
    blurb: templateBlurbs.hearth,
    palettes: palettesForTemplate('hearth'),
    enabled: hearthEnabled,
    swatch: (p) => {
      const c = (hearthPaletteConfigs as Record<string, any>)[p];
      return { accent: c?.accent, accentDeep: c?.accentDeep, wash: c?.accentWash };
    },
    variants: hearthVariants,
    inferDefaultPalette: (u) => inferHearthPalette(u),
  },
  lex: {
    id: 'lex',
    label: templateLabels.lex,
    blurb: templateBlurbs.lex,
    palettes: palettesForTemplate('lex'),
    enabled: lexEnabled,
    swatch: (p) => {
      const c = (lexPaletteConfigs as Record<string, any>)[p];
      return { accent: c?.accent, accentDeep: c?.accentDeep, wash: c?.trustSoft };
    },
    variants: lexVariants,
    inferDefaultPalette: (u) => inferLexPalette(u),
  },
  surge: {
    id: 'surge',
    label: templateLabels.surge,
    blurb: templateBlurbs.surge,
    palettes: palettesForTemplate('surge'),
    enabled: surgeEnabled,
    swatch: (p) => {
      const c = (surgePaletteConfigs as Record<string, any>)[p];
      return { accent: c?.accent, accentDeep: c?.accentDeep, wash: c?.accentSoft };
    },
    variants: surgeVariants,
    inferDefaultPalette: (u) => inferSurgePalette(u),
  },
};

export const TEMPLATE_ORDER: TemplateId[] = ['hearth', 'lex', 'surge'];
