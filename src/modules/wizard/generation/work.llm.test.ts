// src/modules/wizard/generation/work.llm.test.ts
// work-copy-engine phase 5 — the WORK LLM fan-out adapter ORCHESTRATION test.
//
// NO real network: fetch is stubbed, generate-copy is canned. Proves the fan-out
// order, resume-skip of completedPageKeys, that finalizeMultiPageGeneration runs
// EXACTLY ONCE at the end, degraded-meta threading, the plain-page multipage
// INVARIANT (no collectionKey / kind:'collectionItem'), and the byte-identical
// dispatch routing (granth / skeleton / llm) via resolveWorkRoute.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { WorkStrategyOutput } from '@/modules/audience/work/strategy/parseStrategyWork';
import type { GenerationMeta } from './index';

// ── Mocks ────────────────────────────────────────────────────────────────────
// saveDraft: capture the finalContent handed to each save (no network).
const savedFcs: any[] = [];
vi.mock('./finalize', () => ({
  saveDraft: vi.fn(async (body: any) => {
    // Deep-clone so we snapshot the fc AT save time (the adapter mutates it).
    savedFcs.push(JSON.parse(JSON.stringify(body.finalContent)));
  }),
}));

// preloadTemplate: no template module needed (knob seed is best-effort).
vi.mock('@/modules/templates/registry', () => ({
  preloadTemplate: vi.fn(async () => ({})),
}));

// multiPageAssembly: keep the REAL helpers, but wrap finalize in a spy so we can
// assert it fires exactly once at the tail.
vi.mock('@/modules/generation/multiPageAssembly', async (importActual) => {
  const actual = await importActual<typeof import('@/modules/generation/multiPageAssembly')>();
  return { ...actual, finalizeMultiPageGeneration: vi.fn(actual.finalizeMultiPageGeneration) };
});

import { finalizeMultiPageGeneration } from '@/modules/generation/multiPageAssembly';
import {
  runWorkLLMGeneration,
  runWorksFanOut,
  resolveWorkRoute,
  workCopyEngineEnabled,
  WORK_COPY_ENGINE_TEMPLATES,
} from './work.llm';
import { templateMeta } from '@/modules/templates/templateMeta';
import type { WorkGenerationInput } from './work';

// ── Fixtures ───────────────────────────────────────────────────────────────

function makeStrategy(): WorkStrategyOutput {
  return {
    positioningAngle: 'angle',
    storyAngle: 'story',
    voiceNotes: ['note'],
    sections: ['header', 'hero', 'work', 'footer'],
    uiblocks: { header: 'header', hero: 'hero', work: 'work', footer: 'footer' },
    sitemap: [
      { archetypeKey: 'home', title: 'Home', pathSlug: '/', sections: ['hero', 'work'] },
      { archetypeKey: 'work', title: 'Work', pathSlug: '/work', sections: ['work'] },
      { archetypeKey: 'contact', title: 'Contact', pathSlug: '/contact', sections: ['contact'] },
    ],
    archetype: 'standard' as any,
    leadGroups: ['A'],
    storyBranch: 'established',
    primaryLanguage: 'en',
    wording: {} as any,
  };
}

const BRIEF = {
  copyEngine: 'work',
  businessType: 'photographer',
  facts: { work: { identity: { name: 'K' } } },
} as any;

function baseInput(overrides: Partial<WorkGenerationInput> = {}): WorkGenerationInput {
  return {
    tokenId: 'tok1',
    templateId: 'atelier',
    writerName: 'K',
    oneLiner: 'photographer',
    works: [],
    brief: BRIEF,
    strategy: makeStrategy(),
    ...overrides,
  };
}

// A canned copy response: one section entry per requested section type.
function cannedSections(sections: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const s of sections) out[s] = { elements: { heading: `${s}-copy` } };
  return out;
}

function makeResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body } as unknown as Response;
}

interface FetchHarness {
  copyPages: string[]; // archetypeKey per generate-copy call, in order
  copySectionsSeen: string[][]; // payload page.sections per call
}

/**
 * Install a fetch stub. `loadDraft` returns `loadDraftBody` (non-resumable by
 * default); strategy returns the fixture; generate-copy records the page + returns
 * canned sections with the per-call meta from `metaQueue`.
 */
