// src/modules/wizard/generation/workLocale.test.ts
// language-settings phase 3 — the WORK engine's site-language declaration.
//
// Work adds NO second language control (ruling 8): it derives `defaultLocale`
// from the EXISTING Step-3 `languages` question, whose answers are human LABELS
// (`'English'`, `'Dutch'`) — never ISO codes (ruling 5). This file pins:
//   · the label→config mapping + the unmapped-label limit (`'Hindi'` ⇒ no write,
//     copy is still generated in that language by the work prompt path);
//   · ALL FOUR work save sites carrying the patch — work.ts ×3 (granth save,
//     granth collection persist, skeleton save) + work.llm.ts ×1 (saveFC, the
//     single funnel for every LLM fan-out save);
//   · the English/absent ZERO-DIFF: no `localeConfig` key on any save body.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Brief } from '@/types/brief';

// saveDraft is mocked so every save BODY is captured; localeConfigPatch /
// workLocaleConfigPatch stay REAL (they are the unit under test).
const savedBodies: any[] = [];
vi.mock('./finalize', async (importActual) => {
  const actual = await importActual<typeof import('./finalize')>();
  return {
    ...actual,
    saveDraft: vi.fn(async (body: any) => {
      savedBodies.push(JSON.parse(JSON.stringify(body)));
    }),
  };
});

// granth seed / template registry: irrelevant here, keep them cheap.
vi.mock('@/modules/templates/registry', () => ({
  preloadTemplate: vi.fn(async () => ({})),
}));

// Force the (production-DORMANT) collection bridge to run its persist callback
// so work.ts's SECOND save site is actually exercised.
vi.mock('@/modules/generation/multiPageAssembly', async (importActual) => {
  const actual = await importActual<typeof import('@/modules/generation/multiPageAssembly')>();
  return {
    ...actual,
    runCollectionFanOut: vi.fn(async (opts: any) => {
      await opts.persist?.({ meta: { title: 'Persisted' } });
      return { status: 'done' };
    }),
  };
});

import { localeConfigPatch, workLocaleConfigPatch } from './finalize';
import { runWorkGeneration, runWorkSkeleton, type WorkGenerationInput } from './work';
import { runWorkLLMGeneration } from './work.llm';

function brief(languages?: string[]): Brief {
  return {
    facts: { work: { ...(languages ? { languages } : {}) } },
    copyEngine: 'work',
  } as unknown as Brief;
}

function workInput(over: Partial<WorkGenerationInput> = {}): WorkGenerationInput {
  return {
    tokenId: 'tok123',
    templateId: 'granth',
    writerName: 'Vishwas',
    oneLiner: 'Hindi essays about the everyday.',
    works: ['a.jpg', 'b.jpg', 'c.jpg'],
    brief: brief(['English']),
    ...over,
  };
}

function stubFetch(persistedTemplateId = 'granth') {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (url.includes('/api/loadDraft')) {
        return { ok: true, json: async () => ({ templateId: persistedTemplateId }) } as any;
      }
      if (url.includes('/api/audience/work/strategy')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              positioningAngle: 'a',
              storyAngle: 's',
              voiceNotes: [],
              sections: ['hero'],
              uiblocks: { hero: 'hero' },
              sitemap: [{ archetypeKey: 'home', title: 'Home', pathSlug: '/', sections: ['hero'] }],
            },
          }),
        } as any;
      }
      if (url.includes('/api/audience/work/generate-copy')) {
        return {
          ok: true,
          json: async () => ({ success: true, sections: { hero: { elements: {} } } }),
        } as any;
      }
      return { ok: true, json: async () => ({}) } as any;
    })
  );
}

