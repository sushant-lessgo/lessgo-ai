// src/modules/templates/anchorLibrary.test.ts
//
// Derived guard for docs/product/anchorLibrary.md — keeps the banned list from
// rotting. It reads the md file and asserts:
//   (1) the banned section ⊇ the LIVE `templateMeta.designStyles` set — so a new
//       template's designStyle that never made it into the doc turns this RED;
//   (2) the 5 default-mode bans are present;
//   (3) there are ≥15 concrete anchors.
// The live designStyle set is IMPORTED (never hardcoded) so the guard actually
// bites when a new template ships. See the doc's "Maintenance rule" header.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { templateMeta } from './templateMeta';

// src/modules/templates → repo root → docs/product/anchorLibrary.md
const DOC_PATH = path.join(__dirname, '../../../docs/product/anchorLibrary.md');
const doc = readFileSync(DOC_PATH, 'utf8');

// Extract the "## Banned fingerprints" section (up to the next top-level "## ",
// or EOF).
function bannedSection(md: string): string {
  const start = md.indexOf('## Banned fingerprints');
  expect(start, 'anchorLibrary.md must have a "## Banned fingerprints" section').toBeGreaterThanOrEqual(0);
  const rest = md.slice(start + '## Banned fingerprints'.length);
  const nextHeading = rest.search(/\n## /);
  return nextHeading === -1 ? rest : rest.slice(0, nextHeading);
}

// Live design-style fingerprints across every template (retired/empty naturally
// contribute nothing). Deduped, since editorial-craft is shared.
const liveDesignStyles = Array.from(
  new Set(Object.values(templateMeta).flatMap((m) => m.designStyles)),
).sort();

describe('anchorLibrary.md — derived banned-list guard', () => {
  const banned = bannedSection(doc);

  it('has a non-empty banned section', () => {
    expect(banned.trim().length).toBeGreaterThan(0);
  });

  it('banned list ⊇ every LIVE templateMeta.designStyles value', () => {
    // Sanity: we actually have live styles to guard against.
    expect(liveDesignStyles.length).toBeGreaterThan(0);
    for (const style of liveDesignStyles) {
      expect(
        banned.includes(style),
        `designStyle "${style}" is live in templateMeta but MISSING from the banned list in anchorLibrary.md — add it (see the doc's derivation rule).`,
      ).toBe(true);
    }
  });

  it('lists the 5 default-mode bans', () => {
    const defaultBans: Array<[string, RegExp]> = [
      ['Inter', /\bInter\b/],
      ['purple gradients', /purple gradient/i],
      ['glassmorphism', /glassmorphism/i],
      ['rounded-2xl grids', /rounded-2xl/i],
      ['emoji icons', /emoji/i],
    ];
    for (const [label, re] of defaultBans) {
      expect(re.test(banned), `default-mode ban "${label}" missing from banned section`).toBe(true);
    }
  });

  it('has ≥15 concrete anchors', () => {
    const anchorCount = (doc.match(/<!-- anchor -->/g) || []).length;
    expect(anchorCount).toBeGreaterThanOrEqual(15);
  });
});
