import { describe, it, expect } from 'vitest';
import { isServingPublishState } from './publishState';

describe('isServingPublishState', () => {
  it('serves published (happy path)', () => {
    expect(isServingPublishState('published')).toBe(true);
  });

  it('serves publishing — a re-publish keeps the prior version live (must not 404)', () => {
    expect(isServingPublishState('publishing')).toBe(true);
  });

  it('serves failed — a failed re-publish leaves the previous version live', () => {
    expect(isServingPublishState('failed')).toBe(true);
  });

  it('does NOT serve draft', () => {
    expect(isServingPublishState('draft')).toBe(false);
  });

  it('does NOT serve unpublishing (teardown in flight or stuck)', () => {
    expect(isServingPublishState('unpublishing')).toBe(false);
  });

  it('fails open for null/undefined/empty (legacy rows may predate the field)', () => {
    expect(isServingPublishState(null)).toBe(true);
    expect(isServingPublishState(undefined)).toBe(true);
    expect(isServingPublishState('')).toBe(true);
  });

  it('fails open for unknown states', () => {
    expect(isServingPublishState('some_future_state')).toBe(true);
    expect(isServingPublishState('DRAFT')).toBe(true); // case-sensitive by design
  });
});
