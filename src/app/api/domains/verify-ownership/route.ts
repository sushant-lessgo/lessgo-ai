export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { createSecureResponse } from '@/lib/security';
import { verifyOwnershipTxt, ownershipTxtHost, ownershipTxtValue } from '@/lib/domains/verify';
import { addDomain, VercelApiError } from '@/lib/vercel/domains';
import { checkDomainRateLimit } from '@/lib/rateLimit';

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
      customDomain: true,
      customDomainStatus: true,
      customDomainOwnershipToken: true,
    },
  });
  if (!page) return createSecureResponse({ error: 'Page not found' }, 404);
  if (page.userId !== userId) return createSecureResponse({ error: 'Forbidden' }, 403);
  if (!page.customDomain || !page.customDomainOwnershipToken) {
    return createSecureResponse({ error: 'No custom domain pending ownership' }, 400);
  }
  if (page.customDomainStatus !== 'pending_ownership' && page.customDomainStatus !== 'failed') {
    return createSecureResponse(
      { error: 'Ownership already verified', status: page.customDomainStatus },
      409
    );
  }

  const rl = checkDomainRateLimit(page.customDomain);
  if (!rl.allowed) {
    return createSecureResponse({ error: 'Too many verify attempts', retryAfter: rl.retryAfter }, 429);
  }

  const result = await verifyOwnershipTxt(page.customDomain, page.customDomainOwnershipToken);
  if (!result.ok) {
    return createSecureResponse(
      {
        status: 'pending_ownership',
        error: result.error,
        expected: {
          txtHost: ownershipTxtHost(page.customDomain),
          txtValue: ownershipTxtValue(page.customDomainOwnershipToken),
        },
        found: result.foundValues || [],
      },
      200
    );
  }

  // TXT verified — attach to Vercel
  try {
    const added = await addDomain(page.customDomain);
    await prisma.publishedPage.update({
      where: { id: page.id },
      data: {
        customDomainStatus: 'pending_dns',
        customDomainOwnershipVerifiedAt: new Date(),
        customDomainVercelId: added.name || page.customDomain,
        customDomainError: null,
      },
    });
    return createSecureResponse({ status: 'pending_dns', domain: page.customDomain });
  } catch (e) {
    const err = e as VercelApiError;
    const msg = err?.message || 'vercel_api_error';
    const code = err?.code || 'unknown';
    if (code === 'conflict') {
      await prisma.publishedPage.update({
        where: { id: page.id },
        data: {
          customDomainStatus: 'failed',
          customDomainFailedAt: new Date(),
          customDomainError: `vercel_conflict: ${msg}`,
        },
      });
      return createSecureResponse({ status: 'failed', error: 'domain_in_use_on_vercel' }, 409);
    }
    await prisma.publishedPage.update({
      where: { id: page.id },
      data: {
        customDomainStatus: 'failed',
        customDomainFailedAt: new Date(),
        customDomainError: `${code}: ${msg}`,
      },
    });
    return createSecureResponse({ status: 'failed', error: code, message: msg }, 502);
  }
}
