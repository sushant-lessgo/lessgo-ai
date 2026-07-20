// src/app/api/collections/[collectionId]/groups/route.ts
// CMS collections — group create / reorder+rename / delete
// (cms-collections plan phase 1, step 5).
//
//   POST   { tokenId, name, order? }        → { group }
//   PATCH  { tokenId, groups: [{id, name?, order?}] } → { groups }
//   DELETE ?tokenId=…&groupId=…             → { success: true }  (items → ungrouped)
//
// ── AUTHZ — TWO gates, both mandatory ────────────────────────────────────────
//   1. `assertProjectOwner` on the tokenId — a RESULT object, `.ok`-checked and
//      returned early (it never throws / 403s by itself). `allowMissing: false`.
//   2. Nested-route ownership: the collectionId must belong to the verified
//      token, and every groupId must belong to THAT collection. A valid token for
//      project A must never reach project B's groups.
//
// Item fallout on group delete: `CollectionItem.groupId` is `onDelete: SetNull`,
// so deleting a group ungroups its items — it never deletes them.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { createSecureResponse, assertProjectOwner, validateToken } from '@/lib/security';
import { GroupCreateSchema, GroupPatchSchema } from '@/lib/schemas/collection.schema';

type Params = { params: { collectionId: string } };

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

/** Nested-route ownership: the collection must belong to the verified token. */
async function loadOwnedCollection(collectionId: string, tokenId: string) {
  return prisma.collection.findFirst({
    where: { id: collectionId, tokenId },
    select: { id: true },
  });
}

const NOT_FOUND = 'Collection not found';

export async function POST(req: Request, { params }: Params) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = GroupCreateSchema.safeParse(body);
    if (!parsed.success) {
      return createSecureResponse(
        { error: parsed.error.issues[0]?.message ?? 'Invalid request body' },
        400
      );
    }
    const { tokenId, name, order } = parsed.data;

    const denied = await gate(tokenId, 'collections:group-create');
    if (denied) return denied;

    const collection = await loadOwnedCollection(params.collectionId, tokenId);
    if (!collection) return createSecureResponse({ error: NOT_FOUND }, 404);

    let nextOrder = order;
    if (nextOrder === undefined) {
      const agg = await prisma.collectionGroup.aggregate({
        where: { collectionId: collection.id },
        _max: { order: true },
      });
      nextOrder = (agg._max.order ?? -1) + 1;
    }

    const group = await prisma.collectionGroup.create({
      data: { collectionId: collection.id, name, order: nextOrder },
    });

    return createSecureResponse({ group }, 201);
  } catch (err) {
    console.error('[collections/:id/groups] POST failed:', err);
    return createSecureResponse({ error: 'Failed to create group' }, 500);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = GroupPatchSchema.safeParse(body);
    if (!parsed.success) {
      return createSecureResponse(
        { error: parsed.error.issues[0]?.message ?? 'Invalid request body' },
        400
      );
    }
    const { tokenId, groups } = parsed.data;

    const denied = await gate(tokenId, 'collections:group-update');
    if (denied) return denied;

    const collection = await loadOwnedCollection(params.collectionId, tokenId);
    if (!collection) return createSecureResponse({ error: NOT_FOUND }, 404);

    // Every targeted group must live in THIS collection (cross-collection guard).
    const ids = groups.map((g) => g.id);
    const owned = await prisma.collectionGroup.findMany({
      where: { collectionId: collection.id, id: { in: ids } },
      select: { id: true },
    });
    if (owned.length !== new Set(ids).size) {
      return createSecureResponse(
        { error: 'One or more groups do not belong to this collection' },
        400
      );
    }

    await prisma.$transaction(
      groups.map((g) =>
        prisma.collectionGroup.update({
          where: { id: g.id },
          data: {
            ...(g.name !== undefined ? { name: g.name } : {}),
            ...(g.order !== undefined ? { order: g.order } : {}),
          },
        })
      )
    );

    const next = await prisma.collectionGroup.findMany({
      where: { collectionId: collection.id },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });

    return createSecureResponse({ groups: next });
  } catch (err) {
    console.error('[collections/:id/groups] PATCH failed:', err);
    return createSecureResponse({ error: 'Failed to update groups' }, 500);
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const { searchParams } = new URL(req.url);
    const tokenId = searchParams.get('tokenId');
    const groupId = searchParams.get('groupId');

    const denied = await gate(tokenId, 'collections:group-delete');
    if (denied) return denied;

    if (!groupId) {
      return createSecureResponse({ error: 'Missing groupId' }, 400);
    }

    const collection = await loadOwnedCollection(params.collectionId, tokenId!);
    if (!collection) return createSecureResponse({ error: NOT_FOUND }, 404);

    const group = await prisma.collectionGroup.findFirst({
      where: { id: groupId, collectionId: collection.id },
      select: { id: true },
    });
    if (!group) return createSecureResponse({ error: 'Group not found' }, 404);

    // Items fall back to ungrouped via the FK's onDelete: SetNull.
    await prisma.collectionGroup.delete({ where: { id: group.id } });

    return createSecureResponse({ success: true });
  } catch (err) {
    console.error('[collections/:id/groups] DELETE failed:', err);
    return createSecureResponse({ error: 'Failed to delete group' }, 500);
  }
}
