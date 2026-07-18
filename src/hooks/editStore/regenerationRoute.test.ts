// src/hooks/editStore/regenerationRoute.test.ts
// ============================================================================
// regen-modernization phase 5 — `regenerationActions.ts` was the app's LAST
// client-side prompt builder (R1): it ran `buildFullPrompt` in the browser and
// POSTed the prose to an ungated route (H3). This suite pins the re-point:
//
//  • the callers send STRUCTURE ONLY (tokenId + sections + sectionLayouts +
//    unsaved inputs) — never a `prompt`;
//  • design randomization still happens CLIENT-side (D4) and ships as structure;
//  • the WHOLE response object still reaches `updateFromAIResponse` (D8), so
//    `generationActions.ts` stays untouched.
//
// Drives the REAL token-scoped store (`createEditStore`) with a stubbed `fetch`.
// ============================================================================

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createEditStore } from '@/stores/editStore';

const completeSaveDraft = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
vi.mock('@/utils/autoSaveDraft', () => ({
  completeSaveDraft: (...args: unknown[]) => completeSaveDraft(...args),
}));

const TOKEN = 'tok-regen-1';
const HERO_ID = 'hero-abc12345';

/** Exactly what the rebuilt route returns (D8): top-level `content`, flat elements. */
const ROUTE_RESPONSE = {
  success: true,
  content: { [HERO_ID]: { headline: 'Fresh server-built headline', lede: 'New lede' } },
  warnings: ["quote-xyz11111: This section isn't AI-written (no copy contract for \"quote\")"],
  preservedElements: [HERO_ID],
  updatedElements: [HERO_ID],
  regenerationType: 'content-only',
  skippedSections: [{ sectionId: 'quote-xyz11111', reason: "This section isn't AI-written" }],
  creditsUsed: 3,
  creditsRemaining: 37,
};

function stubFetch(status: number, body: unknown) {
  const fn = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  );
  vi.stubGlobal('fetch', fn);
  return fn;
}

function bodyOf(fetchMock: ReturnType<typeof vi.fn>, call = 0) {
  return JSON.parse(fetchMock.mock.calls[call][1].body as string);
}

describe('regenerationActions — calls the route, builds no prompt (H3/R1)', () => {
  let store: ReturnType<typeof createEditStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    store = createEditStore(TOKEN);
    store.setState((s: any) => {
      s.tokenId = TOKEN;
      s.sections = [HERO_ID];
      s.sectionLayouts = { [HERO_ID]: 'TerminalHero' };
      s.content[HERO_ID] = {
        id: HERO_ID,
        layout: 'TerminalHero',
        elements: { headline: 'Old headline' },
      };
      s.changeTracking.currentInputs = { targetAudience: 'Platform teams' };
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('content-only regen POSTs STRUCTURE — tokenId + sections + layouts, and NO prompt', async () => {
    const fetchMock = stubFetch(200, ROUTE_RESPONSE);

    await store.getState().regenerateContentOnly();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/regenerate-content');

    const body = bodyOf(fetchMock);
    // The H3 fix: no prose crosses the wire. Ownership hangs off tokenId.
    expect(body.prompt).toBeUndefined();
    expect(body.tokenId).toBe(TOKEN);
    expect(body.preserveDesign).toBe(true);
    expect(body.sections).toEqual([HERO_ID]);
    expect(body.sectionLayouts).toEqual({ [HERO_ID]: 'TerminalHero' });
    expect(body.updatedInputs).toEqual({ targetAudience: 'Platform teams' });
  });

  it('the WHOLE response object reaches updateFromAIResponse (D8 — verbatim)', async () => {
    stubFetch(200, ROUTE_RESPONSE);
    const spy = vi.fn();
    store.setState((s: any) => {
      s.updateFromAIResponse = spy;
    });

    await store.getState().regenerateContentOnly();

    expect(spy).toHaveBeenCalledTimes(1);
    // Not `.content`, not a translated shape — the whole JSON, as today.
    expect(spy.mock.calls[0][0]).toEqual(ROUTE_RESPONSE);
    // …plus the elements map as the second arg.
    expect(spy.mock.calls[0][1]).toBeTruthy();
  });

  it('the response is applied through the REAL store funnel: copy in, warnings surfaced', async () => {
    stubFetch(200, ROUTE_RESPONSE);

    await store.getState().regenerateContentOnly();

    const state = store.getState();
    expect(state.content[HERO_ID].elements.headline).toBe('Fresh server-built headline');
    // `.warnings` is only reachable if the WHOLE object flowed through (D8) —
    // this is how the honest skipped-section reason reaches the user today.
    expect(state.aiGeneration.warnings).toEqual(ROUTE_RESPONSE.warnings);
    expect(state.persistence.isDirty).toBe(true);
    expect(completeSaveDraft).toHaveBeenCalledWith(TOKEN, expect.anything());
  });

  it('design+copy regen randomizes design CLIENT-side and ships it as structure (D4)', async () => {
    const fetchMock = stubFetch(200, { ...ROUTE_RESPONSE, regenerationType: 'design-and-copy' });

    await store.getState().regenerateDesignAndCopy();

    const body = bodyOf(fetchMock);
    expect(body.prompt).toBeUndefined();
    expect(body.preserveDesign).toBe(false);
    expect(body.sections).toEqual([HERO_ID]);
    // A layout for every section, and the freshly randomized background system —
    // structure the server validates, not a prompt it trusts.
    expect(body.sectionLayouts[HERO_ID]).toBeTruthy();
    expect(body.backgroundSystem).toBeTruthy();
    // The randomization landed in the store too (design stays client-side).
    expect(store.getState().theme.colors.accentCSS).toBeTruthy();
  });

  it('a 402 (the route now charges) surfaces the server MESSAGE, not a bare status', async () => {
    stubFetch(402, {
      error: 'insufficient_credits',
      message: "You're out of credits — top up to regenerate this page.",
    });

    await expect(store.getState().regenerateContentOnly()).rejects.toThrow(/out of credits/i);

    const errors = store.getState().aiGeneration.errors;
    expect(errors[errors.length - 1]).toBe("You're out of credits — top up to regenerate this page.");
    expect(store.getState().aiGeneration.isGenerating).toBe(false);
  });

  it('a body-less failure still degrades to the status (no crash)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 500 })));

    await expect(store.getState().regenerateContentOnly()).rejects.toThrow(/500/);
  });
});
