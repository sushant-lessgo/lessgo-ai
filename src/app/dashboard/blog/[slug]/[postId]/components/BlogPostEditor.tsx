'use client'

// Blog (Phase 1) post editor: metadata fields + markdown textarea with live
// ReactMarkdown preview (modeled on PrivacyPolicyEditor). Manual save; publish/
// unpublish hit the per-post pipeline. Hero upload reuses /api/upload-image.
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { publishedSubdomainHost } from '@/lib/domains/hosts'

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

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export default function BlogPostEditor({
  tokenId,
  slug,
  post,
}: {
  tokenId: string
  slug: string
  post: EditorPost
}) {
  const router = useRouter()
  const [title, setTitle] = useState(post.title)
  const [postSlug, setPostSlug] = useState(post.slug)
  const [excerpt, setExcerpt] = useState(post.excerpt)
  const [heroImage, setHeroImage] = useState(post.heroImage)
  const [markdown, setMarkdown] = useState(post.markdown)
  const [seoTitle, setSeoTitle] = useState(post.seo.title ?? '')
  const [seoDescription, setSeoDescription] = useState(post.seo.description ?? '')
  const [status, setStatus] = useState(post.status)
  const [busy, setBusy] = useState<null | 'save' | 'publish' | 'unpublish' | 'upload'>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [showSeo, setShowSeo] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const flash = (msg: string) => {
    setNotice(msg)
    setTimeout(() => setNotice(null), 3500)
  }

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
      flash('Saved')
      return true
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Save failed')
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
      flash('Published')
      router.refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Publish failed')
    } finally {
      setBusy(null)
    }
  }

  const unpublish = async () => {
    if (!window.confirm('Take this post offline?')) return
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
      flash('Unpublished')
      router.refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Unpublish failed')
    } finally {
      setBusy(null)
    }
  }

  const uploadHero = async (file: File) => {
    setBusy('upload')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('tokenId', tokenId)
      const res = await fetch('/api/upload-image', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.url) throw new Error(data?.error || 'Upload failed')
      setHeroImage(data.url)
      flash('Image uploaded')
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setBusy(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const liveUrl = `https://${publishedSubdomainHost(slug)}/blog/${postSlug}`
  const input =
    'w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent'

  return (
    <div>
      {/* Action bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">Edit post</h1>
          <span
            className={
              status === 'published'
                ? 'inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'
                : 'inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600'
            }
          >
            {status}
          </span>
          {notice && <span className="text-sm text-green-700">{notice}</span>}
        </div>
        <div className="space-x-2">
          <button
            onClick={save}
            disabled={busy !== null}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            {busy === 'save' ? 'Saving…' : 'Save'}
          </button>
          {status === 'published' && (
            <button
              onClick={unpublish}
              disabled={busy !== null}
              className="px-4 py-2 text-sm rounded-lg border border-amber-300 text-amber-800 bg-white hover:bg-amber-50 disabled:opacity-50"
            >
              {busy === 'unpublish' ? 'Unpublishing…' : 'Unpublish'}
            </button>
          )}
          <button
            onClick={publish}
            disabled={busy !== null}
            className="px-4 py-2 text-sm rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {busy === 'publish' ? 'Publishing…' : status === 'published' ? 'Republish' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            className={input}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              if (!post.slugLocked && (postSlug === '' || postSlug === slugify(title))) {
                setPostSlug(slugify(e.target.value))
              }
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Slug {post.slugLocked && <span className="text-gray-400 font-normal">(locked after first publish)</span>}
          </label>
          <input
            className={`${input} ${post.slugLocked ? 'bg-gray-100 text-gray-500' : ''}`}
            value={postSlug}
            disabled={post.slugLocked}
            onChange={(e) => setPostSlug(slugify(e.target.value))}
          />
          {status === 'published' && (
            <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-blue-600">
              {liveUrl} ↗
            </a>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hero image</label>
          <div className="flex gap-2">
            <input
              className={input}
              value={heroImage}
              placeholder="https://…"
              onChange={(e) => setHeroImage(e.target.value)}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy !== null}
              className="px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50 whitespace-nowrap disabled:opacity-50"
            >
              {busy === 'upload' ? 'Uploading…' : 'Upload'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadHero(e.target.files[0])}
            />
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
          <textarea
            className={input}
            rows={2}
            maxLength={300}
            value={excerpt}
            placeholder="Short summary shown on the blog index and in search results"
            onChange={(e) => setExcerpt(e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <button onClick={() => setShowSeo(!showSeo)} className="text-sm text-gray-500 hover:text-gray-900">
            {showSeo ? '▾' : '▸'} SEO overrides
          </button>
          {showSeo && (
            <div className="grid gap-4 md:grid-cols-2 mt-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SEO title</label>
                <input className={input} maxLength={70} value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SEO description</label>
                <input
                  className={input}
                  maxLength={200}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Markdown editor + live preview */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/50 text-xs font-medium text-gray-500">
            MARKDOWN
          </div>
          <textarea
            className="flex-1 w-full p-4 font-mono text-sm leading-relaxed resize-none focus:outline-none min-h-[480px]"
            value={markdown}
            placeholder={'# Heading\n\nWrite your article in markdown…'}
            onChange={(e) => setMarkdown(e.target.value)}
          />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/50 text-xs font-medium text-gray-500">
            PREVIEW
          </div>
          <div className="p-6 prose prose-sm max-w-none min-h-[480px] overflow-auto [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_a]:text-blue-600 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-gray-300 [&_blockquote]:pl-3 [&_blockquote]:text-gray-600 [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-gray-100 [&_pre]:p-3 [&_pre]:rounded [&_pre]:overflow-auto [&_img]:max-w-full [&_img]:rounded">
            <ReactMarkdown>{markdown || '*Nothing to preview yet.*'}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}
