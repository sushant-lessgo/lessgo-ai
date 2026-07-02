export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import type { NextRequest } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { createSecureResponse } from '@/lib/security';
import { validateDomain } from '@/lib/domains/validate';
import { ownershipTxtHost, ownershipTxtValue } from '@/lib/domains/verify';
import { getApexIp } from '@/lib/vercel/domains';
import { hasFeature, checkLimit } from '@/lib/planManager';
import { isAdmin, logAdminOverride } from '@/lib/admin';

const BodySchema = z.object({
  slug: z.string().min(1).max(100),
  customDomain: z.string().min(1).max(253),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return createSecureResponse({ error: 'Unauthorized' }, 401);

  const parse = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parse.success) {
    return createSecureResponse({ error: 'Invalid request', details: parse.error.issues }, 400);
  }
  const { slug, customDomain } = parse.data;

  const v = validateDomain(customDomain);
  if (!v.ok) return createSecureResponse({ error: v.error.message, code: v.error.code }, 400);

  const page = await prisma.publishedPage.findUnique({
    where: { slug },
    select: { id: true, userId: true, customDomain: true, customDomainStatus: true },
  });
  if (!page) return createSecureResponse({ error: 'Page not found' }, 404);
  if (page.userId !== userId) {
    if (!isAdmin(userId)) return createSecureResponse({ error: 'Forbidden' }, 403);
    await logAdminOverride({ actorClerkId: userId, ownerId: page.userId, action: 'domain.add', resource: { slug, domain: customDomain } });
  }
  if (page.customDomain && page.customDomainStatus !== 'failed') {
    return createSecureResponse({ error: 'Page already has a custom domain' }, 409);
  }

  const conflict = await prisma.publishedPage.findUnique({
    where: { customDomain: v.value.input },
    select: { id: true },
  });
  if (conflict && conflict.id !== page.id) {
    return createSecureResponse({ error: 'Domain already in use' }, 409);
  }

  const canUseCustomDomain = await hasFeature(userId, 'customDomains');
  if (!canUseCustomDomain) {
    return createSecureResponse({ error: 'Custom domains not available on your plan' }, 403);
  }
  const currentCount = await prisma.publishedPage.count({
    where: { userId, customDomain: { not: null }, NOT: { customDomainStatus: 'failed' } },
  });
  const limitCheck = await checkLimit(userId, 'customDomains', currentCount);
  if (!limitCheck.allowed) {
    return createSecureResponse(
      { error: 'Custom domain limit reached', limit: limitCheck.limit, current: currentCount },
      403
    );
  }

  const token = crypto.randomBytes(24).toString('base64url');
  const now = new Date();

  await prisma.publishedPage.update({
    where: { id: page.id },
    data: {
      customDomain: v.value.input,
      customDomainStatus: 'pending_ownership',
      customDomainKind: v.value.kind,
      customDomainOwnershipToken: token,
      customDomainOwnershipVerifiedAt: null,
      customDomainVercelId: null,
      customDomainAddedAt: now,
      customDomainLiveAt: null,
      customDomainFailedAt: null,
      customDomainError: null,
    },
  });

  const apexIp = await getApexIp().catch(() => '76.76.21.21');

  return createSecureResponse({
    status: 'pending_ownership',
    domain: v.value.input,
    kind: v.value.kind,
    ownership: {
      txtHost: ownershipTxtHost(v.value.input),
      txtValue: ownershipTxtValue(token),
    },
    dnsInstructions:
      v.value.kind === 'apex'
        ? { type: 'A', host: '@', value: apexIp }
        : { type: 'CNAME', host: v.value.input.split('.')[0], value: 'cname.vercel-dns.com' },
  });
}
