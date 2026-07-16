import { describe, it, expect, vi, beforeEach } from 'vitest';

const upsert = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: { mediaAsset: { upsert: (...args: unknown[]) => upsert(...args) } },
}));

import { recordMediaAsset, recordMediaAssetBestEffort } from './registry';
import type { RecordMediaAssetInput } from './registry';

const input: RecordMediaAssetInput = {
  projectId: 'proj_1',
  tokenId: 'tok_1',
  userId: 'user_clerk_1',
  url: 'https://blob.example/uploads/tok_1/1-abc.webp',
  source: 'upload',
  width: 800,
  height: 600,
  bytes: 1234,
  format: 'webp',
  blurDataUrl: 'data:image/webp;base64,AAAA',
  checksum: 'a'.repeat(64),
};

beforeEach(() => {
  upsert.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('recordMediaAsset (strict)', () => {
  it('upserts on the tokenId_url compound unique and returns the id', async () => {
    upsert.mockResolvedValue({ id: 'asset_1' });

    const id = await recordMediaAsset(input);

    expect(id).toBe('asset_1');
    const arg = upsert.mock.calls[0][0];
    expect(arg.where).toEqual({ tokenId_url: { tokenId: 'tok_1', url: input.url } });
    expect(arg.create).toMatchObject({
      projectId: 'proj_1',
      tokenId: 'tok_1',
      userId: 'user_clerk_1',
      source: 'upload',
      bytes: 1234,
      format: 'webp',
    });
  });

  it('un-hides on the update arm (no resurrection bug: re-picking must restore the tile)', async () => {
    upsert.mockResolvedValue({ id: 'asset_1' });

    await recordMediaAsset(input);

    expect(upsert.mock.calls[0][0].update).toEqual({ hiddenAt: null });
  });

  it('normalizes omitted optional fields to null', async () => {
    upsert.mockResolvedValue({ id: 'asset_2' });

    // The proxy cache-hit shape: bytes from blobs[0].size, everything else unobtainable.
    await recordMediaAsset({
      projectId: 'proj_1',
      tokenId: 'tok_1',
      userId: 'user_clerk_1',
      url: 'https://blob.example/uploads/tok_1/pexels-42.webp',
      source: 'stock',
      bytes: 999,
      format: 'webp',
    });

    expect(upsert.mock.calls[0][0].create).toMatchObject({
      sourceUrl: null,
      width: null,
      height: null,
      blurDataUrl: null,
      checksum: null,
      alt: null,
      bytes: 999,
    });
  });

  it('THROWS on a DB failure — E2 needs the row, so it must not be silently lost', async () => {
    upsert.mockRejectedValue(new Error('db down'));

    await expect(recordMediaAsset(input)).rejects.toThrow('db down');
  });
});

describe('recordMediaAssetBestEffort', () => {
  it('returns the id on success', async () => {
    upsert.mockResolvedValue({ id: 'asset_3' });

    await expect(recordMediaAssetBestEffort(input)).resolves.toBe('asset_3');
  });

  it('swallows DB failures and returns null — an upload must never fail on the row', async () => {
    upsert.mockRejectedValue(new Error('db down'));

    await expect(recordMediaAssetBestEffort(input)).resolves.toBeNull();
    expect(console.error).toHaveBeenCalled();
  });
});
