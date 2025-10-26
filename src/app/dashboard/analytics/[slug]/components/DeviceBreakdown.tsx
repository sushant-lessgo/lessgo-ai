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

function DeviceBar({
  icon: Icon,
  label,
  count,
  conversions,
  percentage,
  conversionRate,
  color,
}: {
  icon: any
  label: string
  count: number
  conversions: number
  percentage: number
  conversionRate: number
  color: 'blue' | 'green' | 'purple'
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
  }

  const barColorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium text-brand-text">{label}</p>
            <p className="text-sm text-brand-mutedText">
              {count.toLocaleString()} views • {conversions.toLocaleString()} conversions
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-semibold text-brand-text">{percentage.toFixed(1)}%</p>
          <p className="text-xs text-brand-mutedText">{conversionRate.toFixed(2)}% conv rate</p>
        </div>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColorClasses[color]} rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export default function DeviceBreakdown({ deviceTotals, deviceConversions }: Props) {
  const total = deviceTotals.desktop + deviceTotals.mobile + deviceTotals.tablet

  if (total === 0) {
    return (
      <div className="bg-white border border-brand-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-brand-text mb-4">Device Breakdown</h3>
        <p className="text-sm text-brand-mutedText py-4">
          No device data available yet.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-brand-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-brand-text mb-4">Device Breakdown</h3>

      <div className="space-y-4">
        <DeviceBar
          icon={Monitor}
          label="Desktop"
          count={deviceTotals.desktop}
          conversions={deviceConversions.desktop}
          percentage={(deviceTotals.desktop / total) * 100}
          conversionRate={deviceTotals.desktop > 0 ? (deviceConversions.desktop / deviceTotals.desktop) * 100 : 0}
          color="blue"
        />
        <DeviceBar
          icon={Smartphone}
          label="Mobile"
          count={deviceTotals.mobile}
          conversions={deviceConversions.mobile}
          percentage={(deviceTotals.mobile / total) * 100}
          conversionRate={deviceTotals.mobile > 0 ? (deviceConversions.mobile / deviceTotals.mobile) * 100 : 0}
          color="green"
        />
        <DeviceBar
          icon={Tablet}
          label="Tablet"
          count={deviceTotals.tablet}
          conversions={deviceConversions.tablet}
          percentage={(deviceTotals.tablet / total) * 100}
          conversionRate={deviceTotals.tablet > 0 ? (deviceConversions.tablet / deviceTotals.tablet) * 100 : 0}
          color="purple"
        />
      </div>
    </div>
  )
}
