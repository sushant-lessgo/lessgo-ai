// src/modules/templates/lumen/tokens.ts
// Lumen design tokens — palette-invariant base.
// Source of truth: "Lumen - Photography & Creative.html" (:root, lines 20-55).
// Lumen is a warm gallery-white system with ONE brass accent (the only palette
// knob → ./palettes.ts) and two dark surfaces (espresso) for the process band,
// footer and lightbox. Spectral (serif display) · Inter (body) · JetBrains Mono.

export interface LumenBaseTokens {
  // Surfaces — warm gallery white
  paper: string;
  paper2: string;
  paper3: string;

  // Espresso — dark surfaces (process band, footer, lightbox)
  esp: string;
  espD: string;

  // Ink — warm near-black
  ink: string;
  ink2: string;
  ink3: string;

  // Lines
  line: string;
  line2: string;
  lineDk: string; // on espresso

  // Type
  fontDisplay: string;
  fontBody: string;
  fontMono: string;

  // Rhythm
  maxW: string;
  padX: string;
  padY: string;
  r: string;
  rLg: string;
}

export const lumenBaseTokens: LumenBaseTokens = {
  paper:  'oklch(0.977 0.006 70)',
  paper2: 'oklch(0.958 0.008 68)',
  paper3: 'oklch(0.936 0.010 66)',

  esp:    'oklch(0.258 0.012 56)',
  espD:   'oklch(0.205 0.010 52)',

  ink:    'oklch(0.235 0.010 60)',
  ink2:   'oklch(0.435 0.012 62)',
  ink3:   'oklch(0.595 0.012 64)',

  line:   'oklch(0.905 0.008 68)',
  line2:  'oklch(0.842 0.012 66)',
  lineDk: 'oklch(0.400 0.012 56)',

  fontDisplay: '"Spectral", Georgia, "Times New Roman", serif',
  fontBody:    '"Inter", system-ui, -apple-system, sans-serif',
  fontMono:    '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',

  maxW: '1240px',
  padX: 'clamp(20px, 5vw, 68px)',
  padY: 'clamp(76px, 9vw, 132px)',
  r:    '2px',
  rLg:  '3px',
};

/**
 * Serialize palette-invariant tokens into a `:root { ... }` block, followed by:
 *   - `[data-surface=...]` rules → the published renderer wraps each section in a
 *     `<div data-surface="...">` (single source of truth: sectionRules.ts). Lumen
 *     has 4 surfaces: paper / paper-2 (light) + esp / esp-d (dark bands).
 *   - `[data-palette] em` rule → Lumen's accent-`<em>` convention: ITALIC, brass.
 *     Scoped under `[data-palette]` so it never leaks to other templates.
 *
 * The brass accent vars themselves live in ./palettes.ts (the one knob), emitted
 * under `[data-palette="brass"]`.
 */
export function serializeBaseTokens(t: LumenBaseTokens = lumenBaseTokens): string {
  return `:root{
  --paper:${t.paper};
  --paper-2:${t.paper2};
  --paper-3:${t.paper3};
  --esp:${t.esp};
  --esp-d:${t.espD};
  --ink:${t.ink};
  --ink-2:${t.ink2};
  --ink-3:${t.ink3};
  --line:${t.line};
  --line-2:${t.line2};
  --line-dk:${t.lineDk};
  --font-display:${t.fontDisplay};
  --font-body:${t.fontBody};
  --font-mono:${t.fontMono};
  --max-w:${t.maxW};
  --pad-x:${t.padX};
  --pad-y:${t.padY};
  --r:${t.r};
  --r-lg:${t.rLg};
}
[data-surface="paper"]{background:var(--paper);}
[data-surface="paper-2"]{background:var(--paper-2);}
[data-surface="esp"]{background:var(--esp);}
[data-surface="esp-d"]{background:var(--esp-d);}
[data-palette] em{font-style:italic;color:var(--brass-d);}
:root{--blog-ink:var(--ink);--blog-ink-2:var(--ink-2);--blog-line:var(--line);--blog-accent:var(--brass-d);--blog-accent-on:var(--paper);}`;
}

/**
 * ===== VARIANTS =====
 * The Lumen design has NO variant axis (one composed system). We ship a single
 * `default` variant (the `:root` baseline) so the picker/registry contract is
 * satisfied; there are no override blocks.
 */
import type { TemplateVariant } from '@/types/template';

export const lumenVariants: TemplateVariant[] = [
  { id: 'default', label: 'Default', blurb: 'Warm gallery editorial — Spectral display, one brass accent.' },
];

export const defaultLumenVariant = 'default';

export function serializeVariantOverrides(): string {
  // Single baked variant → no overrides beyond :root.
  return '';
}
