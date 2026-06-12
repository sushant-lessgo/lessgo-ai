// src/modules/templates/meridian/variants.ts
// Meridian variant overrides — pure token rescales over the same DNA, applied
// via `[data-variant]`. Source: "Meridian - Modern Tech.html" lines 728-734
// (marketing) + 759-771 (light root inversion).
//
// `developer` is the base `:root` (no overrides). Only ROOT-TOKEN overrides are
// ported here; the component-class variant tweaks (HTML 735-755, 783-785) target
// block classes (.hero/.feature/.testi-card) that don't exist until the real
// blocks ship — they'll be authored alongside those blocks (P2).
//
// Selectors are bare (`[data-variant="x"]`) so they work on <html> or a wrapper.

import type { TemplateVariant } from '@/types/template';

/**
 * Selectable Meridian variants (token rescales over one DNA). First entry is the
 * default. Satisfies the TemplateModule `variants` contract (Phase 11b picker).
 */
export const meridianVariants: TemplateVariant[] = [
  { id: 'developer', label: 'Developer', blurb: 'Base dark — terminal-grade contrast.' },
  { id: 'marketing', label: 'Marketing', blurb: 'Softer rhythm — larger radii, more breath.' },
  { id: 'light', label: 'Light', blurb: 'Full inversion — same system, light surface.' },
];

/**
 * `[data-variant="marketing"]` — softer rhythm: larger radii, more breath.
 * Same dark surface, friendlier voice.
 */
const MARKETING = `[data-variant="marketing"]{
  --r-sm:8px;
  --r-md:12px;
  --r-lg:16px;
  --r-xl:22px;
  --sec-pad-y:144px;
}`;

/**
 * `[data-variant="light"]` — full inversion. Hairlines preserved. Same system,
 * flipped surface. (Per-palette accent shifts live in palettes.ts.)
 */
const LIGHT = `[data-variant="light"]{
  --ink:oklch(0.99 0.003 260);
  --ink-1:oklch(0.96 0.005 260);
  --ink-2:oklch(0.93 0.006 260);
  --bone:oklch(0.15 0.01 260);
  --bone-2:oklch(0.38 0.008 260);
  --bone-3:oklch(0.58 0.006 260);
  --line:oklch(0.15 0.01 260 / 0.10);
  --line-strong:oklch(0.15 0.01 260 / 0.18);
  --line-soft:oklch(0.15 0.01 260 / 0.05);
  --shadow-menu:0 10px 24px -12px oklch(0.15 0.01 260 / 0.18), 0 2px 6px -2px oklch(0.15 0.01 260 / 0.08);
}`;

/** Serialize all variant root-token override blocks (developer = base, no block). */
export function serializeVariantOverrides(): string {
  return `${MARKETING}\n${LIGHT}`;
}
