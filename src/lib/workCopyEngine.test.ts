import { describe, it, expect, afterEach } from 'vitest';
import {
  WORK_COPY_ENGINE_TEMPLATES,
  isWorkCopyTemplate,
  workCopyEngineEnabled,
} from './workCopyEngine';

describe('isWorkCopyTemplate (template-membership predicate)', () => {
  it('allow-list is exactly [atelier]', () => {
    expect([...WORK_COPY_ENGINE_TEMPLATES]).toEqual(['atelier']);
  });

  it('returns true for a work-copy-engine template (atelier)', () => {
    expect(isWorkCopyTemplate('atelier')).toBe(true);
  });

  it('returns false for a service template (hearth / lex)', () => {
    expect(isWorkCopyTemplate('hearth')).toBe(false);
    expect(isWorkCopyTemplate('lex')).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(isWorkCopyTemplate(null)).toBe(false);
    expect(isWorkCopyTemplate(undefined)).toBe(false);
  });
});

// ============================================================================
// The kill-switch, at its NEW home (work-onboarding-shell P5).
//
// It moved OUT of `@/modules/wizard/generation/work.llm` so the journey seam's
// SYNC `preflight` can read it without a static import of the generation graph
// (landmine 14). `work.llm.ts` re-exports it, and `work.llm.test.ts` still
// imports it from there — that suite passing UNTOUCHED is the proof the
// generation callers' import surface is intact.
//
// Landmine 2 is the reason both halves are pinned: flag off ⇒ the work journey
// must fail LOUDLY at STEP 05, never fall through to a silent skeleton (an
// empty reveal).
// ============================================================================

describe('workCopyEngineEnabled (env kill-switch × allow-list)', () => {
  const prior = process.env.NEXT_PUBLIC_WORK_COPY_ENGINE;
  afterEach(() => {
    if (prior === undefined) delete process.env.NEXT_PUBLIC_WORK_COPY_ENGINE;
    else process.env.NEXT_PUBLIC_WORK_COPY_ENGINE = prior;
  });

  it('flag OFF (unset) ⇒ false even for an allow-listed template', () => {
    delete process.env.NEXT_PUBLIC_WORK_COPY_ENGINE;
    expect(workCopyEngineEnabled('atelier')).toBe(false);
  });

  it('flag anything-but-"true" ⇒ false (opt-IN, never truthy-ish)', () => {
    process.env.NEXT_PUBLIC_WORK_COPY_ENGINE = '1';
    expect(workCopyEngineEnabled('atelier')).toBe(false);
    process.env.NEXT_PUBLIC_WORK_COPY_ENGINE = 'false';
    expect(workCopyEngineEnabled('atelier')).toBe(false);
  });

  it('flag ON + atelier ⇒ true', () => {
    process.env.NEXT_PUBLIC_WORK_COPY_ENGINE = 'true';
    expect(workCopyEngineEnabled('atelier')).toBe(true);
  });

  it('flag ON + a work template that is NOT allow-listed (granth) ⇒ false', () => {
    process.env.NEXT_PUBLIC_WORK_COPY_ENGINE = 'true';
    expect(workCopyEngineEnabled('granth')).toBe(false);
    expect(workCopyEngineEnabled('lumen')).toBe(false);
    expect(workCopyEngineEnabled(null)).toBe(false);
    expect(workCopyEngineEnabled(undefined)).toBe(false);
  });
});
