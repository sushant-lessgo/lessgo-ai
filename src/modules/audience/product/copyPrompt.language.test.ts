// src/modules/audience/product/copyPrompt.language.test.ts
// ============================================================================
// language-settings phase 4 — the PRODUCT (thing engine) mirror of
// work/copyPrompt.language.test.ts. DETERMINISTIC, no LLM.
//
// The founder-reported bug is "picked English, got Dutch": the model inferred
// the output language from a non-English one-liner because NOTHING in the
// product prompt ever named a language. So the directive is asserted BOTH ways:
//  · a Dutch site gets a Dutch directive that precedes the grounding material;
//  · an ENGLISH site gets an explicit English directive too (ruling 2 — gating
//    the directive on non-English would leave the reported bug unfixed).
//
// It asserts the directive is PRESENT, not that the model obeys it — real
// adherence is an opt-in real-LLM golden / founder QA.
// ============================================================================
import { describe, it, expect } from 'vitest';
import type { ProductStrategyOutput } from '@/types/product';
import { buildProductCopyPrompt, type ProductCopyPromptInput } from './copyPrompt';

// Dutch grounding — the material the model would otherwise echo.
const DUTCH_STRATEGY: ProductStrategyOutput = {
  awareness: 'solution-aware-skeptical',
  oneReader: {
    personaDescription: 'Ondernemer die zijn eigen webshop draait',
    pain: ['Elke release kost een avond'],
    desire: ['Rustig kunnen doorwerken'],
    objections: ['Weer een nieuw hulpmiddel'],
  },
  oneIdea: {
    bigBenefit: 'Publiceren zonder gedoe',
    uniqueMechanism: 'Eén commando regelt alles',
    reasonToBelieve: 'Automatisch terugdraaien bij een fout',
  },
  featureAnalysis: [
    { feature: 'Eén-commando publicatie', benefit: 'Sneller live', benefitOfBenefit: 'Avonden terug' },
  ],
  sections: ['hero', 'pricing', 'cta'],
  uiblocks: { hero: 'TerminalHero', pricing: 'MeridianPricing', cta: 'ArcCTA' },
};

function input(over: Partial<ProductCopyPromptInput> = {}): ProductCopyPromptInput {
  return {
    strategy: DUTCH_STRATEGY,
    uiblocks: DUTCH_STRATEGY.uiblocks,
    productName: 'Vaart',
    oneLiner: 'Publiceer je webshop met één commando.',
    offer: 'Gratis tot 3 projecten',
    landingGoal: 'signup',
    features: ['Eén-commando publicatie'],
    ...over,
  };
}

describe('product copy prompt — output-language directive', () => {
  const dutch = buildProductCopyPrompt(input({ language: 'Dutch' }));

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
    const oneLinerIdx = dutch.indexOf('Publiceer je webshop met één commando.');
    const personaIdx = dutch.indexOf('Ondernemer die zijn eigen webshop draait');
    const sectionsIdx = dutch.indexOf('## SECTIONS TO GENERATE');
    expect(dirIdx).toBeGreaterThan(-1);
    expect(dirIdx).toBeLessThan(oneLinerIdx);
    expect(dirIdx).toBeLessThan(personaIdx);
    expect(dirIdx).toBeLessThan(sectionsIdx);
  });

  it('defaults to English when no language is supplied (ALWAYS emitted — ruling 2)', () => {
    const bare = buildProductCopyPrompt(input());
    expect(bare).toContain('## OUTPUT LANGUAGE — English (READ FIRST)');
    expect(bare).toContain('**Write EVERY string in English.**');
  });

  it('emits the directive on the tailored-trade branch too', () => {
    const trade = buildProductCopyPrompt(input({ language: 'German', voiceId: 'tailored-trade' }));
    expect(trade).toContain('## OUTPUT LANGUAGE — German (READ FIRST)');
    expect(trade).toContain('**Write EVERY string in German.**');
  });

  it('the RULES block still contains exactly ONE "1." line (numbering-collision pin)', () => {
    // `accentRule` hardcodes "1." and `pricingRule` hardcodes "5." — the language
    // rule is deliberately UNNUMBERED. A numbered insert would yield two 1.s.
    for (const prompt of [dutch, buildProductCopyPrompt(input({ voiceId: 'tailored-trade' }))]) {
      const rules = prompt.split('## RULES (MUST FOLLOW)')[1].split('## FINAL SELF-CHECK')[0];
      const ones = rules.split('\n').filter((l) => /^1\.\s/.test(l));
      expect(ones).toHaveLength(1);
      // …and the pricing section's hardcoded 5. is still the only 5.
      expect(rules.split('\n').filter((l) => /^5\.\s/.test(l))).toHaveLength(1);
    }
  });
});
