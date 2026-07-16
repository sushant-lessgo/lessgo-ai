'use client'

import { MousePointerClick } from 'lucide-react'

interface PlacementRow {
  placement: string
  primary: number
  secondary: number
}

interface Props {
  placements: PlacementRow[]
}

// Turn a raw section anchor id (e.g. "hero-abc12345") into a friendly label.
function formatPlacement(placement: string): string {
  if (!placement || placement === 'unknown') return 'Unknown section'
  const type = placement.split('-')[0] || placement
  return type.charAt(0).toUpperCase() + type.slice(1)
}

export default function CtaBreakdown({ placements }: Props) {
  const total = placements.reduce((sum, p) => sum + p.primary + p.secondary, 0)

  if (total === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 text-gray-500 mb-4">
          <MousePointerClick className="w-4 h-4" />
          <span className="text-sm font-medium">Button clicks by placement</span>
        </div>
        <p className="text-sm text-gray-400">No button click data yet</p>
      </div>
    )
  }

  const rows = [...placements].sort(
    (a, b) => b.primary + b.secondary - (a.primary + a.secondary)
  )

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center gap-2 text-gray-500 mb-4">
        <MousePointerClick className="w-4 h-4" />
        <span className="text-sm font-medium">Button clicks by placement</span>
      </div>

      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.placement} className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-sm text-gray-900 truncate">
                {formatPlacement(row.placement)}
              </span>
            </div>
            <div className="flex items-center gap-4 ml-2">
              <span className="text-sm text-gray-900 w-16 text-right tabular-nums">
                {row.primary} primary
              </span>
              <span className="text-sm text-gray-500 w-20 text-right tabular-nums">
                {row.secondary} secondary
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Section</span>
          <div className="flex gap-4">
            <span className="w-16 text-right">Primary</span>
            <span className="w-20 text-right">Secondary</span>
          </div>
        </div>
      </div>
    </div>
  )
}
