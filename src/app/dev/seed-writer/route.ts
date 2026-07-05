export const dynamic = 'force-dynamic';

// DEV-ONLY bespoke seeder for the Granth template (Writer vertical). Granth is §13
// bespoke — absent from the onboarding picker — so a project is attached by hand.
// Visit (while logged in):
//   /dev/seed-writer?token=YOUR_TOKEN[&name=केशव नारायण ‘अरण्य’]
// It writes the deterministic Granth home into content.finalContent and sets
// audienceType='writer', templateId='granth', paletteId='sinduri', variantId='granth',
// then redirects into /edit/{token}. Middleware blocks /dev/* in production; this
// also hard-guards on NODE_ENV. Throwaway — delete once seedWriter ops matures.
//
// NOTE: unlike seed-lumen, this sets audienceType EXPLICITLY — writer is a fresh
// audience with no onboarding route, so a new token has no prior audienceType and
// usesTemplateModule('writer','granth') must see 'writer' to render the template.

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { buildGranthHomeFinalContent } from '@/hooks/editStore/granthSeed';

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Disabled in production' }, { status: 404 });
  }

  const token = req.nextUrl.searchParams.get('token');
  const writerName = req.nextUrl.searchParams.get('name') || undefined;
  if (!token) {
    return NextResponse.json({ error: 'Pass ?token=YOUR_TOKEN' }, { status: 400 });
  }

  const { userId: clerkId } = await auth();
  const userRecord = clerkId ? await prisma.user.findUnique({ where: { clerkId } }) : null;

  const finalContent = buildGranthHomeFinalContent({ tokenId: token, writerName });
  const title = finalContent.meta.title as string;

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
      audienceType: 'writer',
      templateId: 'granth',
      paletteId: 'sinduri',
      variantId: 'granth',
      status: 'draft',
    },
    update: {
      title,
      content: mergedContent as any,
      audienceType: 'writer',
      templateId: 'granth',
      paletteId: 'sinduri',
      variantId: 'granth',
      updatedAt: new Date(),
    },
  });

  return NextResponse.redirect(new URL(`/edit/${token}`, req.url));
}
