// src/hooks/editStore/aiActionsErrorSurfacing.test.ts
// ============================================================================
// regen-modernization phase 4 (R6.3) — the server's HONEST reason must reach the
// user. Founder preference (authoritative): if a capability doesn't exist, say
// WHY; don't silently omit, don't relabel. A why-message the user never sees
// does not satisfy that.
//
// Before this fix `aiActions.ts` DISCARDED the error body: element regen threw
// `API error: 422` and section regen threw the machine CODE (`invalid_scope`).
// The atelier `quote` band — a real block with no work copy contract — 422s on
// every regen, so this is the path Kundius actually hits.
//
// Drives the REAL token-scoped store (`createEditStore`) with a stubbed `fetch`.
// ============================================================================

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createEditStore } from '@/stores/editStore';

const SECTION_ID = 'quote-abc12345';

/** The exact body both rebuilt routes return for an un-regenerable section. */
const QUOTE_BAND_422 = {
  error: 'invalid_scope',
  message:
    "This section isn't AI-written, so it can't be regenerated: No work element contract for section \"quote\"",
  detail: 'No work element contract for section "quote"',
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

describe('aiActions — the server error BODY reaches the caller', () => {
  let store: ReturnType<typeof createEditStore>;

  beforeEach(() => {
    store = createEditStore('tok-err');
    store.setState((s: any) => {
      s.tokenId = 'tok-err';
      s.content[SECTION_ID] = { elements: { quote: 'A line the seller wrote by hand.' } };
      s.sectionLayouts = { [SECTION_ID]: 'AtelierQuote' };
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('section regen: a 422 surfaces the honest MESSAGE, not the machine code', async () => {
    stubFetch(422, QUOTE_BAND_422);

    await expect(store.getState().regenerateSection(SECTION_ID)).rejects.toThrow(
      /isn't AI-written/i
    );

    const errors = store.getState().aiGeneration.errors;
    expect(errors[errors.length - 1]).toBe(QUOTE_BAND_422.message);
    // The old behavior: the bare code, which tells the user nothing.
    expect(errors[errors.length - 1]).not.toBe('invalid_scope');
  });

  it('element regen: a 422 surfaces the honest MESSAGE, not `API error: 422`', async () => {
    const elementBody = {
      error: 'invalid_scope',
      message: "This element isn't AI-written, so it can't be regenerated: Unknown section \"quote\"",
    };
    stubFetch(422, elementBody);

    await expect(
      store.getState().regenerateElementWithVariations(SECTION_ID, 'quote', 'A line.', 5)
    ).rejects.toThrow(/isn't AI-written/i);

    const errors = store.getState().aiGeneration.errors;
    expect(errors[errors.length - 1]).toBe(elementBody.message);
    expect(errors[errors.length - 1]).not.toBe('API error: 422');
  });

  it('element regen: a body-less error still degrades to the status (no crash)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('not json', { status: 500 }))
    );

    await expect(
      store.getState().regenerateElementWithVariations(SECTION_ID, 'quote', 'A line.', 5)
    ).rejects.toThrow(/API error: 500/);
  });

  it('section regen: falls back to `error` when the server sends no message', async () => {
    stubFetch(403, { error: 'Access denied' });

    await expect(store.getState().regenerateSection(SECTION_ID)).rejects.toThrow('Access denied');
  });
});
