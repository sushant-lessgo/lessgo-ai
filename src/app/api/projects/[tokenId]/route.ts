import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { assertProjectOwner } from '@/lib/security';
import { teardownPublishedPage } from '@/lib/staticExport/teardown';
import type { NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { tokenId: string } }
) {
  try {
    const { tokenId } = params;

    if (!tokenId) {
      return NextResponse.json(
        { error: 'Token ID is required' },
        { status: 400 }
      );
    }

    // A01: Broken Access Control - the caller must own this project (or be admin) to read its
    // metadata; the token alone is not authorization.
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const access = await assertProjectOwner(clerkId, tokenId, { action: 'projects.read' });
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    // Fetch project by tokenId
    const project = await prisma.project.findUnique({
      where: { tokenId },
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[tokenId] — delete a project, taking any live page down with it (DD11).
 *
 * If published: the SAME teardown sequence as unpublish (KV → blobs/versions), stopping before
 * the DB finalize — there is nothing to finalize when the rows are about to be deleted. Then a
 * `$transaction` removes PublishedPage → Project → Token (in that order; `Project.tokenId` FKs
 * `Token.value`, so the token must go LAST).
 *
 * Contract (identical to `unpublish/route.ts`):
 *   401 / 403|404 (authz passthrough)
 *   409 `custom_domain_attached` (D1, zero writes) · 500 `teardown_incomplete` (retry-safe)
 *   200 — deleted
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { tokenId: string } }
) {
  try {
    const { tokenId } = params;
    if (!tokenId) {
      return NextResponse.json({ error: 'Token ID is required' }, { status: 400 });
    }

    // A01: same authz ladder as GET above / the unpublish route (D2).
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const access = await assertProjectOwner(clerkId, tokenId, {
      action: 'projects.delete',
      claimIfOrphan: true,
    });
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }
    // The demo token (`lessgodemomockdata`) SHORT-CIRCUITS the ownership ladder in
    // assertProjectOwner — it returns ok:true for ANY caller, before any ownership check. A real
    // Project row exists for it (a shared, un-owned mock; see /api/saveDraft), and this handler
    // deletes PublishedPage → Project → Token: the Token delete is UNRECOVERABLE by re-saving.
    // Destructive ops must reject the demo token explicitly. 404 (not 403) mirrors
    // `src/lib/blog/access.ts` — don't reveal the row exists.
    if (access.isDemo) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    // D2: a non-owner ADMIN reaches here with `access.adminOverride === true`, already
    // audit-logged by assertProjectOwner (`logAdminOverride`). Kept deliberately.
    // STRICT OWNER-ONLY (founder decides at Gate A) = uncomment the next line — the POST
    // handler in `./unpublish/route.ts` carries the identical line; flip BOTH together:
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
      select: { id: true, publishState: true, customDomain: true },
    });

    // D1 guard, run HERE and not only inside teardown: the predicate is `customDomain !== null`,
    // full stop — state-independent. `domains/add` does not require a serving state, so a
    // 'draft' row CAN hold a customDomain (e.g. a domain attached after an unpublish). Teardown
    // owns this guard, but the teardown call below is skipped for a draft row — which would let
    // the delete drop the row with no 409, orphaning the Vercel registration + its KV keys.
    if (page && page.customDomain !== null) {
      return NextResponse.json(
        { code: 'custom_domain_attached', error: 'Remove the custom domain first' },
        { status: 409 }
      );
    }

    // Published (or mid-teardown): external state must be gone BEFORE the rows that point at
    // it. An unpublished/draft page has no KV routes or blobs left → straight to the delete.
    // (Teardown re-checks D1 itself; the guard above already covers the draft case it skips.)
    if (page && page.publishState !== 'draft') {
      const result = await teardownPublishedPage(page.id, { mode: 'delete' });

      if (result.status === 'blocked') {
        return NextResponse.json(
          { code: 'custom_domain_attached', error: 'Remove the custom domain first' },
          { status: 409 }
        );
      }
      if (result.status === 'retryable_failure') {
        return NextResponse.json(
          {
            code: 'teardown_incomplete',
            error: 'Take-down did not finish, so the project was not deleted. Please try again.',
            step: result.step,
          },
          { status: 500 }
        );
      }
    }

    // DD11 cascade. Cascade-deleted by the Project delete (no explicit deletes needed):
    // EditDelta, BlogPost, ProjectPage, SocialPost, EmailSequence, OutreachIntake,
    // ProspectScrape, OutreachMessage, CollectLink. Testimonial is `onDelete: SetNull` — those
    // rows SURVIVE with `projectId: null` (conservative, accepted). FormSubmission /
    // PageAnalytics are slug-keyed historical records and are retained by design.
    await prisma.$transaction(async (tx) => {
      // `PublishedPage.projectId` has no @relation → it does NOT block the project delete;
      // deleting it first only keeps us from stranding a row pointing at a dead project.
      if (page) await tx.publishedPage.delete({ where: { id: page.id } });
      await tx.project.delete({ where: { id: project.id } });
      // LAST: Project.tokenId → Token.value.
      await tx.token.delete({ where: { value: tokenId } });
    });

    return NextResponse.json({ ok: true, deleted: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
