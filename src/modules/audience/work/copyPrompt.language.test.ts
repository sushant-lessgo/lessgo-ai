// src/modules/audience/work/copyPrompt.language.test.ts
// ============================================================================
// LANGUAGE-ADHERENCE test (B2) — DETERMINISTIC, no LLM. Proves the copy prompt
// carries the translate-don't-echo directive so a page whose grounding facts are
// in another language (Dutch here) is still WRITTEN in the chosen output language
// (English). Regression for QA B2: "picked English, work-engine site came out
// Dutch" — the model echoed Dutch grounding because nothing told it to translate
// the MEANING rather than copy the source wording.
//
// NOTE: this asserts the directive is PRESENT in the assembled prompt, NOT that
// the model obeys it. True adherence is an opt-in real-LLM golden
// (captureGoldenWork.test.ts, CAPTURE=1) — out of scope for a unit test.
// ============================================================================
import { describe, it, expect } from 'vitest';
import type { WorkFacts } from '@/lib/schemas/workFacts.schema';
import { buildWorkCopyPrompt, type WorkCopyPage } from './copyPrompt';
import { derivePricePosition } from './pricePosition';
import { selectWorkVoice } from './voice';
import { assembleWorkStrategy } from './strategy/parseStrategyWork';
import type { WorkStrategyResponse } from '@/lib/schemas/workStrategy.schema';

// Dutch group names + Dutch praise — the grounding material the LLM would echo.
const DUTCH_FACTS: WorkFacts = {
  identity: { name: 'Vero Studio', location: 'Amsterdam' },
  groups: [
    { name: 'Bruiloftsfotografie', kind: 'category', price: { mode: 'exact', amount: 2500, currency: '€' } },
    { name: 'Portretsessies', kind: 'category', price: { mode: 'from', amount: 750, currency: '€' } },
  ],
  establishment: 'established',
  dreamClient: 'stellen die hun dag echt willen vastleggen',
  praise: ['De foto’s zijn adembenemend mooi.', 'Elke euro meer dan waard.'],
  contactMethod: 'form',
  languages: ['nl'],
};

// Dutch strategy angles — verbatim-injected near the top of the copy prompt.
const DUTCH_STRATEGY: WorkStrategyResponse = {
  positioningAngle: 'De studio die je boekt als de dag niet overgedaan kan worden.',
  storyAngle: 'Van tweede fotograaf tot de naam die vertrouwd wordt met de enige dag.',
  voiceNotes: ['Laat het werk de pagina dragen.'],
};

const professionRow = { key: 'photographer' as const };

function buildStrategy() {
  const strategy = assembleWorkStrategy({
    llmResponse: DUTCH_STRATEGY,
    facts: DUTCH_FACTS,
    professionRow,
  });
  // The seller picked English as the OUTPUT language while the grounding is Dutch.
  return { ...strategy, primaryLanguage: 'English' };
}

function buildVoice() {
  return selectWorkVoice({
    professionRow,
    pricePosition: derivePricePosition(DUTCH_FACTS),
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

describe('work copy prompt — translate-don’t-echo language directive (B2)', () => {
  const strategy = buildStrategy();
  const prompt = buildWorkCopyPrompt({
    strategy,
    page: homePage(strategy),
    facts: DUTCH_FACTS,
    voice: buildVoice(),
  });

  it('keeps the baseline write-in-English rule', () => {
    expect(prompt).toContain('Write EVERY string in English');
  });

  it('instructs the model to render the MEANING in the output language', () => {
    expect(prompt).toMatch(/render .*meaning in English/i);
  });

  it('forbids copying/echoing the source-language wording', () => {
    expect(prompt).toMatch(/never (copy|echo).*source-language/i);
  });

  it('places the output-language directive BEFORE the Dutch grounding it governs', () => {
    const dirIdx = prompt.search(/render .*meaning in English/i);
    const dutchStrategyIdx = prompt.indexOf(DUTCH_STRATEGY.positioningAngle);
    const dutchGroupIdx = prompt.indexOf('Bruiloftsfotografie');
    expect(dirIdx).toBeGreaterThan(-1);
    expect(dirIdx).toBeLessThan(dutchStrategyIdx);
    expect(dirIdx).toBeLessThan(dutchGroupIdx);
  });
});
