import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDevPrisma, disconnectDevPrisma } from '@/lib/devPrisma';
import { MigrateProjectSchema } from '@/lib/adminValidation';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 min max

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
      logger.warn('Unauthorized admin migration attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. VALIDATE INPUT
    const body = await req.json();
    const validationResult = MigrateProjectSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { token } = validationResult.data;

    // 3. CHECK DEV DATABASE CONNECTION
    const devPrisma = getDevPrisma();
    if (!devPrisma) {
      logger.error('DEV_DATABASE_URL not configured');
      return NextResponse.json(
        { error: 'Dev database not configured' },
        { status: 500 }
      );
    }

    logger.info(`Starting migration for token: ${token}`);

    // 4. FETCH FROM DEV DATABASE
    const devToken = await devPrisma.token.findUnique({
      where: { value: token },
      include: {
        project: {
          include: {
            user: true, // Get user for clerkId mapping
          },
        },
      },
    });

    if (!devToken) {
      return NextResponse.json(
        { error: 'Token not found in dev database' },
        { status: 404 }
      );
    }

    if (!devToken.project) {
      return NextResponse.json(
        { error: 'No project associated with token in dev database' },
        { status: 404 }
      );
    }

    const devProject = devToken.project;
    logger.info(`Found dev project: ${devProject.id} for user: ${devProject.user?.clerkId || 'none'}`);

    // 5. MAP USER ID: Find prod user by clerkId
    let prodUserId: string | null = null;

    if (devProject.user?.clerkId) {
      const prodUser = await prisma.user.findUnique({
        where: { clerkId: devProject.user.clerkId },
      });

      if (!prodUser) {
        logger.warn(`User not found in prod for clerkId: ${devProject.user.clerkId} - creating orphaned project`);
        // Continue without userId - project will be orphaned until claimed
      } else {
        prodUserId = prodUser.id;
        logger.info(`Mapped to prod user: ${prodUserId}`);
      }
    }

    // 6. CHECK CONFLICTS
    const existingProdToken = await prisma.token.findUnique({
      where: { value: token },
    });

    if (existingProdToken) {
      return NextResponse.json(
        {
          error: 'Token already exists in production',
          tokenId: existingProdToken.id,
        },
        { status: 409 }
      );
    }

    // 7. MIGRATE TO PROD (atomic transaction)
    const result = await prisma.$transaction(async (tx) => {
      // Create token in prod (preserve createdAt)
      const prodToken = await tx.token.create({
        data: {
          value: token,
          createdAt: devToken.createdAt,
        },
      });

      // Create project in prod (preserve all fields and timestamps)
      const prodProject = await tx.project.create({
        data: {
          tokenId: prodToken.value,
          userId: prodUserId,
          title: devProject.title,
          status: devProject.status,
          content: devProject.content as any,
          themeValues: devProject.themeValues as any,
          computedDesign: devProject.computedDesign as any,
          inputText: devProject.inputText,
          createdAt: devProject.createdAt,
          updatedAt: devProject.updatedAt,
        },
      });

      return { token: prodToken, project: prodProject };
    });

    logger.info(`✓ Migration complete: Token ${result.token.id}, Project ${result.project.id}`);

    return NextResponse.json({
      success: true,
      message: 'Project migrated successfully',
      data: {
        tokenId: result.token.id,
        tokenValue: result.token.value,
        projectId: result.project.id,
        projectTitle: result.project.title,
        userId: result.project.userId,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Migration failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Migration failed',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  } finally {
    // Cleanup: Disconnect dev Prisma client
    await disconnectDevPrisma();
  }
}
