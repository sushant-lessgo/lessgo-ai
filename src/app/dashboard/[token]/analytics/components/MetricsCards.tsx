'use client'

import { Eye, Target, TrendingUp, MousePointer, ArrowUp, ArrowDown } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface SparklineData {
  date: Date
  views: number
  conversions: number
  conversionRate: number
  ctaClicks: number
}

interface Totals {
  views: number
  uniqueVisitors: number
  submissions: number
  conversionRate: number
  ctaClicks: number
}

interface Props {
  totals: Totals
  previousTotals: Totals
  sparklineData: SparklineData[]
}

function calculateChange(current: number, previous: number): {
  percentage: number
  direction: 'up' | 'down' | 'neutral'
} {
  if (previous === 0) {
    return { percentage: current > 0 ? 100 : 0, direction: current > 0 ? 'up' : 'neutral' }
  }
  const change = ((current - previous) / previous) * 100
  return {
    percentage: Math.abs(change),
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
  }
}

function MiniSparkline({ data, dataKey, color }: { data: any[]; dataKey: string; color: string }) {
  if (data.length < 2) return null
  return (
    <div className="w-20 h-8">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function MetricCard({
  title,
  value,
  subtext,
  change,
  icon: Icon,
  sparklineData,
  sparklineKey,
  color,
}: {
  title: string
  value: string
  subtext?: string
  change: { percentage: number; direction: 'up' | 'down' | 'neutral' }
  icon: React.ElementType
  sparklineData: SparklineData[]
  sparklineKey: string
  color: string
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 text-gray-500">
          <Icon className="w-4 h-4" />
          <span className="text-sm font-medium">{title}</span>
        </div>
        <MiniSparkline data={sparklineData} dataKey={sparklineKey} color={color} />
      </div>

      <div className="mb-1">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
        {subtext && (
          <span className="ml-2 text-sm text-gray-500">{subtext}</span>
        )}
      </div>

      {change.percentage > 0 && change.direction !== 'neutral' && (
        <div className="flex items-center gap-1 text-sm">
          {change.direction === 'up' ? (
            <ArrowUp className="w-3 h-3 text-green-600" />
          ) : (
            <ArrowDown className="w-3 h-3 text-red-600" />
          )}
          <span className={change.direction === 'up' ? 'text-green-600' : 'text-red-600'}>
            {change.percentage.toFixed(0)}%
          </span>
          <span className="text-gray-400">vs prev</span>
        </div>
      )}
    </div>
  )
}

export default function MetricsCards({ totals, previousTotals, sparklineData }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Views"
        value={totals.views.toLocaleString()}
        subtext={`${totals.uniqueVisitors.toLocaleString()} unique`}
        change={calculateChange(totals.views, previousTotals.views)}
        icon={Eye}
        sparklineData={sparklineData}
        sparklineKey="views"
        color="#3b82f6"
      />
      <MetricCard
        title="Conversions"
        value={totals.submissions.toLocaleString()}
        change={calculateChange(totals.submissions, previousTotals.submissions)}
        icon={Target}
        sparklineData={sparklineData}
        sparklineKey="conversions"
        color="#22c55e"
      />
      <MetricCard
        title="Conv. Rate"
        value={`${totals.conversionRate.toFixed(1)}%`}
        change={calculateChange(totals.conversionRate, previousTotals.conversionRate)}
        icon={TrendingUp}
        sparklineData={sparklineData}
        sparklineKey="conversionRate"
        color="#8b5cf6"
      />
      <MetricCard
        title="CTA Clicks"
        value={totals.ctaClicks.toLocaleString()}
        change={calculateChange(totals.ctaClicks, previousTotals.ctaClicks)}
        icon={MousePointer}
        sparklineData={sparklineData}
        sparklineKey="ctaClicks"
        color="#f59e0b"
      />
    </div>
  )
}
