'use client'

import { Download } from 'lucide-react'

interface FormSubmission {
  id: string
  formId: string
  formName: string
  data: unknown
  createdAt: Date | string
}

interface Props {
  submissions: FormSubmission[]
  slug: string
}

function formatDate(dateString: string): string {
  return new Date(dateString).toISOString().split('T')[0]
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function convertToCSV(submissions: FormSubmission[]): string {
  // Collect all unique field keys across submissions
  const allKeys = new Set<string>()
  submissions.forEach(s => {
    if (isRecord(s.data)) {
      Object.keys(s.data).forEach(k => allKeys.add(k))
    }
  })

  const fieldKeys = Array.from(allKeys).sort()
  const headers = ['Date', 'Form Name', ...fieldKeys]

  const rows = submissions.map(s => {
    const data = isRecord(s.data) ? s.data : {}
    return [
      formatDate(String(s.createdAt)),
      s.formName,
      ...fieldKeys.map(k => escapeCSV(String(data[k] ?? '')))
    ]
  })

  return [
    headers.map(h => escapeCSV(h)).join(','),
    ...rows.map(r => r.join(','))
  ].join('\n')
}

export default function ExportFormCSV({ submissions, slug }: Props) {
  const handleExport = () => {
    if (submissions.length === 0) return

    const csv = convertToCSV(submissions)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `form-submissions-${slug}-${formatDate(new Date().toISOString())}.csv`
    link.click()

    URL.revokeObjectURL(url)
  }

  if (submissions.length === 0) return null

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
