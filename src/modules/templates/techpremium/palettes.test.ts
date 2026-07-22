// TechPremium palette guard.
//
// WHY THIS EXISTS: `harbor` widened the palette record from 6 accent vars to the
// full neutral/status/accent/on-dark surface, relocating values out of
// tokens.ts's `:root` and into the per-palette blocks. `forest` is the REVERT
// LEVER for that change, so its *computed* token output must stay byte-identical
// to what the pre-harbor code emitted.
//
// EXPECTED_FOREST_CASCADE below was captured from UNTOUCHED code (dump of
// serializeBaseTokens() + serializePaletteOverrides() before any edit in this
// phase). Verify it against `git show HEAD:.../tokens.ts` + `.../palettes.ts` at
// review time — never "re-capture" it from the working tree to make a red test
// green; a diff here means forest's rendering changed.
//
// It is a VALUE MAP, not a raw-string snapshot, because values legitimately move
// between the two serializers and new vars are added. Only the combined computed
// cascade (`:root` overlaid by `[data-palette="forest"]`) must be stable.

import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { serializeBaseTokens, techPremiumBaseTokens } from './tokens';
import { serializePaletteOverrides, techPremiumPaletteConfigs } from './palettes';
import { defaultTechPremiumPalette } from '@/types/product';
import { palettesForTemplate } from '@/types/service';
import { templateRegistry } from '@/modules/templates/registry';

// ---------------------------------------------------------------------------
// Baseline — frozen literal, captured from pre-change code. DO NOT REGENERATE.
// ---------------------------------------------------------------------------
const EXPECTED_FOREST_CASCADE: Record<string, string> = {
  '--paper': 'oklch(0.978 0.005 95)',
  '--paper-2': 'oklch(0.958 0.007 95)',
  '--paper-3': 'oklch(0.935 0.010 92)',
  '--ink': 'oklch(0.265 0.018 160)',
  '--ink-2': 'oklch(0.445 0.018 162)',
  '--ink-3': 'oklch(0.600 0.016 162)',
  '--line': 'oklch(0.885 0.010 120)',
  '--line-2': 'oklch(0.815 0.014 130)',
  '--line-dk': 'oklch(0.470 0.045 158)',
  '--ok': 'oklch(0.660 0.150 150)',
  '--ok-bg': 'oklch(0.660 0.150 150 / 0.14)',
  '--warn': 'oklch(0.730 0.150 75)',
  '--warn-bg': 'oklch(0.730 0.150 75 / 0.14)',
  '--wa': 'oklch(0.62 0.16 150)',
  '--font-display': '"Inter Tight", system-ui, -apple-system, sans-serif',
  '--font-body': '"Inter", system-ui, -apple-system, sans-serif',
  '--font-mono': '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  '--pad-y': 'clamp(72px, 8.5vw, 120px)',
  '--pad-x': 'clamp(20px, 5vw, 64px)',
  '--max-w': '1200px',
  '--r': '4px',
  '--r-lg': '8px',
  '--forest': 'oklch(0.325 0.045 158)',
  '--forest-d': 'oklch(0.255 0.038 159)',
  '--forest-2': 'oklch(0.405 0.050 157)',
  '--lime': 'oklch(0.855 0.185 128)',
  '--lime-d': 'oklch(0.660 0.150 132)',
  '--lime-dim': 'oklch(0.855 0.185 128 / 0.16)',
  '--teal': 'oklch(0.700 0.095 192)',
  '--teal-dim': 'oklch(0.700 0.095 192 / 0.14)',
  '--blog-ink': 'var(--ink)',
  '--blog-ink-2': 'var(--ink-2)',
  '--blog-line': 'var(--line)',
  '--blog-accent': 'var(--forest)',
  '--blog-accent-on': 'var(--paper)',
};

