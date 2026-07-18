// Guard against the 'use client' → published-renderer boundary bug.
//
// A NAMED value imported from a 'use client' module into a published (server)
// renderer resolves to a non-callable/empty client reference — it has silently
// broken twice: functions (→ 500 "F is not a function") and CSS strings (→ empty
// <style>, unstyled published pages). Both are invisible to markup-parity audits.
//
// Rule enforced: a `*.published.tsx` must NOT do `import { X } from './Sibling'`
// when `./Sibling.tsx` is a 'use client' module (and there's no plain `./Sibling.ts`).
// Default-component imports (`import X from './Sibling'`) are the legitimate
// cross-boundary case (client components render server-side) and are allowed.
// Shared helpers/styles must live in a plain (non-'use client') `.ts` module.
//
// ── Boundary enforcement point (cross-reference) ────────────────────────────
// This is the GLOBAL published/client-boundary check for ALL templates — the
// per-template structural suite `src/modules/templates/templateConformance.ts`
// deliberately does NOT reinvent it. This filesystem walk is stronger: it
// covers `*.published.tsx` files in templates not yet enrolled in
// `templateConformance`. Keep it standalone; assertions must stay unweakened.
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const TEMPLATES_DIR = __dirname; // src/modules/templates
// work-skeleton D1: skeleton block wrappers (`src/modules/skeletons/**`) render
// through the SAME two renderers, so their `*.published.tsx` must be boundary-
// checked too. Scanned alongside templates (dir may hold zero published files in
// early phases — the combined list is still non-empty).
const SKELETONS_DIR = path.resolve(__dirname, '..', 'skeletons');

function walkPublished(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walkPublished(p, acc);
    else if (entry.name.endsWith('.published.tsx')) acc.push(p);
  }
  return acc;
}

function firstNonEmptyLine(file: string): string {
  return (fs.readFileSync(file, 'utf8').split('\n').find((l) => l.trim() !== '') || '').trim();
}

describe('published renderers must not import values across the \'use client\' boundary', () => {
  it('no *.published.tsx imports a NAMED value from a \'use client\' sibling', () => {
    const files = [
      ...walkPublished(TEMPLATES_DIR),
      ...(fs.existsSync(SKELETONS_DIR) ? walkPublished(SKELETONS_DIR) : []),
    ];
    expect(files.length).toBeGreaterThan(0); // sanity: we actually scanned something

    const namedSiblingImport = /import\s*\{[^}]*\}\s*from\s*'(\.\/[A-Za-z0-9_]+)'/g;
    const violations: { file: string; import: string }[] = [];

    for (const file of files) {
      const src = fs.readFileSync(file, 'utf8');
      const dir = path.dirname(file);
      let m: RegExpExecArray | null;
      while ((m = namedSiblingImport.exec(src)) !== null) {
        const base = m[1].slice(2); // './X' -> 'X'
        if (fs.existsSync(path.join(dir, `${base}.ts`))) continue; // plain module → safe
        const tsx = path.join(dir, `${base}.tsx`);
        if (fs.existsSync(tsx) && /^['"]use client['"]/.test(firstNonEmptyLine(tsx))) {
          violations.push({ file: path.relative(TEMPLATES_DIR, file), import: m[1] });
        }
      }
    }

    // Message lists offenders so it's actionable; move the value to a plain `.ts`.
    expect(violations, `Published files importing values from a 'use client' sibling:\n${JSON.stringify(violations, null, 2)}`).toEqual([]);
  });
});
