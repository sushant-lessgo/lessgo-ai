import { describe, it, expect } from 'vitest';
import { WORK_COPY_ENGINE_TEMPLATES, isWorkCopyTemplate } from './workCopyEngine';

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
