import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

const DEMO_TOKEN = 'lessgodemomockdata';

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();


    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tokenId, title, content, inputText, themeValues } = await req.json();

    if (!tokenId || !content) {
      return NextResponse.json({ error: 'Missing tokenId or content' }, { status: 400 });
    }

    const isDemo = tokenId === DEMO_TOKEN;

    let userRecord = null;

    if (!isDemo) {
      // 🔒 Ensure user exists in DB
      userRecord = await prisma.user.findUnique({ where: { clerkId } });

      if (!userRecord) {
        return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
      }
    }

    // ✅ Ensure token exists
    const tokenRecord = await prisma.token.upsert({
      where: { value: tokenId },
      create: { value: tokenId },
      update: {},
    });

    // ✅ Save project (safe FK use)
    await prisma.project.upsert({
      where: { tokenId: tokenRecord.id },
      create: {
        tokenId: tokenRecord.id,
        userId: userRecord?.id ?? null, // Set only if not demo
        title,
        content,
        inputText,
        themeValues,
        status: 'draft',
      },
      update: {
        title,
        content,
        inputText,
        themeValues,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ message: 'Draft saved' });
  } catch (err) {
    console.error('[SAVE_DRAFT_DB_ERROR]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
