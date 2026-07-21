// src/hooks/editStore/aiActions.test.ts
// work-contract-wave2 Phase 3 — story-regen MERGE-SURVIVAL regression.
//
// The story interview regen (`regenerateStoryFromInterview`) applies the route's
// returned `content` CLIENT-SIDE (aiActions.ts ~L365-406). The manual-lane About
// fields must survive that merge:
//   • signature     — belt: the merge skip predicate drops key === 'signature'
//                     (fillMode:'system'; stamped first-gen, stripped at parse).
//   • portrait_image — skipped by isImageKey (contains 'image').
//   • badge          — story output is hard-listed to {eyebrow,heading,bio}, so a
//                     well-formed response NEVER contains badge → the merge (which
//                     only overwrites keys PRESENT in data.content) preserves it.
// This pins BOTH the normal case (fields absent from the response) AND the hostile
// case (a response that DOES echo signature/portrait_image must not clobber).

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createAIActions } from './aiActions';

vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }));
// The tail of the action dynamically imports autoSaveDraft — stub it (no network).
vi.mock('@/utils/autoSaveDraft', () => ({ completeSaveDraft: vi.fn(async () => {}) }));

const ABOUT_ID = 'about-abc12345';

/** A store seeded with an about section carrying CUSTOMIZED manual-lane fields. */
function makeStore() {
  const state: any = {
    tokenId: 'tok_test',
    templateId: 'atelier',
    audienceType: 'service',
    activeLocale: 'en',
    localeConfig: { defaultLocale: 'en' },
    content: {
      [ABOUT_ID]: {
        id: ABOUT_ID,
        elements: {
          eyebrow: 'About',
          heading: 'The old heading',
          bio: 'The old bio.',
          badge: 'Kristina · Amsterdam',
          signature: 'My hand-signed name',
          portrait_image: 'https://cdn.example.com/my-portrait.jpg',
        },
        editMetadata: { lastModified: 0 },
        aiMetadata: {},
      },
    },
    aiGeneration: { isGenerating: false, currentOperation: null, progress: 0, status: '', errors: [], context: null },
    persistence: { isDirty: false },
    queuedChanges: [],
    history: { undoStack: [], redoStack: [], maxHistorySize: 50 },
    lastUpdated: 0,
    queueAiBaselinePatch: vi.fn(),
  };
  const set = (fn: any) => { if (typeof fn === 'function') fn(state); };
  const get = () => state;
  return { state, actions: createAIActions(set, get) as any };
}

function okContent(content: Record<string, unknown>) {
  return { ok: true, status: 200, json: async () => ({ content }) } as unknown as Response;
}

afterEach(() => vi.restoreAllMocks());

describe('regenerateStoryFromInterview — manual-lane fields survive the merge', () => {
  const answers = { origin: 'o', moment: 'm', belief: 'b' };

  it('updates {heading,bio}; preserves signature/badge/portrait_image ABSENT from the response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => okContent({ heading: 'A fresh heading', bio: 'A fresh bio.' })));
    const { state, actions } = makeStore();

    await actions.regenerateStoryFromInterview(ABOUT_ID, answers);

    const el = state.content[ABOUT_ID].elements;
    expect(el.heading).toBe('A fresh heading');
    expect(el.bio).toBe('A fresh bio.');
    // Untouched manual-lane fields survive.
    expect(el.signature).toBe('My hand-signed name');
    expect(el.badge).toBe('Kristina · Amsterdam');
    expect(el.portrait_image).toBe('https://cdn.example.com/my-portrait.jpg');
  });

  it('a hostile response echoing signature/portrait_image does NOT clobber (skip predicate + isImageKey)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      okContent({
        heading: 'A fresh heading',
        signature: 'ROBO SIGNATURE',                 // must be skipped by the belt
        portrait_image: 'https://evil.example/x.jpg', // must be skipped by isImageKey
      }),
    ));
    const { state, actions } = makeStore();

    await actions.regenerateStoryFromInterview(ABOUT_ID, answers);

    const el = state.content[ABOUT_ID].elements;
    expect(el.heading).toBe('A fresh heading');
    expect(el.signature).toBe('My hand-signed name');
    expect(el.portrait_image).toBe('https://cdn.example.com/my-portrait.jpg');
  });
});
