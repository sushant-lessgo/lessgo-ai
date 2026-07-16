// @vitest-environment node
// sharp is a native module — jsdom's environment can upset it, and there is nothing DOM-y here.

import { describe, it, expect, beforeAll } from 'vitest';
import sharp from 'sharp';
import { processImage, checksumOf, MAX_WIDTH, SVG_MIME } from './pipeline';

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
