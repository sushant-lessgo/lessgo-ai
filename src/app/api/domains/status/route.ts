export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import type { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { createSecureResponse } from '@/lib/security';
import { getDomainConfig, getApexIp, type VercelDomainConfig } from '@/lib/vercel/domains';
import { ownershipTxtHost, ownershipTxtValue } from '@/lib/domains/verify';
import { isAdmin } from '@/lib/admin';

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
  // Read-only status: admins may view any page's domain status (silent bypass, no audit — matches
  // the published-slug read-bypass precedent). Mutating domain routes audit-log their overrides.
  if (page.userId !== userId && !isAdmin(userId)) return createSecureResponse({ error: 'Forbidden' }, 403);
  if (!page.customDomain) return createSecureResponse({ status: null });

  let status = page.customDomainStatus;
  let error = page.customDomainError;

  // Lazy regression check for live domains — REPORT ONLY, never persist.
  // Vercel's `misconfigured` flag is transient/flaky (especially for apex A-record domains during
  // DNS propagation or a Vercel API blip). Persisting 'failed' from a GET silently drifted the DB
  // status away from 'live', which stranded custom domains on their old blob on the next republish
  // (publish's canonical gate skipped a non-live domain). A read endpoint must not mutate publish
  // state — surface the transient condition in the response and let the durable customDomainLiveAt
  // marker keep the domain serving. A genuine, persistent regression is handled by explicit removal.
  if (status === 'live') {
    const cfg = await cachedConfig(page.customDomain);
    if (cfg?.misconfigured) {
      error = 'dns_regression';
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
