import { describe, it, expect } from 'vitest';
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
// workCopyEngineEnabled — the ALLOW-LIST gate (B17).
//
// The former `NEXT_PUBLIC_WORK_COPY_ENGINE` env kill-switch was REMOVED (founder
// directive — work is always on). `workCopyEngineEnabled` is now a thin alias of
// `isWorkCopyTemplate`: the allow-list is the ONLY gate, ENV-INDEPENDENT. These
// asserts (no env setup, no restore) are the regression guard that no env branch
// ever creeps back in and that the allow-list still blocks non-atelier work
// templates.
// ============================================================================

describe('workCopyEngineEnabled (allow-list, env-independent)', () => {
  it('atelier ⇒ true (env UNSET — no kill-switch)', () => {
    expect(workCopyEngineEnabled('atelier')).toBe(true);
  });

  it('allow-list still blocks non-atelier work templates + null/undefined', () => {
    expect(workCopyEngineEnabled('granth')).toBe(false);
    expect(workCopyEngineEnabled('lumen')).toBe(false);
    expect(workCopyEngineEnabled(null)).toBe(false);
    expect(workCopyEngineEnabled(undefined)).toBe(false);
  });
});
