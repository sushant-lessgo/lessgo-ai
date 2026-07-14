// src/modules/audience/work/copyPrompt.factsLaw.test.ts
// ============================================================================
// FACTS-LAW test (AC-2) — DETERMINISTIC, no LLM. Proves the copy engine binds to
// the seller's ACTUAL stated facts: groups/prices verbatim in the prompt, binding
// lines enumerate EXACTLY those groups (no extras), ALL praise reaches the parsed
// proof output word-for-word (no drops, no extras), and the parser never pads
// card counts beyond the stated groups.
// ============================================================================
import { describe, it, expect } from 'vitest';
import type { WorkFacts } from '@/lib/schemas/workFacts.schema';
import type { SectionCopy } from '@/types/generation';
import { buildWorkCopyPrompt, type WorkCopyPage } from './copyPrompt';
import { parseWorkCopy } from './parseCopy';
import { derivePricePosition } from './pricePosition';
import { selectWorkVoice } from './voice';
import { assembleWorkStrategy } from './strategy/parseStrategyWork';
import type { WorkStrategyResponse } from '@/lib/schemas/workStrategy.schema';

// Distinctive FAKE groups/prices + two DISTINCT praise strings — nothing here can
// be "already known" to a model, so any leakage/invention is unmistakable.
const FACTS: WorkFacts = {
  identity: { name: 'Vero Studio', location: 'Amsterdam' },
  groups: [
    { name: 'Umbrella-Drone Weddings', kind: 'category', price: { mode: 'exact', amount: 7777, currency: '€' } },
    { name: 'Neon Baptisms', kind: 'category', price: { mode: 'from', amount: 3210, currency: '€' } },
  ],
  establishment: 'established',
  dreamClient: 'couples who want the unrepeatable day done right',
  praise: ['The drone footage still makes us gasp.', 'Every euro was worth it.'],
  contactMethod: 'form',
  languages: ['en'],
};

const CANNED_STRATEGY: WorkStrategyResponse = {
  positioningAngle: 'The studio you book when the day cannot be repeated.',
  storyAngle: 'From second shooter to the name trusted with the once-only days.',
  voiceNotes: ['Let the work carry the page.'],
};

const professionRow = { key: 'photographer' as const };

function buildStrategy() {
  return assembleWorkStrategy({ llmResponse: CANNED_STRATEGY, facts: FACTS, professionRow });
}

function buildVoice() {
  return selectWorkVoice({
    professionRow,
    pricePosition: derivePricePosition(FACTS),
    establishment: 'established',
  });
}

function homePage(strategy: ReturnType<typeof buildStrategy>): WorkCopyPage {
  const home = strategy.sitemap[0];
  return {
    archetypeKey: home.archetypeKey,
    title: home.title,
    pathSlug: home.pathSlug,
    isHome: true,
    sections: strategy.sections,
  };
}

describe('work copy prompt — facts are law (AC-2)', () => {
  const strategy = buildStrategy();
  const prompt = buildWorkCopyPrompt({
    strategy,
    page: homePage(strategy),
    facts: FACTS,
    voice: buildVoice(),
  });

  it('renders every group NAME verbatim', () => {
    expect(prompt).toContain('Umbrella-Drone Weddings');
    expect(prompt).toContain('Neon Baptisms');
  });

  it('renders every PRICE verbatim / mode-phrased', () => {
    expect(prompt).toContain('€7777'); // exact
    expect(prompt).toContain('from €3210'); // from
  });

  it('binding lines enumerate EXACTLY the stated groups (no extras)', () => {
    expect(prompt).toContain(
      'EXACTLY 2 item(s): "Umbrella-Drone Weddings", "Neon Baptisms".'
    );
  });

  it('lists both praise strings verbatim in the prompt', () => {
    expect(prompt).toContain('The drone footage still makes us gasp.');
    expect(prompt).toContain('Every euro was worth it.');
  });

  it('carries the primary-language directive', () => {
    expect(prompt).toContain('Write EVERY string in en');
  });

  it('tells the model NOT to write proof quotes (they are injected)', () => {
    expect(prompt).toContain('injects real client praise here verbatim');
  });
});

describe('work copy parse — praise verbatim, no drops/extras, no padding (AC-2)', () => {
  // A well-behaved LLM response: it writes framing + one card per stated group,
  // and writes NO proof quotes (the system injects them).
  function rawCopy(): Record<string, SectionCopy> {
    return {
      hero: { elements: { role_line: 'Photography', name: 'Vero Studio', cta_label: 'Enquire' } },
      work: {
        elements: {
          heading: 'Selected work',
          groups: FACTS.groups!.map((g) => ({ name: g.name, cover_image: '', href: '' })),
        },
      },
      proof: { elements: { heading: 'What clients say' } }, // no quotes written
      packages: {
        elements: {
          heading: 'Investment',
          packages: FACTS.groups!.map((g) => ({ name: g.name, price_mode: g.price.mode })),
        },
      },
      about: { elements: { heading: 'About', bio: 'A short, true story.' } },
      contact: { elements: { heading: 'Enquire', contact_method: 'form' } },
    };
  }

  const uiblocks = Object.fromEntries(
    Object.keys(rawCopy()).map((k) => [k, k])
  ) as Record<string, string>;

  it('injects ALL praise word-for-word — zero drops, zero extras', () => {
    const out = parseWorkCopy(rawCopy(), uiblocks, FACTS.praise);
    const quotes = out.proof.elements.quotes as Array<{ text: string }>;
    expect(quotes.map((q) => q.text)).toEqual(FACTS.praise); // exact set + order
    expect(quotes).toHaveLength(FACTS.praise!.length);
  });

  it('never pads card counts beyond the stated groups', () => {
    const out = parseWorkCopy(rawCopy(), uiblocks, FACTS.praise);
    const groups = out.work.elements.groups as unknown[];
    const packages = out.packages.elements.packages as unknown[];
    expect(groups.length).toBe(FACTS.groups!.length);
    expect(packages.length).toBeLessThanOrEqual(FACTS.groups!.length);
  });
});
