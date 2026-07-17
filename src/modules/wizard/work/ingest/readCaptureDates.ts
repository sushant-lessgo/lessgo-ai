// src/modules/wizard/work/ingest/readCaptureDates.ts
// ============================================================================
// EXIF CAPTURE-DATE READER (work-onboarding-ingestion E2 · D4).
//
// Thin wrapper over `exifr`. `File → Date | null`, read CLIENT-SIDE from the
// ORIGINAL File bytes, PRE-UPLOAD.
//
// ── WHY PRE-UPLOAD (D4, do NOT move this) ───────────────────────────────────
//   The upload pipeline (`processImage`, src/lib/media/pipeline.ts) re-encodes
//   to WebP and STRIPS EXIF. Reading a capture date after upload is impossible.
//   So `ShowWorkStep` reads dates off the raw `File` list at change time, then
//   feeds them to `proposeGroups` — never off the uploaded url.
//
// ── FIREWALL / BUNDLE ───────────────────────────────────────────────────────
//   `exifr` is pulled ONLY here, and this module is reached ONLY through the
//   engine `ShowWorkStep` (loaded via the seam's DYNAMIC `loadStep` at STEP 02,
//   post-confirm). It never lands on the pre-confirm entry bundle — the seam
//   (`engines/work.ts`) does not statically import it (journeyAgnostic guard).
//
//   Tree-shake: we ask exifr for the single `DateTimeOriginal` tag only (`pick`),
//   so it parses the minimum IFD instead of the whole metadata block.
// ============================================================================

import exifr from 'exifr';

/**
 * Read one file's EXIF `DateTimeOriginal`. Returns `null` for anything without a
 * valid capture date (PNGs, screenshots, stripped/edited files, parse errors) —
 * never throws. A `null` here is an honest "no date signal", which
 * `proposeGroups` handles (folder paths first, then a "Gallery" fallback).
 */
export async function readCaptureDate(file: File): Promise<Date | null> {
  try {
    // `pick` limits exifr to the one tag we consume — the DateTimeOriginal-only
    // build (D4). `reviveValues` (exifr default) hands us a real `Date`.
    const parsed = await exifr.parse(file, { pick: ['DateTimeOriginal'] });
    const value = parsed?.DateTimeOriginal;
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    return null;
  } catch {
    return null;
  }
}

/** Read capture dates for a list of files, index-aligned with the input. */
export async function readCaptureDates(files: File[]): Promise<(Date | null)[]> {
  return Promise.all(files.map((f) => readCaptureDate(f)));
}
