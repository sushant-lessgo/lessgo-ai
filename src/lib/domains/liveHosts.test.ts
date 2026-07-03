// Blog (Phase 1): the centralized live-host list + durable custom-domain gate
// (mirrors publish/route.ts — status 'live' OR customDomainLiveAt survives
// status churn to 'failed').
import { describe, it, expect } from 'vitest';
import { liveHostsForPage } from './liveHosts';

describe('liveHostsForPage', () => {
  it('subdomains only when no custom domain', () => {
    const { hosts, canonicalDomain } = liveHostsForPage({ slug: 'acme' });
    expect(hosts).toEqual(['acme.lessgo.site', 'acme.lessgo.ai']);
    expect(canonicalDomain).toBeUndefined();
  });

  it('adds the custom domain when status is live', () => {
    const { hosts, canonicalDomain } = liveHostsForPage({
      slug: 'acme',
      customDomain: 'acme.com',
      customDomainStatus: 'live',
    });
    expect(hosts).toContain('acme.com');
    expect(canonicalDomain).toBe('acme.com');
  });

  it('durable gate: customDomainLiveAt wins even when status drifted to failed', () => {
    const { canonicalDomain } = liveHostsForPage({
      slug: 'acme',
      customDomain: 'acme.com',
      customDomainStatus: 'failed',
      customDomainLiveAt: new Date('2026-01-01'),
    });
    expect(canonicalDomain).toBe('acme.com');
  });

  it('no custom domain when never live', () => {
    const { hosts, canonicalDomain } = liveHostsForPage({
      slug: 'acme',
      customDomain: 'acme.com',
      customDomainStatus: 'pending_dns',
      customDomainLiveAt: null,
    });
    expect(canonicalDomain).toBeUndefined();
    expect(hosts).not.toContain('acme.com');
  });
});
