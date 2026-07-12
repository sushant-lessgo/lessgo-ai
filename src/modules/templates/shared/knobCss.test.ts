// Knob serializer + attr-apply unit tests — template-factory phase 3.
// Proves the two halves of the default-emits-nothing law.

import { describe, it, expect } from 'vitest';
import { serializeKnobOverrides, knobDataAttributes, type KnobTokenMap } from './knobCss';
import { STANDARD_KNOB_AXES } from '../knobs';

describe('serializeKnobOverrides', () => {
  it('empty token map → empty string (byte-identical for knob-unaware renders)', () => {
    expect(serializeKnobOverrides({})).toBe('');
  });

  it('DEFAULT value emits NOTHING (default = :root)', () => {
    const map: KnobTokenMap = {
      buttonShape: {
        // 'rounded' is the axis default → must be skipped entirely.
        [STANDARD_KNOB_AXES.buttonShape.default]: { '--btn-radius': '8px' },
      },
    };
    expect(serializeKnobOverrides(map)).toBe('');
  });

  it('non-default value emits a scoped [data-knob-<axis>="<value>"] block', () => {
    const css = serializeKnobOverrides({
      buttonShape: { pill: { '--btn-radius': '999px' } },
    });
    expect(css).toBe('[data-knob-buttonShape="pill"]{\n  --btn-radius:999px;\n}');
  });

  it('scopes on the wrapper attr, NOT html[...] (applies at any depth)', () => {
    const css = serializeKnobOverrides({ density: { compact: { '--sec-pad-y': '64px' } } });
    expect(css.startsWith('[data-knob-density="compact"]{')).toBe(true);
    expect(css).not.toContain('html');
  });

  it('emits multiple vars for one value + multiple values, default skipped', () => {
    const css = serializeKnobOverrides({
      cardStyle: {
        // default 'hairline' skipped
        [STANDARD_KNOB_AXES.cardStyle.default]: { '--card-border': '1px' },
        shadow: { '--card-shadow': '0 2px 8px rgba(0,0,0,.1)', '--card-border': '0' },
      },
    });
    expect(css).toContain('[data-knob-cardStyle="shadow"]{');
    expect(css).toContain('  --card-shadow:0 2px 8px rgba(0,0,0,.1);');
    expect(css).toContain('  --card-border:0;');
    expect(css).not.toContain('hairline');
  });

  it('skips values with no declarations', () => {
    expect(serializeKnobOverrides({ buttonShape: { pill: {} } })).toBe('');
  });

  it('emits axes in the standard order', () => {
    const css = serializeKnobOverrides({
      texture: { grain: { '--tex': 'x' } },
      buttonShape: { pill: { '--btn-radius': '999px' } },
    });
    // buttonShape precedes texture in STANDARD_KNOB_AXES.
    expect(css.indexOf('buttonShape')).toBeLessThan(css.indexOf('texture'));
  });
});

describe('knobDataAttributes', () => {
  it('null/undefined selection → no attrs (byte-identical for knob-unaware projects)', () => {
    expect(knobDataAttributes(null)).toEqual({});
    expect(knobDataAttributes(undefined)).toEqual({});
    expect(knobDataAttributes({})).toEqual({});
  });

  it('DEFAULT value → no attr (default = :root)', () => {
    expect(
      knobDataAttributes({ buttonShape: STANDARD_KNOB_AXES.buttonShape.default }),
    ).toEqual({});
  });

  it('non-default valid value → data-knob-<axis> attr', () => {
    expect(knobDataAttributes({ buttonShape: 'pill' })).toEqual({
      'data-knob-buttonShape': 'pill',
    });
  });

  it('ignores stale/hostile values not in the axis vocabulary', () => {
    expect(knobDataAttributes({ buttonShape: 'triangle' as any })).toEqual({});
  });

  it('emits attrs only for the non-default axes in a mixed selection', () => {
    const attrs = knobDataAttributes({
      buttonShape: 'pill',
      density: STANDARD_KNOB_AXES.density.default, // default → skipped
      cardStyle: 'shadow',
    });
    expect(attrs).toEqual({
      'data-knob-buttonShape': 'pill',
      'data-knob-cardStyle': 'shadow',
    });
  });
});
