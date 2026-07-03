export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { createSecureResponse } from '@/lib/security';
import { removeDomain, VercelApiError } from '@/lib/vercel/domains';
import { removeRoutes, removeRedirect, deleteRoutes } from '@/lib/routing/kvRoutes';
import { publishSubdomainHosts } from '@/lib/domains/hosts';
import { isAdmin, logAdminOverride } from '@/lib/admin';

const BodySchema = z.object({ slug: z.string().min(1).max(100) });

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return createSecureResponse({ error: 'Unauthorized' }, 401);

  const parse = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parse.success) return createSecureResponse({ error: 'Invalid request' }, 400);

  const page = await prisma.publishedPage.findUnique({
    where: { slug: parse.data.slug },
    select: { id: true, userId: true, slug: true, customDomain: true, projectId: true },
  });
  if (!page) return createSecureResponse({ error: 'Page not found' }, 404);
  if (page.userId !== userId) {
    if (!isAdmin(userId)) return createSecureResponse({ error: 'Forbidden' }, 403);
    await logAdminOverride({ actorClerkId: userId, ownerId: page.userId, action: 'domain.remove', resource: { slug: page.slug, domain: page.customDomain } });
  }
  if (!page.customDomain) return createSecureResponse({ error: 'No custom domain' }, 400);

  const customHost = page.customDomain;
  const subdomainHosts = publishSubdomainHosts(page.slug);

  try {
    await removeDomain(customHost);
  } catch (e) {
    const err = e as VercelApiError;
    // 404 from Vercel = already gone; continue cleanup
    if (err?.code !== 'not_found') {
      console.error('[domains/remove] Vercel removeDomain failed', err);
    }
  }

  try {
    // Fully remove custom-domain keys; on each subdomain, drop ONLY the redirect so it serves again
    await removeRoutes([customHost]);
    for (const sub of subdomainHosts) {
      await removeRedirect(sub);
    }

    // Blog (Phase 1): removeRoutes only deletes root-path keys — the removed host's
    // /blog and /blog/{slug} routes must go explicitly.
    if (page.projectId) {
      const posts = await prisma.blogPost.findMany({
        where: { projectId: page.projectId, status: 'published' },
        select: { slug: true },
      });
      if (posts.length > 0) {
        await deleteRoutes([
          { host: customHost, path: '/blog' },
          ...posts.map((p) => ({ host: customHost, path: `/blog/${p.slug}` })),
        ]);
      }
    }
  } catch (e) {
    console.error('[domains/remove] KV cleanup failed', e);
  }

  await prisma.publishedPage.update({
    where: { id: page.id },
    data: {
      customDomain: null,
      customDomainStatus: null,
      customDomainKind: null,
      customDomainVercelId: null,
      customDomainOwnershipToken: null,
      customDomainOwnershipVerifiedAt: null,
      customDomainAddedAt: null,
      customDomainLiveAt: null,
      customDomainFailedAt: null,
      customDomainError: null,
    },
  });

  // Blog (Phase 1): re-render posts/index so canonicals fall back to the subdomain
  // (fire-and-forget, self-contained errors). Runs AFTER the DB clear above so
  // liveHostsForPage sees only the remaining hosts.
  import('@/lib/blog/publishBlogPost')
    .then(({ syncBlogAfterSitePublish }) => syncBlogAfterSitePublish(page.id, 'https://lessgo.ai'))
    .catch((e) => console.error('[domains/remove] blog sync failed (non-fatal):', e));

  return createSecureResponse({ removed: true, retryAfter: 60 });
}
