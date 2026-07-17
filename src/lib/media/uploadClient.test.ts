// ============================================================================
// uploadImageFiles — the onboarding bulk upload client (E2 · D3).
//
// A thin caller over the ONE route (`/api/upload-image`). Tests mock `fetch`;
// the point is order-preservation, assetId/blur extraction, per-file failure
// isolation, progress, and that it POSTs file + tokenId as multipart.
// ============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { uploadImageFiles } from './uploadClient';

function file(name: string): File {
  return new File([new Uint8Array([1, 2, 3])], name, { type: 'image/jpeg' });
}

function okResponse(url: string, assetId?: string, blurDataUrl?: string) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ success: true, url, metadata: { assetId, blurDataUrl } }),
  } as unknown as Response;
}

const realFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn();
});
afterEach(() => {
  global.fetch = realFetch;
  vi.restoreAllMocks();
});

describe('uploadImageFiles', () => {
  it('uploads every file and PRESERVES input order regardless of settle order', async () => {
    const files = [file('a.jpg'), file('b.jpg'), file('c.jpg')];
    // Resolve b FAST, a SLOW — settle order ≠ input order.
    (global.fetch as any).mockImplementation((_url: string, init: RequestInit) => {
      const name = (init.body as FormData).get('file') as File;
      const delay = name.name === 'a.jpg' ? 20 : 1;
      return new Promise((resolve) =>
        setTimeout(() => resolve(okResponse(`https://cdn/${name.name}`, `id-${name.name}`)), delay)
      );
    });

    const { uploaded, failed } = await uploadImageFiles(files, 'tok_1', { concurrency: 3 });
    expect(failed).toEqual([]);
    expect(uploaded.map((u) => u.file.name)).toEqual(['a.jpg', 'b.jpg', 'c.jpg']);
    expect(uploaded.map((u) => u.url)).toEqual(['https://cdn/a.jpg', 'https://cdn/b.jpg', 'https://cdn/c.jpg']);
  });

  it('extracts assetId + blurDataUrl from metadata', async () => {
    (global.fetch as any).mockResolvedValue(okResponse('https://cdn/x.jpg', 'asset_9', 'data:blur'));
    const { uploaded } = await uploadImageFiles([file('x.jpg')], 'tok_1');
    expect(uploaded[0].assetId).toBe('asset_9');
    expect(uploaded[0].blurDataUrl).toBe('data:blur');
  });

  it('POSTs multipart file + tokenId to /api/upload-image', async () => {
    (global.fetch as any).mockResolvedValue(okResponse('https://cdn/x.jpg'));
    await uploadImageFiles([file('x.jpg')], 'tok_abc');
    const [url, init] = (global.fetch as any).mock.calls[0];
    expect(url).toBe('/api/upload-image');
    expect(init.method).toBe('POST');
    const form = init.body as FormData;
    expect((form.get('file') as File).name).toBe('x.jpg');
    expect(form.get('tokenId')).toBe('tok_abc');
  });

  it('isolates a per-file failure — the batch still returns the successes', async () => {
    (global.fetch as any).mockImplementation((_url: string, init: RequestInit) => {
      const name = ((init.body as FormData).get('file') as File).name;
      if (name === 'bad.jpg') {
        return Promise.resolve({
          ok: false,
          status: 400,
          json: async () => ({ error: 'Invalid file type' }),
        } as unknown as Response);
      }
      return Promise.resolve(okResponse(`https://cdn/${name}`));
    });

    const { uploaded, failed } = await uploadImageFiles([file('good.jpg'), file('bad.jpg')], 'tok_1');
    expect(uploaded.map((u) => u.file.name)).toEqual(['good.jpg']);
    expect(failed.map((f) => f.file.name)).toEqual(['bad.jpg']);
    expect(failed[0].error).toBe('Invalid file type');
  });

  it('reports progress after each file settles', async () => {
    (global.fetch as any).mockResolvedValue(okResponse('https://cdn/x.jpg'));
    const seen: Array<[number, number]> = [];
    await uploadImageFiles([file('a.jpg'), file('b.jpg')], 'tok_1', {
      concurrency: 1,
      onProgress: (done, total) => seen.push([done, total]),
    });
    expect(seen).toEqual([
      [1, 2],
      [2, 2],
    ]);
  });

  it('empty input ⇒ empty result, no fetch', async () => {
    const res = await uploadImageFiles([], 'tok_1');
    expect(res).toEqual({ uploaded: [], failed: [] });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
