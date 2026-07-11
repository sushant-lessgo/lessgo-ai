export const dynamic = 'force-dynamic';

// app/api/start/route.ts
// scale-02 phase 6 (D4): /api/start stays the creator; the persona gate +
// pilot waitlist moved into the universal entry (/onboarding/[token] serve
// gate). Persona→audienceType derivation on the Project row is KEPT for
// back-compat (e2e publish.spec seeds drafts straight off /api/start and
// dispatch keys on Project.audienceType; the serve gate overwrites it at
// confirm for real users).
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'
import { createDefaultPlan } from '@/lib/planManager'
import { logger } from '@/lib/logger'
import { personaToAudienceType, type UserPersona } from '@/types/service'

export async function GET() {
  const { userId } = await auth()

  let dbUser = null

  // If logged in, find or create a User entry first.
  if (userId) {
    dbUser = await prisma.user.upsert({
      where: { clerkId: userId },
      update: {},
      create: {
        clerkId: userId,
      },
    })

    // Create default plan for new users
    try {
      const existingPlan = await prisma.userPlan.findUnique({
        where: { userId },
      })

      if (!existingPlan) {
        await createDefaultPlan(userId)
        logger.info(`Created default plan for new user ${userId}`)
      }
    } catch (error) {
      logger.error('Error creating default plan:', error)
      // Don't fail the request if plan creation fails
    }
  }

  // Derive audienceType: from persona when present (e2e back-compat — the
  // serve gate overwrites this at /api/brief/confirm), default 'product'.
  const persona = dbUser?.persona as UserPersona | null | undefined
  const audienceType = persona ? personaToAudienceType(persona) : 'product'

  // Create token
  const tokenValue = nanoid(12)
  const token = await prisma.token.create({
    data: {
      value: tokenValue,
    },
  })

  // Create project linked to token and (optionally) user
  await prisma.project.create({
    data: {
      tokenId: token.value,
      userId: dbUser?.id,
      audienceType,
    },
  })

  // Universal entry: one-liner/URL → classify → confirm → serve gate routes
  // into the product/service wizard (or manual-onboard capture).
  return NextResponse.json({
    url: `${process.env.NEXT_PUBLIC_DASHBOARD_URL || process.env.NEXT_PUBLIC_SITE_URL}/onboarding/${tokenValue}`,
  });
}
