// src/app/api/collections/[collectionId]/items/[itemId]/route.ts
// CMS collections — single-item read / update / delete
// (cms-collections plan phase 1, step 5).
//
//   GET    ?tokenId=…                          → { item }
//   PATCH  { tokenId, values?|slug?|groupId?|order?|featuredOnHome? } → { item }
//
//   `featuredOnHome` is a RESERVED column (amendment 2026-07-20 item 3): accepted
//   and persisted, but no UI sets it and nothing reads it. Do not build promotion
//   logic on it without a spec change.
//   DELETE ?tokenId=…                          → { success: true }
//
// ── AUTHZ — THREE nested gates, all mandatory ────────────────────────────────
//   1. `assertProjectOwner` on the tokenId — a RESULT object, `.ok`-checked and
//      returned early (it never throws / 403s by itself). `allowMissing: false`.
//   2. The collectionId must belong to the ownership-verified token.
//   3. The itemId must belong to THAT collection.
//   `loadOwnedItem` is the only path to a row here and enforces 2+3 in one query.
//
// ── VALUES PATCH IS A MERGE, NOT A REPLACE ───────────────────────────────────
//   `values` is merged over the stored map; an explicit `null` deletes a key.
//   A wholesale replace would silently drop ORPHAN keys (values of fields that a
//   schema edit removed), which the plan pins as non-destructive.
//
// ── SLUG ─────────────────────────────────────────────────────────────────────
//   A manual slug edit sets `slugLocked: true` so re-materialization (phase 4)
//   never clobbers it. Uniqueness is enforced here at write time — publish has no
//   collision detection.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { createSecureResponse, assertProjectOwner, validateToken } from '@/lib/security';
import {
  ItemPatchSchema,
  makeItemValuesSchema,
  type FieldDef,
} from '@/lib/schemas/collection.schema';
import { reservedPagePaths, itemSlugShadowsPage } from '@/modules/cms/materializePublish';

type Params = { params: { collectionId: string; itemId: string } };

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

/**
 * Nested ownership in ONE query: item → its collection → the verified token.
 * Never `findUnique({ where: { id: itemId } })`.
 */
async function loadOwnedItem(itemId: string, collectionId: string, tokenId: string) {
  return prisma.collectionItem.findFirst({
    where: { id: itemId, collectionId, collection: { tokenId } },
    include: { collection: true },
  });
}

const NOT_FOUND = 'Item not found';

export async function GET(req: Request, { params }: Params) {
  try {
    const { searchParams } = new URL(req.url);
    const tokenId = searchParams.get('tokenId');

    const denied = await gate(tokenId, 'collections:item-get');
    if (denied) return denied;

    const found = await loadOwnedItem(params.itemId, params.collectionId, tokenId!);
    if (!found) return createSecureResponse({ error: NOT_FOUND }, 404);

    const { collection: _collection, ...item } = found;
    return createSecureResponse({ item });
  } catch (err) {
    console.error('[collections/:id/items/:itemId] GET failed:', err);
    return createSecureResponse({ error: 'Failed to load item' }, 500);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = ItemPatchSchema.safeParse(body);
    if (!parsed.success) {
      return createSecureResponse(
        { error: parsed.error.issues[0]?.message ?? 'Invalid request body' },
        400
      );
    }
    const { tokenId, values, groupId, slug, order, featuredOnHome } = parsed.data;

    const denied = await gate(tokenId, 'collections:item-update');
    if (denied) return denied;

    const found = await loadOwnedItem(params.itemId, params.collectionId, tokenId);
    if (!found) return createSecureResponse({ error: NOT_FOUND }, 404);

    const fields = (found.collection.fieldSchema ?? []) as unknown as FieldDef[];

    // MERGE (never replace): keeps orphan keys alive. `null` = delete the key.
    let nextValues = (found.values ?? {}) as Record<string, unknown>;
    if (values !== undefined) {
      const merged: Record<string, unknown> = { ...nextValues };
      for (const [k, v] of Object.entries(values)) {
        if (v === null) delete merged[k];
        else merged[k] = v;
      }
      const check = makeItemValuesSchema(fields).safeParse(merged);
      if (!check.success) {
        return createSecureResponse(
          { error: check.error.issues[0]?.message ?? 'Invalid values' },
          400
        );
      }
      nextValues = check.data;
    }

    // A supplied group must belong to the SAME collection.
    if (groupId) {
      const group = await prisma.collectionGroup.findFirst({
        where: { id: groupId, collectionId: found.collectionId },
        select: { id: true },
      });
      if (!group) {
        return createSecureResponse(
          { error: 'Group does not belong to this collection' },
          400
        );
      }
    }

    // Slug edit → uniqueness re-checked within the collection, and LOCKED.
    let slugLocked = found.slugLocked;
    if (slug && slug !== found.slug) {
      const clash = await prisma.collectionItem.findFirst({
        where: { collectionId: found.collectionId, slug, NOT: { id: found.id } },
        select: { id: true },
      });
      if (clash) {
        return createSecureResponse(
          { error: `Slug "${slug}" is already used in this collection` },
          409
        );
      }

      // Phase 4 uniqueness hardening: this item's detail page publishes at
      // `/<collectionSlug>/<itemSlug>`. If a real page already sits there, the
      // publish-side guard would fail the whole publish — reject at write time.
      const project = await prisma.project.findUnique({
        where: { tokenId },
        select: { content: true },
      });
      if (
        itemSlugShadowsPage(found.collection.slug, slug, reservedPagePaths(project?.content))
      ) {
        return createSecureResponse(
          {
            error: `Slug "${slug}" conflicts with the existing page "/${found.collection.slug}/${slug}". Pick a different slug.`,
          },
          409
        );
      }

      // A manual slug edit LOCKS the slug (re-materialization never clobbers it).
      slugLocked = true;
    }

    const item = await prisma.collectionItem.update({
      where: { id: found.id },
      data: {
        ...(values !== undefined ? { values: nextValues as any } : {}),
        // `null` is meaningful: move the item to ungrouped.
        ...(groupId !== undefined ? { groupId } : {}),
        ...(slug !== undefined ? { slug, slugLocked } : {}),
        ...(order !== undefined ? { order } : {}),
        // RESERVED FLAG (amendment item 3): persisted, read by nothing, no UI.
        ...(featuredOnHome !== undefined ? { featuredOnHome } : {}),
      },
    });

    return createSecureResponse({ item });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return createSecureResponse({ error: 'Slug is already used in this collection' }, 409);
    }
    console.error('[collections/:id/items/:itemId] PATCH failed:', err);
    return createSecureResponse({ error: 'Failed to update item' }, 500);
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const { searchParams } = new URL(req.url);
    const tokenId = searchParams.get('tokenId');

    const denied = await gate(tokenId, 'collections:item-delete');
    if (denied) return denied;

    const found = await loadOwnedItem(params.itemId, params.collectionId, tokenId!);
    if (!found) return createSecureResponse({ error: NOT_FOUND }, 404);

    await prisma.collectionItem.delete({ where: { id: found.id } });

    return createSecureResponse({ success: true });
  } catch (err) {
    console.error('[collections/:id/items/:itemId] DELETE failed:', err);
    return createSecureResponse({ error: 'Failed to delete item' }, 500);
  }
}
