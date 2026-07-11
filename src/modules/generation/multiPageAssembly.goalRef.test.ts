// src/modules/generation/multiPageAssembly.goalRef.test.ts
// goal-ref-cta phase 1 (BB3 guard) — the multipage GOAL_REF stamp, proven
// through the REAL assembly, not a hand-built fixture.
//
// The fc is built exactly as the generation path builds it: buildMultiPageSkeleton
// + mergePageIntoFinalContent per page, with raw AI-shaped copy fixtures that
// carry NO cta metadata (the F23 repro shape — the multipage path runs no goal
// tail). A hand-built fixture pre-carrying `dest:'GOAL_REF'` would NOT satisfy
// this test: the fixtures MUST enter the assembly unstamped, and the stamp must
// appear only after finalizeMultiPageGeneration(fc, goal).

import { describe, it, expect } from 'vitest';
import {
  buildMultiPageSkeleton,
  mergePageIntoFinalContent,
  finalizeMultiPageGeneration,
  type MultiPageOnboardingData,
} from './multiPageAssembly';
import type { SitemapPage } from '@/types/product';
import type { SectionCopy } from '@/types/generation';
import type { Brief } from '@/types/brief';

type BriefGoal = NonNullable<Brief['goal']>;

const SITEMAP: SitemapPage[] = [
  { archetypeKey: 'home', title: 'Home', pathSlug: '/', sections: ['hero', 'cta', 'contact'] },
  { archetypeKey: 'contact', title: 'Contact', pathSlug: '/contact', sections: ['contact'] },
];

const OB: MultiPageOnboardingData = {
  oneLiner: 'x',
  productName: 'Vestria',
  understanding: { features: ['f1'] },
  landingGoal: 'book-call',
  offer: 'Free quote',
  sitemap: SITEMAP,
  strategy: { sections: [], uiblocks: {} },
};

const FORM_SPEC = {
  fields: [{ id: 'name', type: 'text', label: 'Name', required: true }],
  submitButtonText: 'Send',
  successMessage: 'ok',
};

// Raw AI-shaped copy — cta_text present (hero/header/cta), NO cta metadata.
const COPY_BY_TYPE: Record<string, SectionCopy> = {
  header: { elements: { cta_text: 'Contact', signin_text: 'Sign in' } } as any,
  hero: { elements: { headline: 'Hi', cta_text: 'Get started', secondary_cta_text: 'Learn more' } } as any,
  cta: { elements: { headline: 'Ready?', cta_text: 'Book a call' } } as any,
  contact: { elements: { headline: 'Reach us' } } as any,
  footer: { elements: {} } as any,
};

const copyFor = (types: string[]): Record<string, SectionCopy> =>
  Object.fromEntries(types.map((t) => [t, COPY_BY_TYPE[t] ?? ({ elements: {} } as any)]));

function buildUnstampedFc() {
  const fc = buildMultiPageSkeleton({ tokenId: 'tok1', title: 'Vestria', onboardingData: OB });
  SITEMAP.forEach((page, i) => {
    const types = page.pathSlug === '/' ? ['header', ...page.sections, 'footer'] : page.sections;
    mergePageIntoFinalContent({ fc, page, order: i, copy: copyFor(types), templateId: 'vestria', formSpec: FORM_SPEC });
  });
  return fc;
}

const findId = (content: Record<string, any>, prefix: string) =>
  Object.keys(content).find((id) => id.startsWith(`${prefix}-`))!;

const M1_GOAL: BriefGoal = { intent: 'book-call', mechanism: 'M1' };

