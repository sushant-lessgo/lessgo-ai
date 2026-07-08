// src/modules/goals/copyGuidance.test.ts
// scale-05 phase 3 — the per-intent copy-guidance table + formatter.

import { describe, it, expect } from 'vitest';
import { goalIntents, type GoalIntent } from './vocabulary';
import {
  goalCopyGuidance,
  getGuidanceForIntent,
  getEmphasisForIntent,
} from './copyGuidance';

describe('goalCopyGuidance table', () => {
  it('has an entry for ALL 18 frozen intents (totality)', () => {
    for (const intent of goalIntents) {
      expect(goalCopyGuidance[intent], `missing guidance for ${intent}`).toBeDefined();
    }
    // No extra keys beyond the frozen vocabulary.
    expect(Object.keys(goalCopyGuidance).sort()).toEqual([...goalIntents].sort());
  });

  it('every entry has a non-empty cta and emphasis', () => {
    for (const intent of goalIntents) {
      const g = goalCopyGuidance[intent];
      expect(g.cta.trim().length, `empty cta for ${intent}`).toBeGreaterThan(0);
      expect(g.emphasis.trim().length, `empty emphasis for ${intent}`).toBeGreaterThan(0);
    }
  });

  it('place intents get plain-link guidance only (no subtext)', () => {
    const placeIntents: GoalIntent[] = ['order-via-platform', 'pay-via-link'];
    for (const intent of placeIntents) {
      expect(goalCopyGuidance[intent].subtext).toBeUndefined();
    }
  });

  it('follow-social CTA points to Instagram; manufacturer enquiry emphasises MOQ/specs', () => {
    expect(goalCopyGuidance['follow-social'].cta).toBe('Follow on Instagram');
    expect(goalCopyGuidance['enquiry'].emphasis).toMatch(/MOQ/);
  });

  it('free-trial has trial-terms subtext + trial-terms emphasis', () => {
    expect(goalCopyGuidance['free-trial'].cta).toBe('Start free trial');
    expect(goalCopyGuidance['free-trial'].subtext).toBeDefined();
    expect(goalCopyGuidance['free-trial'].emphasis).toMatch(/trial-terms/);
  });
});

describe('getGuidanceForIntent formatter', () => {
  it('emits a label line, a cta_subtext instruction, and an emphasis line', () => {
    const block = getGuidanceForIntent('free-trial');
    expect(block).toContain('Goal = Start free trial. Primary CTA copy: "Start free trial"');
    expect(block).toContain('cta_subtext');
    expect(block).toContain('do NOT invent terms');
    expect(block).toContain('Emphasis:');
  });

  it('intents without a subtext get the "leave empty" instruction', () => {
    const block = getGuidanceForIntent('follow-social');
    expect(block).toContain('cta_subtext: leave empty for this goal');
    expect(block).toContain('do NOT invent terms');
  });

  it('snapshot — signup-free (the product baseline goal)', () => {
    expect(getGuidanceForIntent('signup-free')).toMatchInlineSnapshot(`
      "Goal = Sign up free. Primary CTA copy: "Sign up free" (or a close, on-brand variant).
      cta_subtext (optional muted line under the primary CTA): free-plan framing (e.g. "Free forever plan"). OMIT this element unless the offer EXPLICITLY states such terms — do NOT invent terms (no fabricated "no credit card", trial length, guarantees, or shipping claims).
      Emphasis: low friction, immediate value; address the "is it really free" objection."
    `);
  });
});

describe('getEmphasisForIntent', () => {
  it('returns just the emphasis string', () => {
    expect(getEmphasisForIntent('free-trial')).toBe(goalCopyGuidance['free-trial'].emphasis);
  });
});
