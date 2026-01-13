'use client'

import { Link2, Tag } from 'lucide-react'

interface SourceData {
  name: string
  views: number
  conversionRate: number
}

interface Props {
  topReferrers?: SourceData[]
  topUtmSources?: SourceData[]
  totalViews: number
  isUtm?: boolean
}

function cleanReferrer(referrer: string): string {
  try {
    const url = new URL(referrer.startsWith('http') ? referrer : `https://${referrer}`)
    return url.hostname.replace('www.', '')
  } catch {
    return referrer
  }
}

export default function TrafficSourcesTable({ topReferrers, topUtmSources, totalViews, isUtm }: Props) {
  const sources = isUtm ? topUtmSources : topReferrers
  const title = isUtm ? 'Campaigns' : 'Traffic Sources'
  const Icon = isUtm ? Tag : Link2
  const colorClass = isUtm ? 'text-amber-600 bg-amber-50' : 'text-blue-600 bg-blue-50'

  if (!sources || sources.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 text-gray-500 mb-4">
          <Icon className="w-4 h-4" />
          <span className="text-sm font-medium">{title}</span>
        </div>
        <p className="text-sm text-gray-400">
          {isUtm ? 'No UTM campaigns tracked yet' : 'No referrer data yet'}
        </p>
      </div>
    )
  }

  // Find best performer for highlighting
  const maxConvRate = Math.max(...sources.map(s => s.conversionRate))

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center gap-2 text-gray-500 mb-4">
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{title}</span>
      </div>

      <div className="space-y-3">
        {sources.map((source, i) => {
          const isBest = source.conversionRate === maxConvRate && maxConvRate > 0
          const percentage = totalViews > 0 ? (source.views / totalViews) * 100 : 0

          return (
            <div key={source.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className={`w-5 h-5 rounded text-xs flex items-center justify-center font-medium ${colorClass}`}>
                  {i + 1}
                </span>
                <span className="text-sm text-gray-900 truncate">
                  {isUtm ? source.name : cleanReferrer(source.name)}
                </span>
                {isBest && (
                  <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                    best
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 ml-2">
                <span className="text-sm text-gray-500 tabular-nums">
                  {source.views.toLocaleString()}
                </span>
                <span className="text-sm font-medium text-gray-900 w-14 text-right tabular-nums">
                  {source.conversionRate.toFixed(1)}%
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Source</span>
          <div className="flex gap-4">
            <span>Views</span>
            <span className="w-14 text-right">Conv %</span>
          </div>
        </div>
      </div>
    </div>
  )
}
