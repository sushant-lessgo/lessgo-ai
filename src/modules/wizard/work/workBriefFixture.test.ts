// ============================================================================
// WORK_BRIEF_FIXTURE DRIFT GUARD (work-onboarding-shell P2b, plan step 6).
//
// The journey e2e seeds `e2e/helpers/workBriefFixture.ts` through the REAL
// `/api/brief/confirm` gate. If the fixture ever stops parsing, stops serving,
// or stops producing readable work facts, EVERY journey e2e fails with an
// unhelpful UI timeout ("the shell never mounted") instead of the real cause.
//
// This test is where that failure becomes legible. It runs in Vitest — the only
// runner where `@/` resolves — so it can assert the fixture against the actual
// schema + serve gate the route uses. The Playwright side cannot do this (no
// alias), which is exactly why the fixture is a zero-import module.
// ============================================================================

import { describe, it, expect } from 'vitest';
import { BriefSchema } from '@/lib/schemas/brief.schema';
import { decideServe } from '@/modules/brief/serveGate';
import { getWorkFacts } from '@/lib/schemas/workFacts.schema';
import type { Brief } from '@/types/brief';
import {
  WORK_BRIEF_FIXTURE,
  WORK_BRIEF_EXPECTED_SERVE,
} from '../../../../e2e/helpers/workBriefFixture';

describe('WORK_BRIEF_FIXTURE — e2e seed drift guard', () => {
  it('parses as a Brief (what /api/brief/confirm validates with)', () => {
    const parsed = BriefSchema.safeParse(WORK_BRIEF_FIXTURE);
    expect(
      parsed.success,
      parsed.success ? '' : JSON.stringify(parsed.error.issues, null, 2)
    ).toBe(true);
  });

  it('serves ⇒ service / atelier (work is an ENGINE, never an audience)', () => {
    const decision = decideServe(WORK_BRIEF_FIXTURE as Brief);
    expect(decision.outcome).toBe(WORK_BRIEF_EXPECTED_SERVE.outcome);
    if (decision.outcome !== 'serve') {
      throw new Error(`fixture no longer serves: missing=${decision.missing}`);
    }
    expect(decision.audienceType).toBe(WORK_BRIEF_EXPECTED_SERVE.audienceType);
    expect(decision.templateId).toBe(WORK_BRIEF_EXPECTED_SERVE.templateId);
    // The seeded project is what the e2e asserts loadDraft against.
    expect(decision.audienceType).not.toBe('work');
  });

  it('carries a readable work facts bag (getWorkFacts non-null)', () => {
    const facts = getWorkFacts(WORK_BRIEF_FIXTURE.facts as Record<string, unknown>);
    expect(facts).not.toBeNull();
    expect(facts?.identity?.name).toBe('Kundius Studio');
    expect(facts?.groups?.length).toBeGreaterThan(0);
  });

  it('gives every seeded group a `kind` and a valid price (landmine 6)', () => {
    // A `kind`-less group nulls getWorkFacts and dead-ends strategy with an
    // unrecoverable 400 — the exact bug the seed defaults exist to prevent.
    const facts = getWorkFacts(WORK_BRIEF_FIXTURE.facts as Record<string, unknown>);
    for (const group of facts?.groups ?? []) {
      expect(group.kind).toBeTruthy();
      expect(group.price?.mode).toBeTruthy();
      if (group.price.mode !== 'on-request') {
        expect(typeof group.price.amount).toBe('number');
      }
    }
  });

  it('declares the work copy engine (the journey dispatch key)', () => {
    expect(WORK_BRIEF_FIXTURE.copyEngine).toBe('work');
    expect(WORK_BRIEF_FIXTURE.facts.entry.resolvedEngine).toBe('work');
  });
});
