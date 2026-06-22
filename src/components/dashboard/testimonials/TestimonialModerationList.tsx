'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Testimonial } from '@prisma/client'
import { Plus, Star, MessageSquare, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import TestimonialFormDialog from './TestimonialFormDialog'
import CollectLinksDialog from './CollectLinksDialog'

type Filter = 'all' | 'pending' | 'approved' | 'rejected'
const FILTERS: Filter[] = ['all', 'pending', 'approved', 'rejected']

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'
const STATUS_BADGE: Record<string, { label: string; variant: BadgeVariant }> = {
  pending: { label: 'Pending', variant: 'secondary' },
  approved: { label: 'Approved', variant: 'default' },
  rejected: { label: 'Rejected', variant: 'destructive' },
}

export default function TestimonialModerationList({
  initial,
  projects,
}: {
  initial: Testimonial[]
  projects: { id: string; title: string }[]
}) {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>('all')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Testimonial | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null)
  const [collectOpen, setCollectOpen] = useState(false)

  const projectMap = new Map(projects.map((p) => [p.id, p.title || 'Untitled project']))
  const hasUnassigned = initial.some((t) => !t.projectId)
  // Project dimension is hidden entirely for the common single-project user (zero friction).
  const showProjects = projects.length > 1 || hasUnassigned

  const visible = initial.filter((t) => {
    if (filter !== 'all' && t.status !== filter) return false
    if (projectFilter === 'all') return true
    if (projectFilter === 'unassigned') return !t.projectId
    return t.projectId === projectFilter
  })
  const refresh = () => router.refresh()

  const act = async (id: string, fn: () => Promise<Response>) => {
    setBusyId(id)
    setError(null)
    try {
      const res = await fn()
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Action failed')
        return
      }
      refresh()
    } catch {
      setError("Couldn't reach the server. Try again.")
    } finally {
      setBusyId(null)
    }
  }

  const setStatus = (t: Testimonial, status: string) =>
    act(t.id, () =>
      fetch(`/api/testimonials/${t.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }),
    )

  const confirmDelete = () => {
    const t = deleteTarget
    setDeleteTarget(null)
    if (t) act(t.id, () => fetch(`/api/testimonials/${t.id}`, { method: 'DELETE' }))
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-sm rounded-lg capitalize transition ${
                  filter === f ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          {showProjects && (
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700"
              aria-label="Filter by project"
            >
              <option value="all">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title || 'Untitled project'}
                </option>
              ))}
              {hasUnassigned && <option value="unassigned">Unassigned</option>}
            </select>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setCollectOpen(true)}>
            <LinkIcon className="w-4 h-4 mr-1.5" />
            Collect link
          </Button>
          <Button
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add testimonial
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {visible.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12">
          <div className="max-w-md mx-auto text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-7 h-7 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No testimonials yet' : `No ${filter} testimonials`}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Add testimonials manually now; the public collection form comes next.
            </p>
            <Button
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add testimonial
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((t) => {
            const badge = STATUS_BADGE[t.status] ?? { label: t.status, variant: 'outline' as BadgeVariant }
            const busy = busyId === t.id
            return (
              <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    {t.authorPhotoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={t.authorPhotoUrl}
                        alt={t.authorName}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <blockquote className="text-sm text-gray-800">“{t.quote}”</blockquote>
                      <div className="mt-2 text-sm text-gray-500">
                        <span className="font-medium text-gray-900">{t.authorName}</span>
                        {t.authorRole && <> · {t.authorRole}</>}
                        {t.authorCompany && <> · {t.authorCompany}</>}
                      </div>
                      {t.rating != null && (
                        <div className="mt-1 flex items-center gap-0.5 text-amber-500">
                          {Array.from({ length: t.rating }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                    {showProjects && (
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {t.projectId ? projectMap.get(t.projectId) ?? 'Unknown project' : 'Unassigned'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  {t.status !== 'approved' && (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => setStatus(t, 'approved')}>
                      Approve
                    </Button>
                  )}
                  {t.status !== 'rejected' && (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => setStatus(t, 'rejected')}>
                      Reject
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => {
                      setEditing(t)
                      setFormOpen(true)
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => setDeleteTarget(t)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <TestimonialFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={refresh}
        testimonial={editing}
        projects={projects}
      />

      <CollectLinksDialog open={collectOpen} onOpenChange={setCollectOpen} projects={projects} />

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete testimonial?</DialogTitle>
            <DialogDescription>This permanently removes it. This action can&apos;t be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
