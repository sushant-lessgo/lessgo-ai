// src/app/api/media/route.ts
// Token-scoped MediaAsset registry API (media-library-picker phase 3).
//
//   GET    ?tokenId=…[&includeHidden=1]  → list this project's assets
//   DELETE { tokenId, assetId }          → SOFT-delete (set hiddenAt). Blob untouched.
//   POST   { tokenId, assetId, restore?, alt? } → un-hide and/or set alt text
//
// There is NO create here, by design. Rows are written server-side only:
//   - `/api/upload-image` + `/api/proxy-image` record them through the phase-2 seam, so
//     every existing image entry point inherits rows for free;
//   - server-side callers (E2 scrape ingestion) import `src/lib/media/registry.ts`
//     directly — the module IS the API for them.
//
// DELETE is a soft-delete and always will be: `docs/tracks/workEndtoEnd.md` §8a promises
// "photos are hidden, never destroyed — restorable anytime". The blob deliberately stays;
// blob reconciliation/GC is t8 storage-manager debt (pre-existing, not a regression).
//
// Token identifies WHICH project, never ownership — assertProjectOwner is mandatory
// (2026-07-02 authz fix). It returns a discriminated union and never throws.
// 0 credits: storage/DB work, no LLM.
export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { createSecureResponse, assertProjectOwner, validateToken } from '@/lib/security';
import { MediaDeleteSchema, MediaUpdateSchema } from '@/lib/schemas/media.schema';

const ASSET_SELECT = {
  id: true,
  url: true,
  source: true,
  sourceUrl: true,
  width: true,
  height: true,
  bytes: true,
  format: true,
  blurDataUrl: true,
  alt: true,
  hiddenAt: true,
  createdAt: true,
} as const;

/** auth → token validation → ownership. Returns a response to bail with, or null to proceed. */
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tokenId = searchParams.get('tokenId');

    const denied = await gate(tokenId, 'media:list');
    if (denied) return denied;

    const includeHidden = searchParams.get('includeHidden') === '1';

    const assets = await prisma.mediaAsset.findMany({
      where: {
        tokenId: tokenId!,
        // Soft-hidden rows are excluded by default — the library must not show them.
        ...(includeHidden ? {} : { hiddenAt: null }),
      },
      // createdAt, NOT updatedAt: `updatedAt` is @updatedAt and the registry's cache-hit
      // un-hide arm bumps it, which would reshuffle the grid on a re-pick.
      orderBy: { createdAt: 'desc' },
      select: ASSET_SELECT,
    });

    return createSecureResponse({ assets });
  } catch (err) {
    console.error('[media] GET failed:', err);
    return createSecureResponse({ error: 'Failed to list media' }, 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = MediaDeleteSchema.safeParse(body);
    if (!parsed.success) {
      return createSecureResponse({ error: 'Invalid request body' }, 400);
    }
    const { tokenId, assetId } = parsed.data;

    const denied = await gate(tokenId, 'media:hide');
    if (denied) return denied;

    // SOFT-delete only. `tokenId` in the filter keeps a caller from hiding another
    // project's asset by id even though they own THIS token.
    const result = await prisma.mediaAsset.updateMany({
      where: { id: assetId, tokenId },
      data: { hiddenAt: new Date() },
    });
    if (result.count === 0) {
      return createSecureResponse({ error: 'Asset not found' }, 404);
    }

    return createSecureResponse({ success: true, hidden: true });
  } catch (err) {
    console.error('[media] DELETE failed:', err);
    return createSecureResponse({ error: 'Failed to hide media asset' }, 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = MediaUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return createSecureResponse({ error: 'Invalid request body' }, 400);
    }
    const { tokenId, assetId, restore, alt } = parsed.data;

    const denied = await gate(tokenId, 'media:update');
    if (denied) return denied;

    const result = await prisma.mediaAsset.updateMany({
      where: { id: assetId, tokenId },
      data: {
        ...(restore ? { hiddenAt: null } : {}),
        ...(alt !== undefined ? { alt: alt === '' ? null : alt } : {}),
      },
    });
    if (result.count === 0) {
      return createSecureResponse({ error: 'Asset not found' }, 404);
    }

    const asset = await prisma.mediaAsset.findUnique({
      where: { id: assetId },
      select: ASSET_SELECT,
    });

    return createSecureResponse({ success: true, asset });
  } catch (err) {
    console.error('[media] POST failed:', err);
    return createSecureResponse({ error: 'Failed to update media asset' }, 500);
  }
}
