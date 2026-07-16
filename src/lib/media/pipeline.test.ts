// @vitest-environment node
// sharp is a native module — jsdom's environment can upset it, and there is nothing DOM-y here.

import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import sharp from 'sharp';
import { put } from '@vercel/blob';
import { processImage, storeImage, checksumOf, MAX_WIDTH, SVG_MIME } from './pipeline';

vi.mock('@vercel/blob', () => ({
  put: vi.fn(async (key: string) => ({ url: `https://blob.example.com/${key}` })),
}));

async function makeRaster(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 200, g: 100, b: 50 },
    },
  })
    .png()
    .toBuffer();
}

const SVG = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60"><rect width="120" height="60" fill="#123456"/></svg>'
);

describe('processImage — raster', () => {
  let small: Buffer;

  beforeAll(async () => {
    small = await makeRaster(400, 300);
  });

  it('converts to webp and reports dimensions + bytes', async () => {
    const result = await processImage(small, 'image/png');

    expect(result.format).toBe('webp');
    expect(result.extension).toBe('webp');
    expect(result.contentType).toBe('image/webp');
    expect(result.width).toBe(400);
    expect(result.height).toBe(300);
    expect(result.bytes).toBe(result.buffer.length);

    const meta = await sharp(result.buffer).metadata();
    expect(meta.format).toBe('webp');
  });

  it('emits a base64 webp blur placeholder', async () => {
    const result = await processImage(small, 'image/png');

    expect(result.blurDataUrl).toMatch(/^data:image\/webp;base64,/);
    // Micro-thumb: must be small enough to live comfortably inside a DB row.
    expect(result.blurDataUrl!.length).toBeLessThan(2000);
  });

  it('does not enlarge images smaller than MAX_WIDTH', async () => {
    const result = await processImage(small, 'image/png');
    expect(result.width).toBe(400);
  });

  it('clamps oversize images to MAX_WIDTH preserving aspect ratio', async () => {
    const oversize = await makeRaster(MAX_WIDTH + 1000, 1700);
    const result = await processImage(oversize, 'image/png');

    expect(result.width).toBe(MAX_WIDTH);
    expect(result.height).toBeLessThan(1700);
  });

  it('produces a stable checksum for identical buffers and a different one otherwise', async () => {
    const a = await processImage(small, 'image/png');
    const b = await processImage(small, 'image/png');
    const other = await processImage(await makeRaster(410, 300), 'image/png');

    expect(a.checksum).toBe(b.checksum);
    expect(a.checksum).not.toBe(other.checksum);
    expect(a.checksum).toHaveLength(64);
    // checksum is of the PROCESSED buffer, not the input
    expect(a.checksum).toBe(checksumOf(a.buffer));
  });
});

// Why this suite exists: `/api/proxy-image` derives its cache-lookup `cacheKey`
// INDEPENDENTLY of storeImage. If the key written here ever drifts from the key looked
// up there, the cache silently never hits — every stock pick re-fetches Pexels and no
// other test fails. The exact `uploads/{tokenId}/{filename}` key is the contract.
describe('storeImage', () => {
  const ORIGINAL_ENV = process.env.NODE_ENV;
  const ORIGINAL_BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

  afterEach(async () => {
    vi.mocked(put).mockClear();
    vi.restoreAllMocks();
    // NODE_ENV is readonly in the type, not at runtime.
    (process.env as Record<string, string | undefined>).NODE_ENV = ORIGINAL_ENV;
    if (ORIGINAL_BLOB_TOKEN === undefined) delete process.env.BLOB_READ_WRITE_TOKEN;
    else process.env.BLOB_READ_WRITE_TOKEN = ORIGINAL_BLOB_TOKEN;
  });

  it('uploads to blob under exactly uploads/{tokenId}/{filename}', async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    process.env.BLOB_READ_WRITE_TOKEN = 'test-blob-token';

    const buffer = Buffer.from('bytes');
    const result = await storeImage(buffer, {
      tokenId: 'tok123',
      filename: 'pexels-42.webp',
      contentType: 'image/webp',
    });

    expect(put).toHaveBeenCalledTimes(1);
    const [key, body, opts] = vi.mocked(put).mock.calls[0];
    // The contract proxy-image's cacheKey mirrors. Do not "tidy" this string.
    expect(key).toBe('uploads/tok123/pexels-42.webp');
    expect(body).toBe(buffer);
    expect(opts).toMatchObject({
      access: 'public',
      contentType: 'image/webp',
      addRandomSuffix: false,
    });
    expect(result.storage).toBe('blob');
    expect(result.url).toBe('https://blob.example.com/uploads/tok123/pexels-42.webp');
  });

  it('falls back to the dev filesystem when dev has no blob token', async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'development';
    delete process.env.BLOB_READ_WRITE_TOKEN;

    const os = await import('os');
    const fs = await import('fs/promises');
    const path = await import('path');
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'pipeline-test-'));
    vi.spyOn(process, 'cwd').mockReturnValue(cwd);

    const buffer = Buffer.from('dev bytes');
    const result = await storeImage(buffer, {
      tokenId: 'tok123',
      filename: 'local.webp',
      contentType: 'image/webp',
    });

    expect(put).not.toHaveBeenCalled();
    expect(result.storage).toBe('dev-fs');
    // Relative URL — the registry stores it verbatim, so the picker grid must cope.
    expect(result.url).toBe('/uploads/tok123/local.webp');

    const written = await fs.readFile(path.join(cwd, 'public', 'uploads', 'tok123', 'local.webp'));
    expect(written.equals(buffer)).toBe(true);

    await fs.rm(cwd, { recursive: true, force: true });
  });

  it('uses blob in dev when a blob token IS present', async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'development';
    process.env.BLOB_READ_WRITE_TOKEN = 'test-blob-token';

    const result = await storeImage(Buffer.from('x'), {
      tokenId: 'tok123',
      filename: 'a.webp',
      contentType: 'image/webp',
    });

    expect(vi.mocked(put).mock.calls[0][0]).toBe('uploads/tok123/a.webp');
    expect(result.storage).toBe('blob');
  });
});

describe('processImage — SVG branch', () => {
  it('passes the buffer through untouched with format svg and no blur', async () => {
    const result = await processImage(SVG, SVG_MIME);

    expect(result.format).toBe('svg');
    expect(result.extension).toBe('svg');
    expect(result.contentType).toBe(SVG_MIME);
    expect(result.blurDataUrl).toBeNull();
    expect(result.buffer).toBe(SVG); // no re-encode: vectors must stay vectors
    expect(result.bytes).toBe(SVG.length);
    expect(result.checksum).toBe(checksumOf(SVG));
  });

  it('reads SVG dimensions best-effort', async () => {
    const result = await processImage(SVG, SVG_MIME);
    expect(result.width).toBe(120);
    expect(result.height).toBe(60);
  });

  it('still stores an unparseable SVG with null dimensions instead of throwing', async () => {
    const junk = Buffer.from('not really an svg at all');
    const result = await processImage(junk, SVG_MIME);

    expect(result.format).toBe('svg');
    expect(result.width).toBeNull();
    expect(result.height).toBeNull();
    expect(result.bytes).toBe(junk.length);
  });
});
