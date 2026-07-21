// src/modules/generation/scopedRegen.test.ts
// Phase-2 guards for the scoped-generation primitive.
//
// The highest-stakes assertion in this file is the atelier cell of the dispatch
// matrix: atelier is a WORK-engine project whose audienceType is 'service'.
// Dispatching on audienceType would silently send the first paying customer's
// regen through the service builder — this suite fails if that regresses.
//
// `@/lib/aiClient` is mocked, so `@/lib/openaiClient` (which instantiates the
// SDK at module load and throws without OPENAI_API_KEY) is never imported.

import { describe, it, expect, vi, beforeEach } from 'vitest';

const generateRawJson = vi.hoisted(() => vi.fn());
vi.mock('@/lib/aiClient', () => ({
  generateRawJson,
  AiParseError: class AiParseError extends Error {},
}));

import {
  resolveCopyEngine,
  resolveMockEngine,
  narrowElementsMap,
  generateScopedCopy,
  validateScopedSubset,
  UnsupportedProjectError,
  ScopeInputError,
  ScopedGenerationError,
  MAX_RETRIES,
  type ScopedProject,
  type ElementsMapInput,
} from './scopedRegen';

// ── Fixtures ────────────────────────────────────────────────────────────────

const ONBOARDING = {
  oneLiner: 'A deploy platform for teams that ship daily.',
  validatedFields: {
    marketCategory: 'Developer Tools',
    targetAudience: 'Staff engineers at fast-shipping startups',
    keyProblem: 'Deploys need babysitting',
    landingPageGoals: 'signup',
    offer: 'Free 14-day trial',
  },
  hiddenInferredFields: { awarenessLevel: 'problem-aware-cold' },
  featuresFromAI: [{ feature: 'Auto deploys', benefit: 'Ship without babysitting' }],
};

// Meridian (product/thing engine) layouts — resolve to real element contracts.
const PRODUCT_LAYOUTS: Record<string, string> = {
  hero: 'TerminalHero',
  features: 'HairlineFeatureGrid',
  footer: 'HairlineFooter',
};

const productProject = (): ScopedProject => ({
  audienceType: 'product',
  templateId: 'meridian',
  title: 'Shipyard',
  inputText: ONBOARDING.oneLiner,
  content: { onboarding: ONBOARDING },
  brief: { businessType: 'saas' },
});

const serviceProject = (): ScopedProject => ({
  audienceType: 'service',
  templateId: 'hearth',
  title: 'Northwind Consulting',
  inputText: 'We help clinics fill their calendar.',
  content: { onboarding: ONBOARDING },
  brief: {},
});

const atelierProject = (): ScopedProject => ({
  // The trap: work ENGINE, service AUDIENCE.
  audienceType: 'service',
  templateId: 'atelier',
  title: 'Kundius',
  inputText: 'Portrait photography.',
  content: {
    onboarding: { ...ONBOARDING },
  },
  brief: {
    businessType: 'photographer',
    facts: {
      work: {
        identity: { name: 'Kundius' },
        establishment: 'established',
        languages: ['en'],
        contactMethod: 'form',
        groups: [
          { name: 'Portraits', kind: 'category', price: { mode: 'from', amount: 400 } },
        ],
      },
    },
  },
});

/**
 * Atelier layout state as the EDITOR holds it (layout names from the atelier
 * template) — the work engine ignores these layouts and narrows against the
 * frozen contract, which is the whole point of the engine-aware path.
 */
const ATELIER_LAYOUT_STATE = {
  sections: ['about', 'work', 'proof', 'contact'],
  sectionLayouts: {
    about: 'AtelierAbout',
    work: 'AtelierWork',
    proof: 'AtelierProof',
    contact: 'AtelierContact',
  },
};

/**
 * A response in the vocabulary the REAL work prompt asks for
 * (`workElementContract.about` = heading [required] + bio [required]). Written by
 * hand from the contract — deliberately NOT derived from the implementation.
 */
const WORK_ABOUT_RESPONSE = {
  heading: 'Portraits made with patience',
  bio: 'Fifteen years behind the camera, most of them spent waiting for the one honest second in a sitting.',
};

