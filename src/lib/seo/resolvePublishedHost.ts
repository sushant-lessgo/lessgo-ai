/**
 * Resolve a published host (subdomain or custom domain) to its PublishedPage
 * for the per-host sitemap/robots routes (SEO track, Phase 4).
 */
import { prisma } from '@/lib/prisma';
import { matchPublishSubdomain, publishedSubdomainHost } from '@/lib/domains/hosts';
import { isServingPublishState } from '@/lib/publishState';

const SELECT = {
  slug: true,
  title: true, // blog: RSS channel title
  content: true,
  lastPublishAt: true,
  publishState: true, // DD0b: isPublished has no writer — serving derives from publishState
  customDomain: true,
  customDomainStatus: true,
  customDomainLiveAt: true,
  projectId: true, // blog: post lookup for sitemap paths
} as const;

export interface ResolvedPublishedHost {
  page: {
    slug: string;
    title: string | null;
    content: unknown;
    lastPublishAt: Date | null;
    projectId: string | null;
  };
  /** Live custom domain when one exists, else the {slug}.lessgo.site subdomain. */
  canonicalHost: string;
}

export async function resolvePublishedPageByHost(hostRaw: string): Promise<ResolvedPublishedHost | null> {
  const host = hostRaw.toLowerCase().split(':')[0];
  if (!host) return null;

  const slug = matchPublishSubdomain(host);
  const page = slug
    ? await prisma.publishedPage.findUnique({ where: { slug }, select: SELECT })
    : await prisma.publishedPage.findUnique({ where: { customDomain: host }, select: SELECT });

  // Sitemap/robots/rss follow the serving predicate (DD0b): 'publishing'/'failed' count as
  // serving because the page IS reachable; 'draft'/'unpublishing' drop out.
  if (!page || !isServingPublishState(page.publishState)) return null;

  // Same go-live gate as the publish route: status flips 'live' first, but
  // customDomainLiveAt survives later status churn.
  const domainLive =
    !!page.customDomain && (page.customDomainStatus === 'live' || page.customDomainLiveAt != null);
  const canonicalHost = domainLive ? page.customDomain! : publishedSubdomainHost(page.slug);

  return {
    page: {
      slug: page.slug,
      title: page.title,
      content: page.content,
      lastPublishAt: page.lastPublishAt,
      projectId: page.projectId,
    },
    canonicalHost,
  };
}
