'use client'

// Blog post composer (handoff TURN 5 article view) — reskinned onto app-chrome by
// blog-composer-redesign phase 2. Layout is rail-left / writing-surface-right:
// settings (slug, excerpt, hero, SEO, status) live in the rail; title + body own the
// right. Markdown stays canonical — BlogRichTextEditor serializes back to markdown on
// every change — with a raw-markdown escape hatch. Manual save; publish/unpublish hit
// the per-post pipeline.
//
// 🚨 CONTRACTS FROZEN BY THIS RESKIN (phase 2 changed CHROME ONLY — if you are diffing,
// these five must be behaviourally identical to the pre-reskin file):
//   1. save     → PATCH /api/blog/posts/{id} with body `{ format:'markdown', markdown }`
//   2. publish  → POST  /api/blog/posts/{id}/publish   `{ tokenId }`
//   3. unpublish→ POST  /api/blog/posts/{id}/unpublish `{ tokenId }`
//   4. the `richKey` remount trick (see below) — the ONLY way raw-mode edits reach Tiptap
//   5. `slugLocked` → the field is disabled AND the reason is spelled out
// `alert`/`confirm`/the home-grown `flash` notice were replaced by the shared
// `toast`/`confirmDialog` hosts already mounted in `dashboard/layout.tsx`. The requests
// themselves are untouched.
import { useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { publishedSubdomainHost } from '@/lib/domains/hosts'
import { slugify as canonicalSlugify } from '@/lib/normalize'
import { confirmDialog } from '@/components/ui/ConfirmDialog'
import { AppIcon } from '@/components/ui/icon'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import BlogRichTextEditor from './BlogRichTextEditor'
import HeroImageField from './HeroImageField'

interface EditorPost {
  id: string
  slug: string
  title: string
  excerpt: string
  heroImage: string
  markdown: string
  status: string
  slugLocked: boolean
  seo: { title?: string; description?: string; ogImage?: string; noIndex?: boolean }
}

// Canonical slugifier (F28) + blog's 80-char slug cap.
function slugify(s: string): string {
  return canonicalSlugify(s).slice(0, 80)
}

const INPUT_CLASS =
  'w-full rounded-app-input border border-app-border-input bg-app-surface px-3 py-2 font-app-sans text-[12.5px] text-app-ink placeholder:text-app-placeholder focus:border-app-primary focus:outline-none focus:ring-2 focus:ring-app-tint disabled:bg-app-hairline disabled:text-app-muted'

const LABEL_CLASS = 'mb-1.5 block font-app-sans text-[11.5px] font-semibold text-app-label'

const BTN_BASE =
  'inline-flex items-center gap-1.5 rounded-app-ctl px-3 py-2 font-app-sans text-[12.5px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50'

/**
 * 🚨 THE RAIL SEAM (plan ruling #5 groundwork). The left rail is a SLOT, not hard-wired
 * markup: `railPanel` defaults to the post-settings panel, and phase 4 mounts the AI brief
 * panel in the same slot without re-laying-out the composer. Anything dropped in here gets
 * the rail's width/sticky/scroll behaviour for free — keep panels self-contained.
 */
function ComposerRail({ children }: { children: ReactNode }) {
  return (
    <aside className="w-full shrink-0 lg:sticky lg:top-4 lg:w-[288px] lg:self-start">{children}</aside>
  )
}

export default function BlogPostEditor({
  tokenId,
  slug,
  post,
  railPanel,
}: {
  tokenId: string
  slug: string
  post: EditorPost
  /** Rail slot — omit for the default settings panel (see ComposerRail). */
  railPanel?: ReactNode
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [title, setTitle] = useState(post.title)
  const [postSlug, setPostSlug] = useState(post.slug)
  const [excerpt, setExcerpt] = useState(post.excerpt)
  const [heroImage, setHeroImage] = useState(post.heroImage)
  const [markdown, setMarkdown] = useState(post.markdown)
  const [seoTitle, setSeoTitle] = useState(post.seo.title ?? '')
  const [seoDescription, setSeoDescription] = useState(post.seo.description ?? '')
  const [status, setStatus] = useState(post.status)
  const [busy, setBusy] = useState<null | 'save' | 'publish' | 'unpublish'>(null)
  const [showSeo, setShowSeo] = useState(false)
  // Rich (Tiptap) vs raw-markdown escape hatch. Both write the same `markdown`
  // state; `richKey` remounts the rich editor so it re-parses markdown edited
  // in raw mode (external changes aren't synced into a live Tiptap instance).
  const [mode, setMode] = useState<'rich' | 'markdown'>('rich')
  const [richKey, setRichKey] = useState(0)

  const save = async (): Promise<boolean> => {
    setBusy('save')
    try {
      const seo: Record<string, unknown> = {}
      if (seoTitle.trim()) seo.title = seoTitle.trim()
      if (seoDescription.trim()) seo.description = seoDescription.trim()
      const res = await fetch(`/api/blog/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId,
          title: title.trim() || 'Untitled',
          ...(post.slugLocked ? {} : { slug: postSlug || slugify(title) || 'post' }),
          excerpt: excerpt.trim() || null,
          heroImage: heroImage.trim() || null,
          body: { format: 'markdown', markdown },
          seo: Object.keys(seo).length ? seo : null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Save failed')
      toast('Post saved.', { variant: 'success' })
      return true
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Save failed', { variant: 'error' })
      return false
    } finally {
      setBusy(null)
    }
  }

  const publish = async () => {
    if (!(await save())) return
    setBusy('publish')
    try {
      const res = await fetch(`/api/blog/posts/${post.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Publish failed')
      setStatus('published')
      toast('Post published.', { variant: 'success' })
      router.refresh()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Publish failed', { variant: 'error' })
    } finally {
      setBusy(null)
    }
  }

  const unpublish = async () => {
    const ok = await confirmDialog({
      title: 'Take this post offline?',
      message:
        'It will stop appearing on your blog. The draft stays here — you can publish it again any time.',
      confirmLabel: 'Unpublish',
    })
    if (!ok) return
    setBusy('unpublish')
    try {
      const res = await fetch(`/api/blog/posts/${post.id}/unpublish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Unpublish failed')
      setStatus('draft')
      toast('Post unpublished.', { variant: 'success' })
      router.refresh()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Unpublish failed', { variant: 'error' })
    } finally {
      setBusy(null)
    }
  }

  const liveUrl = `https://${publishedSubdomainHost(slug)}/blog/${postSlug}`
  const isPublished = status === 'published'

  const settingsPanel = (
    <div className="flex flex-col gap-4 rounded-app-card border border-app-border bg-app-surface p-4">
      <div>
        <span className={LABEL_CLASS}>Status</span>
        <span
          className={cn(
            'inline-flex rounded-app-badge px-2 py-0.5 font-app-sans text-[11px] font-semibold',
            isPublished ? 'bg-app-success-bg text-app-success' : 'bg-app-hairline text-app-muted'
          )}
          data-testid="composer-status"
        >
          {isPublished ? 'Published' : 'Draft'}
        </span>
      </div>

      <div className="h-px bg-app-divider" />

      <div>
        <label className={LABEL_CLASS} htmlFor="post-slug">
          URL slug
        </label>
        <input
          id="post-slug"
          data-testid="composer-slug"
          className={INPUT_CLASS}
          value={postSlug}
          disabled={post.slugLocked}
          onChange={(e) => setPostSlug(slugify(e.target.value))}
        />
        {/* The lock is not decoration: PATCH 409s on a slug change once firstPublishedAt
            is set. Saying WHY beats a mystery disabled box. */}
        {post.slugLocked ? (
          <p
            data-testid="composer-slug-locked-note"
            className="mt-1.5 flex items-start gap-1 font-app-sans text-[11px] text-app-muted"
          >
            <AppIcon name="lock" size={13} className="mt-px shrink-0" />
            URL is permanent after first publish — changing it would break every link
            already pointing here.
          </p>
        ) : null}
        {isPublished ? (
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 block truncate font-app-mono text-[11px] text-app-faint hover:text-app-primary"
          >
            {liveUrl} ↗
          </a>
        ) : null}
      </div>

      <div>
        <label className={LABEL_CLASS} htmlFor="post-excerpt">
          Excerpt
        </label>
        <textarea
          id="post-excerpt"
          className={cn(INPUT_CLASS, 'resize-none')}
          rows={3}
          maxLength={300}
          value={excerpt}
          placeholder="Short summary shown on the blog index and in search results"
          onChange={(e) => setExcerpt(e.target.value)}
        />
      </div>

      {/* Ruling #7 — narrow {value,onChange} seam; picker swaps the internals later. */}
      <HeroImageField
        value={heroImage}
        onChange={setHeroImage}
        tokenId={tokenId}
        disabled={busy !== null}
      />

      <div className="h-px bg-app-divider" />

      <div>
        <button
          type="button"
          onClick={() => setShowSeo(!showSeo)}
          className="flex w-full items-center justify-between font-app-sans text-[11.5px] font-semibold text-app-label hover:text-app-ink"
        >
          SEO overrides
          <AppIcon name={showSeo ? 'expand_less' : 'expand_more'} size={16} />
        </button>
        {showSeo && (
          <div className="mt-3 flex flex-col gap-3">
            <div>
              <label className={LABEL_CLASS} htmlFor="seo-title">
                SEO title
              </label>
              <input
                id="seo-title"
                className={INPUT_CLASS}
                maxLength={70}
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
              />
            </div>
            <div>
              <label className={LABEL_CLASS} htmlFor="seo-description">
                SEO description
              </label>
              <input
                id="seo-description"
                className={INPUT_CLASS}
                maxLength={200}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-app-sans text-[15px] font-bold text-app-ink">Edit post</h1>
        <div className="flex flex-wrap items-center gap-2">
          {/*
            🚨 DELIBERATE: this preview link stays on the OLD slug URL (B2). Every other
            blog link was re-pointed to `/dashboard/{token}/...`, but the SSR preview is
            NOT a dashboard screen — it lives in the `(blog-preview)` root route group
            (`src/app/(blog-preview)/dashboard/blog/[slug]/[postId]/preview/page.tsx`),
            deliberately OUTSIDE the dashboard tree so no `.app-chrome` ancestor can leak
            app fonts/colors into real template markup. It has no `[token]` twin and no
            redirect shim, so this URL is the live one, not a hop. Do NOT "fix" it.
            (`slug` comes from the page's `publishedPage.slug`, D3 — not a route param.)
          */}
          <a
            href={`/dashboard/blog/${slug}/${post.id}/preview`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(BTN_BASE, 'border border-app-border-input bg-app-surface text-app-slate hover:bg-app-hairline')}
          >
            <AppIcon name="visibility" size={16} />
            Preview saved draft
          </a>
          <button
            type="button"
            onClick={save}
            disabled={busy !== null}
            className={cn(BTN_BASE, 'border border-app-border-input bg-app-surface text-app-ink hover:bg-app-hairline')}
          >
            <AppIcon name="save" size={16} />
            {busy === 'save' ? 'Saving…' : 'Save'}
          </button>
          {isPublished && (
            <button
              type="button"
              onClick={unpublish}
              disabled={busy !== null}
              className={cn(BTN_BASE, 'text-app-slate hover:bg-app-hairline')}
            >
              <AppIcon name="cloud_off" size={16} />
              {busy === 'unpublish' ? 'Unpublishing…' : 'Unpublish'}
            </button>
          )}
          <button
            type="button"
            onClick={publish}
            disabled={busy !== null}
            className={cn(
              BTN_BASE,
              'bg-app-primary font-semibold text-white shadow-app-btn-primary hover:bg-app-primary-hover'
            )}
          >
            <AppIcon name="cloud_upload" size={16} />
            {busy === 'publish' ? 'Publishing…' : isPublished ? 'Republish' : 'Publish'}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <ComposerRail>{railPanel ?? settingsPanel}</ComposerRail>

        {/* Writing surface — title + article body, nothing else competing for attention. */}
        <div className="min-w-0 flex-1 overflow-hidden rounded-app-card border border-app-border bg-app-surface">
          <div className="border-b border-app-hairline px-6 pb-4 pt-5">
            <input
              data-testid="composer-title"
              aria-label="Post title"
              className="w-full border-0 bg-transparent p-0 font-app-sans text-[24px] font-bold leading-tight text-app-ink placeholder:text-app-placeholder focus:outline-none focus:ring-0"
              value={title}
              placeholder="Post title"
              onChange={(e) => {
                setTitle(e.target.value)
                if (!post.slugLocked && (postSlug === '' || postSlug === slugify(title))) {
                  setPostSlug(slugify(e.target.value))
                }
              }}
            />
          </div>

          <div className="flex items-center justify-between border-b border-app-hairline bg-app-canvas px-3 py-1.5">
            <span className="font-app-sans text-[10.5px] font-semibold uppercase tracking-wide text-app-faint">
              Article
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setMode('rich')
                  setRichKey((k) => k + 1) // re-parse markdown possibly edited in raw mode
                }}
                className={cn(
                  'rounded-[7px] px-2 py-1 font-app-sans text-[11.5px] font-medium transition-colors',
                  mode === 'rich' ? 'bg-app-ink text-white' : 'text-app-muted hover:bg-app-hairline'
                )}
              >
                Rich
              </button>
              <button
                type="button"
                onClick={() => setMode('markdown')}
                title="Raw markdown (saved markdown may be normalized by the rich editor — same rendering)"
                className={cn(
                  'rounded-[7px] px-2 py-1 font-app-sans text-[11.5px] font-medium transition-colors',
                  mode === 'markdown' ? 'bg-app-ink text-white' : 'text-app-muted hover:bg-app-hairline'
                )}
              >
                Markdown
              </button>
            </div>
          </div>

          {mode === 'rich' ? (
            <BlogRichTextEditor
              key={richKey}
              initialMarkdown={markdown}
              onChange={setMarkdown}
              tokenId={tokenId}
            />
          ) : (
            <textarea
              data-testid="composer-markdown"
              aria-label="Article markdown"
              className="min-h-[480px] w-full resize-none p-6 font-app-mono text-[12.5px] leading-relaxed text-app-ink focus:outline-none"
              value={markdown}
              placeholder={'# Heading\n\nWrite your article in markdown…'}
              onChange={(e) => setMarkdown(e.target.value)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
