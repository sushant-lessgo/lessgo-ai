'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react'

interface FormSubmission {
  id: string
  formId: string
  formName: string
  data: unknown
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: Date | string
}

interface FormSubmissionsTableProps {
  submissions: FormSubmission[]
}

export default function FormSubmissionsTable({ submissions }: FormSubmissionsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const toggleRow = (submissionId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(submissionId)) {
      newExpanded.delete(submissionId)
    } else {
      newExpanded.add(submissionId)
    }
    setExpandedRows(newExpanded)
  }

  const copyToClipboard = async (text: string, fieldKey: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldKey)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      // Silently handle copy failure
    }
  }

  const formatDate = (dateInput: Date | string) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
  }

  const getMainFields = (data: unknown) => {
    if (!isRecord(data)) return []
    // Show the first 3 most important fields in the collapsed view
    const priorityFields = ['email', 'name', 'firstName', 'lastName', 'phone', 'company']
    const fields = Object.entries(data)
    
    // Sort by priority, then by key name
    const sortedFields = fields.sort(([keyA], [keyB]) => {
      const priorityA = priorityFields.indexOf(keyA.toLowerCase())
      const priorityB = priorityFields.indexOf(keyB.toLowerCase())
      
      if (priorityA !== -1 && priorityB !== -1) {
        return priorityA - priorityB
      } else if (priorityA !== -1) {
        return -1
      } else if (priorityB !== -1) {
        return 1
      } else {
        return keyA.localeCompare(keyB)
      }
    })
    
    return sortedFields.slice(0, 3)
  }

  if (submissions.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>No submissions for this form yet.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                {/* Expand column */}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submitted
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data Preview
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {submissions.map((submission) => {
              const isExpanded = expandedRows.has(submission.id)
              const mainFields = getMainFields(submission.data)
              const dataObj = isRecord(submission.data) ? submission.data : {}
              const remainingFieldsCount = Object.keys(dataObj).length - mainFields.length

              return (
                <tr key={submission.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleRow(submission.id)}
                      className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-200 transition"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(submission.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {mainFields.map(([key, value]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500 min-w-[60px]">
                            {key}:
                          </span>
                          <span className="text-sm text-gray-900 truncate max-w-[200px]">
                            {String(value)}
                          </span>
                        </div>
                      ))}
                      {remainingFieldsCount > 0 && !isExpanded && (
                        <div className="text-xs text-gray-400">
                          +{remainingFieldsCount} more fields
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {submission.ipAddress ? (
                      <div>
                        <div>{submission.ipAddress}</div>
                        {submission.userAgent && (
                          <div className="text-xs text-gray-400 truncate max-w-[150px]">
                            {submission.userAgent.split(' ')[0]}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Expanded row details */}
      {submissions.map((submission) => {
        const isExpanded = expandedRows.has(submission.id)
        if (!isExpanded) return null
        const expandedData = isRecord(submission.data) ? submission.data : {}

        return (
          <div key={`${submission.id}-expanded`} className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Complete Submission Data</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(expandedData).map(([key, value]) => {
                const fieldKey = `${submission.id}-${key}`
                const displayValue = String(value)
                
                return (
                  <div key={key} className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                        {key}
                      </label>
                      <button
                        onClick={() => copyToClipboard(displayValue, fieldKey)}
                        className="flex items-center text-xs text-gray-400 hover:text-gray-600 transition"
                      >
                        {copiedField === fieldKey ? (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <div className="text-sm text-gray-900 break-words">
                      {displayValue}
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Technical Details */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
                Technical Details
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
                <div>
                  <span className="font-medium">Submission ID:</span> {submission.id}
                </div>
                <div>
                  <span className="font-medium">Form ID:</span> {submission.formId}
                </div>
                {submission.ipAddress && (
                  <div>
                    <span className="font-medium">IP Address:</span> {submission.ipAddress}
                  </div>
                )}
                {submission.userAgent && (
                  <div className="md:col-span-2">
                    <span className="font-medium">User Agent:</span>
                    <div className="mt-1 font-mono text-xs break-all">
                      {submission.userAgent}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}