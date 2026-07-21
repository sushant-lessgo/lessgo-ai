// src/modules/audience/service/copyPrompt.language.test.ts
// ============================================================================
// language-settings phase 4 — the SERVICE (trust engine) mirror of
// work/copyPrompt.language.test.ts + product/copyPrompt.language.test.ts.
//
// The service ROUTES have no co-located route tests (verified by glob), so this
// file plus `@/lib/i18n/projectLocale.test.ts` is the service-side coverage:
// the routes run the SAME `resolvePromptLanguage` helper and hand its result to
// the builder exercised here.
// ============================================================================
import { describe, it, expect } from 'vitest';
import type { ServiceStrategyOutputAssembled } from '@/types/service';
import { buildServiceCopyPrompt, type ServiceCopyPromptInput } from './copyPrompt';

// Dutch grounding — the material the model would otherwise echo.
const DUTCH_STRATEGY: ServiceStrategyOutputAssembled = {
  awareness: 'search-aware-comparing',
  oneClient: {
    who: 'Praktijkhouder met te weinig tijd voor administratie',
    coreDesire: 'Rust in de agenda',
    corePain: 'De administratie loopt achter',
    pains: ['De administratie loopt achter'],
    desires: ['Rust in de agenda'],
    objections: ['Is dit niet te duur?'],
  },
  ourPosition: {
    promise: 'Wij nemen de boekhouding volledig over',
    approach: 'Vaste maandelijkse begeleiding',
    credibility: 'Gespecialiseerd in zorgpraktijken',
  },
  servicePresentation: { format: 'packages', showProcess: true, showCaseStudies: false },
  sectionDecisions: {
    includeTransformation: false,
    includeProblem: false,
    includeApproach: false,
    isHighTouch: false,
  },
  uiblockDecisions: {},
  sections: ['hero', 'services', 'cta'],
  uiblocks: { hero: 'HearthHero', services: 'HearthServices', cta: 'HearthCta' },
};

function input(over: Partial<ServiceCopyPromptInput> = {}): ServiceCopyPromptInput {
  return {
    strategy: DUTCH_STRATEGY,
    uiblocks: DUTCH_STRATEGY.uiblocks,
    oneLiner: 'Wij verzorgen de boekhouding voor zorgpraktijken.',
    businessName: 'Boekhoudhuis',
    offer: 'Gratis kennismakingsgesprek',
    goal: 'book-call',
    understanding: {
      serviceType: 'consultancy',
      whatYouDo: 'Boekhouding en fiscale begeleiding',
      services: ['Boekhouding', 'Aangifte'],
      targetClients: ['Zorgpraktijken'],
      outcomes: ['Minder administratie'],
      deliveryModel: 'remote',
    } as ServiceCopyPromptInput['understanding'],
    ...over,
  };
}

describe('service copy prompt — output-language directive', () => {
  const dutch = buildServiceCopyPrompt(input({ language: 'Dutch' }));

  it('names the language in a READ-FIRST directive block', () => {
    expect(dutch).toContain('## OUTPUT LANGUAGE — Dutch (READ FIRST)');
  });

  it('instructs the model to render the MEANING in the output language', () => {
    expect(dutch).toMatch(/render its MEANING in\s+Dutch/i);
  });

  it('forbids copying/echoing the source-language wording', () => {
    expect(dutch).toMatch(/never copy or echo the\s+source-language wording/i);
  });

  it('keeps proper nouns out of the translation', () => {
    expect(dutch).toMatch(/Proper nouns .* stay as-is/is);
  });

  it('carries the write-EVERY-string rule inside the RULES block', () => {
    expect(dutch).toContain('**Write EVERY string in Dutch.**');
    const rulesIdx = dutch.indexOf('## RULES (MUST FOLLOW)');
    expect(rulesIdx).toBeGreaterThan(-1);
    expect(dutch.indexOf('**Write EVERY string in Dutch.**')).toBeGreaterThan(rulesIdx);
  });

  it('uses the English EXONYM, never the native endonym (ruling 3)', () => {
    expect(dutch).not.toContain('Nederlands');
  });

  it('places the directive BEFORE the Dutch grounding it governs', () => {
    const dirIdx = dutch.indexOf('## OUTPUT LANGUAGE');
    const providerIdx = dutch.indexOf('Wij verzorgen de boekhouding voor zorgpraktijken.');
    const positionIdx = dutch.indexOf('Wij nemen de boekhouding volledig over');
    expect(dirIdx).toBeGreaterThan(-1);
    expect(dirIdx).toBeLessThan(providerIdx);
    expect(dirIdx).toBeLessThan(positionIdx);
  });

  it('defaults to English when no language is supplied (ALWAYS emitted — ruling 2)', () => {
    const bare = buildServiceCopyPrompt(input());
    expect(bare).toContain('## OUTPUT LANGUAGE — English (READ FIRST)');
    expect(bare).toContain('**Write EVERY string in English.**');
  });

  it('does not disturb the hardcoded RULES numbering (1.–9. stay unique)', () => {
    const rules = dutch.split('## RULES (MUST FOLLOW)')[1].split('## FINAL SELF-CHECK')[0];
    for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      const hits = rules.split('\n').filter((l) => new RegExp(`^${n}\\.\\s`).test(l));
      expect(hits, `rule ${n}. must appear exactly once`).toHaveLength(1);
    }
  });
});
