'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  projects: { id: string; title: string }[]
}

const inputClass =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring'

export default function CollectLinksDialog({ open, onOpenChange, projects }: Props) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '')
  const [token, setToken] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Built client-side so it matches the actual host/port (avoids env drift).
  const url = token ? `${typeof window !== 'undefined' ? window.location.origin : ''}/t/${token}` : ''

  const load = async (pid: string) => {
    if (!pid) return
    setLoading(true)
    setError(null)
    setToken(null)
    setCopied(false)
    try {
      const res = await fetch('/api/testimonials/collect-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: pid }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Failed to load link')
        return
      }
      setToken(data.token)
      setIsActive(data.isActive)
    } catch {
      setError("Couldn't reach the server.")
    } finally {
      setLoading(false)
    }
  }

  const patch = async (body: Record<string, unknown>) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/testimonials/collect-link', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, ...body }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Failed')
        return
      }
      setToken(data.token)
      setIsActive(data.isActive)
      setCopied(false)
    } catch {
      setError("Couldn't reach the server.")
    } finally {
      setLoading(false)
    }
  }

  const copy = async () => {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      /* clipboard blocked — user can select the field manually */
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Collect link</DialogTitle>
          <DialogDescription>Share this link with customers to collect testimonials for a project.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {projects.length === 0 ? (
            <p className="text-sm text-gray-500">Create a project first to get a collect link.</p>
          ) : (
            <>
              {projects.length > 1 && (
                <div className="space-y-1.5">
                  <Label htmlFor="cl-project">Project</Label>
                  <select
                    id="cl-project"
                    value={projectId}
                    className={inputClass}
                    onChange={(e) => {
                      setProjectId(e.target.value)
                      setToken(null)
                      setError(null)
                    }}
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title || 'Untitled project'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!token ? (
                <Button onClick={() => load(projectId)} disabled={loading || !projectId}>
                  {loading ? 'Loading…' : 'Get link'}
                </Button>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label>Public URL</Label>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={url}
                        onFocus={(e) => e.target.select()}
                        className={`${inputClass} flex-1`}
                      />
                      <Button type="button" variant="outline" onClick={copy}>
                        {copied ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                    {!isActive && <p className="text-xs text-amber-600">This link is currently disabled.</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" disabled={loading} onClick={() => patch({ isActive: !isActive })}>
                      {isActive ? 'Disable' : 'Enable'}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" disabled={loading} onClick={() => patch({ rotate: true })}>
                      Regenerate
                    </Button>
                  </div>
                </>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
