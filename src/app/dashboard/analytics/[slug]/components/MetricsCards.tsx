'use client'

import { Eye, Users, CheckCircle, TrendingUp, ArrowUp, ArrowDown, Minus } from 'lucide-react'

interface Totals {
  views: number
  uniqueVisitors: number
  submissions: number
  conversionRate: number
}

interface Props {
  totals: Totals
  previousTotals: Totals
}

function calculateChange(current: number, previous: number): {
  percentage: number
  direction: 'up' | 'down' | 'neutral'
} {
  if (previous === 0) {
    return { percentage: current > 0 ? 100 : 0, direction: 'neutral' }
  }

  const change = ((current - previous) / previous) * 100
  const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'

  return { percentage: Math.abs(change), direction }
}

function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  highlight = false,
}: {
  title: string
  value: string
  change: { percentage: number; direction: 'up' | 'down' | 'neutral' }
  icon: any
  highlight?: boolean
}) {
  return (
    <div className={`bg-white border ${highlight ? 'border-blue-200 bg-blue-50/30' : 'border-brand-border'} rounded-lg p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-brand-mutedText mb-1">{title}</p>
          <p className="text-3xl font-bold text-brand-text mb-2">{value}</p>

          {change.percentage > 0 && (
            <div className="flex items-center gap-1 text-sm">
              {change.direction === 'up' && (
                <>
                  <ArrowUp className="w-4 h-4 text-green-600" />
                  <span className="text-green-600 font-medium">
                    {change.percentage.toFixed(1)}%
                  </span>
                </>
              )}
              {change.direction === 'down' && (
                <>
                  <ArrowDown className="w-4 h-4 text-red-600" />
                  <span className="text-red-600 font-medium">
                    {change.percentage.toFixed(1)}%
                  </span>
                </>
              )}
              {change.direction === 'neutral' && (
                <>
                  <Minus className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-600 font-medium">
                    No change
                  </span>
                </>
              )}
              <span className="text-brand-mutedText">vs previous period</span>
            </div>
          )}
        </div>

        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
          highlight ? 'bg-blue-100' : 'bg-gray-100'
        }`}>
          <Icon className={`w-6 h-6 ${highlight ? 'text-blue-600' : 'text-gray-600'}`} />
        </div>
      </div>
    </div>
  )
}

export default function MetricsCards({ totals, previousTotals }: Props) {
  const viewsChange = calculateChange(totals.views, previousTotals.views)
  const visitorsChange = calculateChange(totals.uniqueVisitors, previousTotals.uniqueVisitors)
  const conversionsChange = calculateChange(totals.submissions, previousTotals.submissions)
  const convRateChange = calculateChange(totals.conversionRate, previousTotals.conversionRate)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Page Views"
        value={totals.views.toLocaleString()}
        change={viewsChange}
        icon={Eye}
      />
      <MetricCard
        title="Unique Visitors"
        value={totals.uniqueVisitors.toLocaleString()}
        change={visitorsChange}
        icon={Users}
      />
      <MetricCard
        title="Conversions"
        value={totals.submissions.toLocaleString()}
        change={conversionsChange}
        icon={CheckCircle}
      />
      <MetricCard
        title="Conversion Rate"
        value={`${totals.conversionRate.toFixed(2)}%`}
        change={convRateChange}
        icon={TrendingUp}
        highlight={true}
      />
    </div>
  )
}