const writerProject = (): ScopedProject => ({
  audienceType: 'writer',
  templateId: 'granth',
  content: { onboarding: ONBOARDING },
});

const mapInput = (): ElementsMapInput => ({
  onboarding: ONBOARDING,
  sections: Object.keys(PRODUCT_LAYOUTS),
  sectionLayouts: PRODUCT_LAYOUTS,
});

/** A response section that satisfies every mandatory element of `sectionId`. */
function fullSection(sectionId: string) {
  const map = narrowElementsMap(mapInput(), { kind: 'section', sectionId });
  const elements: Record<string, unknown> = {};
  for (const el of map[sectionId].mandatoryElements) {
    const key = el.includes('.') ? el.split('.')[0] : el;
    elements[key] = el.includes('.') ? [{ [el.split('.')[1]]: 'x' }] : 'Real copy';
  }
  return { elements };
}

beforeEach(() => {
  generateRawJson.mockReset();
});

// ── 1. resolveCopyEngine — the D1b dispatch matrix ──────────────────────────

describe('resolveCopyEngine — dispatch matrix (D1b)', () => {
  it('atelier dispatches to the WORK engine even though audienceType is "service"', () => {
    // THE regression this matrix exists for (first paying customer).
    expect(resolveCopyEngine(atelierProject())).toEqual({
      engine: 'work',
      endpoint: 'work-copy',
    });
  });

  it('the work template wins over ANY audienceType', () => {
    expect(
      resolveCopyEngine({ audienceType: 'product', templateId: 'atelier' }).engine
    ).toBe('work');
    expect(
      resolveCopyEngine({ audienceType: 'writer', templateId: 'atelier' }).engine
    ).toBe('work');
  });

  it('product project → product engine on the "copy" endpoint', () => {
    expect(resolveCopyEngine(productProject())).toEqual({
      engine: 'product',
      endpoint: 'copy',
    });
  });

  it('plain service project → service engine on the "copy" endpoint', () => {
    expect(resolveCopyEngine(serviceProject())).toEqual({
      engine: 'service',
      endpoint: 'copy',
    });
  });

  it.each([
    ['writer', 'granth'],
    ['ecommerce', 'meridian'],
    ['something-new', 'lumen'],
  ])('audienceType "%s" → UnsupportedProjectError (real path 422)', (audienceType, templateId) => {
    expect(() => resolveCopyEngine({ audienceType, templateId })).toThrow(
      UnsupportedProjectError
    );
  });

  it('null project → UnsupportedProjectError', () => {
    expect(() => resolveCopyEngine(null)).toThrow(UnsupportedProjectError);
  });

  it('a non-work template never yields the work-copy endpoint (D5)', () => {
    for (const p of [productProject(), serviceProject()]) {
      expect(resolveCopyEngine(p).endpoint).toBe('copy');
    }
  });
});

// ── 2. resolveMockEngine — lenient, never throws ────────────────────────────

describe('resolveMockEngine — mock mode never 422s (D2)', () => {
  it('null (demo token has no project row) → product mock default', () => {
    expect(resolveMockEngine(null)).toBe('product');
  });

  it('writer / ecommerce / unknown → product mock default, no throw', () => {
    expect(resolveMockEngine(writerProject())).toBe('product');
    expect(resolveMockEngine({ audienceType: 'ecommerce', templateId: null })).toBe('product');
    expect(resolveMockEngine({})).toBe('product');
  });

  it('resolvable projects keep their real engine', () => {
    expect(resolveMockEngine(atelierProject())).toBe('work');
    expect(resolveMockEngine(productProject())).toBe('product');
    expect(resolveMockEngine(serviceProject())).toBe('service');
  });
});

// ── 3. narrowElementsMap ────────────────────────────────────────────────────

