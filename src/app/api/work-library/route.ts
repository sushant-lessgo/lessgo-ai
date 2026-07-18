// src/app/api/work-library/route.ts
// Token-scoped "Your work" library API (work-library-board phase 3).
//
//   GET ?tokenId=…            → { groups: WorkGroupInput[], blurByUrl }
//   PUT { tokenId, groups }   → resync facts + stored content in one transaction
//
// SOURCE OF TRUTH is `brief.facts.work.groups` (WorkFactsSchema), written through
// the ONE rail door (`applyRailEdit({field:'groups'})`, server-side, pure) — never
// a second persistence path. On save we ALSO rewrite the stored `Project.content`
// group-reference surfaces (gallery/chrome cards, the `/works` catalog `items[]`,
// each item page's `workdetail.photos[]`) via the pure `resyncWorkContent`, so a
// republish reflects board edits. Both columns land in ONE `$transaction`.
//
// ── AUTHZ (2026-07-02 fix) ────────────────────────────────────────────────────
//   Token identifies WHICH project, NEVER ownership — `assertProjectOwner` is
//   mandatory (the `gate()` helper, cloned from /api/media). The owner is derived
//   server-side; a body `userId` would be ignored (we never read one).
//
// ── ELIGIBILITY (decision 7 — the isWorkCopyTemplate trap) ───────────────────
//   The board gates on `templateHasCapability(templateId, 'works')`, NOT
//   `isWorkCopyTemplate`. Live `atelier` is a work-ENGINE template but declares
//   gallery/packages/multipage — NOT `works` — so it has no `page-<slug>` fan-out
//   for the resync to bind into; it MUST be rejected 400. Only `atelier2` (the
//   work-skeleton pilot) declares `works`.
//
// 0 credits: facts + DB work, no LLM.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { createSecureResponse, assertProjectOwner, validateToken } from '@/lib/security';
import { slugify } from '@/lib/normalize';
import { getWorkFacts } from '@/lib/schemas/workFacts.schema';
import { applyRailEdit, type WorkGroupInput } from '@/modules/wizard/work/rail';
import { resyncWorkContent } from '@/modules/generation/workLibrarySync';
import { templateHasCapability } from '@/modules/templates/templateMeta';
import { WorkLibraryPutSchema } from '@/lib/schemas/workLibrary.schema';

const NOT_WORKS_CAPABLE =
  "This project's template doesn't support the work library";

/** auth → token validation → ownership. Returns a response to bail with, or null. */
async function gate(tokenId: string | null | undefined, action: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return createSecureResponse({ error: 'Unauthorized' }, 401);
  }
  if (!tokenId || !validateToken(tokenId)) {
    return createSecureResponse({ error: 'Invalid or missing tokenId' }, 400);
  }
  const access = await assertProjectOwner(clerkId, tokenId, { action });
  if (!access.ok) {
    return createSecureResponse({ error: access.error }, access.status);
  }
  return null;
}

/** Response-only slug backfill: NEVER persisted on a read (decision 3). */
function withResponseSlugs(groups: WorkGroupInput[]): WorkGroupInput[] {
  return groups.map((g) => ({
    ...g,
    slug: g.slug && g.slug.trim() ? g.slug.trim() : slugify(g.name),
  }));
}

/** Seed a stable, de-duped slug on every group missing one (server write path). */
function seedSlugs(groups: WorkGroupInput[]): WorkGroupInput[] {
  const seen = new Set<string>();
  for (const g of groups) {
    if (g.slug && g.slug.trim()) seen.add(g.slug.trim());
  }
  return groups.map((g) => {
    if (g.slug && g.slug.trim()) return { ...g, slug: g.slug.trim() };
    const base = slugify(g.name) || 'group';
    let unique = base;
    let i = 2;
    while (seen.has(unique)) unique = `${base}-${i++}`;
    seen.add(unique);
    return { ...g, slug: unique };
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tokenId = searchParams.get('tokenId');

    const denied = await gate(tokenId, 'work-library:list');
    if (denied) return denied;

    const project = await prisma.project.findUnique({
      where: { tokenId: tokenId! },
      select: { templateId: true, brief: true },
    });
    if (!project) {
      return createSecureResponse({ error: 'Project not found' }, 404);
    }
    if (!templateHasCapability(project.templateId, 'works')) {
      return createSecureResponse({ error: NOT_WORKS_CAPABLE }, 400);
    }

    const facts = getWorkFacts((project.brief as any)?.facts);
    const groups = withResponseSlugs((facts?.groups ?? []) as WorkGroupInput[]);

    // blurByUrl: MediaAsset rows joined by url (hidden rows included — the board
    // shows its own hidden state from facts, not the row's hiddenAt).
    const assets = await prisma.mediaAsset.findMany({
      where: { tokenId: tokenId! },
      select: { url: true, blurDataUrl: true },
    });
    const blurByUrl: Record<string, string> = {};
    for (const a of assets) {
      if (a.url && a.blurDataUrl) blurByUrl[a.url] = a.blurDataUrl;
    }

    return createSecureResponse({ groups, blurByUrl });
  } catch (err) {
    console.error('[work-library] GET failed:', err);
    return createSecureResponse({ error: 'Failed to load work library' }, 500);
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = WorkLibraryPutSchema.safeParse(body);
    if (!parsed.success) {
      return createSecureResponse(
        { error: parsed.error.issues[0]?.message ?? 'Invalid request body' },
        400
      );
    }
    const { tokenId, groups } = parsed.data;

    const denied = await gate(tokenId, 'work-library:save');
    if (denied) return denied;

    // Load FRESH stored brief + content (server-authoritative — client-sent facts
    // are not trusted beyond the groups array; decision 5).
    const project = await prisma.project.findUnique({
      where: { tokenId },
      select: { templateId: true, brief: true, content: true },
    });
    if (!project) {
      return createSecureResponse({ error: 'Project not found' }, 404);
    }
    if (!templateHasCapability(project.templateId, 'works')) {
      return createSecureResponse({ error: NOT_WORKS_CAPABLE }, 400);
    }

    const storedFacts = (project.brief as any)?.facts as
      | Record<string, unknown>
      | undefined;

    // Seed missing slugs (slugify(name), de-duped) then re-emit through the rail.
    const seeded = seedSlugs(groups as WorkGroupInput[]);
    const result = applyRailEdit({ field: 'groups', value: seeded }, storedFacts);
    if (!result.ok) {
      // Nothing is written — the rail rejected the edit.
      return createSecureResponse({ error: result.error }, 400);
    }

    // Resync the stored content tree (finalContent = the page-data tree the
    // generation path seeds: root content + pages + chrome). Facts read-only.
    const nextWorkFacts = getWorkFacts(result.facts);
    const storedContent = (project.content as any) ?? {};
    const nextContent = {
      ...storedContent,
      finalContent: resyncWorkContent(storedContent.finalContent, nextWorkFacts),
    };

    const nextBrief = { ...((project.brief as any) ?? {}), facts: result.facts };

    // BOTH columns in ONE transaction — a partial write (facts without content,
    // or vice-versa) is a bug (decision 5).
    await prisma.$transaction([
      prisma.project.update({
        where: { tokenId },
        data: { brief: nextBrief as any, content: nextContent as any },
      }),
    ]);

    return createSecureResponse({ success: true, groups: seeded });
  } catch (err) {
    console.error('[work-library] PUT failed:', err);
    return createSecureResponse({ error: 'Failed to save work library' }, 500);
  }
}
