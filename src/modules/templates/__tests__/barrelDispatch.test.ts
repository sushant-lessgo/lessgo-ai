// Barrel-level variant dispatch (F3 regression).
//
// The renderers call the template MODULE BARREL's `resolveBlock(type, mode,
// layoutName)` — never the inner `resolveMeridianBlock` directly. F3 was a bug
// where every barrel implemented `resolveBlock` with only TWO params, silently
// dropping `layoutName`, so a stored block-variant pick never reached the inner
// resolver and every section fell back to its default block. The existing
// dispatch tests call the inner resolver, so they never saw it. This test goes
// through the exported barrel to pin the fix.

import { resolveBlock as resolveMeridian } from '@/modules/templates/meridian';
import LedgerFeatureList from '@/modules/templates/meridian/blocks/Features/LedgerFeatureList';
import HairlineFeatureGrid from '@/modules/templates/meridian/blocks/Features/HairlineFeatureGrid';
import LedgerFeatureListPublished from '@/modules/templates/meridian/blocks/Features/LedgerFeatureList.published';

describe('meridian barrel resolveBlock forwards layoutName (F3)', () => {
  it('resolves a stored variant name to the VARIANT component, not the default', () => {
    const variant = resolveMeridian('features', 'edit', 'LedgerFeatureList');
    expect(variant).toBe(LedgerFeatureList);
    // The default block is a different component — if layoutName were dropped,
    // this would resolve to HairlineFeatureGrid instead.
    expect(variant).not.toBe(HairlineFeatureGrid);
  });

  it('forwards layoutName in published mode too', () => {
    expect(resolveMeridian('features', 'published', 'LedgerFeatureList')).toBe(
      LedgerFeatureListPublished,
    );
  });

  it('the variant pick differs from the section default (dropped-arg guard)', () => {
    const withVariant = resolveMeridian('features', 'edit', 'LedgerFeatureList');
    const defaultBlock = resolveMeridian('features', 'edit');
    expect(defaultBlock).toBe(HairlineFeatureGrid);
    expect(withVariant).not.toBe(defaultBlock);
  });

  it('falls back to the section default for an absent / foreign layout name (A1)', () => {
    expect(resolveMeridian('features', 'edit')).toBe(HairlineFeatureGrid);
    expect(resolveMeridian('features', 'edit', 'SomeForeignLayout')).toBe(HairlineFeatureGrid);
  });
});
