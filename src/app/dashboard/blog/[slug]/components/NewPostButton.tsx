'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewPostButton({ tokenId, slug }: { tokenId: string; slug: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const create = async () => {
    const title = window.prompt('Post title?')
    if (!title?.trim()) return
    setBusy(true)
    try {
      const res = await fetch('/api/blog/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId, title: title.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to create post')
      router.push(`/dashboard/blog/${slug}/${data.post.id}`)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to create post')
      setBusy(false)
    }
  }

  return (
    <button
      onClick={create}
      disabled={busy}
      className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
    >
      {busy ? 'Creating…' : '+ New post'}
    </button>
  )
}
