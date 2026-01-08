export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { tokenId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tokenId } = params;
    if (!tokenId) {
      return NextResponse.json(
        { error: 'Token ID required' },
        { status: 400 }
      );
    }

    // Get project by tokenId AND verify ownership via User.clerkId
    const project = await prisma.project.findFirst({
      where: {
        tokenId,
        user: { clerkId: userId }  // Filter by Clerk ID
      },
      select: { id: true },
    });

    if (!project) {
      // Could be "not found" or "forbidden" - return generic 403 for security
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Query PublishedPage by projectId
    const publishedPage = await prisma.publishedPage.findFirst({
      where: {
        projectId: project.id,
        userId: userId // Additional safety check
      },
      select: {
        slug: true,
        updatedAt: true,
        title: true
      },
      orderBy: { updatedAt: 'desc' } // Get most recent if multiple
    });

    if (!publishedPage) {
      return NextResponse.json(
        { published: false, slug: null },
        { status: 200 }
      );
    }

    return NextResponse.json({
      published: true,
      slug: publishedPage.slug,
      title: publishedPage.title,
      publishedAt: publishedPage.updatedAt.toISOString()
    });

  } catch (error) {
    console.error('Error fetching published slug:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
