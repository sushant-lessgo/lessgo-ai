// src/modules/audience/work/voice.test.ts
import { describe, it, expect } from 'vitest';
import {
  selectWorkVoice,
  formatWorkVoiceForPrompt,
  resolveWorkProfession,
} from './voice';

describe('resolveWorkProfession', () => {
  it('maps the four work professions', () => {
    expect(resolveWorkProfession('photographer')).toBe('photographer');
    expect(resolveWorkProfession('designer')).toBe('designer');
    expect(resolveWorkProfession('writer')).toBe('writer');
    expect(resolveWorkProfession('agency')).toBe('agency');
  });

  it('falls back to photographer for unknown/empty keys', () => {
    expect(resolveWorkProfession('saas')).toBe('photographer');
    expect(resolveWorkProfession(undefined)).toBe('photographer');
    expect(resolveWorkProfession(null)).toBe('photographer');
  });
});

describe('selectWorkVoice keying matrix', () => {
  it('keys id + fields on profession × price × establishment', () => {
    const v = selectWorkVoice({
      professionRow: { key: 'designer' },
      pricePosition: 'premium',
      establishment: 'established',
    });
    expect(v.id).toBe('designer-premium-established');
    expect(v.profession).toBe('designer');
    expect(v.pricePosition).toBe('premium');
    expect(v.establishment).toBe('established');
    expect(v.identity.toLowerCase()).toContain('design');
  });

  it('changing any single axis changes the spec', () => {
    const base = selectWorkVoice({
      professionRow: { key: 'photographer' },
      pricePosition: 'middle',
      establishment: 'new',
    });
    const byProfession = selectWorkVoice({
      professionRow: { key: 'writer' },
      pricePosition: 'middle',
      establishment: 'new',
    });
    const byPrice = selectWorkVoice({
      professionRow: { key: 'photographer' },
      pricePosition: 'premium',
      establishment: 'new',
    });
    const byEstablishment = selectWorkVoice({
      professionRow: { key: 'photographer' },
      pricePosition: 'middle',
      establishment: 'established',
    });
    expect(byProfession.id).not.toBe(base.id);
    expect(byPrice.id).not.toBe(base.id);
    expect(byEstablishment.id).not.toBe(base.id);
    expect(byProfession.identity).not.toBe(base.identity);
    expect(byPrice.toneProfile).not.toBe(base.toneProfile);
    expect(byEstablishment.establishmentNote).not.toBe(base.establishmentNote);
  });

  it('premium forbids cheap-lexicon; friendly forbids exclusive-lexicon', () => {
    const premium = selectWorkVoice({
      professionRow: { key: 'photographer' },
      pricePosition: 'premium',
      establishment: 'established',
    });
    const friendly = selectWorkVoice({
      professionRow: { key: 'photographer' },
      pricePosition: 'friendly',
      establishment: 'new',
    });
    expect(premium.lexicon.forbidden).toContain('cheap');
    expect(premium.lexicon.forbidden).toContain('affordable');
    expect(friendly.lexicon.forbidden).toContain('exclusive');
    expect(friendly.lexicon.forbidden).toContain('luxury');
  });

  it('a NEW establishment note carries anti-invention language', () => {
    const v = selectWorkVoice({
      professionRow: { key: 'photographer' },
      pricePosition: 'middle',
      establishment: 'new',
    });
    expect(v.establishmentNote.toLowerCase()).toContain('do not');
    expect(v.establishmentNote.toLowerCase()).toMatch(/fabricate|not stated|history/);
  });

  it('defaults profession to photographer for an unknown row key', () => {
    const v = selectWorkVoice({
      professionRow: { key: 'saas' } as any,
      pricePosition: 'middle',
      establishment: 'established',
    });
    expect(v.profession).toBe('photographer');
  });
});

describe('formatWorkVoiceForPrompt', () => {
  it('renders forbidden words and never leaks a templateId', () => {
    const v = selectWorkVoice({
      professionRow: { key: 'agency' },
      pricePosition: 'premium',
      establishment: 'established',
    });
    const out = formatWorkVoiceForPrompt(v);
    expect(out).toContain('VOICE');
    expect(out).toContain('Forbidden words');
    expect(out).toContain('cheap');
    // firewall: no template/skeleton names appear in the rendered voice block.
    expect(out.toLowerCase()).not.toMatch(/atelier|granth|lumen|meridian|techpremium|hearth|templateid|skeletonid/);
  });
});
