// app/api/publish/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma' // Update path if different

console.log("📩 /api/publish hit");


export async function POST(req: NextRequest) {
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const host = req.headers.get("host") || "localhost:3000";
  const baseUrl = `${protocol}://${host}`;

  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log("📦 Body received:", body);
    const { slug, htmlContent, title, content, themeValues, tokenId, inputText } = body;

    if (!slug || !htmlContent || !tokenId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 🔍 Check for existing published page
    const existing = await prisma.publishedPage.findUnique({ where: { slug } });

    if (existing) {
      if (existing.userId !== userId) {
        return NextResponse.json({ error: 'Slug already taken' }, { status: 409 });
      }

      // 🔁 Update PublishedPage
      await prisma.publishedPage.update({
        where: { slug },
        data: { htmlContent, title, content, themeValues, updatedAt: new Date() }
      });
    } else {
      // 🆕 Create PublishedPage
      await prisma.publishedPage.create({
        data: { userId, slug, htmlContent, title, content, themeValues }
      });
    }

    await prisma.token.upsert({
  where: { value: tokenId },
  create: { value: tokenId },
  update: {},
});
    console.log("🔍 Publishing with:", {
  tokenId,
  userId,
  title,
  status: 'published',
  content,
  themeValues,
  inputText,
});


    // ✅ 🔁 Always upsert into Project as well
    await prisma.project.upsert({
      where: { tokenId },
      create: {
        tokenId,
        userId,
        title: title || 'Untitled',
        content,
        inputText,
        status: 'published',
      },
      update: {
        title,
        content,
        inputText,
        status: 'published',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Page published successfully',
      url: `${baseUrl}/p/${slug}`,
    });

  } catch (err) {
    console.error('[PUBLISH_ERROR]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}



