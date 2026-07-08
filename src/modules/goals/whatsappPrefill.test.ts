// src/modules/goals/whatsappPrefill.test.ts
// scale-05 (phase 6) — deterministic WhatsApp prefill message.

import { describe, it, expect } from 'vitest';
import { buildWhatsappPrefill } from './whatsappPrefill';

describe('buildWhatsappPrefill', () => {
  it('both slots present → exact template with em-dash', () => {
    expect(
      buildWhatsappPrefill({ businessName: 'Acme', offer: 'AI landing pages' }),
    ).toBe('Hi Acme, I found your website — interested in AI landing pages');
  });

  it('businessName only (no offer) → graceful degradation', () => {
    expect(buildWhatsappPrefill({ businessName: 'Acme' })).toBe(
      "Hi Acme, I found your website and I'm interested.",
    );
    expect(buildWhatsappPrefill({ businessName: 'Acme', offer: '' })).toBe(
      "Hi Acme, I found your website and I'm interested.",
    );
  });

  it('no facts → generic no-name message', () => {
    expect(buildWhatsappPrefill()).toBe("Hi, I found your website and I'm interested.");
    expect(buildWhatsappPrefill(null)).toBe("Hi, I found your website and I'm interested.");
    expect(buildWhatsappPrefill({})).toBe("Hi, I found your website and I'm interested.");
  });

  it('offer present but no businessName → generic no-name message', () => {
    // Conservative: without a name the "Hi {name}" template does not apply.
    expect(buildWhatsappPrefill({ offer: 'AI landing pages' })).toBe(
      "Hi, I found your website and I'm interested.",
    );
  });

  it('trims whitespace-only slots to absent', () => {
    expect(buildWhatsappPrefill({ businessName: '   ', offer: '  ' })).toBe(
      "Hi, I found your website and I'm interested.",
    );
    expect(buildWhatsappPrefill({ businessName: '  Acme  ', offer: '  pages  ' })).toBe(
      'Hi Acme, I found your website — interested in pages',
    );
  });

  it('is pure / deterministic — same input yields identical output across calls', () => {
    const facts = { businessName: 'Acme', offer: 'AI landing pages' };
    const first = buildWhatsappPrefill(facts);
    for (let i = 0; i < 50; i++) {
      expect(buildWhatsappPrefill(facts)).toBe(first);
    }
    // No AI/network: source has zero imports (pure by construction) and never
    // varies. This deterministic-equality check is the runtime guard.
  });
});
