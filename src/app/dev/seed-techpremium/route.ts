export const dynamic = 'force-dynamic';

// DEV-ONLY seeder for the TechPremium template.
// TechPremium is RETIRED (templateMeta.ts) — no onboarding path creates a
// techpremium project any more — so palette work on it is otherwise unverifiable
// by hand. Visit (while logged in):
//   /dev/seed-techpremium[?token=YOUR_TOKEN][&brand=Naayom]
// With no ?token it mints a FRESH one. It writes the deterministic TechPremium
// home into the project's content.finalContent, sets templateId='techpremium' and
// variantId='default', then redirects into /edit/{token}.
//
// ⚠️ It deliberately does NOT write `paletteId`. A stored paletteId beats
// `tmpl.defaultPaletteId` (EditLayout.tsx), so writing one would take the
// default-resolution chain out of the loop — and that chain is exactly what the
// harbor default flip (and the flip-back-to-forest check) is verifying.
// Because the update path also leaves the column alone, seed onto a FRESH token
// when checking default resolution.
//
// Writes to the LOCAL DEV DB ONLY: middleware 404s /dev/* in production and this
// route hard-guards on NODE_ENV on top of that. It is NOT the production/real-row
// write that the harbor plan forbids. Throwaway — delete when techpremium's
// republish decision lands.

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { buildTechPremiumHomeFinalContent } from '@/hooks/editStore/archetypes';

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Disabled in production' }, { status: 404 });
  }

  const brand = req.nextUrl.searchParams.get('brand') || 'Naayom';
  const token =
    req.nextUrl.searchParams.get('token') ||
    `tp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  const { userId: clerkId } = await auth();
  const userRecord = clerkId ? await prisma.user.findUnique({ where: { clerkId } }) : null;

  const title = `${brand} — TechPremium`;
  const finalContent = buildTechPremiumHomeFinalContent({
    tokenId: token,
    title,
    productName: brand,
  });

  await prisma.token.upsert({ where: { value: token }, create: { value: token }, update: {} });

  const existing = await prisma.project.findUnique({
    where: { tokenId: token },
    select: { content: true, userId: true },
  });
  const existingContent = (existing?.content as any) || {};
  const mergedContent = {
    ...existingContent,
    onboarding: existingContent.onboarding || {
      stepIndex: 0,
      confirmedFields: {},
      validatedFields: {},
      featuresFromAI: [],
      hiddenInferredFields: {},
    },
    finalContent: { ...finalContent, lastSaved: new Date().toISOString() },
  };

  await prisma.project.upsert({
    where: { tokenId: token },
    create: {
      tokenId: token,
      userId: existing?.userId ?? userRecord?.id ?? null,
      title,
      content: mergedContent as any,
      // Explicit, though it matches the Prisma column default: techpremium is a
      // PRODUCT-audience template (PRODUCT_TEMPLATE_MODULE_IDS, types/service.ts).
      audienceType: 'product',
      templateId: 'techpremium',
      // paletteId intentionally omitted — see header note.
      variantId: 'default',
      status: 'draft',
    },
    update: {
      title,
      content: mergedContent as any,
      templateId: 'techpremium',
      // paletteId intentionally omitted — see header note.
      variantId: 'default',
      updatedAt: new Date(),
    },
  });

  return NextResponse.redirect(new URL(`/edit/${token}`, req.url));
}