describe('narrowElementsMap — scope narrowing (D4)', () => {
  it("'all' keeps every section", () => {
    const map = narrowElementsMap(mapInput(), { kind: 'all' });
    expect(Object.keys(map).sort()).toEqual(Object.keys(PRODUCT_LAYOUTS).sort());
  });

  it("'section' keeps ONLY its own section", () => {
    const map = narrowElementsMap(mapInput(), { kind: 'section', sectionId: 'hero' });
    expect(Object.keys(map)).toEqual(['hero']);
    expect(map.hero.allElements.length).toBeGreaterThan(1);
  });

  it("'element' keeps exactly one section with exactly one element", () => {
    const all = narrowElementsMap(mapInput(), { kind: 'section', sectionId: 'hero' });
    const elementKey = all.hero.mandatoryElements[0];
    const map = narrowElementsMap(mapInput(), {
      kind: 'element',
      sectionId: 'hero',
      elementKey,
    });
    expect(Object.keys(map)).toEqual(['hero']);
    expect(map.hero.allElements).toEqual([elementKey]);
    expect(map.hero.mandatoryElements).toEqual([elementKey]);
  });

  it('unknown section → ScopeInputError', () => {
    expect(() =>
      narrowElementsMap(mapInput(), { kind: 'section', sectionId: 'nope' })
    ).toThrow(ScopeInputError);
  });

  it('missing layout → ScopeInputError', () => {
    expect(() =>
      narrowElementsMap(
        { onboarding: ONBOARDING, sections: ['hero'], sectionLayouts: {} },
        { kind: 'section', sectionId: 'hero' }
      )
    ).toThrow(ScopeInputError);
  });

  it('unknown element → ScopeInputError', () => {
    expect(() =>
      narrowElementsMap(mapInput(), {
        kind: 'element',
        sectionId: 'hero',
        elementKey: 'not_an_element',
      })
    ).toThrow(ScopeInputError);
  });

  it("empty page on 'all' → ScopeInputError", () => {
    expect(() =>
      narrowElementsMap({ onboarding: ONBOARDING, sections: [], sectionLayouts: {} }, { kind: 'all' })
    ).toThrow(ScopeInputError);
  });
});

// ── 3b. narrowElementsMap — engine-aware vocabulary ─────────────────────────

describe('narrowElementsMap — work engine narrows against the CONTRACT', () => {
  const workInput = (): ElementsMapInput => ({
    onboarding: ONBOARDING,
    sections: ATELIER_LAYOUT_STATE.sections,
    sectionLayouts: ATELIER_LAYOUT_STATE.sectionLayouts,
  });

  it('"about" requires the contract keys (heading/bio), not the layout keys', () => {
    const map = narrowElementsMap(workInput(), { kind: 'section', sectionId: 'about' }, 'work');
    expect(map.about.mandatoryElements.sort()).toEqual(['bio', 'heading']);
    expect(map.about.mandatoryElements).not.toContain('headline');
    // uiblocks fed to the prompt/parser are the contract identity map.
    expect(map.about.layout).toBe('about');
  });

  it('"contact" requires heading + contact_method (contract), not just headline', () => {
    const map = narrowElementsMap(workInput(), { kind: 'section', sectionId: 'contact' }, 'work');
    expect(map.contact.mandatoryElements.sort()).toEqual(['contact_method', 'heading']);
  });

  it('"work" has a REAL floor (heading + groups) where the layout resolved empty', () => {
    const map = narrowElementsMap(workInput(), { kind: 'section', sectionId: 'work' }, 'work');
    expect(map.work.mandatoryElements.sort()).toEqual(['groups', 'heading']);
  });

  it('"proof" never demands the system-injected quotes collection', () => {
    const map = narrowElementsMap(workInput(), { kind: 'section', sectionId: 'proof' }, 'work');
    expect(map.proof.mandatoryElements).not.toContain('quotes');
    expect(map.proof.allElements).not.toContain('quotes');
  });

  it('element scope validates the key against the CONTRACT vocabulary', () => {
    expect(
      narrowElementsMap(
        workInput(),
        { kind: 'element', sectionId: 'about', elementKey: 'bio' },
        'work'
      ).about.allElements
    ).toEqual(['bio']);
    // A layout-vocabulary key the work prompt never defines must not be accepted.
    expect(() =>
      narrowElementsMap(
        workInput(),
        { kind: 'element', sectionId: 'about', elementKey: 'body' },
        'work'
      )
    ).toThrow(ScopeInputError);
  });

  it('a non-work section type → ScopeInputError (no work contract)', () => {
    expect(() =>
      narrowElementsMap(
        { onboarding: ONBOARDING, sections: ['features'], sectionLayouts: { features: 'X' } },
        { kind: 'section', sectionId: 'features' },
        'work'
      )
    ).toThrow(ScopeInputError);
  });
});

