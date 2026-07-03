/**
 * Resolve a published host (subdomain or custom domain) to its PublishedPage
 * for the per-host sitemap/robots routes (SEO track, Phase 4).
 */
import { prisma } from '@/lib/prisma';
import { matchPublishSubdomain, publishedSubdomainHost } from '@/lib/domains/hosts';

const SELECT = {
  slug: true,
  title: true, // blog: RSS channel title
  content: true,
  lastPublishAt: true,
  isPublished: true,
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

  if (!page || !page.isPublished) return null;

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
