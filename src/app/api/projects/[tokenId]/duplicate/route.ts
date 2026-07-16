import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { mintProjectToken } from '@/lib/projectToken';
import { assertProjectOwner } from '@/lib/security';
import type { NextRequest } from 'next/server';

/**
 * POST /api/projects/[tokenId]/duplicate — clone a project into an independent DRAFT (DD9).
 *
 * 🚨 THE CLONE CONTRACT IS THE WHOLE ROUTE. Read DD9 before changing the select/creates:
 *  - COPIED: title (+ " (copy)"), audienceType, templateId, variantId, paletteId, content,
 *    themeValues, computedDesign, brief, aiBaseline, inputText. status:'draft', userId = caller.
 *  - CLONED RELATION: `pages` (ProjectPage) — and ONLY that. Skipping it silently loses every
 *    page but the home page of a multi-page site, with no error anywhere. It is pinned by e2e.
 *  - NOT cloned: publishedPage, testimonials, collectLink, blogPosts, editDeltas, socialPosts,
 *    emailSequence, outreach* — published/engagement state belongs to the ORIGINAL. A duplicate
 *    is an independent unpublished draft; it gets no slug, no live page, no history.
 *
 * Everything (token → project → pages) runs in ONE `$transaction`: `Project.tokenId` FKs
 * `Token.value`, so a partial failure must not strand a token or a page-less project.
 *
 * No `user.upsert` / `createDefaultPlan` (unlike `/api/start`): the caller necessarily exists —
 * assertProjectOwner already resolved their `User` row (`access.userRecord`).
 *
 * Contract: 401 · 403|404 (authz passthrough) · 200 `{ tokenId }`.
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

    // A01: the same authz ladder as the sibling lifecycle routes (D2).
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const access = await assertProjectOwner(clerkId, tokenId, { action: 'projects.duplicate' });
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }
    // Demo-token guard. Duplicate is read-then-create, NOT destructive — the shared demo row
    // itself is untouched — so this rejection is the conservative call rather than a strict
    // necessity. Two reasons to keep it: (1) `access.userRecord` is null on the demo
    // short-circuit, so there is no owner to assign the copy to; (2) any signed-in user could
    // otherwise mint unbounded projects off the shared mock, outside every plan limit.
    // 404 (not 403) mirrors `src/lib/blog/access.ts` — don't reveal the row exists.
    if (access.isDemo || !access.userRecord) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    // D2 (Gate A ruling: KEEP the audited override): a non-owner ADMIN reaches here with
    // `access.adminOverride === true`, already audit-logged by assertProjectOwner.
    // STRICT OWNER-ONLY = uncomment the next line (flip it in ../route.ts + unpublish too):
    // if (access.adminOverride) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    // 🚨 Every field read below MUST be selected here — an unselected field clones as undefined,
    // silently. That is the trap that bit phases 2 and 4.
    const source = await prisma.project.findUnique({
      where: { tokenId },
      select: {
        title: true,
        audienceType: true,
        templateId: true,
        variantId: true,
        paletteId: true,
        content: true,
        themeValues: true,
        computedDesign: true,
        brief: true,
        aiBaseline: true,
        inputText: true,
        pages: {
          select: {
            archetypeKey: true,
            pathSlug: true,
            title: true,
            order: true,
            content: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!source) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const ownerId = access.userRecord.id;
    const copyTitle = `${source.title} (copy)`.slice(0, 120);

    const newTokenId = await prisma.$transaction(async (tx) => {
      const value = await mintProjectToken(tx);

      const created = await tx.project.create({
        data: {
          tokenId: value,
          userId: ownerId,
          status: 'draft',
          title: copyTitle,
          audienceType: source.audienceType,
          templateId: source.templateId,
          variantId: source.variantId,
          paletteId: source.paletteId,
          content: source.content ?? undefined,
          themeValues: source.themeValues ?? undefined,
          computedDesign: source.computedDesign ?? undefined,
          brief: source.brief ?? undefined,
          aiBaseline: source.aiBaseline ?? undefined,
          inputText: source.inputText,
        },
        select: { id: true },
      });

      if (source.pages.length > 0) {
        await tx.projectPage.createMany({
          data: source.pages.map((p) => ({
            projectId: created.id,
            archetypeKey: p.archetypeKey,
            pathSlug: p.pathSlug,
            title: p.title,
            order: p.order,
            content: p.content ?? undefined,
          })),
        });
      }

      return value;
    });

    return NextResponse.json({ ok: true, tokenId: newTokenId });
  } catch (error) {
    console.error('Error duplicating project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