describe('finalizeMultiPageGeneration — GOAL_REF stamp (real assembly, unstamped in)', () => {
  it('the assembled fc enters UNSTAMPED (no cta metadata before finalize)', () => {
    const fc = buildUnstampedFc();
    const heroId = findId(fc.pages['home'].content, 'hero');
    expect(fc.pages['home'].content[heroId].elementMetadata).toBeUndefined();
    expect(fc.chrome.header.data.elementMetadata).toBeUndefined();
  });

  it('stamps hero + cta (page body), header (chrome) and the flat home content', () => {
    const fc = buildUnstampedFc();
    const formIds = Object.keys(fc.forms);
    expect(formIds).toHaveLength(1);
    const formId = formIds[0];
    expect(fc.forms[formId].name).toBe('Contact');

    finalizeMultiPageGeneration(fc, M1_GOAL);

    const expected = { role: 'primary', dest: 'GOAL_REF', formId };

    // Page body primaries (hero + cta).
    const homeContent = fc.pages['home'].content;
    const heroId = findId(homeContent, 'hero');
    const ctaId = findId(homeContent, 'cta');
    expect(homeContent[heroId].elementMetadata.cta_text.cta).toEqual(expected);
    expect(homeContent[ctaId].elementMetadata.cta_text.cta).toEqual(expected);

    // Chrome header primary — carries its OWN stamp (relocated at publish).
    expect(fc.chrome.header.data.elementMetadata.cta_text.cta).toEqual(expected);

    // Flat home content (shallow copy) — header AND hero stamped.
    const flatHeaderId = findId(fc.content, 'header');
    const flatHeroId = findId(fc.content, 'hero');
    expect(fc.content[flatHeaderId].elementMetadata.cta_text.cta).toEqual(expected);
    expect(fc.content[flatHeroId].elementMetadata.cta_text.cta).toEqual(expected);
  });

  it('dest is the LITERAL string GOAL_REF — no resolved snapshot object anywhere', () => {
    const fc = buildUnstampedFc();
    finalizeMultiPageGeneration(fc, M1_GOAL);

    const trees: Record<string, any>[] = [
      ...Object.values<any>(fc.pages).map((p) => p.content),
      fc.content,
      { h: fc.chrome.header.data, f: fc.chrome.footer.data },
    ];
    for (const tree of trees) {
      for (const section of Object.values<any>(tree)) {
        const meta = section?.elementMetadata;
        if (!meta) continue;
        for (const entry of Object.values<any>(meta)) {
          if (entry?.cta) {
            expect(entry.cta.dest).toBe('GOAL_REF');
            expect(typeof entry.cta.dest).toBe('string');
          }
        }
      }
    }
  });

  it('leaves excluded keys (secondary_cta_text, signin_text) untouched', () => {
    const fc = buildUnstampedFc();
    finalizeMultiPageGeneration(fc, M1_GOAL);
    const heroId = findId(fc.pages['home'].content, 'hero');
    expect(fc.pages['home'].content[heroId].elementMetadata.secondary_cta_text).toBeUndefined();
    expect(fc.chrome.header.data.elementMetadata.signin_text).toBeUndefined();
  });

  it('no-goal finalize leaves everything metadata-less (existing-caller parity)', () => {
    const fc = buildUnstampedFc();
    finalizeMultiPageGeneration(fc);
    const heroId = findId(fc.pages['home'].content, 'hero');
    expect(fc.pages['home'].content[heroId].elementMetadata).toBeUndefined();
    expect(fc.chrome.header.data.elementMetadata).toBeUndefined();
    expect(fc.generationProgress).toBeUndefined(); // still finalizes.
  });

  it('survives the JSON round-trip — each tree carries its own stamp (refs de-alias)', () => {
    const fc = buildUnstampedFc();
    finalizeMultiPageGeneration(fc, M1_GOAL);
    const round = JSON.parse(JSON.stringify(fc));
    const flatHeaderId = findId(round.content, 'header');
    expect(round.content[flatHeaderId].elementMetadata.cta_text.cta.dest).toBe('GOAL_REF');
    expect(round.chrome.header.data.elementMetadata.cta_text.cta.dest).toBe('GOAL_REF');
  });
});
