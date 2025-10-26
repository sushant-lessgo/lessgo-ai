import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import Header from '@/components/dashboard/Header'
import Footer from '@/components/shared/Footer'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import MetricsCards from './components/MetricsCards'
import TrendChart from './components/TrendChart'
import TrafficSourcesTable from './components/TrafficSourcesTable'
import DeviceBreakdown from './components/DeviceBreakdown'
import ConversionFunnel from './components/ConversionFunnel'
import InsightsPanel from './components/InsightsPanel'
import ExportCSV from './components/ExportCSV'
import LastUpdated from './components/LastUpdated'
import UTMBuilder from './components/UTMBuilder'
import EmptyState from './components/EmptyState'

interface PageProps {
  params: {
    slug: string
  }
  searchParams?: {
    days?: string
  }
}

export default async function AnalyticsPage({ params, searchParams }: PageProps) {
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in')
  }

  // Find the published page and verify ownership
  const publishedPage = await prisma.publishedPage.findFirst({
    where: {
      slug: params.slug,
      userId,
    },
  })

  if (!publishedPage) {
    notFound()
  }

  // Determine date range (default 30 days)
  const daysParam = searchParams?.days || '30'
  const days = parseInt(daysParam, 10)
  const validDays = [7, 30, 90].includes(days) ? days : 30

  // Calculate date range
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - validDays)

  // Fetch analytics data for current period
  const analytics = await prisma.pageAnalytics.findMany({
    where: {
      slug: params.slug,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      date: 'asc',
    },
  })

  // Fetch previous period for comparison
  const previousStartDate = new Date(startDate)
  previousStartDate.setDate(previousStartDate.getDate() - validDays)
  const previousEndDate = new Date(startDate)
  previousEndDate.setDate(previousEndDate.getDate() - 1)

  const previousAnalytics = await prisma.pageAnalytics.findMany({
    where: {
      slug: params.slug,
      date: {
        gte: previousStartDate,
        lte: previousEndDate,
      },
    },
  })

  // Calculate current period totals
  const totals = {
    views: analytics.reduce((sum, day) => sum + day.views, 0),
    uniqueVisitors: analytics.reduce((sum, day) => sum + day.uniqueVisitors, 0),
    submissions: analytics.reduce((sum, day) => sum + day.formSubmissions, 0),
    conversionRate: 0,
    avgTimeOnPage: 0,
    bounceRate: 0,
    ctaClicks: analytics.reduce((sum, day) => sum + day.ctaClicks, 0),
  }

  if (totals.views > 0) {
    totals.conversionRate = (totals.submissions / totals.views) * 100
  }

  // Calculate weighted average time on page
  const timeOnPageValues = analytics
    .filter(d => d.avgTimeOnPage !== null)
    .map(d => ({ time: d.avgTimeOnPage!, weight: d.views }))

  if (timeOnPageValues.length > 0) {
    const totalWeight = timeOnPageValues.reduce((sum, d) => sum + d.weight, 0)
    const weightedSum = timeOnPageValues.reduce((sum, d) => sum + (d.time * d.weight), 0)
    totals.avgTimeOnPage = Math.round(weightedSum / totalWeight)
  }

  // Calculate weighted average bounce rate
  const bounceRateValues = analytics
    .filter(d => d.bounceRate !== null)
    .map(d => ({ rate: d.bounceRate!, weight: d.views }))

  if (bounceRateValues.length > 0) {
    const totalWeight = bounceRateValues.reduce((sum, d) => sum + d.weight, 0)
    const weightedSum = bounceRateValues.reduce((sum, d) => sum + (d.rate * d.weight), 0)
    totals.bounceRate = weightedSum / totalWeight
  }

  // Calculate previous period totals for comparison
  const previousTotals = {
    views: previousAnalytics.reduce((sum, day) => sum + day.views, 0),
    uniqueVisitors: previousAnalytics.reduce((sum, day) => sum + day.uniqueVisitors, 0),
    submissions: previousAnalytics.reduce((sum, day) => sum + day.formSubmissions, 0),
    conversionRate: 0,
  }

  if (previousTotals.views > 0) {
    previousTotals.conversionRate = (previousTotals.submissions / previousTotals.views) * 100
  }

  // Aggregate traffic sources (top 5)
  const allReferrers: Record<string, number> = {}
  const allUtmSources: Record<string, number> = {}

  analytics.forEach(day => {
    if (day.topReferrers) {
      const refs = day.topReferrers as Record<string, number>
      Object.entries(refs).forEach(([ref, count]) => {
        allReferrers[ref] = (allReferrers[ref] || 0) + count
      })
    }
    if (day.topUtmSources) {
      const sources = day.topUtmSources as Record<string, number>
      Object.entries(sources).forEach(([source, count]) => {
        allUtmSources[source] = (allUtmSources[source] || 0) + count
      })
    }
  })

  const topReferrers = Object.entries(allReferrers)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const topUtmSources = Object.entries(allUtmSources)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Device breakdown
  const deviceTotals = {
    desktop: analytics.reduce((sum, d) => sum + d.desktopViews, 0),
    mobile: analytics.reduce((sum, d) => sum + d.mobileViews, 0),
    tablet: analytics.reduce((sum, d) => sum + d.tabletViews, 0),
  }

  const deviceConversions = {
    desktop: analytics.reduce((sum, d) => sum + d.desktopConversions, 0),
    mobile: analytics.reduce((sum, d) => sum + d.mobileConversions, 0),
    tablet: analytics.reduce((sum, d) => sum + d.tabletConversions, 0),
  }

  // Get last update timestamp (most recent analytics entry)
  const lastUpdate = analytics.length > 0
    ? analytics.reduce((latest, day) => {
        return new Date(day.updatedAt) > new Date(latest.updatedAt) ? day : latest
      }).updatedAt
    : null

  // Base URL for UTM builder
  const baseUrl = 'https://lessgo.ai'

  return (
    <div className="flex flex-col min-h-screen bg-white text-brand-text font-body">
      <Header />
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="flex items-center text-brand-mutedText hover:text-brand-text transition"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </div>
          <ExportCSV analytics={analytics} slug={params.slug} />
        </div>

        <div className="mb-6">
          <h1 className="text-heading1 font-heading text-landing-textPrimary mb-2">
            Landing Page Analytics
          </h1>
          <p className="text-brand-mutedText mb-4">
            {publishedPage.title}
          </p>
          <div className="flex items-center justify-between">
            <a
              href={`/p/${params.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-brand-accentPrimary hover:underline"
            >
              https://lessgo.ai/p/{params.slug}
            </a>
            <LastUpdated lastUpdate={lastUpdate} slug={params.slug} />
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2 mb-6">
          <Link
            href={`/dashboard/analytics/${params.slug}?days=7`}
            className={`px-3 py-1.5 text-sm rounded-md transition ${
              validDays === 7
                ? 'bg-brand-accentPrimary text-white'
                : 'border border-brand-border hover:bg-gray-50'
            }`}
          >
            Last 7 Days
          </Link>
          <Link
            href={`/dashboard/analytics/${params.slug}?days=30`}
            className={`px-3 py-1.5 text-sm rounded-md transition ${
              validDays === 30
                ? 'bg-brand-accentPrimary text-white'
                : 'border border-brand-border hover:bg-gray-50'
            }`}
          >
            Last 30 Days
          </Link>
          <Link
            href={`/dashboard/analytics/${params.slug}?days=90`}
            className={`px-3 py-1.5 text-sm rounded-md transition ${
              validDays === 90
                ? 'bg-brand-accentPrimary text-white'
                : 'border border-brand-border hover:bg-gray-50'
            }`}
          >
            Last 90 Days
          </Link>
        </div>

        {analytics.length > 0 ? (
          <div className="space-y-6">
            {/* Metrics Cards */}
            <MetricsCards totals={totals} previousTotals={previousTotals} />

            {/* Trend Chart */}
            <TrendChart analytics={analytics} />

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TrafficSourcesTable
                topReferrers={topReferrers}
                topUtmSources={topUtmSources}
                totalViews={totals.views}
              />
              <DeviceBreakdown
                deviceTotals={deviceTotals}
                deviceConversions={deviceConversions}
              />
            </div>

            {/* Conversion Funnel & Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ConversionFunnel totals={totals} />
              <InsightsPanel
                totals={totals}
                deviceTotals={deviceTotals}
                deviceConversions={deviceConversions}
                topReferrers={topReferrers}
              />
            </div>

            {/* UTM Builder Tool */}
            <UTMBuilder baseUrl={baseUrl} slug={params.slug} />
          </div>
        ) : (
          <>
            <EmptyState slug={params.slug} publishedPageTitle={publishedPage.title || 'Untitled Page'} />

            {/* Show UTM Builder even when no data */}
            <div className="mt-6">
              <UTMBuilder baseUrl={baseUrl} slug={params.slug} />
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
