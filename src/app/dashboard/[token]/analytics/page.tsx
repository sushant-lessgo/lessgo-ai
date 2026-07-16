import { getWorkspaceProject } from '@/lib/workspace'
import { prisma } from '@/lib/prisma'
import { AppIcon } from '@/components/ui/icon'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import MetricsCards from './components/MetricsCards'
import TrendChart from './components/TrendChart'
import TrafficSourcesTable from './components/TrafficSourcesTable'
import DeviceBreakdown from './components/DeviceBreakdown'
import CtaBreakdown from './components/CtaBreakdown'
import ExportCSV from './components/ExportCSV'
import EmptyState from './components/EmptyState'
import { stripHTMLTags } from '@/utils/htmlSanitization'
import { publishedSubdomainHost } from '@/lib/domains/hosts'

/**
 * Analytics tab (`/dashboard/[token]/analytics`) — body moved from the retired
 * `dashboard/analytics/[slug]/page.tsx` (no reskin). `/dashboard/analytics/{slug}`
 * is now a redirect shim onto this route.
 *
 * 🚨 This page calls `getWorkspaceProject` ITSELF. The `[token]/layout.tsx` call is
 * chrome data only and is NOT an auth boundary (Next.js does not re-run layouts as a
 * guard). Within one request the wrapper's React `cache()` dedupes the two calls.
 * The old `publishedPage.findFirst({slug, userId})` ownership scope is replaced by
 * the wrapper's ladder — do NOT re-add a userId filter here (`PublishedPage.userId`
 * is a CLERK id; `project.userId` is an internal `User.id` — a wrong-space compare is
 * tsc-green and silently returns zero rows).
 *
 * R10 — analytics is genuinely published-only: `PageAnalytics` keys on `slug` alone,
 * so an unpublished project has no data to key on. Locked state, not an error.
 *
 * ⚠️ D1 — the 7/30/90 date-range links MUST point at THIS token URL, never at the
 * slug shim: shims preserve no query string, so `?days=` would be dropped and every
 * range click would bounce out of the workspace into the default range.
 */

interface PageProps {
  params: {
    token: string
  }
  searchParams?: {
    days?: string
  }
}

