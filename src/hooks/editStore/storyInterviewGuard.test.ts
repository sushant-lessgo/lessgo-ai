// work-copy-engine phase 6 (review-fix) — regenerateStoryFromInterview target guard.
// The story-interview action is an untyped-cast entry point; it must only ever
// touch an `about` (story) section. A mis-targeted call must no-op WITHOUT hitting
// the network (no fetch, no isGenerating flip), so a stray call can never rewrite
// hero/proof/etc via the work-story route.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createEditStore } from '@/stores/editStore';

type Store = ReturnType<typeof createEditStore>;

function seedAbout(store: Store) {
  store.getState().loadFromDraft(
    {
      tokenId: 'tok-test',
      title: 'Test',
      finalContent: {
        sections: ['about-1', 'hero-1'],
        sectionLayouts: { 'about-1': 'LayoutA', 'hero-1': 'LayoutA' },
        content: {
          'about-1': { id: 'about-1', layout: 'LayoutA', elements: {} },
          'hero-1': { id: 'hero-1', layout: 'LayoutA', elements: {} },
        },
        theme: {},
      },
    },
    'tok-test',
  );
}

describe('regenerateStoryFromInterview target guard', () => {
  let store: Store;
  let fetchSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  const answers = { origin: 'o', moment: 'm', belief: 'b' };

  beforeEach(() => {
    store = createEditStore('tok-test');
    seedAbout(store);
    fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ content: {} }),
    } as unknown as Response);
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('no-ops on a non-about section without hitting the network', async () => {
    await (store.getState() as any).regenerateStoryFromInterview('hero-1', answers, {});
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(store.getState().aiGeneration.isGenerating).toBe(false);
  });

  it('proceeds (reaches fetch) for an about section', async () => {
    await (store.getState() as any).regenerateStoryFromInterview('about-1', answers, {});
    // (an autosave fetch may also fire; assert the story endpoint was hit)
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/audience/work/regenerate-story',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
