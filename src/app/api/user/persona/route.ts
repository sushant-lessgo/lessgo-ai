export const dynamic = 'force-dynamic';

// api/user/persona/route.ts - Read or set the authenticated user's persona
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { userPersonas, type UserPersona } from '@/types/service';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { persona: true },
    });

    return NextResponse.json({ persona: user?.persona ?? null });
  } catch (error: any) {
    logger.error('Error fetching user persona:', error);
    return NextResponse.json(
      { error: 'Failed to fetch persona', message: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const persona = body?.persona;

    if (!persona || !userPersonas.includes(persona as UserPersona)) {
      return NextResponse.json(
        { error: 'Invalid persona', allowed: userPersonas },
        { status: 400 }
      );
    }

    // Upsert: persona prompt may be the first time we touch this clerkId on
    // a fresh signup before /api/start has run.
    const user = await prisma.user.upsert({
      where: { clerkId: userId },
      update: { persona },
      create: { clerkId: userId, persona },
      select: { id: true, persona: true },
    });

    return NextResponse.json({ ok: true, persona: user.persona });
  } catch (error: any) {
    logger.error('Error setting user persona:', error);
    return NextResponse.json(
      { error: 'Failed to set persona', message: error?.message },
      { status: 500 }
    );
  }
}
