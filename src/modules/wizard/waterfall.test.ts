// src/modules/wizard/waterfall.test.ts
// scale-06 phase 1 — waterfall states + acceptance budget (locked from day one).

import { describe, it, expect } from 'vitest';
import { computeFieldStates, computeAsks, computeDroppedSections } from './waterfall';
import { getContract } from '@/modules/engines/inputContracts';
import { businessTypes } from '@/modules/businessTypes/config';
import type { Brief } from '@/types/brief';

const thing = getContract('thing');

/** Build a Brief with a partial EntryFacts payload at facts.entry. */
function briefWithEntry(entry: Record<string, unknown>, extra: Partial<Brief> = {}): Brief {
  return { facts: { entry }, ...extra } as Brief;
}

// A rich URL-entry brief: scrape filled everything an outside crawler can know.
const richBrief = briefWithEntry(
  {
    businessName: 'Acme Invoicing',
    oneLiner: 'Invoicing software for freelancers that auto-chases late payments',
    audiences: ['freelance designers', 'developers'],
    offerings: ['auto-chase', 'recurring invoices', 'reminders'],
    offer: 'Free 14-day trial',
    outcomes: ['gets paid 40% faster', '2-min setup'],
    testimonials: ['"Saved me hours." — Jane'],
  },
  {
    businessType: 'saas',
    copyEngine: 'thing',
    confidence: 0.9,
    goal: { intent: 'free-trial', mechanism: 'M3', param: { url: 'https://acme.app/signup' } },
  },
);

// A bare one-liner: user typed a sentence, nothing else known.
const bareBrief = briefWithEntry({
  oneLiner: 'invoicing software for freelancers',
});

describe('waterfall — acceptance budget (spec §8)', () => {
  it('rich-site brief ⇒ ≤3 questions asked', () => {
    const asks = computeAsks(richBrief, thing, businessTypes.saas);
    expect(asks.length).toBeLessThanOrEqual(3);
  });

  it('bare one-liner brief ⇒ ≤6 questions asked', () => {
    const asks = computeAsks(bareBrief, thing, undefined);
    expect(asks.length).toBeLessThanOrEqual(6);
  });
});

describe('waterfall — rich brief field states', () => {
  const states = computeFieldStates(richBrief, thing, businessTypes.saas);

  it('scraped fields resolve from entry facts', () => {
    expect(states.get('name')).toBe('scraped');
    expect(states.get('audience')).toBe('scraped');
    expect(states.get('capabilities')).toBe('scraped');
    expect(states.get('offer')).toBe('scraped');
    expect(states.get('realNumbers')).toBe('scraped');
    expect(states.get('proofTestimonials')).toBe('scraped');
  });

  it('goal with a concrete param is scraped', () => {
    expect(states.get('goal')).toBe('scraped');
  });

  it('differentiator is never scrape-inferable ⇒ asked', () => {
    expect(states.get('differentiator')).toBe('ask');
  });

  it('unanswered optional objection facts drop', () => {
    expect(states.get('objectionFacts')).toBe('drop');
  });
});

describe('waterfall — bare brief field states', () => {
  const states = computeFieldStates(bareBrief, thing, undefined);

  it('one-liner is scraped, required copy fields ask', () => {
    expect(states.get('oneLiner')).toBe('scraped');
    expect(states.get('name')).toBe('ask');
    expect(states.get('audience')).toBe('ask');
    expect(states.get('capabilities')).toBe('ask');
    expect(states.get('offer')).toBe('ask');
    expect(states.get('goal')).toBe('ask');
  });

  it('optional proof + numbers drop when unbacked', () => {
    expect(states.get('realNumbers')).toBe('drop');
    expect(states.get('proofTestimonials')).toBe('drop');
  });
});

describe('waterfall — inference consumes businessType + confidence', () => {
  it('goal is inferred from businessType likely intents when no goal set + confident', () => {
    const b = briefWithEntry(
      { oneLiner: 'invoicing for freelancers' },
      { businessType: 'saas', confidence: 0.9 },
    );
    const states = computeFieldStates(b, thing, businessTypes.saas);
    expect(states.get('goal')).toBe('inferred');
  });

  it('low confidence blocks inference ⇒ goal falls through to ask', () => {
    const b = briefWithEntry(
      { oneLiner: 'invoicing for freelancers' },
      { businessType: 'saas', confidence: 0.2 },
    );
    const states = computeFieldStates(b, thing, businessTypes.saas);
    expect(states.get('goal')).toBe('ask');
  });
});

describe('waterfall — dropped sections (proof hard rule)', () => {
  it('unbacked testimonials ⇒ testimonials section cut', () => {
    expect(computeDroppedSections(bareBrief, thing, undefined)).toContain('testimonials');
  });

  it('scraped testimonials ⇒ section NOT cut', () => {
    expect(computeDroppedSections(richBrief, thing, businessTypes.saas)).not.toContain('testimonials');
  });
});

describe('waterfall — ordered asks follow the slot skeleton (identity·understanding·goal·offer)', () => {
  it('asks are ordered by slot (identity → understanding → goal → offer)', () => {
    const asks = computeAsks(bareBrief, thing, undefined).map((f) => f.id);
    // name (identity) precedes audience/capabilities/differentiator (understanding)
    expect(asks.indexOf('name')).toBeLessThan(asks.indexOf('audience'));
    // understanding precedes goal precedes offer
    expect(asks.indexOf('audience')).toBeLessThan(asks.indexOf('goal'));
    expect(asks.indexOf('goal')).toBeLessThan(asks.indexOf('offer'));
  });
});
