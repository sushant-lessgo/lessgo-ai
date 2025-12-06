import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TransferOwnershipSchema } from '@/lib/adminValidation';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 1 min max

export async function POST(req: NextRequest) {
  try {
    // 1. AUTH: Verify CRON_SECRET
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      logger.error('CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      logger.warn('Unauthorized admin transfer attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. VALIDATE INPUT
    const body = await req.json();
    const validationResult = TransferOwnershipSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { token, newClerkId } = validationResult.data;

    logger.info(`Starting ownership transfer for token: ${token} to ${newClerkId}`);

    // 3. FIND PROJECT BY TOKEN
    const project = await prisma.project.findUnique({
      where: { tokenId: token },
      include: {
        user: true, // Get current owner info for logging
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found for token' },
        { status: 404 }
      );
    }

    logger.info(`Found project: ${project.id}, current owner: ${project.user?.clerkId || 'none'}`);

    // 4. FIND NEW USER BY CLERK ID
    const newUser = await prisma.user.findUnique({
      where: { clerkId: newClerkId },
    });

    if (!newUser) {
      return NextResponse.json(
        { error: 'New user not found in database' },
        { status: 404 }
      );
    }

    logger.info(`Found new owner: ${newUser.id} (${newUser.email || 'no email'})`);

    // 5. TRANSFER OWNERSHIP (atomic transaction)
    const result = await prisma.$transaction(async (tx) => {
      // Update project userId
      const updatedProject = await tx.project.update({
        where: { id: project.id },
        data: { userId: newUser.id },
      });

      // Find and update PublishedPage if exists
      const publishedPage = await tx.publishedPage.findFirst({
        where: { projectId: project.id },
      });

      let updatedPublishedPage = null;
      if (publishedPage) {
        updatedPublishedPage = await tx.publishedPage.update({
          where: { id: publishedPage.id },
          data: { userId: newClerkId }, // Note: PublishedPage uses clerkId, not FK
        });
      }

      return {
        project: updatedProject,
        publishedPage: updatedPublishedPage,
      };
    });

    logger.info(
      `✓ Transfer complete: Project ${result.project.id}, ` +
      `PublishedPage ${result.publishedPage ? result.publishedPage.id : 'none'}`
    );

    return NextResponse.json({
      success: true,
      message: 'Ownership transferred successfully',
      data: {
        projectId: result.project.id,
        projectTitle: result.project.title,
        previousOwner: project.user?.clerkId || null,
        newOwner: newClerkId,
        publishedPageUpdated: !!result.publishedPage,
        publishedPageSlug: result.publishedPage?.slug || null,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Ownership transfer failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Transfer failed',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
