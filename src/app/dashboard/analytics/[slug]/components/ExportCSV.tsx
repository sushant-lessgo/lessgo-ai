'use client'

import { Download } from 'lucide-react'

interface AnalyticsData {
  date: Date
  views: number
  uniqueVisitors: number
  formSubmissions: number
  conversionRate: number
  ctaClicks: number
  desktopViews: number
  mobileViews: number
  tabletViews: number
}

interface Props {
  analytics: AnalyticsData[]
  slug: string
}

function formatDate(date: Date): string {
  return new Date(date).toISOString().split('T')[0]
}

function convertToCSV(data: AnalyticsData[]): string {
  const headers = [
    'Date',
    'Views',
    'Unique Visitors',
    'Form Submissions',
    'Conversion Rate (%)',
    'CTA Clicks',
    'Desktop Views',
    'Mobile Views',
    'Tablet Views',
  ]

  const rows = data.map(day => [
    formatDate(day.date),
    day.views,
    day.uniqueVisitors,
    day.formSubmissions,
    day.conversionRate.toFixed(2),
    day.ctaClicks,
    day.desktopViews,
    day.mobileViews,
    day.tabletViews,
  ])

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
}

export default function ExportCSV({ analytics, slug }: Props) {
  const handleExport = () => {
    if (analytics.length === 0) return

    const csv = convertToCSV(analytics)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `analytics-${slug}-${formatDate(new Date())}.csv`
    link.click()

    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition"
    >
      <Download className="w-4 h-4" />
      Export
    </button>
  )
}
