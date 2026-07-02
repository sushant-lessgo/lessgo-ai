import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { assertProjectOwner } from '@/lib/security';
import type { NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { tokenId: string } }
) {
  try {
    const { tokenId } = params;

    if (!tokenId) {
      return NextResponse.json(
        { error: 'Token ID is required' },
        { status: 400 }
      );
    }

    // A01: Broken Access Control - the caller must own this project (or be admin) to read its
    // metadata; the token alone is not authorization.
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const access = await assertProjectOwner(clerkId, tokenId, { action: 'projects.read' });
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    // Fetch project by tokenId
    const project = await prisma.project.findUnique({
      where: { tokenId },
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
