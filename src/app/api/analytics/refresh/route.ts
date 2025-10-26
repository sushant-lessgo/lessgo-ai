import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { fetchPageAnalytics } from '@/lib/posthog-api'

// Rate limiting: Store last refresh time per user
const refreshTimestamps = new Map<string, number>()
const RATE_LIMIT_MS = 60000 // 1 minute between refreshes

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await req.json()

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }

    // Verify user owns this page
    const publishedPage = await prisma.publishedPage.findFirst({
      where: { slug, userId },
    })

    if (!publishedPage) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    // Rate limiting check
    const lastRefresh = refreshTimestamps.get(`${userId}-${slug}`)
    const now = Date.now()

    if (lastRefresh && now - lastRefresh < RATE_LIMIT_MS) {
      const waitTime = Math.ceil((RATE_LIMIT_MS - (now - lastRefresh)) / 1000)
      return NextResponse.json(
        { error: `Please wait ${waitTime} seconds before refreshing again` },
        { status: 429 }
      )
    }

    // Update rate limit timestamp
    refreshTimestamps.set(`${userId}-${slug}`, now)

    // Fetch data for yesterday (most recent complete day)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const dateStr = yesterday.toISOString().split('T')[0]

    console.log(`Manual refresh for ${slug} - fetching data for ${dateStr}`)

    const analytics = await fetchPageAnalytics(slug, dateStr, dateStr)

    // Data is already aggregated from fetchPageAnalytics
    const views = analytics.views
    const uniqueVisitors = analytics.uniqueVisitors
    const submissions = analytics.submissions
    const conversionRate = views > 0 ? submissions / views : 0
    const avgTimeOnPage = analytics.avgTimeOnPage
    const topReferrers = analytics.topReferrers
    const topUtmSources = analytics.topUtmSources
    const deviceBreakdown = analytics.deviceBreakdown
    const deviceConversions = analytics.deviceConversions

    // Upsert to database
    await prisma.pageAnalytics.upsert({
      where: {
        slug_date: {
          slug,
          date: yesterday,
        },
      },
      create: {
        slug,
        date: yesterday,
        views,
        uniqueVisitors,
        formSubmissions: submissions,
        conversionRate,
        avgTimeOnPage,
        ctaClicks: analytics.ctaClicks,
        topReferrers: topReferrers,
        topUtmSources: topUtmSources,
        desktopViews: deviceBreakdown.desktop,
        mobileViews: deviceBreakdown.mobile,
        tabletViews: deviceBreakdown.tablet,
        desktopConversions: deviceConversions.desktop,
        mobileConversions: deviceConversions.mobile,
        tabletConversions: deviceConversions.tablet,
      },
      update: {
        views,
        uniqueVisitors,
        formSubmissions: submissions,
        conversionRate,
        avgTimeOnPage,
        ctaClicks: analytics.ctaClicks,
        topReferrers: topReferrers,
        topUtmSources: topUtmSources,
        desktopViews: deviceBreakdown.desktop,
        mobileViews: deviceBreakdown.mobile,
        tabletViews: deviceBreakdown.tablet,
        desktopConversions: deviceConversions.desktop,
        mobileConversions: deviceConversions.mobile,
        tabletConversions: deviceConversions.tablet,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Analytics refreshed successfully',
      date: dateStr,
      views,
      submissions,
    })
  } catch (error) {
    console.error('Error refreshing analytics:', error)
    return NextResponse.json(
      { error: 'Failed to refresh analytics', details: String(error) },
      { status: 500 }
    )
  }
}
