// src/app/api/collections/[collectionId]/route.ts
// CMS collections — single-collection read / update / delete
// (cms-collections plan phase 1, step 5).
//
//   GET    ?tokenId=…  → { collection, groups, items }
//   PATCH  { tokenId, name?|slug?|fieldSchema?|roles?|detailPages?|layoutHint?|order? }
//   DELETE ?tokenId=…  → { success: true }  (groups + items cascade)
//
// ── AUTHZ — TWO gates, both mandatory ────────────────────────────────────────
//   1. `assertProjectOwner` on the tokenId. It returns a RESULT object; it does
//      NOT throw and does NOT 403 by itself, so the result is `.ok`-checked and
//      returned early. `allowMissing: false`, no `claimIfOrphan`.
//   2. **Nested-route ownership:** the collectionId in the path must belong to
//      the ownership-verified token. Without check 2, a caller holding a valid
//      token for project A could read/mutate project B's collections — the same
//      bug class as the publish cross-tenant leak. `loadOwnedCollection` below is
//      the ONLY way this file reaches a Collection row, and it always filters on
//      `{ id, tokenId }`. A mismatch is a 404 (no existence oracle).
//
// ── SCHEMA-EDIT SEMANTICS (non-destructive, pinned by the plan) ──────────────
//   Removing a field from `fieldSchema` ORPHANS that key in every item's
//   `values`. Items are NEVER rewritten here; readers ignore unknown keys.
//
// 0 credits: pure DB work, no LLM.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { createSecureResponse, assertProjectOwner, validateToken } from '@/lib/security';
import {
  CollectionPatchSchema,
  makeRolesSchema,
  ROLE_ALLOWED_TYPES,
  type FieldDef,
  type CollectionRoles,
  type RoleKey,
} from '@/lib/schemas/collection.schema';

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

/**
 * Nested-route ownership: fetch the collection ONLY if it belongs to the
 * already-ownership-verified token. Never `findUnique({ where: { id } })`.
 */
async function loadOwnedCollection(collectionId: string, tokenId: string) {
  return prisma.collection.findFirst({ where: { id: collectionId, tokenId } });
}

const NOT_FOUND = 'Collection not found';

export async function GET(req: Request, { params }: Params) {
  try {
    const { searchParams } = new URL(req.url);
    const tokenId = searchParams.get('tokenId');

    const denied = await gate(tokenId, 'collections:get');
    if (denied) return denied;

    const collection = await loadOwnedCollection(params.collectionId, tokenId!);
    if (!collection) return createSecureResponse({ error: NOT_FOUND }, 404);

    const [groups, items] = await Promise.all([
      prisma.collectionGroup.findMany({
        where: { collectionId: collection.id },
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
      }),
      prisma.collectionItem.findMany({
        where: { collectionId: collection.id },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      }),
    ]);

    return createSecureResponse({ collection, groups, items });
  } catch (err) {
    console.error('[collections/:id] GET failed:', err);
    return createSecureResponse({ error: 'Failed to load collection' }, 500);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = CollectionPatchSchema.safeParse(body);
    if (!parsed.success) {
      return createSecureResponse(
        { error: parsed.error.issues[0]?.message ?? 'Invalid request body' },
        400
      );
    }
    const { tokenId, name, slug, fieldSchema, roles, detailPages, layoutHint, order } =
      parsed.data;

    const denied = await gate(tokenId, 'collections:update');
    if (denied) return denied;

    const collection = await loadOwnedCollection(params.collectionId, tokenId);
    if (!collection) return createSecureResponse({ error: NOT_FOUND }, 404);

    // Effective field schema after this PATCH (unchanged when not supplied).
    const nextFields: FieldDef[] =
      fieldSchema ?? ((collection.fieldSchema ?? []) as unknown as FieldDef[]);

    let nextRoles: CollectionRoles;
    if (roles !== undefined) {
      // Explicit roles are validated strictly against the effective schema.
      const check = makeRolesSchema(nextFields).safeParse(roles);
      if (!check.success) {
        return createSecureResponse(
          { error: check.error.issues[0]?.message ?? 'Invalid roles' },
          400
        );
      }
      nextRoles = check.data;
    } else {
      // Roles not supplied: keep the stored ones, but DROP any role whose target
      // field the schema edit just removed or retyped. Rejecting instead would
      // make deleting a role-bearing field impossible without a two-step dance.
      nextRoles = pruneRoles(
        (collection.roles ?? {}) as CollectionRoles,
        nextFields
      );
    }

    // Slug edit → re-checked for uniqueness within the token (write-time gate;
    // publish has no collision detection).
    if (slug && slug !== collection.slug) {
      const clash = await prisma.collection.findFirst({
        where: { tokenId, slug, NOT: { id: collection.id } },
        select: { id: true },
      });
      if (clash) {
        return createSecureResponse(
          { error: `Slug "${slug}" is already used in this project` },
          409
        );
      }
    }

    const updated = await prisma.collection.update({
      where: { id: collection.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(slug !== undefined ? { slug } : {}),
        ...(fieldSchema !== undefined ? { fieldSchema: fieldSchema as any } : {}),
        // Roles are always rewritten: an unsupplied-roles schema edit may prune.
        roles: nextRoles as any,
        ...(detailPages !== undefined ? { detailPages } : {}),
        ...(layoutHint !== undefined ? { layoutHint: layoutHint ?? null } : {}),
        ...(order !== undefined ? { order } : {}),
      },
    });

    // NOTE: items are deliberately untouched — a removed field's values stay as
    // orphan keys (non-destructive schema edit).
    return createSecureResponse({ collection: updated });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return createSecureResponse({ error: 'Slug is already used in this project' }, 409);
    }
    console.error('[collections/:id] PATCH failed:', err);
    return createSecureResponse({ error: 'Failed to update collection' }, 500);
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const { searchParams } = new URL(req.url);
    const tokenId = searchParams.get('tokenId');

    const denied = await gate(tokenId, 'collections:delete');
    if (denied) return denied;

    const collection = await loadOwnedCollection(params.collectionId, tokenId!);
    if (!collection) return createSecureResponse({ error: NOT_FOUND }, 404);

    // Groups + items cascade at the DB level (onDelete: Cascade).
    await prisma.collection.delete({ where: { id: collection.id } });

    return createSecureResponse({ success: true });
  } catch (err) {
    console.error('[collections/:id] DELETE failed:', err);
    return createSecureResponse({ error: 'Failed to delete collection' }, 500);
  }
}

/** Drop roles whose target field no longer exists or no longer has a legal type. */
function pruneRoles(roles: CollectionRoles, fields: FieldDef[]): CollectionRoles {
  const byId = new Map(fields.map((f) => [f.id, f]));
  const next: CollectionRoles = {};
  for (const role of Object.keys(ROLE_ALLOWED_TYPES) as RoleKey[]) {
    const fieldId = roles?.[role];
    if (!fieldId) continue;
    const field = byId.get(fieldId);
    if (!field) continue;
    const allowed = ROLE_ALLOWED_TYPES[role] as readonly string[];
    if (!allowed.includes(field.type)) continue;
    next[role] = fieldId;
  }
  return next;
}
