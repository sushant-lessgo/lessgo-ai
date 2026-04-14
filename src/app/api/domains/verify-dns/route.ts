export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { createSecureResponse } from '@/lib/security';
import { getDomainConfig, VercelApiError } from '@/lib/vercel/domains';
import { checkDomainRateLimit } from '@/lib/rateLimit';
import { writeRedirect, atomicPublishWithRetry } from '@/lib/routing/kvRoutes';

const BodySchema = z.object({ slug: z.string().min(1).max(100) });

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return createSecureResponse({ error: 'Unauthorized' }, 401);

  const parse = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parse.success) return createSecureResponse({ error: 'Invalid request' }, 400);

  const page = await prisma.publishedPage.findUnique({
    where: { slug: parse.data.slug },
    select: {
      id: true,
      userId: true,
      slug: true,
      customDomain: true,
      customDomainStatus: true,
      currentVersion: { select: { version: true, blobUrl: true } },
    },
  });
  if (!page) return createSecureResponse({ error: 'Page not found' }, 404);
  if (page.userId !== userId) return createSecureResponse({ error: 'Forbidden' }, 403);
  if (!page.customDomain) return createSecureResponse({ error: 'No custom domain' }, 400);
  if (page.customDomainStatus === 'live') {
    return createSecureResponse({ status: 'live', domain: page.customDomain });
  }
  if (page.customDomainStatus !== 'pending_dns' && page.customDomainStatus !== 'issuing_ssl') {
    return createSecureResponse(
      { error: 'Ownership not verified yet', status: page.customDomainStatus },
      409
    );
  }

  const rl = checkDomainRateLimit(page.customDomain);
  if (!rl.allowed) {
    return createSecureResponse({ error: 'Too many verify attempts', retryAfter: rl.retryAfter }, 429);
  }

  let cfg;
  try {
    cfg = await getDomainConfig(page.customDomain);
  } catch (e) {
    const err = e as VercelApiError;
    return createSecureResponse({ error: err?.code || 'vercel_error', message: err?.message }, 502);
  }

  if (cfg.misconfigured) {
    // DNS not ready yet; advance to issuing_ssl after first pass-through or stay pending_dns
    await prisma.publishedPage.update({
      where: { id: page.id },
      data: { customDomainStatus: 'pending_dns', customDomainError: 'dns_misconfigured' },
    });
    return createSecureResponse({
      status: 'pending_dns',
      misconfigured: true,
      expected: { aValues: cfg.aValues, cnames: cfg.cnames, nameservers: cfg.nameservers },
    });
  }

  // DNS good. If not yet live, mark issuing_ssl then live in one call.
  // Vercel cert issuance is automatic once DNS is correct; we transition to live here.
  const subdomainHost = `${page.slug}.lessgo.ai`;
  const customHost = page.customDomain;

  await prisma.publishedPage.update({
    where: { id: page.id },
    data: {
      customDomainStatus: 'live',
      customDomainLiveAt: new Date(),
      customDomainError: null,
    },
  });

  // Write KV route for custom domain (point to current blob) + redirect from subdomain
  try {
    if (page.currentVersion?.blobUrl && page.currentVersion?.version) {
      await atomicPublishWithRetry(
        page.id,
        [customHost],
        page.currentVersion.version,
        page.currentVersion.blobUrl,
        { maxRetries: 3, baseDelay: 500 }
      );
    }
    await writeRedirect(subdomainHost, `https://${customHost}`, 301);
  } catch (e) {
    console.error('[verify-dns] KV wiring failed', e);
    // Non-fatal for status — user can republish to repair
  }

  return createSecureResponse({ status: 'live', domain: customHost });
}
