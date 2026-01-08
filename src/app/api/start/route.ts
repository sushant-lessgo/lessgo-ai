export const dynamic = 'force-dynamic';

// app/api/start/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'
import { createDefaultPlan } from '@/lib/planManager'
import { logger } from '@/lib/logger'

export async function GET() {
  const { userId } = await auth()

  const tokenValue = nanoid(12) // Short, unique token for the URL

  // Create token
  const token = await prisma.token.create({
    data: {
      value: tokenValue,
    },
  })

  let dbUser = null

  // If logged in, find or create a User entry
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

  // Create project linked to token and (optionally) user
  await prisma.project.create({
    data: {
      tokenId: token.value,
      userId: dbUser?.id,
    },
  })

  // Redirect to the /start/[token] route
  return NextResponse.json({
  url: `${process.env.NEXT_PUBLIC_SITE_URL}/create/${tokenValue}`,
});

}
