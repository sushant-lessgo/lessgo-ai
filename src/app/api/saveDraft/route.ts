import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

const DEMO_TOKEN = 'lessgodemomockdata';

export async function POST(req: Request) {
  const { userId } = await auth();
  const { tokenId, title, content, inputText, themeValues} = await req.json();

  
  

  if (!tokenId || !content) {
    return NextResponse.json({ error: 'Missing tokenId or content' }, { status: 400 });
  }

  const isDemo = tokenId === DEMO_TOKEN;

  try {
    // Step 1: Ensure token exists (lookup by value)
    const tokenRecord = await prisma.token.upsert({
      where: { value: tokenId },
      create: { value: tokenId },
      update: {},
    });

    // Step 2: Save project linked to token.id
    await prisma.project.upsert({
      where: { tokenId: tokenRecord.id },
      create: {
        tokenId: tokenRecord.id,
        ...(isDemo ? {} : { userId }),
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
