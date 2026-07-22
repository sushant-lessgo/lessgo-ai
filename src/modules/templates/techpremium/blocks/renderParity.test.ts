/**
 * Dual-renderer colour parity guard for techpremium block pairs.
 *
 * THE TRAP THIS EXISTS FOR: every block is a PAIR — `<Block>.tsx` (edit renderer) and
 * `<Block>.published.tsx` (published renderer). Both inline their own copy of the same CSS.
 * If a colour value is changed on one side only, the page "looks right in the editor but wrong
 * when published" (or vice-versa) and nothing else in the repo catches it.
 *
 * WHAT IT ASSERTS: for each pair, the sorted MULTISET of colour expressions (`oklch(…)` and
 * `color-mix(…)`) extracted from the two source files must be identical.
 *
 * EXTRACTION IS PAREN-BALANCED ON PURPOSE. A naive /color-mix\([^)]*\)/ truncates at the first
 * ')', so `color-mix(in oklch, var(--forest) 50%, transparent)` would capture as
 * `color-mix(in oklch, var(--forest)` — the percentage lives in the DISCARDED tail, and a
 * 50%-vs-55% split between the two renderers would compare EQUAL. That is a green-while-false
 * test. Balanced scanning also keeps nested forms
 * (`color-mix(in oklch, color-mix(…) 92%, transparent)`) intact as one expression.
 *
 * Per-file non-emptiness is asserted so a broken extractor cannot pass green.
 */
import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const BLOCKS_DIR = __dirname;

/** Pairs with inline colour literals. Results is READ-ONLY here — it must not be edited. */
const PAIRS: { name: string; edit: string; published: string }[] = [
  {
    name: 'Hero',
    edit: 'Hero/TechPremiumHero.tsx',
    published: 'Hero/TechPremiumHero.published.tsx',
  },
  {
    name: 'CTA',
    edit: 'CTA/TechPremiumCTA.tsx',
    published: 'CTA/TechPremiumCTA.published.tsx',
  },
  {
    name: 'Pricing',
    edit: 'Pricing/TechPremiumPricing.tsx',
    published: 'Pricing/TechPremiumPricing.published.tsx',
  },
  {
    name: 'Results',
    edit: 'Testimonials/TechPremiumResults.tsx',
    published: 'Testimonials/TechPremiumResults.published.tsx',
  },
];

const FN_START = /\b(?:oklch|color-mix)\(/g;

/**
 * Paren-balanced extraction of every top-level `oklch(…)` / `color-mix(…)` expression.
 * Nested expressions are returned as part of their OUTERMOST expression (scanning resumes
 * after the closing paren), so nesting depth itself is part of what parity compares.
 */
export function extractColourExpressions(source: string): string[] {
  const out: string[] = [];
  FN_START.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = FN_START.exec(source)) !== null) {
    const start = m.index;
    let depth = 0;
    let end = -1;
    for (let i = source.indexOf('(', start); i < source.length; i++) {
      const ch = source[i];
      if (ch === '(') depth++;
      else if (ch === ')') {
        depth--;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }
    if (end === -1) {
      // Unbalanced source — surface it loudly rather than silently dropping the expression.
      throw new Error(`Unbalanced parentheses starting at index ${start}: ${source.slice(start, start + 80)}`);
    }
    out.push(source.slice(start, end));
    FN_START.lastIndex = end; // resume AFTER the whole expression → no double-counting of nesting
  }
  return out;
}

function read(rel: string): string {
  return fs.readFileSync(path.join(BLOCKS_DIR, rel), 'utf8');
}

describe('techpremium dual-renderer colour parity', () => {
  it.each(PAIRS)('$name: .tsx and .published.tsx declare identical colour expressions', (pair) => {
    const editExprs = extractColourExpressions(read(pair.edit));
    const pubExprs = extractColourExpressions(read(pair.published));

    // Inert-test guard: a broken extractor returns [] for both sides and would compare equal.
    expect(editExprs.length).toBeGreaterThan(0);
    expect(pubExprs.length).toBeGreaterThan(0);

    expect([...editExprs].sort()).toEqual([...pubExprs].sort());
  });

  it('the extractor is paren-balanced (guards against the [^)]* truncation bug)', () => {
    const sample =
      'a{color:color-mix(in oklch, var(--forest) 50%, transparent);' +
      'background:color-mix(in oklch, color-mix(in oklch, var(--forest-d) 78%, black) 92%, transparent);' +
      'border-color:oklch(0.66 0.15 150 / 0.30);}';
    expect(extractColourExpressions(sample)).toEqual([
      'color-mix(in oklch, var(--forest) 50%, transparent)',
      'color-mix(in oklch, color-mix(in oklch, var(--forest-d) 78%, black) 92%, transparent)',
      'oklch(0.66 0.15 150 / 0.30)',
    ]);
    // The truncating form would have swallowed the percentage tail — prove the difference.
    expect(extractColourExpressions('color-mix(in oklch, var(--forest) 55%, transparent)')).not.toEqual(
      extractColourExpressions('color-mix(in oklch, var(--forest) 50%, transparent)'),
    );
  });
});
