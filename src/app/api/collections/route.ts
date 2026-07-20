// src/app/api/collections/route.ts
// CMS collections — token-scoped list + create (cms-collections plan phase 1, step 5).
//
//   GET  ?tokenId=…   → { collections: [...] } (ordered, with item/field counts)
//   POST { tokenId, name, fieldSchema, roles?, detailPages?, layoutHint? }
//                     → { collection }
//
// ── AUTHZ (pinned by the plan, identical in all five collection route files) ──
//   The token identifies WHICH project, NEVER ownership. `assertProjectOwner`
//   returns a RESULT object — it does NOT throw and does NOT 403 by itself, so
//   the result MUST be `.ok`-checked and returned early. A discarded result is a
//   gate that enforces nothing.
//     const owner = await assertProjectOwner(userId, tokenId, { action, allowMissing: false });
//     if (!owner.ok) return createSecureResponse({ error: owner.error }, owner.status);
//   `allowMissing: false`, NO `claimIfOrphan` — these are token-scoped reads and
//   writes over existing projects. (Only the phase-3 /api/publish call differs,
//   with `allowMissing: true`.)
//
// ── projectId is SERVER-DERIVED ──────────────────────────────────────────────
//   `Collection.projectId` is resolved from the ownership-verified token, never
//   from the request body. A body `projectId` is not read at all.
//
// 0 credits: pure DB work, no LLM.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { createSecureResponse, assertProjectOwner, validateToken } from '@/lib/security';
import {
  CollectionCreateSchema,
  makeRolesSchema,
  type FieldDef,
} from '@/lib/schemas/collection.schema';
import { slugifyName, uniqueSlug } from '@/modules/cms/slug';

/** auth → token validation → ownership. Returns a response to bail with, or null. */
async function gate(tokenId: string | null | undefined, action: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return createSecureResponse({ error: 'Unauthorized' }, 401);
  }
  if (!tokenId || !validateToken(tokenId)) {
    return createSecureResponse({ error: 'Invalid or missing tokenId' }, 400);
  }
  const access = await assertProjectOwner(clerkId, tokenId, { action, allowMissing: false });
  if (!access.ok) {
    return createSecureResponse({ error: access.error }, access.status);
  }
  return null;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tokenId = searchParams.get('tokenId');

    const denied = await gate(tokenId, 'collections:list');
    if (denied) return denied;

    const rows = await prisma.collection.findMany({
      where: { tokenId: tokenId! },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      include: { _count: { select: { items: true, groups: true } } },
    });

    const collections = rows.map((c) => ({
      id: c.id,
      tokenId: c.tokenId,
      name: c.name,
      slug: c.slug,
      fieldSchema: (c.fieldSchema ?? []) as unknown as FieldDef[],
      roles: (c.roles ?? {}) as Record<string, string>,
      detailPages: c.detailPages,
      layoutHint: c.layoutHint,
      order: c.order,
      itemCount: c._count.items,
      groupCount: c._count.groups,
    }));

    return createSecureResponse({ collections });
  } catch (err) {
    console.error('[collections] GET failed:', err);
    return createSecureResponse({ error: 'Failed to load collections' }, 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = CollectionCreateSchema.safeParse(body);
    if (!parsed.success) {
      return createSecureResponse(
        { error: parsed.error.issues[0]?.message ?? 'Invalid request body' },
        400
      );
    }
    const { tokenId, name, fieldSchema, roles, detailPages, layoutHint } = parsed.data;

    const denied = await gate(tokenId, 'collections:create');
    if (denied) return denied;

    // Cross-field gate: every role must point at an existing field of a legal type.
    const rolesCheck = makeRolesSchema(fieldSchema).safeParse(roles);
    if (!rolesCheck.success) {
      return createSecureResponse(
        { error: rolesCheck.error.issues[0]?.message ?? 'Invalid roles' },
        400
      );
    }

    // projectId is resolved from the OWNERSHIP-VERIFIED token — never the body.
    const project = await prisma.project.findUnique({
      where: { tokenId },
      select: { id: true },
    });
    if (!project) {
      return createSecureResponse({ error: 'Project not found' }, 404);
    }

    const siblings = await prisma.collection.findMany({
      where: { tokenId },
      select: { slug: true, order: true },
    });
    const taken = siblings.map((s) => s.slug);

    // Explicit slug → collision is a hard 409 (the caller asked for that string).
    // Derived slug → clamped to the next free `base-N`.
    let slug: string;
    if (parsed.data.slug) {
      if (taken.includes(parsed.data.slug)) {
        return createSecureResponse(
          { error: `Slug "${parsed.data.slug}" is already used in this project` },
          409
        );
      }
      slug = parsed.data.slug;
    } else {
      slug = uniqueSlug(slugifyName(name), taken);
    }

    const nextOrder = siblings.reduce((max, s) => Math.max(max, s.order + 1), 0);

    const created = await prisma.collection.create({
      data: {
        projectId: project.id,
        tokenId,
        name,
        slug,
        fieldSchema: fieldSchema as any,
        roles: rolesCheck.data as any,
        detailPages,
        layoutHint: layoutHint ?? null,
        order: nextOrder,
      },
    });

    return createSecureResponse({ collection: created }, 201);
  } catch (err: any) {
    // Unique([tokenId, slug]) race — surface as a collision, not a 500.
    if (err?.code === 'P2002') {
      return createSecureResponse({ error: 'Slug is already used in this project' }, 409);
    }
    console.error('[collections] POST failed:', err);
    return createSecureResponse({ error: 'Failed to create collection' }, 500);
  }
}