beforeEach(() => {
  savedBodies.length = 0;
  stubFetch();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ─── The helpers ───────────────────────────────────────────────────────────

describe('localeConfigPatch (shared by thing/trust/work)', () => {
  it('en / absent / empty ⇒ {} (no key materializes ⇒ zero-diff)', () => {
    expect(localeConfigPatch('en')).toEqual({});
    expect(localeConfigPatch(undefined)).toEqual({});
    expect(localeConfigPatch(null)).toEqual({});
    expect(localeConfigPatch('')).toEqual({});
    expect(Object.keys(localeConfigPatch('en'))).toHaveLength(0);
  });

  it('a supported non-en code ⇒ the single-locale declaration', () => {
    expect(localeConfigPatch('nl')).toEqual({
      localeConfig: { locales: ['nl'], defaultLocale: 'nl' },
    });
  });

  it('an UNSUPPORTED code is never persisted (closed vocabulary)', () => {
    expect(localeConfigPatch('hi')).toEqual({});
    expect(localeConfigPatch('xx')).toEqual({});
  });
});

describe('workLocaleConfigPatch (labels → declaration)', () => {
  it("'Dutch' ⇒ the nl declaration", () => {
    expect(workLocaleConfigPatch(['Dutch'])).toEqual({
      localeConfig: { locales: ['nl'], defaultLocale: 'nl' },
    });
  });

  it("'English' ⇒ {} (platform default, zero-diff)", () => {
    expect(workLocaleConfigPatch(['English'])).toEqual({});
  });

  it('no answer ⇒ {}', () => {
    expect(workLocaleConfigPatch(undefined)).toEqual({});
    expect(workLocaleConfigPatch([])).toEqual({});
  });

  it("an UNMAPPED custom label ('Hindi') ⇒ {} + a warn — the documented limit", () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(workLocaleConfigPatch(['Hindi'])).toEqual({});
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('Hindi');
    warn.mockRestore();
  });

  it('the FIRST answered language wins (multi-select question)', () => {
    expect(workLocaleConfigPatch(['Dutch', 'English'])).toEqual({
      localeConfig: { locales: ['nl'], defaultLocale: 'nl' },
    });
  });
});

// ─── The four save sites ───────────────────────────────────────────────────

describe('work save sites carry the declaration (all FOUR)', () => {
  it('site 1+2 — granth generator save AND the collection persist', async () => {
    const res = await runWorkGeneration(workInput({ brief: brief(['Dutch']) }));
    expect(res.status).toBe('done');
    // The granth save + the (forced) collection persist.
    expect(savedBodies.length).toBeGreaterThanOrEqual(2);
    for (const b of savedBodies) {
      expect(b.localeConfig).toEqual({ locales: ['nl'], defaultLocale: 'nl' });
    }
  });

  it('site 3 — the multipage SKELETON save', async () => {
    const res = await runWorkSkeleton(
      workInput({
        templateId: 'atelier',
        brief: brief(['Dutch']),
        pages: [{ archetypeKey: 'home', title: 'Home', pathSlug: '/', sections: ['hero'] }] as any,
      })
    );
    expect(res.status).toBe('done');
    expect(savedBodies).toHaveLength(1);
    expect(savedBodies[0].localeConfig).toEqual({ locales: ['nl'], defaultLocale: 'nl' });
  });

  it('site 4 — every work.llm saveFC body (skeleton + per-page + final)', async () => {
    const res = await runWorkLLMGeneration(
      workInput({
        templateId: 'atelier',
        brief: brief(['Dutch']),
        pages: [{ archetypeKey: 'home', title: 'Home', pathSlug: '/', sections: ['hero'] }] as any,
      })
    );
    expect(res.status).toBe('done');
    expect(savedBodies.length).toBeGreaterThan(1);
    for (const b of savedBodies) {
      expect(b.localeConfig).toEqual({ locales: ['nl'], defaultLocale: 'nl' });
    }
  });
});

describe('work ZERO-DIFF (English / unmapped) — no localeConfig key anywhere', () => {
  it('English granth run writes NO localeConfig key', async () => {
    const res = await runWorkGeneration(workInput());
    expect(res.status).toBe('done');
    expect(savedBodies.length).toBeGreaterThan(0);
    for (const b of savedBodies) expect(b).not.toHaveProperty('localeConfig');
  });

  it("an unmapped label ('Hindi') writes NO localeConfig key", async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const res = await runWorkGeneration(workInput({ brief: brief(['Hindi']) }));
    expect(res.status).toBe('done');
    for (const b of savedBodies) expect(b).not.toHaveProperty('localeConfig');
  });

  it('English work.llm run writes NO localeConfig key', async () => {
    const res = await runWorkLLMGeneration(
      workInput({
        templateId: 'atelier',
        pages: [{ archetypeKey: 'home', title: 'Home', pathSlug: '/', sections: ['hero'] }] as any,
      })
    );
    expect(res.status).toBe('done');
    expect(savedBodies.length).toBeGreaterThan(0);
    for (const b of savedBodies) expect(b).not.toHaveProperty('localeConfig');
  });
});
