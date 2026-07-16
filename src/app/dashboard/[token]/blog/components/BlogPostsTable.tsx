'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

/**
 * Blog posts table — moved from `dashboard/blog/[slug]/components/` with its page.
 *
 * 🚨 C1 — the row/Edit links target `/dashboard/{tokenId}/blog/{postId}`, NOT the old
 * `/dashboard/blog/{slug}/{postId}` (that URL is now a redirect shim: an in-tab link
 * must never bounce through one). The page's `slug` prop existed ONLY to build those two
 * old URLs, so it is dropped here (the `/blog/{post.slug}` sub-line uses the POST's own
 * slug, a different field).
 */

interface PostRow {
  id: string
  slug: string
  title: string
  status: string
  publishedAt: string | null
  updatedAt: string
}

export default function BlogPostsTable({
  posts,
  tokenId,
}: {
  posts: PostRow[]
  tokenId: string
}) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)

  const act = async (post: PostRow, action: 'publish' | 'unpublish' | 'delete') => {
    if (action === 'unpublish' && !window.confirm(`Take "${post.title}" offline?`)) return
    if (action === 'delete' && !window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return
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
      router.refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : `${action} failed`)
    } finally {
      setBusyId(null)
    }
  }

  if (posts.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
        <p className="text-sm text-gray-500">
          Write your first article — it goes live at /blog/&lt;slug&gt; the moment you publish it.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/50 text-left text-gray-500">
            <th className="px-5 py-3 font-medium">Title</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Published</th>
            <th className="px-5 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id} className="border-b border-gray-100 last:border-0">
              <td className="px-5 py-3">
                <Link href={`/dashboard/${tokenId}/blog/${post.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                  {post.title}
                </Link>
                <div className="text-xs text-gray-400">/blog/{post.slug}</div>
              </td>
              <td className="px-5 py-3">
                <span
                  className={
                    post.status === 'published'
                      ? 'inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'
                      : 'inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600'
                  }
                >
                  {post.status}
                </span>
              </td>
              <td className="px-5 py-3 text-gray-500">
                {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : '—'}
              </td>
              <td className="px-5 py-3 text-right space-x-3 whitespace-nowrap">
                <Link href={`/dashboard/${tokenId}/blog/${post.id}`} className="text-gray-600 hover:text-gray-900">
                  Edit
                </Link>
                {post.status === 'published' ? (
                  <button
                    onClick={() => act(post, 'unpublish')}
                    disabled={busyId === post.id}
                    className="text-amber-700 hover:text-amber-900 disabled:opacity-50"
                  >
                    Unpublish
                  </button>
                ) : (
                  <button
                    onClick={() => act(post, 'publish')}
                    disabled={busyId === post.id}
                    className="text-green-700 hover:text-green-900 disabled:opacity-50"
                  >
                    Publish
                  </button>
                )}
                <button
                  onClick={() => act(post, 'delete')}
                  disabled={busyId === post.id}
                  className="text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
