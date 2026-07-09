// scale-08 phase 2 — pipeline guard test.
//
// Locks in the businessType-config melt of the manufacturer↔vestria hack:
//   (a) ZERO `isManufacturerFlow` anywhere in src (the helper is DELETED — the
//       remap now reads `businessTypes[key].extractionSchemaKey === 'manufacturer'`).
//   (b) The literal `templateId === 'vestria'` (either operand order) may appear
//       ONLY in an explicit render-layer allowlist — never in the generation
//       pipeline. Copy voice, field remap, block selection, and structure are
//       all keyed off the businessType config now, not the template id.
//
// SCOPE (intentional, per scale-08 plan step 8): this guard enforces the
// `'vestria'` literal half of acceptance + the `isManufacturerFlow` ban. It is
// NOT a general `templateId ===` ban — other render-layer / static-export
// dispatch on templateId is deliberately outside this guard:
//   • thing.ts `templateId === 'techpremium'` (:443) — deterministic TechPremium
//     path, a KNOWN pipeline exception left as-is this feature (future melt
//     candidate). The guard keys on the `'vestria'` literal so this techpremium
//     string never trips it; this comment records that the gap is intentional.
//   • VestriaThemePopover uses `tid === 'vestria'` (a different identifier) —
//     the regex is anchored on the `templateId ===` form, so render-layer
//     `tid`-based vestria dispatch does not trip it.
//
// The test walks src/ with fs, skipping *.test.* and *.md.

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.resolve(__dirname, '..', '..'); // src/

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      walk(p, acc);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      if (entry.name.includes('.test.')) continue; // skip tests
      acc.push(p);
    }
  }
  return acc;
}

/** src-relative POSIX path for stable allowlist keys across platforms. */
function rel(file: string): string {
  return path.relative(SRC_DIR, file).split(path.sep).join('/');
}

const FILES = walk(SRC_DIR).filter((f) => !f.endsWith('.md'));

describe('scale-08 pipeline guards', () => {
  it('has files to scan (sanity)', () => {
    expect(FILES.length).toBeGreaterThan(100);
  });

  it('no `isManufacturerFlow` anywhere in src (helper deleted, keyed off config)', () => {
    const offenders = FILES.filter((f) => fs.readFileSync(f, 'utf8').includes('isManufacturerFlow'));
    expect(offenders.map(rel)).toEqual([]);
  });

  it("literal `templateId === 'vestria'` only in the render-layer allowlist", () => {
    // Render-layer files where a literal vestria gate is a legitimate UI
    // dispatch (a visual capability, not a generation-pipeline fork).
    const RENDER_LAYER_ALLOWLIST = new Set<string>([
      // Editor layout-change modal: only vestria hero sections offer the
      // hero-layout swap. Pure render-layer UI gate.
      'app/edit/[token]/components/ui/LayoutChangeModal.tsx',
    ]);
    const pattern = /(templateId\s*===\s*'vestria'|'vestria'\s*===\s*templateId)/;
    const offenders = FILES.filter((f) => pattern.test(fs.readFileSync(f, 'utf8')))
      .map(rel)
      .filter((r) => !RENDER_LAYER_ALLOWLIST.has(r));
    expect(offenders).toEqual([]);
  });
});
