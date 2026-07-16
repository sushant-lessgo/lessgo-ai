export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { list } from '@vercel/blob';
import { isAdmin } from '@/lib/admin';
import { processImage, storeImage } from '@/lib/media/pipeline';
import { recordMediaAssetBestEffort } from '@/lib/media/registry';

const MAX_INPUT_SIZE = 15 * 1024 * 1024; // 15MB max from Pexels

export async function POST(request: NextRequest) {
  console.log('🔵 [PROXY] POST handler called');
  try {
    // Authenticate user
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { pexelsPhotoId, tokenId } = body;

    if (!pexelsPhotoId) {
      return NextResponse.json({ error: 'pexelsPhotoId required' }, { status: 400 });
    }

    if (!tokenId) {
      return NextResponse.json({ error: 'tokenId required' }, { status: 400 });
    }

    // Verify project ownership
    const token = await prisma.token.findUnique({
      where: { value: tokenId },
      include: { project: true },
    });

    // Read-side image fetch/cache: admins may proxy for any project (silent bypass, no audit —
    // the write-side upload-image audits its overrides).
    if (!token || !token.project) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    if (token.project.userId !== user.id && !isAdmin(clerkId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check cache - look for existing processed image
    const cacheKey = `uploads/${tokenId}/pexels-${pexelsPhotoId}.webp`;

    try {
      const { blobs } = await list({ prefix: cacheKey });
      if (blobs.length > 0) {
        console.log('🔵 [PROXY] Cache hit:', blobs[0].url);

        // Backfill / un-hide the registry row WITHOUT calling Pexels — the cache exists
        // precisely to avoid that call, and this path fires before any Pexels fetch, so
        // sourceUrl/width/height/blurDataUrl are unobtainable here (all nullable by design;
        // `bytes` comes from the blob listing, which is why it can stay non-null).
        // The upsert's update arm sets `hiddenAt: null`: re-picking an asset is an explicit
        // "I want this on my page", so a hidden asset must reappear in the library.
        // Partial rows are rare by construction — post-seam, the MISS path writes the full
        // row on first proxy, so `create` here only backfills pre-feature blobs.
        await recordMediaAssetBestEffort({
          projectId: token.project.id,
          tokenId,
          userId: clerkId,
          url: blobs[0].url,
          source: 'stock',
          bytes: blobs[0].size,
          format: 'webp',
        });

        return NextResponse.json({
          success: true,
          url: blobs[0].url,
          cached: true,
        });
      }
    } catch {
      // Cache check failed, proceed with processing
    }

    // Fetch photo details from Pexels API
    const pexelsApiKey = process.env.PEXELS_API_KEY;
    if (!pexelsApiKey) {
      return NextResponse.json({ error: 'Pexels API not configured' }, { status: 503 });
    }

    const pexelsResponse = await fetch(`https://api.pexels.com/v1/photos/${pexelsPhotoId}`, {
      headers: { Authorization: pexelsApiKey },
    });

    if (!pexelsResponse.ok) {
      if (pexelsResponse.status === 429) {
        return NextResponse.json({ error: 'Rate limited by Pexels' }, { status: 429 });
      }
      return NextResponse.json({ error: 'Photo not found on Pexels' }, { status: 404 });
    }

    const pexelsPhoto = await pexelsResponse.json();
    const imageUrl = pexelsPhoto.src?.large || pexelsPhoto.src?.large2x;

    if (!imageUrl) {
      return NextResponse.json({ error: 'No image URL in Pexels response' }, { status: 500 });
    }

    console.log('🔵 [PROXY] Fetching image from Pexels:', imageUrl);

    // Fetch the actual image
    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch image from Pexels' }, { status: 502 });
    }

    // Validate content type
    const contentType = imageResponse.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid content type from Pexels' }, { status: 502 });
    }

    // Validate size
    const contentLength = parseInt(imageResponse.headers.get('content-length') || '0', 10);
    if (contentLength > MAX_INPUT_SIZE) {
      return NextResponse.json({ error: 'Image too large' }, { status: 413 });
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Additional size check (content-length can be missing)
    if (buffer.length > MAX_INPUT_SIZE) {
      return NextResponse.json({ error: 'Image too large' }, { status: 413 });
    }

    console.log('🔵 [PROXY] Processing with Sharp...');

    // Process + store via the shared pipeline (same blob key as before: uploads/{tokenId}/…)
    const processed = await processImage(buffer, 'image/webp');
    const filename = `pexels-${pexelsPhotoId}.webp`;

    const stored = await storeImage(processed.buffer, {
      tokenId,
      filename,
      contentType: processed.contentType,
    });

    console.log('🔵 [PROXY] Stored:', stored.storage, stored.url);

    // Registry row — BEST EFFORT: a stock pick must never fail because the row failed.
    await recordMediaAssetBestEffort({
      projectId: token.project.id,
      tokenId,
      userId: clerkId,
      url: stored.url,
      source: 'stock',
      sourceUrl: imageUrl,
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
      cached: false,
    });

  } catch (error) {
    console.error('🔴 [PROXY] Error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy image', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
