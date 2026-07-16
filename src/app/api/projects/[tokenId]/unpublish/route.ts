import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { assertProjectOwner } from '@/lib/security';
import { teardownPublishedPage } from '@/lib/staticExport/teardown';
import type { NextRequest } from 'next/server';

// Teardown renders nothing but touches Blob/KV/Postgres — Node runtime, never cached.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/projects/[tokenId]/unpublish — take a published page down (DD1–DD4).
 *
 * The inverse of `/api/publish`: KV routes → blobs/versions → DB finalize to `'draft'`, with
 * the `PublishedPage` row KEPT so the slug stays reserved for re-publish (DD12).
 *
 * Contract:
 *   401 — unauthenticated
 *   403 — not the owner (or 404 if no such project/user; status is passed through)
 *   409 `custom_domain_attached` — a custom domain is attached (D1); ZERO writes happened
 *   500 `teardown_incomplete` — external cleanup failed; the page is parked at
 *       `'unpublishing'` (already non-serving) and the call is safe to RETRY
 *   200 — done, or a no-op (nothing published / already draft — idempotent)
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { tokenId: string } }
) {
  try {
    const { tokenId } = params;
    if (!tokenId) {
      return NextResponse.json({ error: 'Token ID is required' }, { status: 400 });
    }

    // A01: authz ladder (D2) — canonical `[tokenId]/route.ts` pattern: auth() → 401, then
    // assertProjectOwner with status passthrough. Deliberately NOT the hand-rolled
    // `published-slug` admin-all widening (unaudited) that the spec calls out.
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const access = await assertProjectOwner(clerkId, tokenId, {
      action: 'projects.unpublish',
      claimIfOrphan: true,
    });
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }
    // The demo token (`lessgodemomockdata`) SHORT-CIRCUITS the ownership ladder in
    // assertProjectOwner — it returns ok:true for ANY caller, before any ownership check. A real
    // Project row exists for it (a shared, un-owned mock; see /api/saveDraft), so without this
    // any signed-in user could take the shared demo down. Destructive ops must reject it
    // explicitly. 404 (not 403) mirrors `src/lib/blog/access.ts` — don't reveal the row exists.
    if (access.isDemo) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    // D2: a non-owner ADMIN reaches here with `access.adminOverride === true`, already
    // audit-logged by assertProjectOwner (`logAdminOverride`). Kept deliberately.
    // STRICT OWNER-ONLY (founder decides at Gate A) = uncomment the next line — the DELETE
    // handler in `../route.ts` carries the identical line; flip BOTH together:
    // if (access.adminOverride) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    const project = await prisma.project.findUnique({
      where: { tokenId },
      select: { id: true },
    });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const page = await prisma.publishedPage.findFirst({
      where: { projectId: project.id },
      select: { id: true, publishState: true },
    });

    // Idempotent no-op: never published, or already down. A double-click / retry must not 404.
    if (!page || page.publishState === 'draft') {
      return NextResponse.json({ ok: true, unpublished: false });
    }

    const result = await teardownPublishedPage(page.id, { mode: 'unpublish' });

    if (result.status === 'blocked') {
      // D1: keyed off `customDomain !== null` regardless of status. Zero writes happened —
      // the page is still fully live.
      return NextResponse.json(
        { code: 'custom_domain_attached', error: 'Remove the custom domain first' },
        { status: 409 }
      );
    }

    if (result.status === 'retryable_failure') {
      return NextResponse.json(
        {
          code: 'teardown_incomplete',
          error: 'Take-down did not finish. Please try again.',
          step: result.step,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, unpublished: true });
  } catch (error) {
    console.error('Error unpublishing project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
