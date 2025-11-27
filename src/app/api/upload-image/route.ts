import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const MAX_WIDTH = 2400;
const WEBP_QUALITY = 85;

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

    if (!token.project || token.project.userId !== user.id) {
      console.log('🔴 [UPLOAD] Unauthorized - not project owner');
      return NextResponse.json({ error: 'Unauthorized - not project owner' }, { status: 403 });
    }
    console.log('🔵 [UPLOAD] Project ownership verified');

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique filename
    const timestamp = Date.now();
    const uniqueId = nanoid(10);
    const filename = `${timestamp}-${uniqueId}.webp`;

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', tokenId);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);

    // Process image with Sharp (resize + optimize)
    let processedImage;
    if (file.type === 'image/svg+xml') {
      // SVG - save as-is (no optimization)
      await writeFile(filePath.replace('.webp', '.svg'), buffer);
      const svgUrl = `/uploads/${tokenId}/${timestamp}-${uniqueId}.svg`;
      return NextResponse.json({
        success: true,
        url: svgUrl,
        metadata: {
          format: 'svg',
          size: file.size,
        },
      });
    } else {
      // Raster images - resize and convert to WebP
      const image = sharp(buffer);
      const metadata = await image.metadata();

      processedImage = image.resize(MAX_WIDTH, null, {
        withoutEnlargement: true,
        fit: 'inside',
      });

      processedImage = processedImage.webp({ quality: WEBP_QUALITY });

      await processedImage.toFile(filePath);

      // Get final image metadata
      const finalMetadata = await sharp(filePath).metadata();

      const imageUrl = `/uploads/${tokenId}/${filename}`;

      return NextResponse.json({
        success: true,
        url: imageUrl,
        metadata: {
          width: finalMetadata.width,
          height: finalMetadata.height,
          size: finalMetadata.size,
          format: 'webp',
        },
      });
    }
  } catch (error) {
    console.error('🔴 [UPLOAD] Image upload error:', error);
    console.error('🔴 [UPLOAD] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { error: 'Failed to upload image', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
