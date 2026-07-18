export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { isAdmin, logAdminOverride } from '@/lib/admin';
import { processImage, storeImage } from '@/lib/media/pipeline';
import { recordMediaAssetBestEffort } from '@/lib/media/registry';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

export async function POST(request: NextRequest) {
  console.log('🔵 [UPLOAD] POST handler called');
  try {
    console.log('🔵 [UPLOAD] Authenticating...');
    // Authenticate user
    const { userId: clerkId } = await auth();
    console.log('🔵 [UPLOAD] Auth result:', { clerkId });
    if (!clerkId) {
      console.log('🔴 [UPLOAD] No clerkId, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Look up internal user ID
    console.log('🔵 [UPLOAD] Looking up user by clerkId...');
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });
    console.log('🔵 [UPLOAD] User lookup result:', user ? `found (id: ${user.id})` : 'not found');

    if (!user) {
      console.log('🔴 [UPLOAD] User not found, returning 401');
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    console.log('🔵 [UPLOAD] Parsing form data...');
    // Parse form data
    const formData = await request.formData();
    console.log('🔵 [UPLOAD] Form data parsed');
    const file = formData.get('file') as File;
    const tokenId = formData.get('tokenId') as string;
    console.log('🔵 [UPLOAD] File:', file?.name, 'TokenId:', tokenId);

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!tokenId) {
      return NextResponse.json({ error: 'No tokenId provided' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    console.log('🔵 [UPLOAD] Verifying project ownership...');
    // Verify project ownership
    const token = await prisma.token.findUnique({
      where: { value: tokenId },
      include: { project: true },
    });
    console.log('🔵 [UPLOAD] Token query result:', token ? 'found' : 'not found');

    if (!token) {
      console.log('🔴 [UPLOAD] Invalid token, returning 404');
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
    }

    console.log('🔵 [UPLOAD] Token data:', { hasProject: !!token.project, projectUserId: token.project?.userId, userInternalId: user.id });

    if (!token.project) {
      console.log('🔴 [UPLOAD] Token has no project, returning 403');
      return NextResponse.json({ error: 'Unauthorized - not project owner' }, { status: 403 });
    }
    if (token.project.userId !== user.id) {
      // Owner mismatch: reject unless the actor is an admin (support/ops override on another
      // user's project). Audit-logged. isAdmin needs the Clerk id, not the internal user id.
      if (!isAdmin(clerkId)) {
        console.log('🔴 [UPLOAD] Unauthorized - not project owner');
        return NextResponse.json({ error: 'Unauthorized - not project owner' }, { status: 403 });
      }
      await logAdminOverride({ actorClerkId: clerkId, ownerId: token.project.userId, action: 'image.upload', resource: { tokenId } });
    }
    console.log('🔵 [UPLOAD] Project ownership verified');

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique filename
    const timestamp = Date.now();
    const uniqueId = nanoid(10);

    // Process image (shared pipeline: sharp resize → WebP + blur + checksum; SVG passthrough)
    const processed = await processImage(buffer, file.type);
    const filename = `${timestamp}-${uniqueId}.${processed.extension}`;

    // Store (shared pipeline: Vercel Blob, or filesystem fallback in dev without a blob token)
    const stored = await storeImage(processed.buffer, {
      tokenId,
      filename,
      contentType: processed.contentType,
    });

    console.log('🔵 [UPLOAD] Stored:', stored.storage, stored.url);

    // Registry row — BEST EFFORT: an upload must never fail because the row failed.
    const assetId = await recordMediaAssetBestEffort({
      projectId: token.project.id,
      tokenId,
      userId: clerkId,
      url: stored.url,
      source: 'upload',
      width: processed.width,
      height: processed.height,
      bytes: processed.bytes,
      format: processed.format,
      blurDataUrl: processed.blurDataUrl,
      checksum: processed.checksum,
    });

    return NextResponse.json({
      success: true,
      url: stored.url,
      metadata: {
        width: processed.width ?? undefined,
        height: processed.height ?? undefined,
        size: processed.bytes,
        format: processed.format,
        blurDataUrl: processed.blurDataUrl,
        assetId,
      },
    });
  } catch (error) {
    console.error('🔴 [UPLOAD] Image upload error:', error);
    console.error('🔴 [UPLOAD] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { error: 'Failed to upload image', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
