/**
 * Literal census for the techpremium `harbor` palette migration.
 *
 * Walks every `.ts` / `.tsx` source file under `blocks/` and counts RAW `oklch(...)`
 * colour literals by hue.
 *
 *  - Hues 158 / 159 / 140 / 128 are the BAND FAMILY. Slice 2 (phases 2-5) tokenised all
 *    58 of them onto `--forest` / `--forest-d` / `--on-dark` / `--on-dark-2` / `--lime`
 *    derivations, so the page actually switches when `data-palette` flips to `harbor`.
 *    Any raw literal from those hues reappearing is a half-switch regression.
 *  - Hues 150 (ok-status / WhatsApp green), 192 (teal) and 95 (paper @ alpha) are the
 *    spec's explicit SCOPE-OUT (plan § "Common rules for phases 2-5"). They are asserted
 *    at their exact expected counts rather than ignored: the non-zero anchors make future
 *    drift visible AND prove nobody quietly tokenised a scope-out line.
 *
 * NOTE — the `*.test.ts` / `*.test.tsx` exclusion below is LOAD-BEARING, not tidiness.
 * Two test files live under `blocks/` (this one and `renderParity.test.ts`), and
 * `renderParity.test.ts` carries `oklch(0.66 0.15 150 / 0.30)` twice as extractor
 * fixtures. Including test files makes the hue-150 anchor read 13 instead of 11 — a
 * census that counts its own fixtures is an inert assertion.
 */

import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const BLOCKS_DIR = path.join(__dirname);

/** Raw `oklch(` literals only. `color-mix(in oklch, …)` reads "oklch," not "oklch(", so it never matches. */
const OKLCH_LITERAL = /\boklch\(([^)]*)\)/g;

function listSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listSourceFiles(full));
      continue;
    }
    if (!/\.tsx?$/.test(entry.name)) continue;
    if (/\.test\.tsx?$/.test(entry.name)) continue; // LOAD-BEARING — see file header
    out.push(full);
  }
  return out;
}

function listExcludedTestFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listExcludedTestFiles(full));
    else if (/\.test\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

/**
 * `oklch(L C H)` / `oklch(L C H / A)` → the hue term as a number.
 * Returns `null` for anything that does not parse to a finite hue (e.g. a `var()`-driven
 * form), so a doc-comment token can never masquerade as a real hue bucket.
 */
function hueOf(inner: string): number | null {
  const beforeSlash = inner.split('/')[0].trim();
  const parts = beforeSlash.split(/\s+/);
  if (parts.length < 3) return null;
  const hue = Number(parts[2]);
  return Number.isFinite(hue) ? hue : null;
}

interface Occurrence {
  file: string;
  hue: number | null;
  raw: string;
}

function census(): { files: string[]; occurrences: Occurrence[] } {
  const files = listSourceFiles(BLOCKS_DIR);
  const occurrences: Occurrence[] = [];
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    for (const m of src.matchAll(OKLCH_LITERAL)) {
      occurrences.push({
        file: path.relative(BLOCKS_DIR, file).replace(/\\/g, '/'),
        hue: hueOf(m[1]),
        raw: m[0],
      });
    }
  }
  return { files, occurrences };
}

function sitesForHue(occurrences: Occurrence[], hue: number): string[] {
  return occurrences.filter((o) => o.hue === hue).map((o) => `${o.file} :: ${o.raw}`).sort();
}

describe('techpremium blocks — oklch literal census', () => {
  const { files, occurrences } = census();

  // Inert-assertion guards: a broken walker / extractor must not pass green by finding nothing.
  it('the walker and extractor actually found source files and literals', () => {
    expect(files.length).toBeGreaterThan(20);
    expect(occurrences.length).toBeGreaterThan(0);
    expect(occurrences.every((o) => o.raw.startsWith('oklch('))).toBe(true);
  });

  it('the *.test.ts(x) exclusion is real — test files exist under blocks/ and are not scanned', () => {
    const excluded = listExcludedTestFiles(BLOCKS_DIR);
    expect(excluded.length).toBeGreaterThan(0);
    expect(files.some((f) => /\.test\.tsx?$/.test(f))).toBe(false);
  });

  // The band family — every one of these was tokenised in slice 2.
  it.each([158, 159, 140, 128])(
    'hue %i (band family) has ZERO raw oklch literals left',
    (hue) => {
      expect(sitesForHue(occurrences, hue)).toEqual([]);
    },
  );

  // Scope-out anchors — deliberately NOT tokenised (plan § "Common rules for phases 2-5").
  it.each([
    [150, 11], // ok-status / WhatsApp green
    [192, 2], //  teal
    [95, 4], //   paper @ alpha
  ])('hue %i (scope-out) still has exactly %i raw oklch literals', (hue, expected) => {
    const sites = sitesForHue(occurrences, hue);
    expect(sites.length, `hue ${hue} sites:\n${sites.join('\n')}`).toBe(expected);
  });

  it('no unexpected hue buckets exist under blocks/', () => {
    const allowed = new Set([150, 192, 95]);
    const stray = occurrences.filter((o) => o.hue === null || !allowed.has(o.hue));
    expect(stray.map((o) => `${o.file} :: ${o.raw}`)).toEqual([]);
  });
});
