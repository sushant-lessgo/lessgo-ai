// src/modules/templates/shared/knobCss.ts
// Shared knob serializer + attr-apply helpers — template-factory phase 3. Mirrors
// `serializeVariantOverrides` (per-template CSS emitted under a `[data-<axis>]`
// selector, NOT `html[...]`, so it applies on the theme wrapper at any depth).
//
// TWO halves, ONE law (default emits nothing):
//   1. serializeKnobOverrides(tokenMap) → CSS TEXT. For every axis/value the
//      template tokenizes, emits `[data-knob-<axis>="<value>"]{--var:val;…}`.
//      The axis DEFAULT value is SKIPPED (default = `:root`), and empty token
//      maps yield an empty string.
//   2. knobDataAttributes(selection) → wrapper attr object. Emits a
//      `data-knob-<axis>` attr ONLY for a selected value that is valid AND
//      non-default; absent/default/invalid → no attr. Used identically by the
//      published SSRTokens and the edit ThemeInjector so both renderers scope
//      knob CSS the same way.
//
// PURE + FIREWALL-SAFE: type-only import from types/template, data import from
// the sibling knobs registry; no template component imports.

import type { KnobAxis, KnobSelection } from '@/types/template';
import { STANDARD_KNOB_AXES, KNOB_AXES, knobAttr } from '../knobs';

/**
 * Per-axis, per-value CSS variable declarations a template supplies for its
 * knobs. Shape: `{ buttonShape: { pill: { '--btn-radius': '999px' } } }`.
 * Only NON-default values need entries — a default entry (if present) is skipped
 * by the serializer, upholding the default-emits-nothing law.
 */
export type KnobTokenMap = Partial<
  Record<KnobAxis, Partial<Record<string, Record<string, string>>>>
>;

/**
 * Serialize a template's knob token map into scoped CSS layers. Default values
 * emit nothing; empty/absent maps emit an empty string (byte-identical output
 * for knob-unaware or all-default renders).
 */
export function serializeKnobOverrides(tokenMap: KnobTokenMap): string {
  const blocks: string[] = [];

  // Iterate the STANDARD axis order for deterministic output.
  for (const axis of KNOB_AXES) {
    const valueMap = tokenMap[axis];
    if (!valueMap) continue;
    const def = STANDARD_KNOB_AXES[axis];

    for (const [value, vars] of Object.entries(valueMap)) {
      // Default value never emits (default = :root). Skip empty declarations too.
      if (value === def.default) continue;
      if (!vars || Object.keys(vars).length === 0) continue;

      const decls = Object.entries(vars)
        .map(([name, val]) => `  ${name}:${val};`)
        .join('\n');
      blocks.push(`[${knobAttr(axis)}="${value}"]{\n${decls}\n}`);
    }
  }

  return blocks.join('\n');
}

/**
 * Build the `data-knob-*` attribute object for a theme wrapper from a project's
 * knob selection. An axis contributes an attr ONLY when its selected value is a
 * valid, non-default member of the axis vocabulary. Absent/default/unknown
 * values contribute nothing → a null/empty selection yields `{}` (no attrs),
 * keeping knob-unaware projects byte-identical.
 */
export function knobDataAttributes(
  selection: KnobSelection | null | undefined,
): Record<string, string> {
  const attrs: Record<string, string> = {};
  if (!selection) return attrs;

  for (const axis of KNOB_AXES) {
    const value = selection[axis];
    if (!value) continue;
    const def = STANDARD_KNOB_AXES[axis];
    if (value === def.default) continue; // default = :root, no attr
    if (!def.values.includes(value)) continue; // ignore stale/hostile values
    attrs[def.attr] = value;
  }

  return attrs;
}
