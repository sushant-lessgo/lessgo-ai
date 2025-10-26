'use client'

import { Download } from 'lucide-react'

interface AnalyticsData {
  date: Date
  views: number
  uniqueVisitors: number
  formSubmissions: number
  conversionRate: number
  avgTimeOnPage: number | null
  bounceRate: number | null
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
    'Avg Time on Page (s)',
    'Bounce Rate (%)',
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
    day.avgTimeOnPage ?? '',
    day.bounceRate?.toFixed(2) ?? '',
    day.ctaClicks,
    day.desktopViews,
    day.mobileViews,
    day.tabletViews,
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n')

  return csvContent
}

export default function ExportCSV({ analytics, slug }: Props) {
  const handleExport = () => {
    if (analytics.length === 0) {
      alert('No data to export')
      return
    }

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
      disabled={analytics.length === 0}
      className="flex items-center px-4 py-2 bg-brand-accentPrimary text-white rounded-md hover:bg-brand-logo transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Download className="w-4 h-4 mr-2" />
      Export CSV
    </button>
  )
}
