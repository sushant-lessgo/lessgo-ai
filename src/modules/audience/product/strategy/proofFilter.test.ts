// src/modules/audience/product/strategy/proofFilter.test.ts
// scale-06 phase 4 — the PROOF HARD RULE at product section assembly.
//
// assembleProductStrategy is the SINGLE point that emits strategyData.sections
// (single-page via selectProductSections + multi-page via clampSitemap). These
// tests lock: no proof ⇒ current behavior (testimonials present, old wizard
// byte-identical); proof off ⇒ testimonials ABSENT (never generated); proof on
// ⇒ present. Plus the phase-1 carry-forward parity flag on WORK `achievements`.

import { describe, it, expect } from 'vitest';
import {
  assembleProductStrategy,
  filterSectionsByProof,
} from './parseStrategyProduct';
import { VESTRIA_PAGE_ARCHETYPES } from '../pageArchetypes';
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

// scale 1-10 F22 — the SAME proof rule must govern the 7b add-page/seed path
// (StructureSlot). `filterSectionsByProof` is the single shared implementation
// used by both the strategy assembly above AND the gate's seed/add chips.
describe('proof hard rule — filterSectionsByProof (7b seed/add path)', () => {
  it('proof off ⇒ testimonials cut from an added page’s default sections', () => {
    const industries = VESTRIA_PAGE_ARCHETYPES.find((a) => a.key === 'industries')!;
    expect(industries.defaultSections).toContain('testimonials'); // menu still offers it
    const seeded = filterSectionsByProof(
      [...industries.defaultSections],
      { hasTestimonials: false }
    );
    expect(seeded).not.toContain('testimonials');
    expect(seeded).toContain('industries'); // non-proof sections untouched
  });

  it('proof off ⇒ testimonials cut from the addable allowedSections chips', () => {
    const about = VESTRIA_PAGE_ARCHETYPES.find((a) => a.key === 'about')!;
    expect(about.allowedSections).toContain('testimonials');
    const addable = filterSectionsByProof([...about.allowedSections], {
      hasTestimonials: false,
    });
    expect(addable).not.toContain('testimonials');
  });

  it('proof on ⇒ testimonials survives the seed', () => {
    const industries = VESTRIA_PAGE_ARCHETYPES.find((a) => a.key === 'industries')!;
    const seeded = filterSectionsByProof(
      [...industries.defaultSections],
      { hasTestimonials: true }
    );
    expect(seeded).toContain('testimonials');
  });

  it('empty proof object (no key) ⇒ unpromised ⇒ testimonials cut', () => {
    const seeded = filterSectionsByProof(['industries', 'testimonials'], {});
    expect(seeded).not.toContain('testimonials');
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
