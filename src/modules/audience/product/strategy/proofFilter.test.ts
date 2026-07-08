// src/modules/audience/product/strategy/proofFilter.test.ts
// scale-06 phase 4 — the PROOF HARD RULE at product section assembly.
//
// assembleProductStrategy is the SINGLE point that emits strategyData.sections
// (single-page via selectProductSections + multi-page via clampSitemap). These
// tests lock: no proof ⇒ current behavior (testimonials present, old wizard
// byte-identical); proof off ⇒ testimonials ABSENT (never generated); proof on
// ⇒ present. Plus the phase-1 carry-forward parity flag on WORK `achievements`.

import { describe, it, expect } from 'vitest';
import { assembleProductStrategy } from './parseStrategyProduct';
import type { ProductStrategyResponse } from '@/lib/schemas/productStrategy.schema';
import { engineContracts } from '@/modules/engines/inputContracts';

const llmResponse: ProductStrategyResponse = {
  awareness: 'problem-aware-cold',
  oneReader: {
    personaDescription: 'Freelance designer billing a handful of clients',
    pain: ['chasing late payments'],
    desire: ['get paid on time'],
    objections: ['too complex to set up'],
  },
  oneIdea: {
    bigBenefit: 'Get paid faster',
    uniqueMechanism: 'Auto-chasing reminders',
    reasonToBelieve: 'Bank-level security',
  },
  featureAnalysis: [
    { feature: 'Auto-reminders', benefit: 'Fewer late payments', benefitOfBenefit: 'Steady cash flow' },
  ],
};

describe('proof hard rule — assembleProductStrategy (meridian single-page)', () => {
  it('ABSENT proof ⇒ testimonials present (old wizard byte-identical)', () => {
    const out = assembleProductStrategy({ llmResponse, templateId: 'meridian' });
    expect(out.sections).toContain('testimonials');
  });

  it('proof.hasTestimonials false ⇒ testimonials section ABSENT (never generated)', () => {
    const out = assembleProductStrategy({
      llmResponse,
      templateId: 'meridian',
      proof: { hasTestimonials: false },
    });
    expect(out.sections).not.toContain('testimonials');
    // The block map derived from the filtered sections drops it too.
    expect(Object.keys(out.uiblocks)).not.toContain('testimonials');
    // Non-proof sections are untouched.
    expect(out.sections).toContain('hero');
    expect(out.sections).toContain('features');
  });

  it('proof.hasTestimonials true ⇒ testimonials present', () => {
    const out = assembleProductStrategy({
      llmResponse,
      templateId: 'meridian',
      proof: { hasTestimonials: true },
    });
    expect(out.sections).toContain('testimonials');
  });

  it('empty proof object (no key) ⇒ unpromised ⇒ testimonials ABSENT', () => {
    const out = assembleProductStrategy({
      llmResponse,
      templateId: 'meridian',
      proof: {},
    });
    expect(out.sections).not.toContain('testimonials');
  });
});

describe('contract carry-forward — WORK achievements skippable-with-warning', () => {
  it('WORK achievements (real-numbers) is skippableWithWarning (parity with thing/trust)', () => {
    const nums = engineContracts.work.fields.find((f) => f.askCandidate === 'real-numbers');
    expect(nums?.id).toBe('achievements');
    expect(nums?.skippableWithWarning).toBe(true);
    expect(nums?.requirement).toBe('optional');
  });
});