// ── 4. validateScopedSubset ─────────────────────────────────────────────────

describe('validateScopedSubset — contract check, never default-fill', () => {
  const map = narrowElementsMap(mapInput(), { kind: 'section', sectionId: 'hero' });

  it('accepts a 1-section subset response', () => {
    expect(validateScopedSubset({ hero: fullSection('hero') }, map)).toBeNull();
  });

  it('rejects a response missing the section', () => {
    expect(validateScopedSubset({ features: fullSection('features') }, map)).toMatch(/missing/i);
  });

  it('rejects an empty mandatory element', () => {
    const section = fullSection('hero');
    const firstMandatory = map.hero.mandatoryElements[0].split('.')[0];
    section.elements[firstMandatory] = '   ';
    expect(validateScopedSubset({ hero: section }, map)).toMatch(/empty or missing/i);
  });
});

// ── 5. generateScopedCopy ───────────────────────────────────────────────────

describe('generateScopedCopy — engine, retry loop, scopes', () => {
  const layoutState = { sections: Object.keys(PRODUCT_LAYOUTS), sectionLayouts: PRODUCT_LAYOUTS };

  it('section scope: one AI call on the "copy" endpoint, subset returned', async () => {
    generateRawJson.mockResolvedValueOnce({ hero: fullSection('hero') });
    const result = await generateScopedCopy({
      project: productProject(),
      layoutState,
      scope: { kind: 'section', sectionId: 'hero' },
    });
    expect(generateRawJson).toHaveBeenCalledTimes(1);
    expect(generateRawJson.mock.calls[0][0]).toBe('copy');
    expect(result.engine).toBe('product');
    expect(result.attempts).toBe(1);
    expect(Object.keys(result.sections!)).toEqual(['hero']);
    expect(Object.keys(result.elementsMap)).toEqual(['hero']);
  });

  it("'all' scope validates every section of the page", async () => {
    generateRawJson.mockResolvedValueOnce({
      hero: fullSection('hero'),
      features: fullSection('features'),
      // footer deliberately absent → invalid
    });
    generateRawJson.mockResolvedValueOnce({
      hero: fullSection('hero'),
      features: fullSection('features'),
      footer: fullSection('footer'),
    });
    const result = await generateScopedCopy({
      project: productProject(),
      layoutState,
      scope: { kind: 'all' },
    });
    expect(result.attempts).toBe(2);
    expect(Object.keys(result.sections!).sort()).toEqual(['features', 'footer', 'hero']);
  });

  // These atelier tests are keyed to the vocabulary the REAL work prompt asks for
  // (workElementContract — `about` = heading/bio), NOT to whatever the
  // implementation's map happens to produce. Mocking the map's own output was the
  // non-discriminating test that hid a 100%-failing atelier path.
  it('an atelier project accepts a WORK-CONTRACT-shaped response in ONE call', async () => {
    generateRawJson.mockResolvedValueOnce({ about: { elements: WORK_ABOUT_RESPONSE } });
    const result = await generateScopedCopy({
      project: atelierProject(),
      layoutState: ATELIER_LAYOUT_STATE,
      scope: { kind: 'section', sectionId: 'about' },
    });
    expect(result.engine).toBe('work');
    expect(result.endpoint).toBe('work-copy');
    expect(generateRawJson).toHaveBeenCalledTimes(1);
    expect(generateRawJson.mock.calls[0][0]).toBe('work-copy');
    expect(result.attempts).toBe(1);
    // The prompt asks for the contract keys — and validation accepts them.
    expect(generateRawJson.mock.calls[0][1]).toContain('heading');
    expect(result.sections!.about.elements.bio).toBe(WORK_ABOUT_RESPONSE.bio);
  });

  it('atelier "contact": the layout vocabulary ("headline") is REJECTED — the contract rules', async () => {
    // The layout map demanded only `headline`; the contract (and the prompt)
    // demand `heading` + `contact_method`.
    generateRawJson.mockResolvedValue({
      contact: { elements: { headline: 'Get in touch' } },
    });
    await expect(
      generateScopedCopy({
        project: atelierProject(),
        layoutState: ATELIER_LAYOUT_STATE,
        scope: { kind: 'section', sectionId: 'contact' },
      })
    ).rejects.toThrow(/contact_method|heading/);
  });

  it('atelier "contact": the contract keys are accepted', async () => {
    generateRawJson.mockResolvedValueOnce({
      contact: { elements: { heading: 'Get in touch', contact_method: 'form' } },
    });
    const result = await generateScopedCopy({
      project: atelierProject(),
      layoutState: ATELIER_LAYOUT_STATE,
      scope: { kind: 'section', sectionId: 'contact' },
    });
    expect(result.attempts).toBe(1);
  });

  it('atelier "work": an empty elements object is REJECTED (no vacuous floor)', async () => {
    // Regression: the atelier `work` LAYOUT resolves to zero elements, so the
    // layout-derived map validated `{}` vacuously. The contract requires
    // heading + groups.
    generateRawJson.mockResolvedValue({ work: { elements: {} } });
    await expect(
      generateScopedCopy({
        project: atelierProject(),
        layoutState: ATELIER_LAYOUT_STATE,
        scope: { kind: 'section', sectionId: 'work' },
      })
    ).rejects.toBeInstanceOf(ScopedGenerationError);
    expect(generateRawJson).toHaveBeenCalledTimes(MAX_RETRIES + 1);
  });

  it('atelier "work": heading + groups satisfies the contract floor', async () => {
    generateRawJson.mockResolvedValueOnce({
      work: { elements: { heading: 'Selected work', groups: [{ name: 'Portraits' }] } },
    });
    const result = await generateScopedCopy({
      project: atelierProject(),
      layoutState: ATELIER_LAYOUT_STATE,
      scope: { kind: 'section', sectionId: 'work' },
    });
    expect(result.attempts).toBe(1);
    // parseWorkCopy ran BEFORE validation → system ids backfilled on the groups.
    expect((result.sections!.work.elements.groups as any[])[0].id).toBeTruthy();
  });

  it('atelier: work post-processing runs before validation — praise injected verbatim', async () => {
    const project = atelierProject();
    (project.brief as any).facts.work.praise = ['Sublime work. — A. Client'];
    generateRawJson.mockResolvedValueOnce({
      proof: { elements: { heading: 'What clients say' } },
    });
    const result = await generateScopedCopy({
      project,
      layoutState: ATELIER_LAYOUT_STATE,
      scope: { kind: 'section', sectionId: 'proof' },
    });
    expect(JSON.stringify(result.sections!.proof.elements)).toContain('Sublime work. — A. Client');
  });

  it('atelier: brief.facts.work missing → ScopeInputError before any AI call', async () => {
    const project = atelierProject();
    project.brief = { businessType: 'photographer' };
    await expect(
      generateScopedCopy({
        project,
        layoutState: ATELIER_LAYOUT_STATE,
        scope: { kind: 'section', sectionId: 'about' },
      })
    ).rejects.toBeInstanceOf(ScopeInputError);
    expect(generateRawJson).not.toHaveBeenCalled();
  });

  it('an unsupported project throws BEFORE any AI call (route → 422, no charge)', async () => {
    await expect(
      generateScopedCopy({
        project: writerProject(),
        layoutState,
        scope: { kind: 'section', sectionId: 'hero' },
      })
    ).rejects.toBeInstanceOf(UnsupportedProjectError);
    expect(generateRawJson).not.toHaveBeenCalled();
  });

  it('retries with the validation error folded into the prompt, then succeeds', async () => {
    const bad = fullSection('hero');
    const firstMandatory = narrowElementsMap(mapInput(), {
      kind: 'section',
      sectionId: 'hero',
    }).hero.mandatoryElements[0].split('.')[0];
    bad.elements[firstMandatory] = '';
    generateRawJson.mockResolvedValueOnce({ hero: bad });
    generateRawJson.mockResolvedValueOnce({ hero: fullSection('hero') });

    const result = await generateScopedCopy({
      project: productProject(),
      layoutState,
      scope: { kind: 'section', sectionId: 'hero' },
    });

    expect(result.attempts).toBe(2);
    expect(generateRawJson).toHaveBeenCalledTimes(2);
    const retryPrompt = generateRawJson.mock.calls[1][1] as string;
    // The retry prompt must CARRY the rejection reason (R3: own retry loop).
    expect(retryPrompt).toContain(firstMandatory);
    expect(retryPrompt).toContain('PREVIOUS ATTEMPT FAILED');
    expect(retryPrompt).not.toBe(generateRawJson.mock.calls[0][1]);
  });

  it('retries an AI throw (no inherited fallback) and exhausts at MAX_RETRIES + 1 calls', async () => {
    generateRawJson.mockRejectedValue(new Error('No JSON found in response'));
    await expect(
      generateScopedCopy({
        project: productProject(),
        layoutState,
        scope: { kind: 'section', sectionId: 'hero' },
      })
    ).rejects.toBeInstanceOf(ScopedGenerationError);
    expect(generateRawJson).toHaveBeenCalledTimes(MAX_RETRIES + 1);
  });

  it('element scope: returns variationCount variations from the tight schema', async () => {
    const elementKey = narrowElementsMap(mapInput(), { kind: 'section', sectionId: 'hero' })
      .hero.mandatoryElements[0];
    generateRawJson.mockResolvedValueOnce({
      variations: ['One', 'Two', 'Three', 'Four'],
    });
    const result = await generateScopedCopy({
      project: productProject(),
      layoutState,
      scope: { kind: 'element', sectionId: 'hero', elementKey },
      variationCount: 3,
      currentContent: 'the old headline',
      maxTokens: 1024,
    });
    expect(result.variations).toEqual(['One', 'Two', 'Three']);
    expect(result.sections).toBeUndefined();
    const [endpoint, prompt, schema, opts] = generateRawJson.mock.calls[0];
    expect(endpoint).toBe('copy'); // element rides its first-gen tier (D5)
    expect(prompt).toContain(elementKey);
    expect(prompt).toContain('the old headline');
    expect(opts).toEqual({ maxTokens: 1024 });
    // The tight schema is a z.object({variations}) — NOT the loose copy record.
    expect(schema.safeParse({ variations: ['a'] }).success).toBe(true);
    expect(schema.safeParse({ hero: { elements: {} } }).success).toBe(false);
  });

  it('element scope: an all-empty variations array is rejected and retried', async () => {
    const elementKey = narrowElementsMap(mapInput(), { kind: 'section', sectionId: 'hero' })
      .hero.mandatoryElements[0];
    generateRawJson.mockResolvedValueOnce({ variations: ['   '] });
    generateRawJson.mockResolvedValueOnce({ variations: ['Real'] });
    const result = await generateScopedCopy({
      project: productProject(),
      layoutState,
      scope: { kind: 'element', sectionId: 'hero', elementKey },
      variationCount: 1,
    });
    expect(result.variations).toEqual(['Real']);
    expect(generateRawJson).toHaveBeenCalledTimes(2);
  });

  it('userGuidance reaches the prompt', async () => {
    generateRawJson.mockResolvedValueOnce({ hero: fullSection('hero') });
    await generateScopedCopy({
      project: productProject(),
      layoutState,
      scope: { kind: 'section', sectionId: 'hero' },
      userGuidance: 'make it punchier',
    });
    expect(generateRawJson.mock.calls[0][1]).toContain('make it punchier');
  });

  it('a bad scope throws ScopeInputError before any AI call', async () => {
    await expect(
      generateScopedCopy({
        project: productProject(),
        layoutState,
        scope: { kind: 'section', sectionId: 'ghost' },
      })
    ).rejects.toBeInstanceOf(ScopeInputError);
    expect(generateRawJson).not.toHaveBeenCalled();
  });
});

