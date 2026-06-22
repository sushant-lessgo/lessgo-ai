'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring'

export default function CollectFormClient({ collectToken }: { collectToken: string }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [photoName, setPhotoName] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const fd = new FormData(e.currentTarget)
      fd.set('collectToken', collectToken)
      const res = await fetch('/api/testimonials/collect', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }
      setDone(true)
    } catch {
      setError("Couldn't reach the server. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Thank you! 🎉</h2>
        <p className="text-sm text-gray-500">Your testimonial has been submitted for review.</p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      {/* Honeypot: hidden from people, bots fill it → server drops the submission. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

      <div className="space-y-1.5">
        <Label htmlFor="authorName">Your name *</Label>
        <Input id="authorName" name="authorName" required maxLength={120} placeholder="Jane Doe" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="authorRole">Role</Label>
          <Input id="authorRole" name="authorRole" maxLength={120} placeholder="Founder" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="authorCompany">Company</Label>
          <Input id="authorCompany" name="authorCompany" maxLength={120} placeholder="Acme Inc" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="quote">Your testimonial *</Label>
        <Textarea id="quote" name="quote" required rows={5} maxLength={2000} placeholder="What was your experience?" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="rating">Rating</Label>
          <select id="rating" name="rating" className={selectClass} defaultValue="">
            <option value="">No rating</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} ★
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="photo">Photo</Label>
          <input
            id="photo"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => setPhotoName(e.target.files?.[0]?.name ?? null)}
            className="block w-full text-sm text-gray-500 file:mr-3 file:rounded-md file:border-0 file:bg-gray-900 file:px-3 file:py-1.5 file:text-white file:text-sm hover:file:bg-gray-800"
          />
          {photoName && <p className="text-xs text-gray-400 truncate">{photoName}</p>}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Submitting…' : 'Submit testimonial'}
      </Button>
    </form>
  )
}
