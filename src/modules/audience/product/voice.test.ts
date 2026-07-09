// src/modules/audience/product/voice.test.ts
// scale-08 phase 1 — product copy-voice derivation from the businessType config
// entry's `voiceHint` (replaces the old `templateId === 'vestria'` fork).

import { describe, it, expect } from 'vitest';
import { productVoiceForBusinessType } from './voice';

describe('productVoiceForBusinessType', () => {
  it('manufacturer ⇒ tailored-trade (from config voiceHint)', () => {
    expect(productVoiceForBusinessType('manufacturer')).toBe('tailored-trade');
  });

  it('saas ⇒ modern-tech (from config voiceHint)', () => {
    expect(productVoiceForBusinessType('saas')).toBe('modern-tech');
  });

  it('undefined / null ⇒ modern-tech default', () => {
    expect(productVoiceForBusinessType(undefined)).toBe('modern-tech');
    expect(productVoiceForBusinessType(null)).toBe('modern-tech');
  });

  it('garbage / unknown key ⇒ modern-tech default', () => {
    expect(productVoiceForBusinessType('not-a-key')).toBe('modern-tech');
    // A service entry with no voiceHint also defaults.
    expect(productVoiceForBusinessType('agency')).toBe('modern-tech');
  });
});
