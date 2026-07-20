// src/app/api/collections/[collectionId]/items/route.ts
// CMS collections — item create + bulk reorder/regroup
// (cms-collections plan phase 1, step 5).
//
//   POST  { tokenId, values?, groupId?, slug?, order? }        → { item }
//   PATCH { tokenId, items: [{id, order?, groupId?}] }         → { items }
//
// ── AUTHZ — TWO gates, both mandatory ────────────────────────────────────────
//   1. `assertProjectOwner` on the tokenId — a RESULT object, `.ok`-checked and
//      returned early (it never throws / 403s by itself). `allowMissing: false`.
//   2. Nested-route ownership: the collectionId must belong to the verified
//      token; every itemId / groupId must belong to THAT collection.
//
// ── SLUGS ────────────────────────────────────────────────────────────────────
//   Derived from the TITLE-ROLE value ("Blue Chair" → `blue-chair`), unique per
//   collection, clamped (`base-2`, `base-3`…). Uniqueness is enforced HERE, at
//   write time — the publish materializer has no collision detection (plan
//   phase 4 risk). An EXPLICIT slug is never silently clamped: a collision is a
//   409, and the item is marked `slugLocked` so re-materialization can't clobber
//   the caller's choice.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { createSecureResponse, assertProjectOwner, validateToken } from '@/lib/security';
import {
  ItemCreateSchema,
  ItemBulkPatchSchema,
  makeItemValuesSchema,
  type FieldDef,
  type CollectionRoles,
} from '@/lib/schemas/collection.schema';
import { uniqueSlug } from '@/modules/cms/slug';

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
  return prisma.collection.findFirst({ where: { id: collectionId, tokenId } });
}

const NOT_FOUND = 'Collection not found';
const ITEM_SLUG_FALLBACK = 'item';

export async function POST(req: Request, { params }: Params) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = ItemCreateSchema.safeParse(body);
    if (!parsed.success) {
      return createSecureResponse(
        { error: parsed.error.issues[0]?.message ?? 'Invalid request body' },
        400
      );
    }
    const { tokenId, values, groupId, order } = parsed.data;

    const denied = await gate(tokenId, 'collections:item-create');
    if (denied) return denied;

    const collection = await loadOwnedCollection(params.collectionId, tokenId);
    if (!collection) return createSecureResponse({ error: NOT_FOUND }, 404);

    const fields = (collection.fieldSchema ?? []) as unknown as FieldDef[];

    // Type-check values against THIS collection's schema (unknown/orphan keys are
    // tolerated and preserved — see makeItemValuesSchema).
    const valuesCheck = makeItemValuesSchema(fields).safeParse(values);
    if (!valuesCheck.success) {
      return createSecureResponse(
        { error: valuesCheck.error.issues[0]?.message ?? 'Invalid values' },
        400
      );
    }

    // A supplied group must belong to this collection.
    if (groupId) {
      const group = await prisma.collectionGroup.findFirst({
        where: { id: groupId, collectionId: collection.id },
        select: { id: true },
      });
      if (!group) {
        return createSecureResponse(
          { error: 'Group does not belong to this collection' },
          400
        );
      }
    }

    const siblings = await prisma.collectionItem.findMany({
      where: { collectionId: collection.id },
      select: { slug: true, order: true },
    });
    const taken = siblings.map((s) => s.slug);

    let slug: string;
    let slugLocked = false;
    if (parsed.data.slug) {
      if (taken.includes(parsed.data.slug)) {
        return createSecureResponse(
          { error: `Slug "${parsed.data.slug}" is already used in this collection` },
          409
        );
      }
      slug = parsed.data.slug;
      // An explicitly chosen slug is a manual decision — lock it (plan phase 4).
      slugLocked = true;
    } else {
      slug = uniqueSlug(titleBase(valuesCheck.data, fields, collection), taken);
    }

    const nextOrder =
      order ?? siblings.reduce((max, s) => Math.max(max, s.order + 1), 0);

    const item = await prisma.collectionItem.create({
      data: {
        collectionId: collection.id,
        groupId: groupId ?? null,
        slug,
        slugLocked,
        values: valuesCheck.data as any,
        order: nextOrder,
      },
    });

    return createSecureResponse({ item }, 201);
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return createSecureResponse({ error: 'Slug is already used in this collection' }, 409);
    }
    console.error('[collections/:id/items] POST failed:', err);
    return createSecureResponse({ error: 'Failed to create item' }, 500);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = ItemBulkPatchSchema.safeParse(body);
    if (!parsed.success) {
      return createSecureResponse(
        { error: parsed.error.issues[0]?.message ?? 'Invalid request body' },
        400
      );
    }
    const { tokenId, items } = parsed.data;

    const denied = await gate(tokenId, 'collections:item-reorder');
    if (denied) return denied;

    const collection = await loadOwnedCollection(params.collectionId, tokenId);
    if (!collection) return createSecureResponse({ error: NOT_FOUND }, 404);

    // Every targeted item must live in THIS collection (cross-collection guard).
    const ids = items.map((i) => i.id);
    const owned = await prisma.collectionItem.findMany({
      where: { collectionId: collection.id, id: { in: ids } },
      select: { id: true },
    });
    if (owned.length !== new Set(ids).size) {
      return createSecureResponse(
        { error: 'One or more items do not belong to this collection' },
        400
      );
    }

    // …and every target group too.
    const groupIds = Array.from(
      new Set(items.map((i) => i.groupId).filter((g): g is string => !!g))
    );
    if (groupIds.length) {
      const ownedGroups = await prisma.collectionGroup.findMany({
        where: { collectionId: collection.id, id: { in: groupIds } },
        select: { id: true },
      });
      if (ownedGroups.length !== groupIds.length) {
        return createSecureResponse(
          { error: 'One or more groups do not belong to this collection' },
          400
        );
      }
    }

    await prisma.$transaction(
      items.map((i) =>
        prisma.collectionItem.update({
          where: { id: i.id },
          data: {
            ...(i.order !== undefined ? { order: i.order } : {}),
            // `null` is meaningful here: move the item to ungrouped.
            ...(i.groupId !== undefined ? { groupId: i.groupId } : {}),
          },
        })
      )
    );

    const next = await prisma.collectionItem.findMany({
      where: { collectionId: collection.id },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });

    return createSecureResponse({ items: next });
  } catch (err) {
    console.error('[collections/:id/items] PATCH failed:', err);
    return createSecureResponse({ error: 'Failed to update items' }, 500);
  }
}

/**
 * Slug source for a new item: the TITLE-ROLE value, else the first non-empty
 * text_short value, else the collection name, else "item". Never returns "".
 */
function titleBase(
  values: Record<string, unknown>,
  fields: FieldDef[],
  collection: { name: string; roles: unknown }
): string {
  const roles = (collection.roles ?? {}) as CollectionRoles;
  const titleId = roles.title;
  const fromRole = titleId ? values[titleId] : undefined;
  if (typeof fromRole === 'string' && fromRole.trim()) return fromRole;

  for (const f of fields) {
    if (f.type !== 'text_short') continue;
    const v = values[f.id];
    if (typeof v === 'string' && v.trim()) return v;
  }

  return collection.name?.trim() || ITEM_SLUG_FALLBACK;
}
