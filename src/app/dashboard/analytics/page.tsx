import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getAccountScope } from '@/lib/dashboard/accountScope'
import { AppIcon } from '@/components/ui/icon'
import { stripHTMLTags } from '@/utils/htmlSanitization'

/**
 * All Analytics (`/dashboard/analytics`) — account-level, read-only rollup of
 * `PageAnalytics` across every PublishedPage the viewer owns.
 *
 * Legal sibling of the existing `analytics/[slug]/page.tsx` redirect shim — the
 * shim is untouched and keeps handling `/dashboard/analytics/{slug}`.
 *
 * 🚨 AUTH: this page scopes its OWN query. `dashboard/layout.tsx` is NOT an auth
 * boundary (Next.js does not re-run layouts as a guard). Pattern copied from
 * `src/app/dashboard/leads/page.tsx` — `auth()` → Clerk userId, unauth → null.
 *
 * 🚨 R-B — NO admin god-view branch here (deliberate divergence from the dashboard
 * root's `isAdmin` all-projects widening): a merged everyone-analytics blob is
 * semantically wrong for a personal rollup. `isAdmin` is intentionally NOT imported.
 * `getUserPlan()` is never called either (it get-or-creates and seeds credits).
 *
 * 🚨 SCOPING: `PageAnalytics` has NO userId column — rows are keyed on `slug` alone.
 * The join is therefore `slug: { in: slugs }`, where `slugs` come from
 * `getAccountScope` (derived from the server-set `PublishedPage.userId`, trustworthy).
 * The `[slug, date]` index supports this query.
 *
 * ⚠️ `getAccountScope` takes the CLERK id from `auth()` — never the internal
 * `User.id` (wrong space compiles clean and silently returns ZERO rows).
 *
 * R-E — window mirrors the per-site page (`[token]/analytics/page.tsx`): `?days=`
 * in {7,30,90}, default 30, same startDate/endDate computation. The per-site
 * previous-period comparison + trend chart are deliberately OUT of the pilot.
 *
 * R-D — fresh `app-*` markup only; the legacy stock-Tailwind per-site components
 * (`[token]/analytics/components/*`) are NOT imported or edited.
 */

interface PageProps {
  searchParams?: {
    days?: string
  }
}

interface SiteRow {
  slug: string
  title: string
  views: number
  uniqueVisitors: number
  submissions: number
  conversionRate: number
}

