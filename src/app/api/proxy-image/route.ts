export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import sharp from 'sharp';
import { put, list } from '@vercel/blob';

const MAX_INPUT_SIZE = 15 * 1024 * 1024; // 15MB max from Pexels
const MAX_WIDTH = 2400;
const WEBP_QUALITY = 85;

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

    if (!token || !token.project || token.project.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check cache - look for existing processed image
    const cacheKey = `uploads/${tokenId}/pexels-${pexelsPhotoId}.webp`;

    try {
      const { blobs } = await list({ prefix: cacheKey });
      if (blobs.length > 0) {
        console.log('🔵 [PROXY] Cache hit:', blobs[0].url);
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

    // Process with Sharp
    const processedBuffer = await sharp(buffer)
      .resize(MAX_WIDTH, null, {
        withoutEnlargement: true,
        fit: 'inside',
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    // Dev mode fallback
    const isDev = process.env.NODE_ENV === 'development';
    const hasBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

    if (isDev && !hasBlob) {
      const { writeFile, mkdir } = await import('fs/promises');
      const { existsSync } = await import('fs');
      const path = await import('path');

      const uploadDir = path.join(process.cwd(), 'public', 'uploads', tokenId);
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      const filename = `pexels-${pexelsPhotoId}.webp`;
      const filePath = path.join(uploadDir, filename);
      await writeFile(filePath, processedBuffer);

      const localUrl = `/uploads/${tokenId}/${filename}`;
      console.log('🔵 [PROXY] Dev mode: Saved to filesystem:', localUrl);

      return NextResponse.json({
        success: true,
        url: localUrl,
        cached: false,
      });
    }

    // Upload to Vercel Blob
    console.log('🔵 [PROXY] Uploading to Vercel Blob...');
    const blob = await put(cacheKey, processedBuffer, {
      access: 'public',
      contentType: 'image/webp',
      addRandomSuffix: false,
    });

    console.log('🔵 [PROXY] Upload successful:', blob.url);

    return NextResponse.json({
      success: true,
      url: blob.url,
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
