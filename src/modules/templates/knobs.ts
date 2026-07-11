// src/modules/templates/knobs.ts
// Standard knob-axis registry — template-factory phase 3. PURE DATA leaf: no
// template-module imports (firewall-safe), type-only import from types/template.
//
// A knob is a per-template design lever surfaced as a `data-knob-<axis>`
// attribute on the theme wrapper. This module is the VOCABULARY (which axes
// exist, their allowed values, and each axis' default). It does NOT hold the CSS
// values a value emits — those are template-specific and live in the template's
// tokens.ts, formatted into scoped `[data-knob-<axis>="<value>"]{…}` blocks by
// the shared serializer (`./shared/knobCss.ts`).
//
// LAW: the DEFAULT value of every axis emits NOTHING (default = `:root`). A
// template opting into knobs (phase 8) MUST align its `:root` design with each
// axis default so that a knob-unaware project (no `themeValues.knobs`) renders
// byte-identical to today. Blocks NEVER branch on a knob — CSS-token only, so the
// dual-renderer pair stays identical by construction.

import type { KnobAxis, KnobValue } from '@/types/template';

/** One standard knob axis: its DOM attribute, allowed value vocabulary, and the
 *  default value (which emits no attr and no CSS). */
export interface KnobAxisDef {
  axis: KnobAxis;
  /** The DOM attribute name, e.g. `data-knob-buttonShape`. */
  attr: string;
  /** The full standard value vocabulary. A template may support a subset (which
   *  MUST include `default`). */
  values: readonly KnobValue[];
  /** The default value — emits neither attr nor CSS (default = `:root`). MUST be
   *  a member of `values`. */
  default: KnobValue;
  /** One-line intent (agent/kit-facing). */
  note: string;
}

/** Build the standard attribute name for an axis. Single source of truth for the
 *  `data-knob-<axis>` convention (serializer + attr-apply helpers use this). */
export const knobAttr = (axis: KnobAxis): string => `data-knob-${axis}`;

/**
 * The standard knob axes. Every knob-tokenized template declares a subset of
 * these values per axis; the conformance rule requires the FULL axis set to be
 * declared (`assertKnobConformance`). Value vocabularies are intentionally small
 * and semantic — a template maps each value to concrete CSS tokens in its own
 * tokens.ts (the serializer only formats the scoped blocks).
 */
export const STANDARD_KNOB_AXES: Record<KnobAxis, KnobAxisDef> = {
  buttonShape: {
    axis: 'buttonShape',
    attr: knobAttr('buttonShape'),
    values: ['square', 'rounded', 'pill'],
    default: 'rounded',
    note: 'Button corner radius (--btn-radius): square (0) · rounded (mid) · pill (full).',
  },
  cardStyle: {
    axis: 'cardStyle',
    attr: knobAttr('cardStyle'),
    values: ['hairline', 'shadow', 'flat'],
    default: 'hairline',
    note: 'Card treatment: hairline border · drop shadow · flat fill.',
  },
  density: {
    axis: 'density',
    attr: knobAttr('density'),
    values: ['compact', 'comfortable', 'spacious'],
    default: 'comfortable',
    note: 'Spacing multiplier applied to section rhythm / padding tokens.',
  },
  typePairing: {
    axis: 'typePairing',
    attr: knobAttr('typePairing'),
    values: ['classic', 'condensed', 'editorial'],
    default: 'classic',
    note: 'Type-pairing archetype. ALIASES the existing per-template variant axis; a template maps each value to a stored variantId.',
  },
  texture: {
    axis: 'texture',
    attr: knobAttr('texture'),
    values: ['none', 'grain', 'paper'],
    default: 'none',
    note: 'Surface texture overlay (subsumes the neutral mood axis). none = no overlay.',
  },
};

/** All standard axes, in declaration order. */
export const KNOB_AXES = Object.keys(STANDARD_KNOB_AXES) as KnobAxis[];

/** Is `value` a member of `axis`' standard vocabulary? */
export function isValidKnobValue(axis: KnobAxis, value: KnobValue): boolean {
  return STANDARD_KNOB_AXES[axis].values.includes(value);
}

/** Is `value` the (no-op) default for `axis`? Default values emit no attr/CSS. */
export function isDefaultKnobValue(axis: KnobAxis, value: KnobValue): boolean {
  return STANDARD_KNOB_AXES[axis].default === value;
}
