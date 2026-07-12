import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const ADMIN_IDS = (process.env.ADMIN_CLERK_IDS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export function isAdmin(clerkId: string | null | undefined): boolean {
  return !!clerkId && ADMIN_IDS.includes(clerkId);
}

/**
 * data-capture: is this clerkId a founder/admin? Same `ADMIN_CLERK_IDS` parse as
 * `isAdmin` — a distinct named export so the delta-capture write site reads
 * clearly (`isFounderEdit`) without coupling to the auth-gate helper. No behavior
 * change to `requireAdmin`.
 */
export function isAdminClerkId(clerkId: string | null | undefined): boolean {
  return isAdmin(clerkId);
}

/**
 * Record a privileged admin override — an admin acting on a resource they don't own
 * (publish/domain/image on another user's page). The DB row is the durable system-of-record;
 * the logger.warn line is live-ops visibility (dev). Best-effort: an audit-write failure must
 * NEVER break the underlying operation, so this swallows its own errors.
 *
 * Call at each ownership-check site ONLY on the admin-bypass branch, after confirming the actor
 * is an admin and is NOT the owner. Capture both the actor and the resource owner.
 */
export async function logAdminOverride(p: {
  actorClerkId: string; // the admin acting
  ownerId: string | null; // resource owner (PublishedPage.userId=clerkId, or Project.userId FK)
  action: string; // e.g. 'publish', 'domain.add', 'image.upload'
  resource?: Record<string, unknown>; // { slug, domain, tokenId, ... }
}): Promise<void> {
  logger.warn('[admin-override]', p);
  try {
    await prisma.adminAuditLog.create({
      data: {
        actorClerkId: p.actorClerkId,
        ownerId: p.ownerId ?? null,
        action: p.action,
        resource: (p.resource ?? undefined) as any,
      },
    });
  } catch (e) {
    // Never throw — auditing must not block the operation it records.
    logger.error('[admin-override] audit write failed', e as Error);
  }
}

export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return null;

  const { userId } = await auth();
  if (isAdmin(userId)) return null;

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