// ---------------------------------------------------------------------------
// Tiny CSS parser. Rules that matter:
//  - split each declaration on the FIRST colon only (font stacks carry colons)
//  - `:root` is emitted TWICE (tokens.ts re-opens it for the --blog-* contract),
//    so duplicate selectors must MERGE last-wins, not replace.
// ---------------------------------------------------------------------------
function parseCss(css: string): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {};
  const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = ruleRe.exec(css)) !== null) {
    const selector = m[1].trim();
    const decls: Record<string, string> = {};
    for (const raw of m[2].split(';')) {
      const decl = raw.trim();
      if (!decl) continue;
      const i = decl.indexOf(':'); // FIRST colon only
      if (i < 0) continue;
      const prop = decl.slice(0, i).trim();
      const value = decl.slice(i + 1).trim();
      if (!prop.startsWith('--')) continue;
      decls[prop] = value;
    }
    out[selector] = { ...(out[selector] || {}), ...decls }; // merge, last-wins
  }
  return out;
}

const baseCss = serializeBaseTokens();
const paletteCss = serializePaletteOverrides();
const parsedBase = parseCss(baseCss);
const parsedPalette = parseCss(paletteCss);

function cascadeFor(paletteId: string): Record<string, string> {
  return { ...parsedBase[':root'], ...parsedPalette[`[data-palette="${paletteId}"]`] };
}

