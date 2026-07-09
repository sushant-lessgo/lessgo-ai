// src/modules/wizard/acceptance.test.ts
// scale-06 phase 11 — the DURABLE lock on the spec's headline acceptance numbers.
//
// Spec (docs/task/scale-06-wizard-convergence.spec.md · Acceptance):
//   • URL entry with a rich site ⇒ ≤3 questions asked
//   • bare one-liner            ⇒ ≤6 questions asked
//   • unpromised proof          ⇒ that section is ABSENT from the assembled page
//
// These are locked on the REAL machinery, not stubs:
//   • ask budget      → the phase-1 waterfall (`computeAsks`) over the real
//     engine contracts + real businessType entries.
//   • proof hard rule → the phase-4 product filter (`assembleProductStrategy`),
//     the service selector (`selectServiceSections`), and the waterfall's
//     `computeDroppedSections` — the three points a proof section can be cut.
// All THREE engines (thing/trust/work) are checked so the numbers can't be
// gamed for one engine and quietly regress on another.

import { describe, it, expect } from 'vitest';
import { computeAsks, computeDroppedSections } from './waterfall';
import { getContract } from '@/modules/engines/inputContracts';
import { businessTypes } from '@/modules/businessTypes/config';
import { assembleProductStrategy } from '@/modules/audience/product/strategy/parseStrategyProduct';
import { selectServiceSections } from '@/modules/audience/service/sectionSelection';
import type { Brief } from '@/types/brief';
import type { CopyEngine } from '@/types/brief';
import type { ProductStrategyResponse } from '@/lib/schemas/productStrategy.schema';
import type { ServiceAssetInput } from '@/types/service';

// ---------------------------------------------------------------------------
// Brief fixtures — a rich URL-entry brief (scrape filled everything an outside
// crawler can know) and a bare one-liner (user typed a sentence, nothing else).
// Built from real EntryFacts so the waterfall runs its true logic.
// ---------------------------------------------------------------------------

function briefWithEntry(entry: Record<string, unknown>, extra: Partial<Brief> = {}): Brief {
  return { facts: { entry }, ...extra } as Brief;
}

/** Rich brief: scrape prefilled every outside-knowable field + a concrete goal. */
function richBrief(engine: CopyEngine, businessType: string): Brief {
  return briefWithEntry(
    {
      rawInput: 'https://example.com',
      businessName: 'Example Co',
      oneLiner: 'Software that auto-chases late invoices for freelancers',
      audiences: ['freelance designers', 'developers'],
      offerings: ['auto-chase', 'recurring invoices', 'reminders'],
      categories: ['poetry', 'essays'],
      offer: 'Free 14-day trial',
      outcomes: ['gets paid 40% faster', '2-min setup'],
      testimonials: ['"Saved me hours." — Jane'],
    },
    {
      businessType,
      copyEngine: engine,
      confidence: 0.9,
      goal: { intent: 'free-trial', mechanism: 'M3', param: { url: 'https://example.com/signup' } },
    } as Partial<Brief>,
  );
}

/** Bare brief: only a one-liner survived entry; nothing else known. */
function bareBrief(engine: CopyEngine): Brief {
  return briefWithEntry({ oneLiner: 'invoicing software for freelancers' }, { copyEngine: engine } as Partial<Brief>);
}

const engineFixtures: Array<{ engine: CopyEngine; businessTypeKey: keyof typeof businessTypes }> = [
  { engine: 'thing', businessTypeKey: 'saas' },
  { engine: 'trust', businessTypeKey: 'agency' },
  { engine: 'work', businessTypeKey: 'writer' },
];

// ---------------------------------------------------------------------------
// (a) rich site ⇒ ≤3 asks  ·  (b) bare one-liner ⇒ ≤6 asks — ALL engines.
// ---------------------------------------------------------------------------

describe('acceptance — question budget (spec headline numbers)', () => {
  for (const { engine, businessTypeKey } of engineFixtures) {
    it(`${engine}: rich-site brief ⇒ ≤3 questions asked`, () => {
      const contract = getContract(engine);
      const asks = computeAsks(richBrief(engine, businessTypeKey), contract, businessTypes[businessTypeKey]);
      expect(asks.length, `asks: ${asks.map((f) => f.id).join(', ')}`).toBeLessThanOrEqual(3);
    });

    it(`${engine}: bare one-liner brief ⇒ ≤6 questions asked`, () => {
      const contract = getContract(engine);
      const asks = computeAsks(bareBrief(engine), contract, undefined);
      expect(asks.length, `asks: ${asks.map((f) => f.id).join(', ')}`).toBeLessThanOrEqual(6);
    });
  }
});

// ---------------------------------------------------------------------------
// (c) unpromised proof ⇒ section ABSENT from the assembled sections.
// Locked at every point a proof section can be cut.
// ---------------------------------------------------------------------------

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

const baseAssets: ServiceAssetInput = {
  hasTestimonials: true,
  hasClientLogos: true,
  hasOutcomes: true,
  hasCaseStudies: false,
  hasTeamPhotos: false,
  hasFounderPhoto: false,
  testimonialType: 'text',
};

describe('acceptance — proof hard rule (unpromised proof ⇒ section absent)', () => {
  it('waterfall: bare brief (no proof) drops the testimonials section; rich brief keeps it', () => {
    const thing = getContract('thing');
    expect(computeDroppedSections(bareBrief('thing'), thing, undefined)).toContain('testimonials');
    expect(
      computeDroppedSections(richBrief('thing', 'saas'), thing, businessTypes.saas),
    ).not.toContain('testimonials');
  });

  it('product pipeline: proof.hasTestimonials=false ⇒ testimonials ABSENT from the assembled page', () => {
    const off = assembleProductStrategy({ llmResponse, templateId: 'meridian', proof: { hasTestimonials: false } });
    expect(off.sections).not.toContain('testimonials');
    expect(Object.keys(off.uiblocks)).not.toContain('testimonials');
    // A promised proof keeps the section (the rule cuts, it doesn't nuke).
    const on = assembleProductStrategy({ llmResponse, templateId: 'meridian', proof: { hasTestimonials: true } });
    expect(on.sections).toContain('testimonials');
  });

  it('service pipeline: assets.hasTestimonials=false ⇒ testimonials ABSENT from the selection', () => {
    const off = selectServiceSections({
      awareness: 'search-aware-comparing',
      goal: 'book-call',
      assets: { ...baseAssets, hasTestimonials: false },
    });
    expect(off).not.toContain('testimonials');
    const on = selectServiceSections({
      awareness: 'search-aware-comparing',
      goal: 'book-call',
      assets: { ...baseAssets, hasTestimonials: true },
    });
    expect(on).toContain('testimonials');
  });

  it('empty proof object (nothing promised) ⇒ testimonials ABSENT (product)', () => {
    const out = assembleProductStrategy({ llmResponse, templateId: 'meridian', proof: {} });
    expect(out.sections).not.toContain('testimonials');
  });
});
