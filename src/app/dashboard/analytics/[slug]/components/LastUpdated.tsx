'use client'

import { RefreshCw, Clock } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  lastUpdate: Date | null
  slug: string
}

export default function LastUpdated({ lastUpdate, slug }: Props) {
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      // Trigger a manual sync for this page
      const response = await fetch('/api/analytics/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      })

      if (response.ok) {
        // Refresh the page data
        router.refresh()
      } else {
        alert('Failed to refresh analytics. Please try again.')
      }
    } catch (error) {
      console.error('Error refreshing analytics:', error)
      alert('Failed to refresh analytics. Please try again.')
    } finally {
      setRefreshing(false)
    }
  }

  const formatLastUpdate = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - new Date(date).getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.floor(diffMs / (1000 * 60))

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    } else {
      return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    }
  }

  return (
    <div className="flex items-center gap-4 text-sm text-brand-mutedText">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4" />
        <span>
          {lastUpdate ? (
            <>Last updated: {formatLastUpdate(lastUpdate)}</>
          ) : (
            <>No data synced yet</>
          )}
        </span>
      </div>
      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="flex items-center gap-1 px-2 py-1 text-brand-accentPrimary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
        {refreshing ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>
  )
}
