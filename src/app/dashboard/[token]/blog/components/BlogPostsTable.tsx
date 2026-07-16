'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { confirmDialog } from '@/components/ui/ConfirmDialog'
import { AppIcon } from '@/components/ui/icon'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

/**
 * Blog posts list (handoff 3c) — a card/row list, reskinned onto app-chrome.
 *
 * 🚨 C1 — the row/Edit links target `/dashboard/{tokenId}/blog/{postId}`, NOT the old
 * `/dashboard/blog/{slug}/{postId}` (that URL is now a redirect shim: an in-tab link
 * must never bounce through one). The page's `slug` prop existed ONLY to build those two
 * old URLs, so it is dropped here (the `/blog/{post.slug}` sub-line uses the POST's own
 * slug, a different field).
 *
 * 🚨 API CONTRACT FROZEN (blog-composer-redesign phase 1 = reskin only):
 *   publish/unpublish → `POST /api/blog/posts/{id}/{action}` with `{ tokenId }`
 *   delete            → `DELETE /api/blog/posts/{id}?tokenId=…`
 *   after any success → `router.refresh()` (the page is a SERVER component; never splice
 *                       local state — the server re-derives enablement AND the stats).
 * `window.confirm`/`alert` were replaced by the shared `confirmDialog`/toast hosts mounted
 * once in `dashboard/layout.tsx`; the requests themselves are untouched.
 *
 * ⚠️ Deleting the LAST post reverts the whole tab to the first-run screen — the derived
 * `enabled ⇔ ≥1 post` model (plan ruling #1). The confirm copy below says so, because that
 * is the only warning a user gets before it happens.
 */

interface PostRow {
  id: string
  slug: string
  title: string
  status: string
  publishedAt: string | null
  updatedAt: string
}

const ACTION_CLASS =
  'inline-flex items-center gap-1 rounded-[7px] px-2 py-1.5 font-app-sans text-[12px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50'

export default function BlogPostsTable({
  posts,
  tokenId,
}: {
  posts: PostRow[]
  tokenId: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [busyId, setBusyId] = useState<string | null>(null)

  const act = async (post: PostRow, action: 'publish' | 'unpublish' | 'delete') => {
    if (action === 'unpublish') {
      const ok = await confirmDialog({
        title: 'Take this post offline?',
        message: `“${post.title}” will stop appearing on your blog. The draft stays here — you can publish it again any time.`,
        confirmLabel: 'Unpublish',
      })
      if (!ok) return
    }
    if (action === 'delete') {
      const ok = await confirmDialog({
        title: 'Delete this post?',
        message:
          `“${post.title}” will be permanently deleted. This can't be undone.` +
          // The derived-enablement wart, said out loud at the only moment it matters.
          (posts.length === 1
            ? ' It is your only post, so your blog goes back to the setup screen.'
            : ''),
        confirmLabel: 'Delete',
        destructive: true,
      })
      if (!ok) return
    }

    setBusyId(post.id)
    try {
      const res =
        action === 'delete'
          ? await fetch(`/api/blog/posts/${post.id}?tokenId=${encodeURIComponent(tokenId)}`, { method: 'DELETE' })
          : await fetch(`/api/blog/posts/${post.id}/${action}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tokenId }),
            })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || `${action} failed`)
      toast(
        action === 'delete'
          ? 'Post deleted.'
          : action === 'publish'
            ? 'Post published.'
            : 'Post unpublished.',
        { variant: 'success' }
      )
      router.refresh()
    } catch (e) {
      toast(e instanceof Error ? e.message : `${action} failed`, { variant: 'error' })
    } finally {
      setBusyId(null)
    }
  }

  // 0 posts never reaches this component: the page renders <BlogFirstRun /> instead
  // (derived enablement). No local empty state here — one owner per state.
  return (
    <div className="overflow-hidden rounded-app-card border border-app-border bg-app-surface">
      {posts.map((post) => {
        const busy = busyId === post.id
        const isPublished = post.status === 'published'
        return (
          <div
            key={post.id}
            data-testid={`blog-post-row-${post.id}`}
            className="flex items-center gap-4 border-b border-app-hairline px-4 py-3.5 last:border-0"
          >
            <div className="min-w-0 flex-1">
              <Link
                href={`/dashboard/${tokenId}/blog/${post.id}`}
                className="font-app-sans text-[13px] font-semibold text-app-ink hover:text-app-primary"
              >
                {post.title}
              </Link>
              <div className="mt-0.5 font-app-mono text-[11px] text-app-faint">
                /blog/{post.slug}
              </div>
            </div>

            <span
              className={cn(
                'inline-flex shrink-0 rounded-app-badge px-2 py-0.5 font-app-sans text-[11px] font-semibold',
                isPublished
                  ? 'bg-app-success-bg text-app-success'
                  : 'bg-app-hairline text-app-muted'
              )}
            >
              {isPublished ? 'Published' : 'Draft'}
            </span>

            <span className="w-[92px] shrink-0 text-right font-app-sans text-[11.5px] text-app-faint">
              {post.publishedAt
                ? new Date(post.publishedAt).toLocaleDateString()
                : `Edited ${new Date(post.updatedAt).toLocaleDateString()}`}
            </span>

            <div className="flex shrink-0 items-center gap-1">
              {isPublished ? (
                <button
                  type="button"
                  onClick={() => act(post, 'unpublish')}
                  disabled={busy}
                  className={cn(ACTION_CLASS, 'text-app-slate hover:bg-app-hairline')}
                >
                  <AppIcon name="cloud_off" size={16} />
                  Unpublish
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => act(post, 'publish')}
                  disabled={busy}
                  className={cn(ACTION_CLASS, 'text-app-primary hover:bg-app-tint')}
                >
                  <AppIcon name="cloud_upload" size={16} />
                  Publish
                </button>
              )}
              <button
                type="button"
                onClick={() => act(post, 'delete')}
                disabled={busy}
                aria-label={`Delete ${post.title}`}
                className={cn(ACTION_CLASS, 'text-app-danger hover:bg-app-danger-bg')}
              >
                <AppIcon name="delete" size={16} />
                Delete
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
