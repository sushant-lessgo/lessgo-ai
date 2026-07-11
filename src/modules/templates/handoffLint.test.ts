// src/modules/templates/handoffLint.test.ts
// template-factory phase 5 — the handoff lint acceptance tests.
//
// The load-bearing acceptance criterion: the BROKEN fixture (missing a section
// AND a required slot) fails on BOTH distinct checks; the VALID fixture passes.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { lintHandoff, type LintCheck } from './handoffLint';

function fixture(name: string): string {
  return readFileSync(path.join(__dirname, '__fixtures__', name), 'utf8');
}

const VALID = fixture('handoff-valid.html');
const BROKEN = fixture('handoff-broken.html');

function checks(html: string): LintCheck[] {
  return lintHandoff(html, 'thing').findings.map((f) => f.check);
}

describe('handoffLint', () => {
  it('passes the minimal valid handoff (no findings)', () => {
    const result = lintHandoff(VALID, 'thing');
    expect(result.findings, JSON.stringify(result.findings, null, 2)).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('fails the broken handoff on BOTH missing-section AND missing-required-slot', () => {
    const result = lintHandoff(BROKEN, 'thing');
    expect(result.ok).toBe(false);

    const missingSection = result.findings.filter((f) => f.check === 'missing-section');
    const missingSlot = result.findings.filter((f) => f.check === 'missing-required-slot');

    // Two DISTINCT failures (acceptance criterion).
    expect(missingSection.length).toBeGreaterThan(0);
    expect(missingSlot.length).toBeGreaterThan(0);

    // The specific defects the fixture seeds.
    expect(missingSection.some((f) => f.message.includes('testimonials'))).toBe(true);
    expect(missingSlot.some((f) => f.message.includes('hero') && f.message.includes('headline'))).toBe(true);
  });

  it('broken fixture does NOT report a present-but-slotless section as missing-section', () => {
    // hero is present (only its slot is missing) → hero must NOT appear as a
    // missing-section, proving the two checks are independent.
    const result = lintHandoff(BROKEN, 'thing');
    const missingSection = result.findings.filter((f) => f.check === 'missing-section');
    expect(missingSection.some((f) => f.message.includes('"hero"') || f.message.includes('="hero"'))).toBe(false);
  });

  it('required-slot check is section-scoped (a shared slot key in another section does not satisfy it)', () => {
    // `headline` exists in `features` in the broken fixture, but hero still lacks
    // its own → the check must not be satisfied globally.
    const result = lintHandoff(BROKEN, 'thing');
    const heroSlot = result.findings.find(
      (f) => f.check === 'missing-required-slot' && f.message.includes('hero') && f.message.includes('headline')
    );
    expect(heroSlot).toBeDefined();
  });

  it('flags an external stylesheet/script/font URL (not self-contained)', () => {
    const withExternal = VALID.replace(
      '</head>',
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter" /></head>'
    );
    expect(checks(withExternal)).toContain<LintCheck>('self-contained');
  });

  it('flags a non-self-hosted font family', () => {
    const withBadFont = VALID.replace("'Fraunces', serif", "'Comic Sans MS', serif");
    const findings = lintHandoff(withBadFont, 'thing').findings;
    expect(findings.some((f) => f.check === 'font' && f.message.includes('Comic Sans MS'))).toBe(true);
  });

  it('flags missing structural axes (:root / palette / variant / knob)', () => {
    const noAxes = '<html><body><header data-section="header"></header></body></html>';
    const axisFindings = lintHandoff(noAxes, 'thing').findings.filter((f) => f.check === 'axis');
    // :root, [data-palette], [data-variant], data-knob-* → 4 axis findings.
    expect(axisFindings.length).toBe(4);
  });

  it('accepts data-element-key as a matching element for a slot', () => {
    // features.kicker is expressed via data-element-key in the valid fixture and
    // still passes — proves the "matching element" acceptance path.
    expect(VALID).toContain('data-element-key="features.kicker"');
    expect(lintHandoff(VALID, 'thing').ok).toBe(true);
  });
});
