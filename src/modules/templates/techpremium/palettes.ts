// src/modules/templates/techpremium/palettes.ts
// TechPremium palette configs — the full switchable surface: neutrals, hairlines,
// status, teal, the two brand "hue knobs" (forest + signal-lime), and the two
// on-dark ink tokens.
//
// TechPremium ships TWO palettes:
//   - forest: the original warm-paper control-room system. Value-identical to the
//     pre-harbor `:root` base tokens — it is the revert lever, so do not "tidy"
//     these numbers.
//   - harbor: navy bands (hue 252) + brand-green signal + cool hue-240 neutrals,
//     verbatim from the designer's `<style id="brand-palette">` block.
// Only `forest` is exposed to the picker (see pilotEnabledPalettes below);
// `harbor` is reached via the template default.
//
// `--on-dark` / `--on-dark-2` are OURS (no designer entry): the pale ink that sits
// ON the dark bands. They exist to kill the hue-140 copy-paste drift across the
// block literals — every drifted site becomes
// `color-mix(in oklch, var(--on-dark) N%, transparent)` at its original alpha.
//
// Selectors are authored BARE (`[data-palette="x"]`) so they apply whether the
// attribute lands on <html> (client ThemeInjector) or a wrapping <div> (server
// SSRTokens).

import {
  techPremiumPalettes,
  techPremiumPickerPalettes,
  type TechPremiumPalette,
} from '@/types/product';

export interface TechPremiumPaletteConfig {
  /** Light surfaces. */
  paper: string;
  paper2: string;
  paper3: string;
  /** Text. */
  ink: string;
  ink2: string;
  ink3: string;
  /** Hairlines (lineDk = on the dark bands). */
  line: string;
  line2: string;
  lineDk: string;
  /** Brand fill — nav CTA, dark sections, button fills, headings highlight. */
  forest: string;
  forestD: string;
  forest2: string;
  /** Signal accent — data accent, primary action on dark, status, hero highlight. */
  lime: string;
  limeD: string;
  limeDim: string;
  /** Secondary accent. */
  teal: string;
  tealDim: string;
  /** Status-ok. */
  ok: string;
  okBg: string;
  /** Pale ink ON the dark bands (ours, not the designer's — see header note). */
  onDark: string;
  onDark2: string;
}

/** Accent + neutral configs keyed by palette ID. */
export const techPremiumPaletteConfigs: Record<TechPremiumPalette, TechPremiumPaletteConfig> = {
  // Verbatim copy of the pre-harbor techPremiumBaseTokens values. Keep in sync
  // with the `:root` fallbacks in ./tokens.ts (palettes.test.ts asserts it).
  forest: {
    paper:   'oklch(0.978 0.005 95)',
    paper2:  'oklch(0.958 0.007 95)',
    paper3:  'oklch(0.935 0.010 92)',
    ink:     'oklch(0.265 0.018 160)',
    ink2:    'oklch(0.445 0.018 162)',
    ink3:    'oklch(0.600 0.016 162)',
    line:    'oklch(0.885 0.010 120)',
    line2:   'oklch(0.815 0.014 130)',
    lineDk:  'oklch(0.470 0.045 158)',
    forest:  'oklch(0.325 0.045 158)',
    forestD: 'oklch(0.255 0.038 159)',
    forest2: 'oklch(0.405 0.050 157)',
    lime:    'oklch(0.855 0.185 128)',
    limeD:   'oklch(0.660 0.150 132)',
    limeDim: 'oklch(0.855 0.185 128 / 0.16)',
    teal:    'oklch(0.700 0.095 192)',
    tealDim: 'oklch(0.700 0.095 192 / 0.14)',
    ok:      'oklch(0.660 0.150 150)',
    okBg:    'oklch(0.660 0.150 150 / 0.14)',
    // The two dominant hue-140 values in today's block literals, verbatim, so
    // forest's appearance is preserved at the sites that already used them.
    onDark:  'oklch(0.840 0.022 140)',
    onDark2: 'oklch(0.780 0.030 140)',
  },
  // Designer's `<style id="brand-palette">` block, verbatim. `--ok` sitting close
  // to `--lime` is as-delivered and deliberately NOT "fixed" here.
  harbor: {
    paper:   'oklch(0.985 0.0015 240)',
    paper2:  'oklch(0.963 0.003 240)',
    paper3:  'oklch(0.938 0.005 240)',
    ink:     'oklch(0.305 0.010 230)',
    ink2:    'oklch(0.470 0.008 230)',
    ink3:    'oklch(0.645 0.004 220)',
    line:    'oklch(0.900 0.004 240)',
    line2:   'oklch(0.820 0.006 240)',
    lineDk:  'oklch(0.470 0.045 250)',
    forest:  'oklch(0.320 0.048 252)',
    forestD: 'oklch(0.258 0.042 253)',
    forest2: 'oklch(0.455 0.085 156)',
    lime:    'oklch(0.720 0.130 157)',
    limeD:   'oklch(0.520 0.105 155)',
    limeDim: 'oklch(0.720 0.130 157 / 0.16)',
    teal:    'oklch(0.620 0.075 244)',
    tealDim: 'oklch(0.620 0.075 244 / 0.14)',
    ok:      'oklch(0.660 0.120 152)',
    okBg:    'oklch(0.660 0.120 152 / 0.14)',
    // Ours — designer's cool-neutral family, hue 240 (NOT the legacy hue 140).
    onDark:  'oklch(0.840 0.020 240)',
    onDark2: 'oklch(0.780 0.028 240)',
  },
};

/**
 * Palettes the in-editor picker offers — `forest` ONLY. `harbor` is deliberately
 * picker-hidden (it ships via the template default) so a stray swatch click can
 * never write `Project.paletteId`. Canonical home: types/product.
 */
export const pilotEnabledPalettes: readonly TechPremiumPalette[] = techPremiumPickerPalettes;

/** Default palette re-exported for convenience (canonical home: types/product). */
export { defaultTechPremiumPalette } from '@/types/product';

function paletteBlock(selector: string, c: TechPremiumPaletteConfig): string {
  return `${selector}{--paper:${c.paper};--paper-2:${c.paper2};--paper-3:${c.paper3};--ink:${c.ink};--ink-2:${c.ink2};--ink-3:${c.ink3};--line:${c.line};--line-2:${c.line2};--line-dk:${c.lineDk};--forest:${c.forest};--forest-d:${c.forestD};--forest-2:${c.forest2};--lime:${c.lime};--lime-d:${c.limeD};--lime-dim:${c.limeDim};--teal:${c.teal};--teal-dim:${c.tealDim};--ok:${c.ok};--ok-bg:${c.okBg};--on-dark:${c.onDark};--on-dark-2:${c.onDark2};}`;
}

/** Serialize per-palette overrides as bare-attribute selector blocks. */
export function serializePaletteOverrides(
  base: Record<TechPremiumPalette, TechPremiumPaletteConfig> = techPremiumPaletteConfigs,
): string {
  return techPremiumPalettes
    .map((id) => paletteBlock(`[data-palette="${id}"]`, base[id]))
    .join('\n');
}
