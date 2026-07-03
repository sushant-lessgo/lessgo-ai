import { publishSubdomainHosts } from './hosts';

// Centralizes the "which hosts is this published page live on" answer used by the
// publish route, domains routes, and blog publish. Custom-domain gate matches
// publish/route.ts: durable customDomainLiveAt marker OR status === 'live'
// (status can silently drift to 'failed' on flaky Vercel apex readings — the
// durable marker keeps a republish from stranding the domain on an old blob).
export interface LiveHostsInput {
  slug: string;
  customDomain?: string | null;
  customDomainStatus?: string | null;
  customDomainLiveAt?: Date | string | null;
}

export function liveHostsForPage(page: LiveHostsInput): {
  hosts: string[];
  canonicalDomain?: string;
} {
  const domainHasGoneLive =
    !!page.customDomain &&
    (page.customDomainStatus === 'live' || page.customDomainLiveAt != null);
  const canonicalDomain = domainHasGoneLive ? page.customDomain! : undefined;

  const hosts = [...publishSubdomainHosts(page.slug)];
  if (canonicalDomain) hosts.push(canonicalDomain);

  return { hosts, canonicalDomain };
}
