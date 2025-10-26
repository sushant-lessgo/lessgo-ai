'use client'

import { Link2, Tag } from 'lucide-react'

interface Props {
  topReferrers: [string, number][]
  topUtmSources: [string, number][]
  totalViews: number
}

function cleanReferrer(referrer: string): string {
  try {
    const url = new URL(referrer)
    return url.hostname.replace('www.', '')
  } catch {
    return referrer
  }
}

export default function TrafficSourcesTable({ topReferrers, topUtmSources, totalViews }: Props) {
  const hasData = topReferrers.length > 0 || topUtmSources.length > 0

  return (
    <div className="bg-white border border-brand-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-brand-text mb-4">Traffic Sources</h3>

      {!hasData ? (
        <p className="text-sm text-brand-mutedText py-4">
          No traffic source data available yet. Make sure visitors are coming from external sources or using UTM parameters.
        </p>
      ) : (
        <div className="space-y-6">
          {/* Top Referrers */}
          {topReferrers.length > 0 && (
            <div>
              <p className="text-sm font-medium text-brand-mutedText mb-3">Top Referrers</p>
              <div className="space-y-3">
                {topReferrers.map(([referrer, count]) => {
                  const percentage = (count / totalViews) * 100
                  return (
                    <div key={referrer} className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Link2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-medium text-sm truncate">{cleanReferrer(referrer)}</span>
                      </div>
                      <div className="flex items-center gap-4 ml-4">
                        <span className="text-sm text-brand-mutedText whitespace-nowrap">
                          {count.toLocaleString()} ({percentage.toFixed(1)}%)
                        </span>
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Top UTM Sources */}
          {topUtmSources.length > 0 && (
            <div>
              <p className="text-sm font-medium text-brand-mutedText mb-3">Top UTM Sources</p>
              <div className="space-y-3">
                {topUtmSources.map(([source, count]) => {
                  const percentage = (count / totalViews) * 100
                  return (
                    <div key={source} className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <Tag className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="font-medium text-sm truncate">{source}</span>
                      </div>
                      <div className="flex items-center gap-4 ml-4">
                        <span className="text-sm text-brand-mutedText whitespace-nowrap">
                          {count.toLocaleString()} ({percentage.toFixed(1)}%)
                        </span>
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