describe('techpremium palettes — forest revert-lever guard', () => {
  // 1 — forest's computed cascade is byte-identical to the pre-harbor output.
  it('forest effective cascade is byte-identical to the frozen baseline', () => {
    const forest = cascadeFor('forest');
    for (const [name, value] of Object.entries(EXPECTED_FOREST_CASCADE)) {
      expect(`${name}=${forest[name]}`).toBe(`${name}=${value}`);
    }
    // sanity: the parser actually found the vars (an empty cascade must not pass)
    expect(Object.keys(forest).length).toBeGreaterThanOrEqual(
      Object.keys(EXPECTED_FOREST_CASCADE).length,
    );
  });

  // 2 — the REAL picker source, not the (importer-less) pilotEnabledPalettes.
  // Both palettes are offered: `Project.paletteId='harbor'` is written on the live
  // row at the prod cutover, and a picker missing the ACTIVE palette renders an
  // all-unselected grid whose only click reverts the customer. See the
  // `techPremiumPickerPalettes` doc comment in src/types/product.ts.
  it('the theme popover offers both palettes, active one included', () => {
    expect([...palettesForTemplate('techpremium')]).toEqual(['forest', 'harbor']);
    expect([...palettesForTemplate('techpremium')]).toContain(defaultTechPremiumPalette);
  });

  // 3 — harbor exists and is the default.
  it('harbor is the default palette and emits a real block', () => {
    expect(defaultTechPremiumPalette).toBe('harbor');
    expect(paletteCss).toContain('[data-palette="harbor"]{');

    const harbor = cascadeFor('harbor');
    expect(harbor['--forest']).toBe('oklch(0.320 0.048 252)');
    expect(harbor['--paper']).toBe('oklch(0.985 0.0015 240)');
    expect(harbor['--lime']).toBe('oklch(0.720 0.130 157)');
    expect(harbor['--on-dark']).toBe('oklch(0.840 0.020 240)');
    expect(harbor['--on-dark-2']).toBe('oklch(0.780 0.028 240)');
  });

  // 4 — the override works by EMISSION ORDER, not specificity: `:root` and
  // `[data-palette="x"]` are both (0,1,0). Flip the order in either injector and
  // every palette silently stops applying.
  it('both injectors emit base tokens BEFORE palette overrides', () => {
    const here = path.resolve(__dirname);
    const sources = [
      path.join(here, 'ThemeInjector.tsx'),
      path.join(here, 'components', 'TechPremiumSSRTokens.tsx'),
    ];
    for (const file of sources) {
      const src = fs.readFileSync(file, 'utf8');
      const base = src.indexOf('serializeBaseTokens()');
      const pal = src.indexOf('serializePaletteOverrides()');
      expect(base, `${file}: no serializeBaseTokens() call site`).toBeGreaterThan(-1);
      expect(pal, `${file}: no serializePaletteOverrides() call site`).toBeGreaterThan(-1);
      expect(base, `${file}: base tokens must be emitted first`).toBeLessThan(pal);
    }
  });

  // 5 — the non-var rules still live in the base output.
  it('base output still carries the surface + em rules', () => {
    for (const rule of [
      '[data-surface="paper"]{background:var(--paper);}',
      '[data-surface="paper-2"]{background:var(--paper-2);}',
      '[data-surface="forest"]{background:var(--forest);}',
      '[data-surface="forest-d"]{background:var(--forest-d);}',
      '[data-palette] em{font-style:normal;color:var(--forest-2);}',
      '[data-surface="forest"] em,[data-surface="forest-d"] em{color:var(--lime);}',
    ]) {
      expect(baseCss).toContain(rule);
    }
  });

  // 6 — the registry's defaultPaletteId follows defaultTechPremiumPalette. This
  // is the mechanism the manual "flip back to forest" check exercises.
  //
  // Explicit 30s timeout (vitest.config.ts sets no testTimeout, so the default is
  // 5000ms): this is the only test in the repo that awaits a templateRegistry
  // loader, and `await import('@/modules/templates/techpremium')` pulls the whole
  // barrel — resolveTechPremiumBlock → every block component — through vite's
  // transform inside jsdom. In isolation that is ~4s; under the full suite, with
  // 300+ files competing for workers, it exceeds 5000ms and flaps. Do NOT "fix"
  // this by downgrading to an fs read of registry.ts — exercising the REAL dynamic
  // import is the point of the assertion; it just needs room to run.
  it(
    'the techpremium registry entry resolves defaultPaletteId to harbor',
    async () => {
      const mod = await templateRegistry.techpremium();
      expect(mod.defaultPaletteId).toBe('harbor');
    },
    30_000,
  );

  // 7 — DEAD-VALUE HAZARD. Both palettes now override all 19 relocated vars, so
  // tokens.ts's `:root` values are a bare-page fallback only and drift there is
  // invisible to assertion 1 (which reads the overlay). Pin them to the forest
  // record. The camelCase→--kebab map below is load-bearing: if it breaks, the
  // comparison set silently empties and this test passes green — hence the
  // explicit length assertion.
  it('every relocated :root fallback equals the forest record value', () => {
    const RELOCATED: Record<keyof typeof techPremiumBaseTokens & string, string> = {
      paper: '--paper',
      paper2: '--paper-2',
      paper3: '--paper-3',
      ink: '--ink',
      ink2: '--ink-2',
      ink3: '--ink-3',
      line: '--line',
      line2: '--line-2',
      lineDk: '--line-dk',
      teal: '--teal',
      tealDim: '--teal-dim',
      ok: '--ok',
      okBg: '--ok-bg',
      forest: '--forest',
      forestD: '--forest-d',
      forest2: '--forest-2',
      lime: '--lime',
      limeD: '--lime-d',
      limeDim: '--lime-dim',
    } as Record<keyof typeof techPremiumBaseTokens & string, string>;

    const compared: string[] = [];
    for (const key of Object.keys(RELOCATED) as (keyof typeof techPremiumBaseTokens)[]) {
      const rootValue = techPremiumBaseTokens[key];
      const forestValue = (techPremiumPaletteConfigs.forest as Record<string, string>)[
        key as string
      ];
      expect(typeof rootValue).toBe('string');
      expect(typeof forestValue).toBe('string');
      expect(`${key}=${rootValue}`).toBe(`${key}=${forestValue}`);
      compared.push(key as string);
    }
    // 13 neutrals/hairlines/status/teal + 6 accents. Inert-test guard.
    expect(compared.length).toBe(19);
  });

  // 7b — same hazard for the two NEW on-dark tokens (not "relocated", so kept out
  // of the 19-count above, but the fallback must still match forest).
  it('the :root on-dark fallbacks equal the forest record values', () => {
    expect(techPremiumBaseTokens.onDark).toBe(techPremiumPaletteConfigs.forest.onDark);
    expect(techPremiumBaseTokens.onDark2).toBe(techPremiumPaletteConfigs.forest.onDark2);
  });
});
