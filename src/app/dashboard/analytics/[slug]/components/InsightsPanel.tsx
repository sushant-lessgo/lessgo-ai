'use client'

import { Lightbulb, AlertTriangle, CheckCircle, Info } from 'lucide-react'

interface Totals {
  views: number
  submissions: number
  conversionRate: number
}

interface DeviceTotals {
  desktop: number
  mobile: number
  tablet: number
}

interface DeviceConversions {
  desktop: number
  mobile: number
  tablet: number
}

interface Props {
  totals: Totals
  deviceTotals: DeviceTotals
  deviceConversions: DeviceConversions
  topReferrers: [string, number][]
}

interface Insight {
  type: 'warning' | 'success' | 'info'
  title: string
  description: string
  action?: string
}

function generateInsights(
  totals: Totals,
  deviceTotals: DeviceTotals,
  deviceConversions: DeviceConversions,
  topReferrers: [string, number][]
): Insight[] {
  const insights: Insight[] = []

  const totalViews = deviceTotals.desktop + deviceTotals.mobile + deviceTotals.tablet

  // Low conversion rate
  if (totals.views > 100 && totals.conversionRate < 2) {
    insights.push({
      type: 'warning',
      title: 'Low conversion rate detected',
      description: `Your conversion rate (${totals.conversionRate.toFixed(2)}%) is below industry average (2-3%). Consider adding social proof or simplifying your form.`,
      action: 'Optimize Page',
    })
  }

  // High conversion rate
  if (totals.views > 50 && totals.conversionRate > 5) {
    insights.push({
      type: 'success',
      title: 'Excellent conversion rate!',
      description: `Your conversion rate (${totals.conversionRate.toFixed(2)}%) is above industry average. Great job!`,
    })
  }

  // High mobile traffic
  const mobilePercentage = totalViews > 0 ? (deviceTotals.mobile / totalViews) * 100 : 0
  if (mobilePercentage > 40 && totalViews > 50) {
    insights.push({
      type: 'info',
      title: 'High mobile traffic',
      description: `${mobilePercentage.toFixed(0)}% of your visitors are on mobile. Ensure your page is mobile-optimized.`,
      action: 'Preview Mobile',
    })
  }

  // Mobile conversion rate vs desktop
  const mobileConvRate = deviceTotals.mobile > 0 ? (deviceConversions.mobile / deviceTotals.mobile) * 100 : 0
  const desktopConvRate = deviceTotals.desktop > 0 ? (deviceConversions.desktop / deviceTotals.desktop) * 100 : 0

  if (deviceTotals.mobile > 20 && deviceTotals.desktop > 20 && desktopConvRate > 0) {
    const difference = ((desktopConvRate - mobileConvRate) / desktopConvRate) * 100
    if (difference > 40) {
      insights.push({
        type: 'warning',
        title: 'Mobile conversion is lower',
        description: `Mobile conversion rate (${mobileConvRate.toFixed(2)}%) is ${difference.toFixed(0)}% lower than desktop. Check your mobile user experience.`,
        action: 'View Mobile Issues',
      })
    }
  }

  // Best performing traffic source
  if (topReferrers.length > 0) {
    const [topSource, topCount] = topReferrers[0]
    const topPercentage = totalViews > 0 ? (topCount / totalViews) * 100 : 0

    if (topPercentage > 20) {
      try {
        const url = new URL(topSource)
        const domain = url.hostname.replace('www.', '')
        insights.push({
          type: 'success',
          title: 'Strong traffic source',
          description: `${domain} is your top referrer with ${topPercentage.toFixed(0)}% of traffic. Consider focusing your marketing efforts here.`,
        })
      } catch {
        // Ignore invalid URLs
      }
    }
  }

  // Not enough data
  if (totals.views < 50) {
    insights.push({
      type: 'info',
      title: 'Need more data',
      description: 'You need at least 50 views for meaningful insights. Keep promoting your page!',
      action: 'Share Page',
    })
  }

  return insights
}

export default function InsightsPanel({
  totals,
  deviceTotals,
  deviceConversions,
  topReferrers,
}: Props) {
  const insights = generateInsights(totals, deviceTotals, deviceConversions, topReferrers)

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-brand-text mb-4 flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-yellow-600" />
        Insights & Recommendations
      </h3>

      {insights.length === 0 ? (
        <p className="text-sm text-brand-mutedText">
          No insights available yet. Keep collecting data for personalized recommendations.
        </p>
      ) : (
        <>
          <div className="space-y-4 mb-4">
            {insights.map((insight, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {insight.type === 'warning' && <AlertTriangle className="w-5 h-5 text-orange-500" />}
                  {insight.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                  {insight.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 mb-1">{insight.title}</p>
                  <p className="text-sm text-gray-600">{insight.description}</p>
                  {insight.action && (
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2">
                      {insight.action} →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Industry Benchmarks */}
          {totals.views >= 50 && (
            <div className="pt-4 border-t border-blue-200">
              <p className="text-xs font-semibold text-brand-mutedText uppercase mb-3">
                Industry Benchmarks
              </p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white/50 rounded-lg p-2">
                  <p className="text-xs text-brand-mutedText mb-1">Avg Conv Rate</p>
                  <p className="text-sm font-bold text-gray-900">2-3%</p>
                </div>
                <div className="bg-white/50 rounded-lg p-2">
                  <p className="text-xs text-brand-mutedText mb-1">Good Conv Rate</p>
                  <p className="text-sm font-bold text-gray-900">5%+</p>
                </div>
                <div className="bg-white/50 rounded-lg p-2">
                  <p className="text-xs text-brand-mutedText mb-1">Your Rate</p>
                  <p className={`text-sm font-bold ${
                    totals.conversionRate >= 5 ? 'text-green-600' :
                    totals.conversionRate >= 2 ? 'text-blue-600' :
                    'text-orange-600'
                  }`}>
                    {totals.conversionRate.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
