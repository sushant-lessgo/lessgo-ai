// src/utils/selectionPriority.test.ts
import { describe, it, expect } from 'vitest';
import type { ElementSelection } from '@/types/store';
import { isSectionVisuallySelected, getActiveToolbar } from './selectionPriority';

const element: ElementSelection = {
  sectionId: 'hero-abc12345',
  elementKey: 'headline',
  type: 'text',
  editMode: 'inline',
};

describe('isSectionVisuallySelected', () => {
  it('highlights the section when it is the bare target (no element selected)', () => {
    expect(isSectionVisuallySelected('hero-abc12345', 'hero-abc12345', null)).toBe(true);
    expect(isSectionVisuallySelected('hero-abc12345', 'hero-abc12345', undefined)).toBe(true);
  });

  it('does NOT highlight the section once an element in it is selected (select-cascade regression)', () => {
    // Founder bug: selecting one element washed the whole parent section blue.
    expect(isSectionVisuallySelected('hero-abc12345', 'hero-abc12345', element)).toBe(false);
  });

  it('does NOT highlight sibling / unrelated sections', () => {
    expect(isSectionVisuallySelected('hero-abc12345', 'features-xyz', null)).toBe(false);
    expect(isSectionVisuallySelected(null, 'hero-abc12345', null)).toBe(false);
    expect(isSectionVisuallySelected(undefined, 'hero-abc12345', null)).toBe(false);
  });

  it('mirrors the section-toolbar gate: visual on iff active toolbar is "section"', () => {
    const base = { mode: 'edit' as const, isTextEditing: false };
    // section selected, no element → section toolbar + visual both on
    expect(getActiveToolbar({ ...base, selectedSection: 'hero-abc12345' })).toBe('section');
    expect(isSectionVisuallySelected('hero-abc12345', 'hero-abc12345', undefined)).toBe(true);
    // element selected → element toolbar wins, section visual off
    expect(
      getActiveToolbar({ ...base, selectedSection: 'hero-abc12345', selectedElement: element })
    ).toBe('element');
    expect(isSectionVisuallySelected('hero-abc12345', 'hero-abc12345', element)).toBe(false);
  });
});
