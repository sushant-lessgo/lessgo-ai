// perf-03 phase 2 — write-layer base64/blob guard.
// Covers: the pure sync check, the store-level write refusal (old value kept),
// and the store auto-upload adapter (data:/blob: → File → delegates to uploadImage).

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isForbiddenImageSrc } from './imageWriteGuard';
import { createEditStore } from '@/stores/editStore';

type Store = ReturnType<typeof createEditStore>;

function seedHome(store: Store) {
  store.getState().loadFromDraft(
    {
      tokenId: 'tok-test',
      title: 'Test',
      finalContent: {
        sections: ['hero-1'],
        sectionLayouts: { 'hero-1': 'LayoutA' },
        content: { 'hero-1': { id: 'hero-1', layout: 'LayoutA', elements: {} } },
        theme: {},
      },
    },
    'tok-test',
  );
}

describe('isForbiddenImageSrc (pure sync check)', () => {
  it('rejects base64 data image URIs', () => {
    expect(isForbiddenImageSrc('data:image/png;base64,iVBORw0KGgo=')).toBe(true);
    expect(isForbiddenImageSrc('data:image/jpeg;base64,/9j/4AAQ')).toBe(true);
  });

  it('rejects ephemeral blob object URLs', () => {
    expect(isForbiddenImageSrc('blob:http://localhost:3000/abc-123')).toBe(true);
    expect(isForbiddenImageSrc('blob:')).toBe(true);
  });

  it('allows https URLs, relative paths, and empty string', () => {
    expect(isForbiddenImageSrc('https://blob.vercel-storage.com/x.webp')).toBe(false);
    expect(isForbiddenImageSrc('/relative/path.png')).toBe(false);
    expect(isForbiddenImageSrc('')).toBe(false);
  });

  it('does not treat non-image data URIs as forbidden', () => {
    // Only image data URIs are the target; other data: URIs never reach content.
    expect(isForbiddenImageSrc('data:text/plain;base64,SGk=')).toBe(false);
  });
});

describe('updateElementContent write-layer guard', () => {
  let store: Store;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    store = createEditStore('tok-test');
    seedHome(store);
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('refuses a data:image write and preserves the old value', () => {
    store.getState().updateElementContent('hero-1', 'hero_image', 'https://good.example/x.webp');
    expect(store.getState().content['hero-1'].elements.hero_image).toBe('https://good.example/x.webp');

    store.getState().updateElementContent('hero-1', 'hero_image', 'data:image/png;base64,AAAA');
    expect(store.getState().content['hero-1'].elements.hero_image).toBe('https://good.example/x.webp');
  });

  it('refuses a blob: write and preserves the old value', () => {
    store.getState().updateElementContent('hero-1', 'hero_image', 'https://good.example/x.webp');
    store.getState().updateElementContent('hero-1', 'hero_image', 'blob:http://localhost/xyz');
    expect(store.getState().content['hero-1'].elements.hero_image).toBe('https://good.example/x.webp');
  });

  it('still allows normal URL/text writes', () => {
    store.getState().updateElementContent('hero-1', 'headline', 'Hello world');
    expect(store.getState().content['hero-1'].elements.headline).toBe('Hello world');
  });
});

describe('uploadImageFromObjectUrl adapter', () => {
  let store: Store;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    store = createEditStore('tok-test');
    seedHome(store);
    fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['fake-bytes'], { type: 'image/png' }),
    } as unknown as Response);
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('converts a blob: URL into a File and delegates to uploadImage with the target', async () => {
    const uploadSpy = vi.fn().mockResolvedValue('https://blob.vercel-storage.com/permanent.webp');
    store.setState({ uploadImage: uploadSpy } as any);

    const result = await (store.getState() as any).uploadImageFromObjectUrl(
      'blob:http://localhost/ephemeral',
      { sectionId: 'hero-1', elementKey: 'hero_image' },
    );

    expect(fetchSpy).toHaveBeenCalledWith('blob:http://localhost/ephemeral');
    expect(uploadSpy).toHaveBeenCalledTimes(1);
    const [fileArg, targetArg] = uploadSpy.mock.calls[0];
    expect(fileArg).toBeInstanceOf(File);
    expect((fileArg as File).type).toBe('image/png');
    expect(targetArg).toEqual({ sectionId: 'hero-1', elementKey: 'hero_image' });
    expect(result).toBe('https://blob.vercel-storage.com/permanent.webp');
  });

  it('converts a data:image URL into a File and delegates to uploadImage', async () => {
    const uploadSpy = vi.fn().mockResolvedValue('https://blob.vercel-storage.com/permanent2.webp');
    store.setState({ uploadImage: uploadSpy } as any);

    await (store.getState() as any).uploadImageFromObjectUrl(
      'data:image/png;base64,AAAA',
      { sectionId: 'hero-1', elementKey: 'center_hero_image' },
    );

    expect(uploadSpy).toHaveBeenCalledTimes(1);
    const [fileArg, targetArg] = uploadSpy.mock.calls[0];
    expect(fileArg).toBeInstanceOf(File);
    expect(targetArg).toEqual({ sectionId: 'hero-1', elementKey: 'center_hero_image' });
  });
});
