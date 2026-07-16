'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { promptDialog } from '@/components/ui/ConfirmDialog'
import { AppIcon } from '@/components/ui/icon'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

/**
 * New-post button — creates a draft post and opens the composer.
 *
 * 🚨 C1 — pushes `/dashboard/{tokenId}/blog/{postId}`, NOT the old
 * `/dashboard/blog/{slug}/{postId}` (now a redirect shim; in-tab links must never hop
 * through one). The `slug` prop existed only for that old URL and is dropped.
 *
 * 🚨 API CONTRACT FROZEN (blog-composer-redesign phase 1): `POST /api/blog/posts`
 * with `{ tokenId, title }`. This phase is a reskin — `window.prompt`/`alert` were
 * swapped for the shared `promptDialog` + toast hosts already mounted in
 * `dashboard/layout.tsx`. The request/response shape must NOT change here.
 *
 * Title bound (200) mirrors `BlogPostCreateSchema` — a client courtesy that turns the
 * route's 400 into a sentence before the round trip. The route stays the real gate.
 */

const TITLE_MAX = 200

export interface NewPostButtonProps {
  tokenId: string
  /** `hero` = the larger first-run CTA (BlogFirstRun); `default` = manager header. */
  variant?: 'default' | 'hero'
  className?: string
}

export default function NewPostButton({
  tokenId,
  variant = 'default',
  className,
}: NewPostButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)

  const create = () => {
    void (async () => {
      const entered = await promptDialog({
        title: 'New post',
        message: 'Give it a working title — you can change it any time before it goes live.',
        placeholder: 'How we cut onboarding to five minutes',
        confirmLabel: 'Create post',
      })
      if (entered === null) return

      const title = entered.trim()
      if (!title) {
        toast('Give the post a title first.', { variant: 'error' })
        return
      }
      if (title.length > TITLE_MAX) {
        toast(`Titles are limited to ${TITLE_MAX} characters.`, { variant: 'error' })
        return
      }

      setBusy(true)
      try {
        const res = await fetch('/api/blog/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tokenId, title }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || 'Failed to create post')
        router.push(`/dashboard/${tokenId}/blog/${data.post.id}`)
      } catch (e) {
        toast(e instanceof Error ? e.message : 'Failed to create post', { variant: 'error' })
        setBusy(false)
      }
    })()
  }

  return (
    <button
      type="button"
      onClick={create}
      disabled={busy}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-app-ctl bg-app-primary font-app-sans font-semibold text-white transition-colors hover:bg-app-primary-hover disabled:opacity-50',
        variant === 'hero'
          ? 'px-4 py-2.5 text-[13px] shadow-app-btn-primary'
          : 'px-3 py-2 text-[12.5px]',
        className
      )}
    >
      <AppIcon name="edit_note" size={variant === 'hero' ? 19 : 17} />
      {busy ? 'Creating…' : 'Write a post'}
    </button>
  )
}
