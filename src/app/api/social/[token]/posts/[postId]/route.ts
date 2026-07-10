export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * /api/social/[token]/posts/[postId] — delete one saved social post.
 *
 * Owner-gated AND the post must belong to this token AND to this clerkId (D6).
 * Deletes the `SocialPost` row ONLY — NEVER the `UsageEvent` ledger row: the
 * ledger is append-only and the Free lifetime cap (phase 7) counts it, so
 * delete-and-regenerate must NOT restore allowance.
 */
import type { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { createSecureResponse, assertProjectOwner } from '@/lib/security';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { token: string; postId: string } },
): Promise<Response> {
  const { token: tokenId, postId } = params;
  try {
    // clerkId is the id space for ownership of the SocialPost row (D6).
    const { userId: clerkId } = await auth();
    const access = await assertProjectOwner(clerkId, tokenId, { action: 'social-posts.delete' });
    if (!access.ok) {
      return createSecureResponse({ success: false, error: access.error }, access.status);
    }

    // Demo bearer never persisted anything → nothing to delete.
    if (access.isDemo || !clerkId) {
      return createSecureResponse({ success: false, error: 'Post not found' }, 404);
    }

    const post = await prisma.socialPost.findUnique({ where: { id: postId } });
    // Verify the post belongs to THIS token AND THIS clerk user before deleting.
    if (!post || post.tokenId !== tokenId || post.userId !== clerkId) {
      return createSecureResponse({ success: false, error: 'Post not found' }, 404);
    }

    // Delete the SocialPost ONLY. The UsageEvent ledger row is intentionally left intact.
    await prisma.socialPost.delete({ where: { id: post.id } });
    return createSecureResponse({ success: true, deleted: true });
  } catch (error) {
    logger.error('[social:delete] endpoint error:', error);
    return createSecureResponse({ success: false, error: 'internal_error' }, 500);
  }
}
