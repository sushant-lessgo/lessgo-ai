// src/app/api/analytics/event/route.test.ts
// F9b (versioning contract): the analytics ingest endpoint must tolerate BOTH
// beacon formats forever — the frozen a.v1.js (no `v`, no role/placement) and the
// live a.v2.js (v:2 + role + placement) — without producing garbage rows. These
// tests pin the validation schema so a future field rename can't silently reject
// events emitted by already-published blobs.

import { describe, it, expect } from 'vitest';
import { AnalyticsEventSchema } from './schema';

const base = {
  pageId: 'page_123',
  slug: 'qa-scale-vestria',
  timestamp: '2026-07-10T12:00:00.000Z',
  url: 'https://lessgo.ai/p/qa-scale-vestria',
};

describe('AnalyticsEventSchema — dual beacon-format tolerance', () => {
  it('accepts a v1 cta_click (no v, no role/placement)', () => {
    const r = AnalyticsEventSchema.safeParse({
      ...base,
      event: 'cta_click',
      ctaText: 'Get started',
      ctaHref: '#contact',
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.v).toBeUndefined();
      expect(r.data.role).toBeUndefined();
      expect(r.data.placement).toBeUndefined();
    }
  });

  it('accepts a v2 cta_click (v:2 + role + placement)', () => {
    const r = AnalyticsEventSchema.safeParse({
      ...base,
      event: 'cta_click',
      v: 2,
      ctaText: 'Get started',
      ctaHref: '#contact',
      role: 'secondary',
      placement: 'hero',
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.v).toBe(2);
      expect(r.data.role).toBe('secondary');
      expect(r.data.placement).toBe('hero');
    }
  });

  it('accepts a v1 pageview (no v field)', () => {
    const r = AnalyticsEventSchema.safeParse({
      ...base,
      event: 'pageview',
      title: 'Home',
    });
    expect(r.success).toBe(true);
  });

  it('accepts a v2 pageview (v:2)', () => {
    const r = AnalyticsEventSchema.safeParse({
      ...base,
      event: 'pageview',
      v: 2,
      title: 'Home',
    });
    expect(r.success).toBe(true);
  });

  it('ignores an unknown future version rather than rejecting', () => {
    const r = AnalyticsEventSchema.safeParse({
      ...base,
      event: 'pageview',
      v: 99,
    });
    expect(r.success).toBe(true);
  });
});
