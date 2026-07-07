// Frozen-vocabulary regression tests (scale spec 01 phase 1).
// These assert the FROZEN goal vocabulary (scalePlan §6/§11.2) exactly —
// a red test here means someone changed a closed vocabulary; that's a
// deliberate decision, not a fix-the-test moment.

import { describe, it, expect } from 'vitest';
import {
  goalIntents,
  goalMechanisms,
  goalIntentMeta,
  goalMechanismMeta,
} from './vocabulary';
import { BriefSchema } from '@/lib/schemas/brief.schema';

describe('goal vocabulary (frozen)', () => {
  it('has exactly 18 intents', () => {
    expect(goalIntents).toHaveLength(18);
    // No duplicates
    expect(new Set(goalIntents).size).toBe(18);
  });

  it('has exactly 5 mechanisms M1–M5', () => {
    expect(goalMechanisms).toEqual(['M1', 'M2', 'M3', 'M4', 'M5']);
  });

  it('uses buy-via-link (D16 rename) — legacy `buy` is NOT in the vocabulary', () => {
    expect(goalIntents).toContain('buy-via-link');
    expect(goalIntents as readonly string[]).not.toContain('buy');
  });

  it('includes place intents: order-via-platform + pay-via-link (typo check: -link, not -line)', () => {
    expect(goalIntents).toContain('order-via-platform');
    expect(goalIntents).toContain('pay-via-link');
    expect(goalIntents as readonly string[]).not.toContain('pay-via-line');
  });

  it('has meta for every intent, and every meta.mechanisms ⊆ goalMechanisms (non-empty)', () => {
    expect(Object.keys(goalIntentMeta).sort()).toEqual([...goalIntents].sort());
    for (const intent of goalIntents) {
      const { label, mechanisms } = goalIntentMeta[intent];
      expect(label.length).toBeGreaterThan(0);
      expect(mechanisms.length).toBeGreaterThan(0);
      for (const m of mechanisms) {
        expect(goalMechanisms).toContain(m);
      }
    }
  });

  it('has meta for every mechanism', () => {
    expect(Object.keys(goalMechanismMeta).sort()).toEqual([...goalMechanisms].sort());
    for (const m of goalMechanisms) {
      expect(goalMechanismMeta[m].label.length).toBeGreaterThan(0);
      expect(goalMechanismMeta[m].description.length).toBeGreaterThan(0);
    }
  });

  it('spot-checks §6 table mechanism sets', () => {
    expect(goalIntentMeta['enquiry'].mechanisms).toEqual(['M1', 'M2']);
    expect(goalIntentMeta['book-call'].mechanisms).toEqual(['M1', 'M3', 'M2']);
    expect(goalIntentMeta['follow-social'].mechanisms).toEqual(['M4']);
    expect(goalIntentMeta['pay-via-link'].mechanisms).toEqual(['M3']);
  });
});

describe('BriefSchema (v0 contract, not a gate)', () => {
  it('parses the empty object — all top-level fields optional', () => {
    expect(() => BriefSchema.parse({})).not.toThrow();
  });

  it('parses a full fixture', () => {
    const brief = BriefSchema.parse({
      businessType: 'saas',
      copyEngine: 'thing',
      category: 'developer-tools',
      goal: { intent: 'request-demo', mechanism: 'M1' },
      facts: { founded: 2024, team: 'solo' },
      proofAvailable: ['testimonials', 'logos'],
      socialProfiles: [{ platform: 'twitter', url: 'https://x.com/acme' }],
      structure: { mode: 'multi', pages: ['home', 'about', 'contact'] },
      designStyleHint: 'tech-minimal',
      templateShortlist: ['meridian', 'vestria'],
      confidence: 0.8,
    });
    expect(brief.goal?.intent).toBe('request-demo');
    expect(brief.structure?.mode).toBe('multi');
  });

  it('rejects invalid enum values and out-of-range confidence', () => {
    expect(() => BriefSchema.parse({ copyEngine: 'place' })).toThrow();
    expect(() => BriefSchema.parse({ goal: { intent: 'buy', mechanism: 'M3' } })).toThrow();
    expect(() => BriefSchema.parse({ confidence: 1.5 })).toThrow();
    expect(() => BriefSchema.parse({ templateShortlist: ['not-a-template'] })).toThrow();
  });

  it('accepts array destination (writers: follow-social multi-destination)', () => {
    const brief = BriefSchema.parse({
      goal: { intent: 'follow-social', mechanism: 'M4', destination: ['instagram', 'amazon'] },
    });
    expect(brief.goal?.destination).toEqual(['instagram', 'amazon']);
  });
});
