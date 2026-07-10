// src/modules/goals/__tests__/ctaKeyAllowlist.test.ts
// goal-ref-cta phase 1 (D-A mitigation) — mechanical guard against the
// hardcoded-allowlist "forgot-a-spot" risk.
//
// Scans every `.published.tsx` block for CTA metadata call-site element keys
// (the `elementMetadata[KEY].buttonConfig` reads that resolveCtaHref consumes)
// and fails if any key is neither ALLOWLISTED (stamped GOAL_REF) nor
// KNOWN-EXCLUDED. When a new template introduces a genuine primary CTA under a
// new key, this test fails until the key is either added to the stamp allowlist
// (stampGoalRefCtas.ts) or explicitly excluded here.
//
// Handles BOTH call-site syntaxes:
//   • dot access            `md?.cta_text?.buttonConfig`            → `cta_text`
//   • bracket template-lit  `md?.[`packages_cta_${p.id}`]?.buttonConfig`
//                                                                   → `packages_cta_`

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { GOAL_REF_STAMP_KEYS } from '../stampGoalRefCtas';

const SRC_ROOT = path.resolve(__dirname, '../../..'); // src/

/** Element keys that render a CTA but are DELIBERATELY not GOAL_REF-stamped. */
const KNOWN_EXCLUDED_EXACT = new Set(['secondary_cta_text', 'signin_text', 'newsletter_cta']);
/** Dynamic pricing-tier keys (bracket template-literal prefixes) — never stamped. */
const KNOWN_EXCLUDED_PREFIXES = new Set(['tiers_cta_', 'packages_cta_']);

const ALLOWLIST = new Set<string>(GOAL_REF_STAMP_KEYS);

/** Recursively collect every *.published.tsx under a dir. */
function collectPublishedFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectPublishedFiles(full, out);
    else if (entry.name.endsWith('.published.tsx')) out.push(full);
  }
  return out;
}

interface Found {
  file: string;
  key: string;
  kind: 'exact' | 'prefix';
}

/** Extract every CTA metadata key referenced in a file's source. */
function extractCtaKeys(src: string, file: string): Found[] {
  const found: Found[] = [];
  // Dot access: `.<ident>?.buttonConfig`
  const dotRe = /\.([A-Za-z_][A-Za-z0-9_]*)\?\.buttonConfig/g;
  let m: RegExpExecArray | null;
  while ((m = dotRe.exec(src))) found.push({ file, key: m[1], kind: 'exact' });
  // Bracket template-literal: `[`<prefix>${…}`]?.buttonConfig` → static prefix.
  const tplRe = /\[`([A-Za-z0-9_]+?)\$\{[^}]*\}`\]\?\.buttonConfig/g;
  while ((m = tplRe.exec(src))) found.push({ file, key: m[1], kind: 'prefix' });
  return found;
}

describe('CTA key allowlist guard (D-A)', () => {
  const files = collectPublishedFiles(SRC_ROOT);

  it('finds published blocks to scan', () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it('every CTA metadata call-site key is allowlisted or known-excluded', () => {
    const offenders: Found[] = [];
    for (const file of files) {
      const src = fs.readFileSync(file, 'utf8');
      for (const f of extractCtaKeys(src, file)) {
        if (f.kind === 'exact') {
          if (ALLOWLIST.has(f.key) || KNOWN_EXCLUDED_EXACT.has(f.key)) continue;
        } else {
          if (KNOWN_EXCLUDED_PREFIXES.has(f.key)) continue;
        }
        offenders.push(f);
      }
    }
    expect(
      offenders,
      `Unclassified CTA metadata keys found — add to the stamp allowlist ` +
        `(stampGoalRefCtas.ts) or the known-excluded set:\n` +
        offenders.map((o) => `  ${o.key} (${o.kind}) in ${path.relative(SRC_ROOT, o.file)}`).join('\n'),
    ).toEqual([]);
  });

  it('the allowlisted key (cta_text) is actually referenced by real blocks', () => {
    // Sanity: the guard would be vacuous if no block read cta_text.
    let seen = false;
    for (const file of files) {
      if (/\.cta_text\?\.buttonConfig/.test(fs.readFileSync(file, 'utf8'))) {
        seen = true;
        break;
      }
    }
    expect(seen).toBe(true);
    expect(ALLOWLIST.has('cta_text')).toBe(true);
  });
});
