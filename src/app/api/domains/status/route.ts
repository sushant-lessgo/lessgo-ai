export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import type { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { createSecureResponse } from '@/lib/security';
import { getDomainConfig, getApexIp, type VercelDomainConfig } from '@/lib/vercel/domains';
import { ownershipTxtHost, ownershipTxtValue } from '@/lib/domains/verify';

// Per-instance cache for Vercel config lookups (60s TTL). Cold-start resets.
const configCache = new Map<string, { cfg: VercelDomainConfig; fetchedAt: number }>();
const CACHE_TTL_MS = 60 * 1000;

async function cachedConfig(domain: string): Promise<VercelDomainConfig | null> {
  const hit = configCache.get(domain);
  if (hit && Date.now() - hit.fetchedAt < CACHE_TTL_MS) return hit.cfg;
  try {
    const cfg = await getDomainConfig(domain);
    configCache.set(domain, { cfg, fetchedAt: Date.now() });
    return cfg;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return createSecureResponse({ error: 'Unauthorized' }, 401);

  const slug = req.nextUrl.searchParams.get('slug');
  if (!slug) return createSecureResponse({ error: 'slug required' }, 400);

  const page = await prisma.publishedPage.findUnique({
    where: { slug },
    select: {
      userId: true,
      customDomain: true,
      customDomainStatus: true,
      customDomainKind: true,
      customDomainOwnershipToken: true,
      customDomainOwnershipVerifiedAt: true,
      customDomainError: true,
    },
  });
  if (!page) return createSecureResponse({ error: 'Page not found' }, 404);
  if (page.userId !== userId) return createSecureResponse({ error: 'Forbidden' }, 403);
  if (!page.customDomain) return createSecureResponse({ status: null });

  let status = page.customDomainStatus;
  let error = page.customDomainError;

  // Lazy regression check for live domains
  if (status === 'live') {
    const cfg = await cachedConfig(page.customDomain);
    if (cfg?.misconfigured) {
      status = 'failed';
      error = 'dns_regression';
      await prisma.publishedPage.update({
        where: { customDomain: page.customDomain },
        data: {
          customDomainStatus: 'failed',
          customDomainFailedAt: new Date(),
          customDomainError: error,
        },
      });
    }
  }

  const apexIp = await getApexIp().catch(() => '76.76.21.21');
  const dnsInstructions =
    page.customDomainKind === 'apex'
      ? { type: 'A', host: '@', value: apexIp }
      : { type: 'CNAME', host: page.customDomain.split('.')[0], value: 'cname.vercel-dns.com' };

  const ownership =
    page.customDomainOwnershipToken
      ? {
          txtHost: ownershipTxtHost(page.customDomain),
          txtValue: ownershipTxtValue(page.customDomainOwnershipToken),
        }
      : null;

  return createSecureResponse({
    status,
    domain: page.customDomain,
    kind: page.customDomainKind,
    error,
    dnsInstructions,
    ownership,
    ownershipVerified: !!page.customDomainOwnershipVerifiedAt,
  });
}
