// Guards against a compiler-invisible regression: inferDefaultPalette scores on
// the lean ServiceUnderstanding (services + outcomes + whatYouDo). If a future
// field-drop empties that haystack, every project silently collapses to the
// serviceType fallback — the build stays green but palettes stop discriminating.
// These tests fix serviceType so only keyword scoring can vary the result.

import { describe, it, expect } from 'vitest';
import { inferDefaultPalette as hearth } from './hearth/paletteSelection';
import { inferDefaultPalette as lex } from './lex/paletteSelection';
import type { ServiceUnderstanding } from '@/types/service';

const mk = (over: Partial<ServiceUnderstanding>): ServiceUnderstanding => ({
  serviceType: 'agency',
  whatYouDo: '',
  services: [],
  targetClients: [],
  outcomes: [],
  deliveryModel: 'remote',
  ...over,
});

describe('inferDefaultPalette discriminates on lean fields (fixed serviceType)', () => {
  const skincare = mk({ whatYouDo: 'branding studio for skincare and beauty brands' });
  const tech = mk({ whatYouDo: 'landing pages for saas and dev tools' });
  const finance = mk({ whatYouDo: 'compliance and audit copy for finance firms' });

  it('hearth: keyword scoring overrides the agency default', () => {
    const results = [hearth(skincare), hearth(tech), hearth(finance)];
    // All agency → would be one palette via fallback; keyword hits must split them.
    expect(new Set(results).size).toBeGreaterThan(1);
  });

  it('lex: keyword scoring overrides the agency default', () => {
    const results = [lex(skincare), lex(tech), lex(finance)];
    expect(new Set(results).size).toBeGreaterThan(1);
  });
});
