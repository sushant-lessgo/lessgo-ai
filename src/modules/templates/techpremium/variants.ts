// src/modules/templates/techpremium/variants.ts
// TechPremium ships a SINGLE variant ('default') — the base :root system. There
// are no per-variant token rescales, so serializeVariantOverrides() emits nothing.
// The export shape still satisfies the TemplateModule `variants` contract (and a
// future picker) exactly like Meridian/Hearth.
//
// Selectors (when added) should be bare (`[data-variant="x"]`) so they work on
// <html> (client) or a wrapper <div> (server).

import type { TemplateVariant } from '@/types/template';

/**
 * Selectable TechPremium variants. First entry is the default. One variant for
 * the pilot — the control-room system has a single canonical expression.
 */
export const techPremiumVariants: TemplateVariant[] = [
  { id: 'default', label: 'Default', blurb: 'Control-room — warm paper, forest + signal-lime.' },
];

/** No per-variant rescales — 'default' is the :root baseline. */
export function serializeVariantOverrides(): string {
  return '';
}
