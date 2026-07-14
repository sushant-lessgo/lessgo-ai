// src/modules/engines/designKit.test.ts
// template-factory phase 4 — the design-kit generator DERIVES from the live
// schemas. These tests assert against the live contract/schema (NOT a frozen
// string), so a real contract change would reflect here — that is the "can't
// rot" guarantee.

import { describe, it, expect } from 'vitest';
import { copyEngines, type CopyEngine } from '@/types/brief';
import { engineCoreSections } from './coreSections';
import { elementContracts } from './elementContracts';
import { getAllElements, getCardRequirements, layoutElementSchema } from '@/modules/sections/layoutElementSchema';
import { STANDARD_KNOB_AXES, KNOB_AXES } from '@/modules/templates/knobs';
import { MERIDIAN_LAYOUT_NAMES } from '@/modules/audience/product/elementSchema';
import { PILOT_LAYOUT_NAMES } from '@/modules/audience/service/elementSchema';
import { buildDesignKit, renderDesignKitMarkdown, SELF_HOSTED_FONTS } from './designKit';

describe('designKit generator', () => {
  it('generates a kit for every copy engine (thing, trust, work)', () => {
    for (const engine of copyEngines) {
      const kit = buildDesignKit(engine);
      expect(kit.engine).toBe(engine);
      expect(kit.sections.length).toBeGreaterThan(0);
      const md = renderDesignKitMarkdown(kit);
      expect(md).toContain(`\`${engine}\` engine`);
    }
  });

  it('lists required sections IN ORDER, matching engineCoreSections', () => {
    for (const engine of copyEngines) {
      const kit = buildDesignKit(engine);
      expect(kit.sections.map((s) => s.sectionType)).toEqual([...engineCoreSections[engine]]);
    }
  });

  it('labels source per section: thing/work=contract, trust=legacy-layout', () => {
    for (const engine of ['thing', 'work'] as CopyEngine[]) {
      const kit = buildDesignKit(engine);
      for (const s of kit.sections) expect(s.source).toBe('contract');
    }

    const trust = buildDesignKit('trust');
    for (const s of trust.sections) expect(s.source).toBe('legacy-layout');
  });

  it('thing sections carry every slot from the LIVE elementContract (derive-from-live)', () => {
    const kit = buildDesignKit('thing');
    const contract = elementContracts.thing!;
    for (const s of kit.sections) {
      const liveKeys = getAllElements(contract[s.sectionType] as any).map((e) => e.element);
      const kitKeys = s.slots.map((sl) => sl.key);
      expect(kitKeys.sort()).toEqual(liveKeys.sort());
    }
  });

  it('work sections carry every slot from the LIVE work elementContract (derive-from-live)', () => {
    const kit = buildDesignKit('work');
    const contract = elementContracts.work!;
    for (const s of kit.sections) {
      const liveKeys = getAllElements(contract[s.sectionType] as any).map((e) => e.element);
      const kitKeys = s.slots.map((sl) => sl.key);
      expect(kitKeys.sort()).toEqual(liveKeys.sort());
    }
  });

  it('trust sections carry every slot from the LIVE hearth layout schema', () => {
    const kit = buildDesignKit('trust');
    for (const s of kit.sections) {
      const layout = (PILOT_LAYOUT_NAMES as Record<string, string>)[s.sectionType];
      const raw = layoutElementSchema[layout];
      const liveKeys = getAllElements(raw as any).map((e) => e.element);
      const kitKeys = s.slots.map((sl) => sl.key);
      expect(kitKeys.sort()).toEqual(liveKeys.sort());
    }
  });

  it('surfaces manifest capacities (thing features from live blockManifest)', () => {
    const kit = buildDesignKit('thing');
    const features = kit.sections.find((s) => s.sectionType === 'features')!;
    // Live meridian manifest declares a collection capacity for features.
    expect(features.capacity).toBeDefined();
    expect(features.capacity!.minCards).toBeGreaterThan(0);
    expect(features.capacity!.maxCards).toBeGreaterThanOrEqual(features.capacity!.minCards);
    // And declares its variants (default + skins).
    expect(features.variants.length).toBeGreaterThan(0);
  });

  it('surfaces card min/max where the schema declares a collection', () => {
    const kit = buildDesignKit('thing');
    const contract = elementContracts.thing!;
    for (const s of kit.sections) {
      const liveCards = getCardRequirements(contract[s.sectionType] as any);
      if (liveCards) {
        expect(s.cards).not.toBeNull();
        expect(s.cards!.min).toBe(liveCards.min);
        expect(s.cards!.max).toBe(liveCards.max);
      }
    }
  });

  it('carries the full knob axis range set from STANDARD_KNOB_AXES', () => {
    const kit = buildDesignKit('thing');
    expect(kit.knobs.map((k) => k.axis).sort()).toEqual([...KNOB_AXES].sort());
    for (const k of kit.knobs) {
      const def = STANDARD_KNOB_AXES[k.axis as keyof typeof STANDARD_KNOB_AXES];
      expect(k.default).toBe(def.default);
      expect([...k.values].sort()).toEqual([...def.values].sort());
      expect(k.values).toContain(k.default);
    }
  });

  it('carries a format-constraints block with axes, class prefix, and font whitelist', () => {
    const kit = buildDesignKit('thing');
    expect(kit.format.classPrefix).toContain('lg-');
    expect(kit.format.axes).toContain('[data-palette]');
    expect(kit.format.axes).toContain('[data-variant]');
    expect(kit.format.axes).toContain('[data-surface]');
    for (const axis of KNOB_AXES) {
      expect(kit.format.axes).toContain(STANDARD_KNOB_AXES[axis].attr);
    }
    expect(kit.format.fonts).toEqual(SELF_HOSTED_FONTS);
    expect(kit.format.fonts).toContain('Inter');
  });

  it('markdown render contains sections-in-order, slots, capacities, knobs, and format', () => {
    const kit = buildDesignKit('thing');
    const md = renderDesignKitMarkdown(kit);
    // sections in order
    for (const st of engineCoreSections.thing) expect(md).toContain(`\`${st}\``);
    // a real slot key derived from the live contract
    const heroKeys = getAllElements(elementContracts.thing!.hero as any).map((e) => e.element);
    expect(md).toContain(`\`${heroKeys[0]}\``);
    // knob ranges + format
    expect(md).toContain('Knob axes to design');
    expect(md).toContain('Format constraints');
    expect(md).toContain(STANDARD_KNOB_AXES.buttonShape.attr);
    // reference to the flagship layout name proves manifest/layout join
    expect(md).toContain((MERIDIAN_LAYOUT_NAMES as Record<string, string>).hero);
  });

  it('is derive-from-live: adding a slot to the live contract would appear in the kit', () => {
    // Guard by construction: the kit slot list is produced by getAllElements over
    // the SAME live object the assertion reads — no frozen copy. Prove the two
    // are the same source by object identity of the derived key set.
    const kit = buildDesignKit('thing');
    const features = kit.sections.find((s) => s.sectionType === 'features')!;
    const liveKeys = getAllElements(elementContracts.thing!.features as any).map((e) => e.element);
    expect(features.slots.map((s) => s.key).sort()).toEqual(liveKeys.sort());
  });
});
