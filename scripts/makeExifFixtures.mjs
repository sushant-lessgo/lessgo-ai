// scripts/makeExifFixtures.mjs
// ============================================================================
// EXIF FIXTURE GENERATOR (work-onboarding-ingestion E2).
//
// Generates the small binary fixtures the STEP-02 e2e uses to exercise same-day
// EXIF CLUSTERING: two JPEGs with genuine DateTimeOriginal on ONE day, two on a
// SECOND day (⇒ two proposed groups), plus one DATELESS png (⇒ no date signal).
//
// A blank png would NOT exercise clustering — the point is REAL DateTimeOriginal
// in the file's APP1 EXIF segment, written via sharp's `withExif`.
//
// Run:  node scripts/makeExifFixtures.mjs
// Both the script AND its output binaries are committed (fixtures are inputs).
// ============================================================================

import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const OUT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../e2e/fixtures/images'
);
mkdirSync(OUT, { recursive: true });

// DateTimeOriginal lives in the Exif SubIFD (sharp: IFD2). Format: 'YYYY:MM:DD HH:MM:SS'.
const jpeg = (name, r, g, b, dateTimeOriginal) =>
  sharp({ create: { width: 48, height: 48, channels: 3, background: { r, g, b } } })
    .jpeg({ quality: 80 })
    .withExif({ IFD2: { DateTimeOriginal: dateTimeOriginal } })
    .toFile(path.join(OUT, name));

const png = (name, r, g, b) =>
  sharp({ create: { width: 48, height: 48, channels: 3, background: { r, g, b } } })
    .png()
    .toFile(path.join(OUT, name));

async function main() {
  await Promise.all([
    // Day 1 — 2023-06-14
    jpeg('exif-day1-a.jpg', 200, 60, 60, '2023:06:14 09:30:00'),
    jpeg('exif-day1-b.jpg', 210, 70, 70, '2023:06:14 16:45:00'),
    // Day 2 — 2023-06-20
    jpeg('exif-day2-a.jpg', 60, 120, 200, '2023:06:20 10:15:00'),
    jpeg('exif-day2-b.jpg', 70, 130, 210, '2023:06:20 18:05:00'),
    // Dateless
    png('no-exif.png', 120, 120, 120),
  ]);
  console.log(`Wrote EXIF fixtures to ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