// ── language-settings phase 4: REGEN's language source ──────────────────────
//
// First generation takes the language off the REQUEST (the audience routes hold
// no token — plan ruling 11); REGEN is the other half of the seam and reads the
// DURABLE declaration off the Project row it already has. These cases drive the
// real primitive and read the prompt string handed to the (mocked) AI client, so
// they fail if the thread is cut anywhere between `content.localeConfig` and the
// builder.
describe('generateScopedCopy — output language comes from content.localeConfig', () => {
  const layoutState = { sections: Object.keys(PRODUCT_LAYOUTS), sectionLayouts: PRODUCT_LAYOUTS };
  const promptSent = () => String(generateRawJson.mock.calls[0][1]);

  const withLocale = (project: ScopedProject, defaultLocale: string): ScopedProject => ({
    ...project,
    content: { ...(project.content as object), localeConfig: { locales: [defaultLocale], defaultLocale } },
  });

  it('PRODUCT regen: a declared nl project regenerates with the Dutch directive', async () => {
    generateRawJson.mockResolvedValueOnce({ hero: fullSection('hero') });
    await generateScopedCopy({
      project: withLocale(productProject(), 'nl'),
      layoutState,
      scope: { kind: 'section', sectionId: 'hero' },
    });
    expect(promptSent()).toContain('## OUTPUT LANGUAGE — Dutch (READ FIRST)');
    expect(promptSent()).not.toContain('Nederlands');
  });

  it('PRODUCT regen: no declaration ⇒ the English directive (always emitted)', async () => {
    generateRawJson.mockResolvedValueOnce({ hero: fullSection('hero') });
    await generateScopedCopy({
      project: productProject(),
      layoutState,
      scope: { kind: 'section', sectionId: 'hero' },
    });
    expect(promptSent()).toContain('## OUTPUT LANGUAGE — English (READ FIRST)');
  });

  it('SERVICE regen: a declared de project regenerates with the German directive', async () => {
    generateRawJson.mockResolvedValueOnce({ hero: fullSection('hero') });
    await generateScopedCopy({
      project: withLocale(serviceProject(), 'de'),
      layoutState,
      scope: { kind: 'section', sectionId: 'hero' },
    });
    expect(promptSent()).toContain('## OUTPUT LANGUAGE — German (READ FIRST)');
  });

  it('WORK regen: localeConfig BEATS facts.languages[0] (plan ruling 4)', async () => {
    generateRawJson.mockResolvedValueOnce({ about: { elements: WORK_ABOUT_RESPONSE } });
    // facts say English; the site DECLARES Dutch — the declaration wins.
    await generateScopedCopy({
      project: withLocale(atelierProject(), 'nl'),
      layoutState: ATELIER_LAYOUT_STATE,
      scope: { kind: 'section', sectionId: 'about' },
    });
    expect(promptSent()).toContain('## OUTPUT LANGUAGE — Dutch (READ FIRST)');
    expect(promptSent()).not.toContain('## OUTPUT LANGUAGE — English');
  });

  it('WORK regen: NO localeConfig ⇒ facts.languages[0] is still the fallback (legacy work projects)', async () => {
    generateRawJson.mockResolvedValueOnce({ about: { elements: WORK_ABOUT_RESPONSE } });
    const legacy = atelierProject();
    (legacy.brief as any).facts.work.languages = ['Dutch'];
    await generateScopedCopy({
      project: legacy,
      layoutState: ATELIER_LAYOUT_STATE,
      scope: { kind: 'section', sectionId: 'about' },
    });
    expect(promptSent()).toContain('## OUTPUT LANGUAGE — Dutch (READ FIRST)');
  });

  it('WORK regen: an UNMAPPED work label (Hindi — no localeConfig is ever written for it) still reaches the prompt', async () => {
    generateRawJson.mockResolvedValueOnce({ about: { elements: WORK_ABOUT_RESPONSE } });
    const legacy = atelierProject();
    (legacy.brief as any).facts.work.languages = ['Hindi'];
    await generateScopedCopy({
      project: legacy,
      layoutState: ATELIER_LAYOUT_STATE,
      scope: { kind: 'section', sectionId: 'about' },
    });
    expect(promptSent()).toContain('## OUTPUT LANGUAGE — Hindi (READ FIRST)');
  });
});