export default async function AllAnalyticsPage({ searchParams }: PageProps) {
  const { userId } = await auth()
  if (!userId) return null

  const { pages, slugs } = await getAccountScope(userId) // Clerk id space

  // Determine date range (default 30 days) — identical to the per-site page.
  const daysParam = searchParams?.days || '30'
  const days = parseInt(daysParam, 10)
  const validDays = [7, 30, 90].includes(days) ? days : 30

  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - validDays)

  if (slugs.length === 0) {
    return (
      <div className="px-[26px] pb-[26px] pt-[22px]">
        <RangeSwitcher validDays={validDays} />
        <EmptyState title="No analytics yet" body="Publish a site to see analytics." />
      </div>
    )
  }

  const analytics = await prisma.pageAnalytics.findMany({
    where: {
      slug: { in: slugs },
      date: { gte: startDate, lte: endDate },
    },
  })

  // Group by slug in JS (no groupBy round-trip needed at beta volume).
  const bySlug = new Map<string, { views: number; uniqueVisitors: number; submissions: number }>()
  for (const day of analytics) {
    const acc = bySlug.get(day.slug) ?? { views: 0, uniqueVisitors: 0, submissions: 0 }
    acc.views += day.views
    acc.uniqueVisitors += day.uniqueVisitors
    acc.submissions += day.formSubmissions
    bySlug.set(day.slug, acc)
  }

  const totals = {
    views: analytics.reduce((sum, d) => sum + d.views, 0),
    uniqueVisitors: analytics.reduce((sum, d) => sum + d.uniqueVisitors, 0),
    submissions: analytics.reduce((sum, d) => sum + d.formSubmissions, 0),
    ctaClicks: analytics.reduce((sum, d) => sum + d.ctaClicks, 0),
    conversionRate: 0,
  }
  // Computed FROM TOTALS — never an average of the stored per-row conversionRate
  // (that would weight a 1-view day the same as a 1000-view day). Matches the
  // per-site page's formula exactly, so the rollup equals the sum of its parts.
  if (totals.views > 0) {
    totals.conversionRate = (totals.submissions / totals.views) * 100
  }

  // Zero-filled: every owned site gets a row, even with no analytics in window.
  const rows: SiteRow[] = pages
    .map((p) => {
      const a = bySlug.get(p.slug) ?? { views: 0, uniqueVisitors: 0, submissions: 0 }
      return {
        slug: p.slug,
        title: p.title ? stripHTMLTags(p.title) : 'Untitled site',
        views: a.views,
        uniqueVisitors: a.uniqueVisitors,
        submissions: a.submissions,
        conversionRate: a.views > 0 ? (a.submissions / a.views) * 100 : 0,
      }
    })
    .sort((a, b) => b.views - a.views)

  return (
    <div className="px-[26px] pb-[26px] pt-[22px]">
      <RangeSwitcher validDays={validDays} />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Views" value={formatNumber(totals.views)} icon="visibility" />
        <StatTile
          label="Unique visitors"
          value={formatNumber(totals.uniqueVisitors)}
          icon="group"
        />
        <StatTile label="Conversions" value={formatNumber(totals.submissions)} icon="check_circle" />
        <StatTile label="Conv. rate" value={formatPct(totals.conversionRate)} icon="trending_up" />
      </div>

      <div className="overflow-hidden rounded-[13px] border border-app-border bg-app-surface">
        <table className="w-full border-collapse font-app-sans text-[12px]">
          <thead>
            <tr className="border-b border-app-border">
              <Th className="text-left">Site</Th>
              <Th className="text-right">Views</Th>
              <Th className="text-right">Visitors</Th>
              <Th className="text-right">Conversions</Th>
              <Th className="text-right">Conv. rate</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.slug} className="border-b border-app-border last:border-b-0">
                <td className="px-4 py-3">
                  <p className="font-semibold text-app-ink">{r.title}</p>
                  <p className="font-app-mono text-[10.5px] text-app-faint">{r.slug}</p>
                </td>
                <Td>{formatNumber(r.views)}</Td>
                <Td>{formatNumber(r.uniqueVisitors)}</Td>
                <Td>{formatNumber(r.submissions)}</Td>
                <Td>{formatPct(r.conversionRate)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RangeSwitcher({ validDays }: { validDays: number }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      {[7, 30, 90].map((d) => (
        <Link
          key={d}
          href={`/dashboard/analytics?days=${d}`}
          className={
            validDays === d
              ? 'rounded-app-pill bg-app-primary px-3 py-1.5 font-app-sans text-[11.5px] font-semibold text-app-surface'
              : 'rounded-app-pill border border-app-border bg-app-surface px-3 py-1.5 font-app-sans text-[11.5px] text-app-slate transition-colors hover:text-app-ink'
          }
        >
          {d}d
        </Link>
      ))}
    </div>
  )
}

function StatTile({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="rounded-[13px] border border-app-border bg-app-surface px-4 py-[15px]">
      <div className="mb-1.5 flex items-center gap-1.5">
        <AppIcon name={icon} size={15} className="text-app-primary" />
        <span className="font-app-sans text-[11px] text-app-faint">{label}</span>
      </div>
      <p className="font-app-sans text-[20px] font-bold text-app-ink">{value}</p>
    </div>
  )
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-4 py-2.5 font-app-mono text-[10px] font-bold tracking-[0.08em] text-app-placeholder ${className ?? ''}`}
    >
      {children}
    </th>
  )
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-right font-app-sans text-[12px] text-app-slate">{children}</td>
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[13px] border border-app-border bg-app-surface px-6 py-[52px] text-center">
      <span className="mb-1 flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-app-tint">
        <AppIcon name="monitoring" size={20} className="text-app-primary" />
      </span>
      <p className="font-app-sans text-[13px] font-bold text-app-ink">{title}</p>
      <p className="font-app-sans text-[12px] text-app-faint">{body}</p>
    </div>
  )
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

function formatPct(n: number): string {
  return `${n.toFixed(1)}%`
}