export default async function AnalyticsPage({ params, searchParams }: PageProps) {
  const { publishedPage } = await getWorkspaceProject(params.token)

  // R10 — locked until published (no slug ⇒ no PageAnalytics rows can exist).
  if (!publishedPage) {
    return (
      <div className="px-[26px] pb-[26px] pt-[22px]">
        <div className="flex flex-col items-center gap-2 rounded-[13px] border border-app-border bg-app-surface px-6 py-[52px] text-center">
          <span className="mb-1 flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-app-tint">
            <AppIcon name="monitoring" size={20} className="text-app-primary" />
          </span>
          <p className="font-app-sans text-[13px] font-bold text-app-ink">
            No analytics yet
          </p>
          <p className="font-app-sans text-[12px] text-app-faint">
            Publish to see analytics
          </p>
        </div>
      </div>
    )
  }

  const slug = publishedPage.slug

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
      slug,
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
      slug,
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
    ctaClicks: analytics.reduce((sum, day) => sum + day.ctaClicks, 0),
  }

  if (totals.views > 0) {
    totals.conversionRate = (totals.submissions / totals.views) * 100
  }

  // Calculate previous period totals for comparison
  const previousTotals = {
    views: previousAnalytics.reduce((sum, day) => sum + day.views, 0),
    uniqueVisitors: previousAnalytics.reduce((sum, day) => sum + day.uniqueVisitors, 0),
    submissions: previousAnalytics.reduce((sum, day) => sum + day.formSubmissions, 0),
    conversionRate: 0,
    ctaClicks: previousAnalytics.reduce((sum, day) => sum + day.ctaClicks, 0),
  }

  if (previousTotals.views > 0) {
    previousTotals.conversionRate = (previousTotals.submissions / previousTotals.views) * 100
  }

  // Prepare sparkline data (last 7 days of current selection)
  const sparklineData = analytics.slice(-7).map(day => ({
    date: day.date,
    views: day.views,
    conversions: day.formSubmissions,
    conversionRate: day.views > 0 ? (day.formSubmissions / day.views) * 100 : 0,
    ctaClicks: day.ctaClicks,
  }))

  // Aggregate traffic sources with conversion data
  const referrerData: Record<string, { views: number; conversions: number }> = {}
  const utmData: Record<string, { views: number; conversions: number }> = {}

  analytics.forEach(day => {
    if (day.topReferrers) {
      const refs = day.topReferrers as Record<string, number>
      Object.entries(refs).forEach(([ref, count]) => {
        if (!referrerData[ref]) referrerData[ref] = { views: 0, conversions: 0 }
        referrerData[ref].views += count
      })
    }
    if (day.topUtmSources) {
      const sources = day.topUtmSources as Record<string, number>
      Object.entries(sources).forEach(([source, count]) => {
        if (!utmData[source]) utmData[source] = { views: 0, conversions: 0 }
        utmData[source].views += count
      })
    }
  })

  // Sort by views for now (conversion tracking per-source requires schema change)
  const topReferrers = Object.entries(referrerData)
    .map(([name, data]) => ({
      name,
      views: data.views,
      conversionRate: totals.views > 0 ? (data.views / totals.views) * totals.conversionRate : 0,
    }))
    .sort((a, b) => b.conversionRate - a.conversionRate)
    .slice(0, 5)

  const topUtmSources = Object.entries(utmData)
    .map(([name, data]) => ({
      name,
      views: data.views,
      conversionRate: totals.views > 0 ? (data.views / totals.views) * totals.conversionRate : 0,
    }))
    .sort((a, b) => b.conversionRate - a.conversionRate)
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

  // CTA click breakdown by section placement + role (scale-04)
  const placementData: Record<string, { primary: number; secondary: number }> = {}
  analytics.forEach(day => {
    if (day.ctaPlacements) {
      const dayPlacements = day.ctaPlacements as Record<string, { primary?: number; secondary?: number }>
      Object.entries(dayPlacements).forEach(([placement, counts]) => {
        if (!placementData[placement]) placementData[placement] = { primary: 0, secondary: 0 }
        placementData[placement].primary += counts.primary || 0
        placementData[placement].secondary += counts.secondary || 0
      })
    }
  })
  const ctaPlacements = Object.entries(placementData).map(([placement, counts]) => ({
    placement,
    primary: counts.primary,
    secondary: counts.secondary,
  }))

  return (
    <div className="flex flex-col bg-gray-50 text-brand-text font-body">
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-8">
        {/* Header — moved as-is. `/dashboard` back-link kept verbatim (D1: it needs no
            re-point); the workspace 3a header's "All Projects" link sits above it. */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/dashboard"
            className="flex items-center text-brand-mutedText hover:text-brand-text transition"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-brand-text mb-1">
            {stripHTMLTags(publishedPage.title || 'Untitled Page')}
          </h1>
          <a
            href={`https://${publishedSubdomainHost(slug)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-brand-mutedText hover:text-brand-accentPrimary"
          >
            {publishedSubdomainHost(slug)} ↗
          </a>
        </div>

        {/* Date Range + Export */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {[7, 30, 90].map((d) => (
              <Link
                key={d}
                // D1 — token URL, NOT `/dashboard/analytics/{slug}?days=`: the slug
                // route is a shim now and shims preserve no query string.
                href={`/dashboard/${params.token}/analytics?days=${d}`}
                className={`px-3 py-1.5 text-sm rounded-md transition ${
                  validDays === d
                    ? 'bg-brand-text text-white'
                    : 'bg-white border border-gray-200 hover:border-gray-300'
                }`}
              >
                {d}d
              </Link>
            ))}
          </div>
          {analytics.length > 0 && (
            <ExportCSV analytics={analytics} slug={slug} />
          )}
        </div>

        {analytics.length > 0 ? (
          <div className="space-y-6">
            {/* Top: Is this page working? */}
            <MetricsCards
              totals={totals}
              previousTotals={previousTotals}
              sparklineData={sparklineData}
            />

            {/* Middle: What changed over time? */}
            <TrendChart analytics={analytics} />

            {/* Bottom: What should I do next? */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <TrafficSourcesTable
                topReferrers={topReferrers}
                totalViews={totals.views}
              />
              <TrafficSourcesTable
                topUtmSources={topUtmSources}
                totalViews={totals.views}
                isUtm
              />
              <DeviceBreakdown
                deviceTotals={deviceTotals}
                deviceConversions={deviceConversions}
              />
            </div>

            <CtaBreakdown placements={ctaPlacements} />
          </div>
        ) : (
          <EmptyState slug={slug} publishedPageTitle={publishedPage.title || 'Untitled Page'} />
        )}
      </main>
    </div>
  )
}
