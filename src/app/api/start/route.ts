// app/api/start/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'

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
  }

  // Create project linked to token and (optionally) user
  await prisma.project.create({
    data: {
      tokenId: token.id,
      userId: dbUser?.id,
    },
  })

  // Redirect to the /start/[token] route
  return NextResponse.redirect(
  new URL(`/start/${tokenValue}`, process.env.NEXT_PUBLIC_SITE_URL)
)

}
