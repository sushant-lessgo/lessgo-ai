// app/api/publish/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

import { prisma } from '@/lib/prisma' // Update path if different

export async function POST(req: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { slug, htmlContent, title } = body

    if (!slug || !htmlContent) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if slug is already taken
    const existing = await prisma.publishedPage.findUnique({
      where: { slug }
    })

    if (existing) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 })
    }

    // Create published page
    const published = await prisma.publishedPage.create({
      data: {
        userId,
        slug,
        htmlContent,
        title
      }
    })

    return NextResponse.json({
      message: 'Page published successfully',
      url: `https://lessgo.ai/p/${slug}`
    })
  } catch (err) {
    console.error('[PUBLISH_ERROR]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
