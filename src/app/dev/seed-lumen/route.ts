export const dynamic = 'force-dynamic';

// DEV-ONLY bespoke seeder for the Lumen template (Kundius Photography).
// Lumen is §13 bespoke — absent from the onboarding picker — so a project is
// attached to it by hand. Visit (while logged in):
//   /dev/seed-lumen?token=YOUR_TOKEN[&brand=Kundius]
// It writes the deterministic Lumen home into the project's content.finalContent
// and sets templateId='lumen', paletteId='brass', variantId='default', then
// redirects into /edit/{token}. Middleware blocks /dev/* in production; this
// also hard-guards on NODE_ENV. Throwaway — delete when Kundius is stood up.

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { buildLumenHomeFinalContent } from '@/hooks/editStore/lumenSeed';

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Disabled in production' }, { status: 404 });
  }

  const token = req.nextUrl.searchParams.get('token');
  const brand = req.nextUrl.searchParams.get('brand') || 'Kundius';
  if (!token) {
    return NextResponse.json({ error: 'Pass ?token=YOUR_TOKEN' }, { status: 400 });
  }

  const { userId: clerkId } = await auth();
  const userRecord = clerkId ? await prisma.user.findUnique({ where: { clerkId } }) : null;

  const finalContent = buildLumenHomeFinalContent({ tokenId: token, brandName: brand });
  const title = `${brand} Photography`;

  await prisma.token.upsert({ where: { value: token }, create: { value: token }, update: {} });

  const existing = await prisma.project.findUnique({ where: { tokenId: token }, select: { content: true, userId: true } });
  const existingContent = (existing?.content as any) || {};
  const mergedContent = {
    ...existingContent,
    onboarding: existingContent.onboarding || { stepIndex: 0, confirmedFields: {}, validatedFields: {}, featuresFromAI: [], hiddenInferredFields: {} },
    finalContent: { ...finalContent, lastSaved: new Date().toISOString() },
  };

  await prisma.project.upsert({
    where: { tokenId: token },
    create: {
      tokenId: token,
      userId: existing?.userId ?? userRecord?.id ?? null,
      title,
      content: mergedContent as any,
      templateId: 'lumen',
      paletteId: 'brass',
      variantId: 'default',
      status: 'draft',
    },
    update: {
      title,
      content: mergedContent as any,
      templateId: 'lumen',
      paletteId: 'brass',
      variantId: 'default',
      updatedAt: new Date(),
    },
  });

  return NextResponse.redirect(new URL(`/edit/${token}`, req.url));
}
