'use client'

interface Totals {
  views: number
  submissions: number
  ctaClicks: number
}

interface Props {
  totals: Totals
}

function FunnelStage({
  label,
  count,
  percentage,
  dropoff,
  isLast,
}: {
  label: string
  count: number
  percentage: number
  dropoff: number
  isLast: boolean
}) {
  const barWidth = Math.max(percentage, 5) // Minimum 5% for visibility

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-brand-text">{label}</span>
        <span className="text-sm text-brand-mutedText">
          {count.toLocaleString()} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full overflow-hidden" style={{ height: '40px' }}>
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium transition-all duration-300"
          style={{ width: `${barWidth}%` }}
        >
          {percentage > 10 && `${percentage.toFixed(1)}%`}
        </div>
      </div>
      {!isLast && dropoff > 0 && (
        <div className="flex items-center justify-center py-1">
          <div className="flex items-center gap-2 text-xs text-red-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span>{dropoff.toFixed(1)}% drop-off</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ConversionFunnel({ totals }: Props) {
  // Simplified funnel stages
  const funnel = [
    {
      label: 'Page Views',
      count: totals.views,
      percentage: 100,
    },
    {
      label: 'Engaged Visitors',
      count: Math.round(totals.views * 0.4), // Estimate: 40% engage
      percentage: 40,
    },
    {
      label: 'CTA Clicks',
      count: totals.ctaClicks,
      percentage: totals.views > 0 ? (totals.ctaClicks / totals.views) * 100 : 0,
    },
    {
      label: 'Form Submissions',
      count: totals.submissions,
      percentage: totals.views > 0 ? (totals.submissions / totals.views) * 100 : 0,
    },
  ]

  return (
    <div className="bg-white border border-brand-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-brand-text mb-4">Conversion Funnel</h3>

      <div className="space-y-4">
        {funnel.map((stage, index) => {
          const dropoff = index > 0 ? funnel[index - 1].percentage - stage.percentage : 0
          return (
            <FunnelStage
              key={stage.label}
              label={stage.label}
              count={stage.count}
              percentage={stage.percentage}
              dropoff={dropoff}
              isLast={index === funnel.length - 1}
            />
          )
        })}
      </div>

      {totals.views > 0 && (
        <div className="mt-6 pt-4 border-t border-brand-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-brand-mutedText">Overall Conversion Rate</span>
            <span className="font-semibold text-brand-text">
              {((totals.submissions / totals.views) * 100).toFixed(2)}%
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
