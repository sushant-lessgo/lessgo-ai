'use client'

import { Monitor, Smartphone, Tablet } from 'lucide-react'

interface Props {
  deviceTotals: {
    desktop: number
    mobile: number
    tablet: number
  }
  deviceConversions: {
    desktop: number
    mobile: number
    tablet: number
  }
}

const devices = [
  { key: 'desktop' as const, label: 'Desktop', icon: Monitor, color: 'blue' },
  { key: 'mobile' as const, label: 'Mobile', icon: Smartphone, color: 'green' },
  { key: 'tablet' as const, label: 'Tablet', icon: Tablet, color: 'purple' },
]

export default function DeviceBreakdown({ deviceTotals, deviceConversions }: Props) {
  const total = deviceTotals.desktop + deviceTotals.mobile + deviceTotals.tablet

  if (total === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 text-gray-500 mb-4">
          <Monitor className="w-4 h-4" />
          <span className="text-sm font-medium">Devices</span>
        </div>
        <p className="text-sm text-gray-400">No device data yet</p>
      </div>
    )
  }

  // Find best converter
  const convRates = devices.map(d => ({
    key: d.key,
    rate: deviceTotals[d.key] > 0 ? (deviceConversions[d.key] / deviceTotals[d.key]) * 100 : 0,
  }))
  const maxConvRate = Math.max(...convRates.map(c => c.rate))

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center gap-2 text-gray-500 mb-4">
        <Monitor className="w-4 h-4" />
        <span className="text-sm font-medium">Devices</span>
      </div>

      <div className="space-y-3">
        {devices.map(device => {
          const views = deviceTotals[device.key]
          const conversions = deviceConversions[device.key]
          const percentage = (views / total) * 100
          const convRate = views > 0 ? (conversions / views) * 100 : 0
          const isBest = convRate === maxConvRate && maxConvRate > 0

          const Icon = device.icon
          const colorClasses: Record<string, string> = {
            blue: 'text-blue-600 bg-blue-50',
            green: 'text-green-600 bg-green-50',
            purple: 'text-purple-600 bg-purple-50',
          }

          return (
            <div key={device.key} className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className={`w-7 h-7 rounded flex items-center justify-center ${colorClasses[device.color]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm text-gray-900">{device.label}</span>
                {isBest && (
                  <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                    best
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 ml-2">
                <span className="text-sm text-gray-500 tabular-nums">
                  {percentage.toFixed(0)}%
                </span>
                <span className="text-sm font-medium text-gray-900 w-14 text-right tabular-nums">
                  {convRate.toFixed(1)}%
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Device</span>
          <div className="flex gap-4">
            <span>Traffic</span>
            <span className="w-14 text-right">Conv %</span>
          </div>
        </div>
      </div>
    </div>
  )
}
