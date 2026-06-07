export const dynamic = 'force-dynamic';

// app/api/start/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'
import { createDefaultPlan } from '@/lib/planManager'
import { logger } from '@/lib/logger'
import { personaToAudienceType, type UserPersona } from '@/types/service'

// Pilot lockdown: only `agency` persona reaches the service onboarding flow.
// Other service personas waitlist (resolution #6 in nsoPlan.md).
const PILOT_SERVICE_PERSONAS: ReadonlySet<UserPersona> = new Set(['agency'])

export async function GET() {
  const { userId } = await auth()

  let dbUser = null

  // If logged in, find or create a User entry FIRST so we can read persona
  // before allocating a Token. This prevents orphan-token leaks when the user
  // has no persona yet and needs to be redirected to the persona prompt.
  if (userId) {
    dbUser = await prisma.user.upsert({
      where: { clerkId: userId },
      update: {},
      create: {
        clerkId: userId,
      },
    })

    // Persona gate: authed-without-persona users must capture persona before
    // we create any Token / Project rows. Caller navigates to the persona
    // prompt; on save it re-hits /api/start and the create path runs.
    if (!dbUser.persona) {
      return NextResponse.json({
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/onboarding/persona?next=/api/start`,
      })
    }

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

  // Derive audienceType: from persona for authed users, default 'product' for anon.
  const persona = dbUser?.persona as UserPersona | null | undefined
  const audienceType = persona ? personaToAudienceType(persona) : 'product'

  // Pilot waitlist gate: non-agency service personas short-circuit BEFORE any
  // Token/Project creation, so we don't leak orphan rows for waitlisted users.
  if (audienceType === 'service' && persona && !PILOT_SERVICE_PERSONAS.has(persona)) {
    return NextResponse.json({
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/onboarding/waitlist`,
    })
  }

  // Create token (now safe — persona check passed for authed users)
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

  // Branch redirect by audienceType. Service (agency-only at pilot) → service
  // wizard. Product / anon → existing v3 onboarding.
  const wizardPath = audienceType === 'service'
    ? `/onboarding/service/${tokenValue}`
    : `/create/${tokenValue}`

  return NextResponse.json({
    url: `${process.env.NEXT_PUBLIC_SITE_URL}${wizardPath}`,
  });
}