function installFetch(opts: {
  loadDraftBody?: unknown;
  metaQueue?: (GenerationMeta | undefined)[];
} = {}): FetchHarness {
  const harness: FetchHarness = { copyPages: [], copySectionsSeen: [] };
  const metaQueue = opts.metaQueue ?? [];
  let copyIdx = 0;
  global.fetch = vi.fn(async (url: any, init?: any) => {
    const u = String(url);
    if (u.includes('/api/loadDraft')) return makeResponse(opts.loadDraftBody ?? {});
    if (u.includes('/api/audience/work/strategy')) {
      return makeResponse({ success: true, data: makeStrategy() });
    }
    if (u.includes('/api/audience/work/generate-copy')) {
      const body = JSON.parse(init.body);
      harness.copyPages.push(body.page.archetypeKey);
      harness.copySectionsSeen.push(body.page.sections);
      const meta = metaQueue[copyIdx++];
      return makeResponse({
        success: true,
        sections: cannedSections(body.page.sections),
        ...(meta ? { meta } : {}),
      });
    }
    throw new Error(`unexpected fetch: ${u}`);
  }) as any;
  return harness;
}

beforeEach(() => {
  savedFcs.length = 0;
  (finalizeMultiPageGeneration as any).mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Fan-out orchestration ────────────────────────────────────────────────────

describe('runWorkLLMGeneration — fan-out orchestration', () => {
  it('generates copy for every sitemap page IN ORDER and finalizes exactly once', async () => {
    const h = installFetch();
    const result = await runWorkLLMGeneration(baseInput());

    expect(result.status).toBe('done');
    expect(result.redirectTo).toBe('/edit/tok1');
    // Every page, home-first, in sitemap order.
    expect(h.copyPages).toEqual(['home', 'work', 'contact']);
    // finalize fires exactly once, at the tail.
    expect(finalizeMultiPageGeneration).toHaveBeenCalledTimes(1);
  });

  it('sends chrome-inclusive sections for HOME, body-only for inner pages', async () => {
    const h = installFetch();
    await runWorkLLMGeneration(baseInput());
    // home (index 0) is chrome-wrapped; inner pages are body-only.
    expect(h.copySectionsSeen[0]).toEqual(['header', 'hero', 'work', 'footer']);
    expect(h.copySectionsSeen[1]).toEqual(['work']);
    expect(h.copySectionsSeen[2]).toEqual(['contact']);
  });

  it('INVARIANT: plain sitemap pages never carry collectionKey / kind:collectionItem', async () => {
    installFetch();
    await runWorkLLMGeneration(baseInput());
    const finalFc = savedFcs[savedFcs.length - 1]; // post-finalize save
    expect(finalFc.pages).toBeTruthy();
    for (const key of Object.keys(finalFc.pages)) {
      const page = finalFc.pages[key];
      expect(page.collectionKey).toBeUndefined();
      expect(page.kind).not.toBe('collectionItem');
    }
    // Generation marker dropped by finalize ⇒ not a resumable draft anymore.
    expect(finalFc.generationProgress).toBeUndefined();
  });

  it('fetches the work strategy when none is pre-supplied', async () => {
    installFetch();
    const result = await runWorkLLMGeneration(baseInput({ strategy: null }));
    expect(result.status).toBe('done');
    const calls = (global.fetch as any).mock.calls.map((c: any[]) => String(c[0]));
    expect(calls.some((u: string) => u.includes('/api/audience/work/strategy'))).toBe(true);
  });
});

// ── Resume ───────────────────────────────────────────────────────────────────

describe('runWorkLLMGeneration — resume', () => {
  it('skips already-completed pages (completedPageKeys) on a resumable draft', async () => {
    // A resumable fc: home already done; strategy + sitemap persisted.
    const strategy = makeStrategy();
    const resumable = {
      pages: {
        home: { id: 'home', archetypeKey: 'home', pathSlug: '/', sections: [], content: {} },
      },
      content: {},
      meta: { title: 'K', lastUpdated: 1, tokenId: 'tok1' },
      onboardingData: { sitemap: strategy.sitemap, strategy },
      generationProgress: { completedPageKeys: ['home'] },
    };
    const h = installFetch({ loadDraftBody: { finalContent: resumable } });

    const result = await runWorkLLMGeneration(baseInput());
    expect(result.status).toBe('done');
    // home was already complete ⇒ only the remaining pages get a copy call.
    expect(h.copyPages).toEqual(['work', 'contact']);
    expect(finalizeMultiPageGeneration).toHaveBeenCalledTimes(1);
  });
});

// ── Degraded-meta threading ──────────────────────────────────────────────────

describe('runWorkLLMGeneration — degraded meta threading', () => {
  it('threads mock/incomplete up: any mock ⇒ mock, any incomplete ⇒ !complete', async () => {
    installFetch({
      metaQueue: [
        { mock: false, complete: true },
        { mock: true, complete: false, missingSections: ['work'] },
        { mock: false, complete: true },
      ],
    });
    const result = await runWorkLLMGeneration(baseInput());
    expect(result.status).toBe('done');
    expect(result.meta?.mock).toBe(true);
    expect(result.meta?.complete).toBe(false);
    expect(result.meta?.missingSections).toContain('work');
  });

  it('all-clean pages ⇒ meta complete, not mock', async () => {
    installFetch({
      metaQueue: [
        { mock: false, complete: true },
        { mock: false, complete: true },
        { mock: false, complete: true },
      ],
    });
    const result = await runWorkLLMGeneration(baseInput());
    expect(result.meta?.mock).toBe(false);
    expect(result.meta?.complete).toBe(true);
  });
});

// ── Failure propagation ──────────────────────────────────────────────────────

describe('runWorkLLMGeneration — failures', () => {
  it('returns credits when a copy call 402s', async () => {
    global.fetch = vi.fn(async (url: any) => {
      const u = String(url);
      if (u.includes('/api/loadDraft')) return makeResponse({});
      if (u.includes('/api/audience/work/generate-copy')) {
        return makeResponse({ success: false, error: 'out of credits' }, false, 402);
      }
      return makeResponse({ success: true, data: makeStrategy() });
    }) as any;
    const result = await runWorkLLMGeneration(baseInput());
    expect(result.status).toBe('credits');
    // No finalize on an aborted run.
    expect(finalizeMultiPageGeneration).not.toHaveBeenCalled();
  });

  it('returns error (and no finalize) when strategy fails', async () => {
    global.fetch = vi.fn(async (url: any) => {
      const u = String(url);
      if (u.includes('/api/loadDraft')) return makeResponse({});
      if (u.includes('/api/audience/work/strategy')) {
        return makeResponse({ success: false, message: 'boom' }, false, 500);
      }
      throw new Error('should not reach copy');
    }) as any;
    const result = await runWorkLLMGeneration(baseInput({ strategy: null }));
    expect(result.status).toBe('error');
    expect(finalizeMultiPageGeneration).not.toHaveBeenCalled();
  });
});

// ── Works binding fan-out (work-onboarding E2 / phase 1) ─────────────────────
// Drives the EXTRACTED runWorksFanOut directly. Fixture caps ['works'] ⇒ fires
// (wiring); real templateMeta caps (no `works`) ⇒ fan-out no-op (dormancy).

describe('runWorksFanOut — wiring + dormancy', () => {
  const PHOTO_BRIEF = {
    facts: {
      work: {
        identity: { name: 'K' },
        groups: [
          { name: 'Weddings', kind: 'category', price: { mode: 'on-request' },
            photos: [{ id: 'w1', url: 'https://cdn/w1.jpg', cover: true }, { id: 'w2', url: 'https://cdn/w2.jpg' }] },
        ],
      },
    },
  } as any;

  /** fc with a home work gallery card named 'Weddings' + a resume marker. */
  function fcWithGallery() {
    return {
      content: { 'work-1': { id: 'work-1', elements: { groups: [{ id: 'g1', name: 'Weddings', cover_image: '', href: '#work' }] } } },
      pages: {},
      onboardingData: {},
      generationProgress: { completedPageKeys: [] },
    };
  }

  it('WIRING: fixture caps [works] ⇒ builds /works pages + stamps covers/href', async () => {
    const fc = fcWithGallery();
    const r = await runWorksFanOut(fc, baseInput({ brief: PHOTO_BRIEF }), ['works'], async () => {});
    expect(r.status).toBe('done');
    // item + catalog pages built
    expect(fc.pages['page-weddings']).toBeTruthy();
    const item = (fc.pages['page-weddings'] as any);
    const sec = item.content[item.sections[0]];
    expect(sec.type).toBe('workdetail');
    expect(sec.elements.photos).toHaveLength(2); // VERBATIM
    // gallery card stamped: cover (cover:true) + href (item page exists)
    const card = (fc.content['work-1'] as any).elements.groups[0];
    expect(card.cover_image).toBe('https://cdn/w1.jpg');
    expect(card.href).toBe('/works/weddings');
    // entries persisted for resume
    expect((fc.onboardingData as any).collections.works).toHaveLength(1);
  });

  it('DORMANCY: real atelier caps (no `works`) ⇒ no /works pages; fan-out gated', async () => {
    const fc = fcWithGallery();
    const caps = templateMeta['atelier' as keyof typeof templateMeta].capabilities;
    expect(caps).not.toContain('works'); // guard the premise
    await runWorksFanOut(fc, baseInput({ brief: PHOTO_BRIEF }), caps, async () => {});
    expect(fc.pages['page-weddings']).toBeUndefined(); // fan-out dormant
    // cover stamping IS capability-independent (D7a), href is NOT (no item page)
    const card = (fc.content['work-1'] as any).elements.groups[0];
    expect(card.cover_image).toBe('https://cdn/w1.jpg');
    expect(card.href).toBe('#work'); // left as-is — no /works page exists
  });

  it('BYTE-IDENTICAL: no photos/groups ⇒ fc untouched (P1 prod reality)', async () => {
    const fc = fcWithGallery();
    const before = JSON.stringify(fc);
    const caps = templateMeta['atelier' as keyof typeof templateMeta].capabilities;
    const r = await runWorksFanOut(fc, baseInput({ brief: BRIEF }), caps, async () => {
      throw new Error('persist must not be called on the empty fast path');
    });
    expect(r.status).toBe('done');
    expect(JSON.stringify(fc)).toBe(before);
  });
});

// ── Dispatch guard (byte-identical routing proof; plan step 4 / N4) ───────────

describe('workCopyEngineEnabled + resolveWorkRoute (allow-list guard)', () => {
  const ORIG = process.env.NEXT_PUBLIC_WORK_COPY_ENGINE;
  afterEach(() => {
    if (ORIG === undefined) delete process.env.NEXT_PUBLIC_WORK_COPY_ENGINE;
    else process.env.NEXT_PUBLIC_WORK_COPY_ENGINE = ORIG;
  });

  it('allow-list is exactly [atelier]', () => {
    expect([...WORK_COPY_ENGINE_TEMPLATES]).toEqual(['atelier']);
  });

  it('flag OFF (default) ⇒ disabled for every template', () => {
    delete process.env.NEXT_PUBLIC_WORK_COPY_ENGINE;
    expect(workCopyEngineEnabled('atelier')).toBe(false);
    expect(workCopyEngineEnabled('lumen')).toBe(false);
  });

  it('flag ON ⇒ enabled ONLY for allow-listed templates', () => {
    process.env.NEXT_PUBLIC_WORK_COPY_ENGINE = 'true';
    expect(workCopyEngineEnabled('atelier')).toBe(true);
    expect(workCopyEngineEnabled('lumen')).toBe(false);
    expect(workCopyEngineEnabled(null)).toBe(false);
  });

  // The 4 byte-identical routing cases the orchestrator mandated.
  it('(a) granth (not multipage) ⇒ granth-generator regardless of flag', () => {
    process.env.NEXT_PUBLIC_WORK_COPY_ENGINE = 'true';
    expect(resolveWorkRoute({ isWorkMultipage: false, templateId: 'granth' })).toBe(
      'granth-generator'
    );
  });

  it('(b) flag OFF + work-multipage ⇒ skeleton (unchanged)', () => {
    delete process.env.NEXT_PUBLIC_WORK_COPY_ENGINE;
    expect(resolveWorkRoute({ isWorkMultipage: true, templateId: 'atelier' })).toBe('skeleton');
  });

  it('(c) flag ON + non-atelier multipage ⇒ skeleton (unchanged)', () => {
    process.env.NEXT_PUBLIC_WORK_COPY_ENGINE = 'true';
    expect(resolveWorkRoute({ isWorkMultipage: true, templateId: 'lumen' })).toBe('skeleton');
  });

  it('(d) flag ON + atelier multipage ⇒ llm-fanout', () => {
    process.env.NEXT_PUBLIC_WORK_COPY_ENGINE = 'true';
    expect(resolveWorkRoute({ isWorkMultipage: true, templateId: 'atelier' })).toBe('llm-fanout');
  });
});
