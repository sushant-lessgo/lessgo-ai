'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { PLATFORM_PRESETS } from '@/modules/social/presets'
import type { Platform } from '@/modules/social/types'
import { SOCIAL_POST_CREATED_EVENT } from './SocialPostsPanel'

interface LibraryPost {
  id: string
  platform: string
  archetype: string | null
  mode: string
  content: string
  createdAt: string
}

function titleCase(key: string): string {
  return key
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function platformLabel(p: string): string {
  return PLATFORM_PRESETS[p as Platform]?.label ?? p
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function PostLibrary({ tokenId }: { tokenId: string }) {
  const [posts, setPosts] = useState<LibraryPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<LibraryPost | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/social/${encodeURIComponent(tokenId)}/posts`)
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.success) {
        setError('Could not load your saved posts.')
        return
      }
      setPosts(Array.isArray(data.posts) ? data.posts : [])
    } catch {
      setError('Could not reach the server.')
    } finally {
      setLoading(false)
    }
  }, [tokenId])

  useEffect(() => {
    load()
  }, [load])

  // Refetch when the panel reports a newly generated + persisted post.
  useEffect(() => {
    const handler = () => load()
    window.addEventListener(SOCIAL_POST_CREATED_EVENT, handler)
    return () => window.removeEventListener(SOCIAL_POST_CREATED_EVENT, handler)
  }, [load])

  const copy = async (post: LibraryPost) => {
    try {
      await navigator.clipboard.writeText(post.content)
      setCopiedId(post.id)
      setTimeout(() => setCopiedId((id) => (id === post.id ? null : id)), 2000)
    } catch {
      setError('Copy failed — select the text and copy manually.')
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      const res = await fetch(
        `/api/social/${encodeURIComponent(tokenId)}/posts/${encodeURIComponent(pendingDelete.id)}`,
        { method: 'DELETE' },
      )
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.success) {
        setError('Could not delete that post.')
        return
      }
      setPosts((prev) => prev.filter((p) => p.id !== pendingDelete.id))
      setPendingDelete(null)
    } catch {
      setError('Could not reach the server.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Saved posts</h2>
        <span className="text-xs text-gray-500">{posts.length}</span>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading…</p>}

      {error && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && posts.length === 0 && !error && (
        <p className="text-sm text-gray-500">No saved posts yet. Generate one to get started.</p>
      )}

      <ul className="space-y-3">
        {posts.map((post) => (
          <li key={post.id} className="rounded-md border border-gray-200 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                  {platformLabel(post.platform)}
                </span>
                {post.archetype && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                    {titleCase(post.archetype)}
                  </span>
                )}
                <span className="text-xs text-gray-400">{formatDate(post.createdAt)}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copy(post)}
                  className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                >
                  {copiedId === post.id ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={() => setPendingDelete(post)}
                  className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition"
                >
                  Delete
                </button>
              </div>
            </div>
            <p className="whitespace-pre-wrap text-sm text-gray-800 line-clamp-6">{post.content}</p>
          </li>
        ))}
      </ul>

      <Dialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this post?</DialogTitle>
            <DialogDescription>
              This removes the saved post from your library. It does not restore your generation
              allowance and can’t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setPendingDelete(null)}
              disabled={deleting}
              className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleting}
              className="px-3 py-1.5 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
