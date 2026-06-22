'use client'

import { useState } from 'react'
import type { Testimonial } from '@prisma/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export interface ProjectLite {
  id: string
  title: string
  audienceType: string
  token: string | null
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  projects: ProjectLite[]
  testimonials: Testimonial[]
}

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring'

export default function FeatureOnPageDialog({ open, onOpenChange, projects, testimonials }: Props) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ token: string | null } | null>(null)

  const project = projects.find((p) => p.id === projectId)
  const cap = project?.audienceType === 'product' ? 3 : 1
  const approved = testimonials.filter((t) => t.projectId === projectId && t.status === 'approved')

  const reset = () => {
    setSelectedIds([])
    setError(null)
    setDone(null)
  }

  const toggle = (id: string) => {
    setSelectedIds((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id)
      if (cur.length >= cap) return cur
      return [...cur, id]
    })
  }

  const submit = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/testimonials/apply-to-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, testimonialIds: selectedIds }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Failed to add to page')
        return
      }
      setDone({ token: project?.token ?? null })
    } catch {
      setError("Couldn't reach the server.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset()
        onOpenChange(o)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Feature on page</DialogTitle>
          <DialogDescription>Add approved testimonials to a project&apos;s landing page.</DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              Added to your page draft. Open a <strong>fresh</strong> editor tab and <strong>Publish</strong> to make it live.
            </p>
            {done.token && (
              <a
                href={`/edit/${done.token}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm text-blue-600 hover:underline"
              >
                Open editor →
              </a>
            )}
          </div>
        ) : projects.length === 0 ? (
          <p className="text-sm text-gray-500">Create a project first.</p>
        ) : (
          <div className="space-y-4">
            {projects.length > 1 && (
              <div className="space-y-1.5">
                <Label htmlFor="fop-project">Project</Label>
                <select
                  id="fop-project"
                  value={projectId}
                  className={selectClass}
                  onChange={(e) => {
                    setProjectId(e.target.value)
                    setSelectedIds([])
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

            <p className="text-xs text-gray-500">
              {cap === 1 ? 'Select 1 testimonial.' : `Select up to ${cap} testimonials.`}
            </p>

            {approved.length === 0 ? (
              <p className="text-sm text-gray-500">No approved testimonials for this project yet.</p>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {approved.map((t) => {
                  const checked = selectedIds.includes(t.id)
                  const atCap = !checked && selectedIds.length >= cap
                  return (
                    <label
                      key={t.id}
                      className={`flex items-start gap-2 rounded-lg border p-3 cursor-pointer ${
                        checked ? 'border-gray-900 bg-gray-50' : 'border-gray-200'
                      } ${atCap ? 'opacity-50' : ''}`}
                    >
                      <input type="checkbox" checked={checked} disabled={atCap} onChange={() => toggle(t.id)} className="mt-1" />
                      <span className="min-w-0">
                        <span className="block text-sm text-gray-800 line-clamp-2">“{t.quote}”</span>
                        <span className="block text-xs text-gray-500 mt-0.5">
                          {t.authorName}
                          {t.authorRole ? ` · ${t.authorRole}` : ''}
                        </span>
                      </span>
                    </label>
                  )
                })}
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button onClick={submit} disabled={loading || selectedIds.length === 0}>
              {loading ? 'Adding…' : 'Add to page'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
