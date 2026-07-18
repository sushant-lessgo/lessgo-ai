// ============================================================================
// readCaptureDates — the EXIF DateTimeOriginal reader (E2 · D4, CF-2).
//
// Cheap insurance for the ONE thing this wrapper promises: a dated JPEG yields a
// real Date, and a PNG / dateless file yields null (never a throw). Previously
// only e2e exercised it; this pins it deterministically off the committed EXIF
// fixtures (scripts/makeExifFixtures.mjs).
// ============================================================================

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { readCaptureDate, readCaptureDates } from './readCaptureDates';

const FIXTURES = path.resolve('e2e/fixtures/images');

/** Build a jsdom File from a committed fixture (exifr reads via Blob.arrayBuffer). */
function fileFrom(name: string, type: string): File {
  const bytes = readFileSync(path.join(FIXTURES, name));
  return new File([new Uint8Array(bytes)], name, { type });
}

describe('readCaptureDate', () => {
  it('reads DateTimeOriginal off a dated JPEG as a real Date (2023-06-14)', async () => {
    const d = await readCaptureDate(fileFrom('exif-day1-a.jpg', 'image/jpeg'));
    expect(d).toBeInstanceOf(Date);
    // Local calendar components (the reader is timezone-stable by construction).
    expect(d!.getFullYear()).toBe(2023);
    expect(d!.getMonth() + 1).toBe(6);
    expect(d!.getDate()).toBe(14);
  });

  it('returns null for a dateless PNG (no date signal — never a throw)', async () => {
    const d = await readCaptureDate(fileFrom('no-exif.png', 'image/png'));
    expect(d).toBeNull();
  });
});

describe('readCaptureDates', () => {
  it('is index-aligned with the input (dated JPEG → Date, PNG → null)', async () => {
    const files = [
      fileFrom('exif-day2-a.jpg', 'image/jpeg'),
      fileFrom('no-exif.png', 'image/png'),
    ];
    const dates = await readCaptureDates(files);
    expect(dates).toHaveLength(2);
    expect(dates[0]).toBeInstanceOf(Date);
    expect(dates[0]!.getDate()).toBe(20); // 2023-06-20
    expect(dates[1]).toBeNull();
  });
});
