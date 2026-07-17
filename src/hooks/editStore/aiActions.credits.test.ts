// billing-beta phase 4 — credit blocks (402) reach the user instead of vanishing.
//
// WHAT THIS PINS: for each of the file's three REAL credit-gated fetches, a 402
// must (a) announce on creditsBlockedBus and (b) throw InsufficientCreditsError
// (which the existing catch blocks record in aiGeneration.errors). Non-credit
// failures must behave EXACTLY as before — no emit.
//
// Deliberately NOT covered: `regenerateElement` (the setTimeout mock stub) — it
// makes no request and spends no credits, so there is nothing to gate.
//
// This file proves the STORE end only. That the modal actually appears (i.e. that
// a host is mounted and subscribed) is provable only in e2e/billing-beta.spec.ts.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { createAIActions } from './aiActions';
import { InsufficientCreditsError } from '@/lib/billing/insufficientCredits';
import {
  subscribeCreditsBlocked,
  __resetCreditsBlockedBus,
  type CreditsBlockedEvent,
} from '@/lib/billing/creditsBlockedBus';

vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }));

const SECTION_ID = 'hero-abc12345';
const ABOUT_ID = 'about-abc12345';

function makeStore() {
  const state: any = {
    tokenId: 'tok_test',
    templateId: 'meridian',
    audienceType: 'product',
    activeLocale: 'en',
    localeConfig: { defaultLocale: 'en' },
    sectionLayouts: { [SECTION_ID]: 'default' },
    content: {
      [SECTION_ID]: {
        id: SECTION_ID,
        elements: { headline: 'Ship on Friday' },
        editMetadata: { lastModified: 0 },
        aiMetadata: {},
      },
    },
    elementVariations: { visible: false, variations: [], selectedIndex: 0 },
    aiGeneration: { isGenerating: false, currentOperation: null, progress: 0, status: '', errors: [], context: null },
    persistence: { isDirty: false },
    queuedChanges: [],
    history: [],
    queueAiBaselinePatch: vi.fn(),
  };
  const set = (fn: any) => {
    if (typeof fn === 'function') fn(state);
  };
  const get = () => state;
  return { state, actions: createAIActions(set, get) as any };
}

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

let events: CreditsBlockedEvent[];

beforeEach(() => {
  __resetCreditsBlockedBus();
  events = [];
  subscribeCreditsBlocked((e) => events.push(e));
});

afterEach(() => {
  vi.restoreAllMocks();
  __resetCreditsBlockedBus();
});

describe('aiActions — credit blocks', () => {
  it('regenerateElementWithVariations: 402 (Pattern B, no details) emits via the regex fallback', async () => {
    // The real /api/regenerate-element shape: the route calls requireAICredits →
    // createErrorResponse (planCheck.ts:193-203), which emits `{error, code}` and
    // nothing more. There is NO `details` here — that belongs to checkAIAccess
    // (planCheck.ts:265-274), which this route never calls. So required/available
    // are recoverable ONLY by parsing the `error` string, which is what this
    // asserts. This path previously threw on response.status WITHOUT reading the
    // body at all — the numbers below were unreachable.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(402, {
          error: 'Insufficient credits. Required: 1, Available: 0',
          code: 'INSUFFICIENT_CREDITS',
        }),
      ),
    );
    const { state, actions } = makeStore();

    await expect(
      actions.regenerateElementWithVariations(SECTION_ID, 'headline', 5),
    ).rejects.toBeInstanceOf(InsufficientCreditsError);

    expect(events).toEqual([{ required: 1, available: 0 }]);
    expect(state.aiGeneration.errors).toContain('Insufficient credits');
    expect(state.aiGeneration.isGenerating).toBe(false);
  });

  it('regenerateElementWithVariations: 500 does NOT emit (non-credit errors unchanged)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(500, { error: 'Model provider exploded' })),
    );
    const { state, actions } = makeStore();

    await expect(
      actions.regenerateElementWithVariations(SECTION_ID, 'headline', 5),
    ).rejects.toThrow('API error: 500');

    expect(events).toEqual([]);
    expect(state.aiGeneration.errors).toContain('API error: 500');
  });

  it('regenerateSection: 402 (Pattern A) emits with the structured numbers', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(402, {
          success: false,
          error: 'insufficient_credits',
          message: 'Insufficient credits. Required: 2, Available: 0',
          creditsRequired: 2,
          creditsRemaining: 0,
        }),
      ),
    );
    const { actions } = makeStore();

    await expect(actions.regenerateSection(SECTION_ID)).rejects.toBeInstanceOf(
      InsufficientCreditsError,
    );
    expect(events).toEqual([{ required: 2, available: 0 }]);
  });

  it('regenerateSection: 400 does NOT emit', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(400, { error: 'Bad section' })),
    );
    const { actions } = makeStore();

    await expect(actions.regenerateSection(SECTION_ID)).rejects.toThrow('Bad section');
    expect(events).toEqual([]);
  });

  // The third fetch. NOTE: the action is `regenerateStoryFromInterview` (the plan
  // called it `regenerateStorySection`) and it no-ops unless the section is an
  // `about-*` one — hence the different fixture id.
  it('regenerateStoryFromInterview: 402 emits', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(402, {
          error: 'Insufficient credits. Required: 2, Available: 1',
          code: 'INSUFFICIENT_CREDITS',
        }),
      ),
    );
    const { state, actions } = makeStore();
    state.content[ABOUT_ID] = {
      id: ABOUT_ID,
      elements: { story: 'A story' },
      editMetadata: { lastModified: 0 },
      aiMetadata: {},
    };

    await expect(
      actions.regenerateStoryFromInterview(
        ABOUT_ID,
        { origin: 'o', moment: 'm', belief: 'b' },
        {},
      ),
    ).rejects.toBeInstanceOf(InsufficientCreditsError);
    // No structured numbers on this shape — the regex fallback recovers them.
    expect(events).toEqual([{ required: 2, available: 1 }]);
  });

  it('the social 403 upgrade wall is NOT claimed as a credit block', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(403, { error: 'limit_reached', limit: 10 })),
    );
    const { actions } = makeStore();

    await expect(
      actions.regenerateElementWithVariations(SECTION_ID, 'headline', 5),
    ).rejects.toThrow('API error: 403');
    expect(events).toEqual([]);
  });
});
