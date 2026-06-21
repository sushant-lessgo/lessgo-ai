'use client'

import { useEffect, useState } from 'react'
import type { Testimonial } from '@prisma/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  testimonial?: Testimonial | null
}

const emptyForm = {
  authorName: '',
  authorRole: '',
  authorCompany: '',
  quote: '',
  authorPhotoUrl: '',
  rating: '',
  status: 'approved',
}

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring'

export default function TestimonialFormDialog({ open, onOpenChange, onSuccess, testimonial }: Props) {
  const isEdit = !!testimonial
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync form state whenever the dialog opens (for add) or the target changes (for edit).
  useEffect(() => {
    if (!open) return
    if (testimonial) {
      setForm({
        authorName: testimonial.authorName ?? '',
        authorRole: testimonial.authorRole ?? '',
        authorCompany: testimonial.authorCompany ?? '',
        quote: testimonial.quote ?? '',
        authorPhotoUrl: testimonial.authorPhotoUrl ?? '',
        rating: testimonial.rating ? String(testimonial.rating) : '',
        status: testimonial.status ?? 'approved',
      })
    } else {
      setForm(emptyForm)
    }
    setError(null)
  }, [open, testimonial])

  const set =
    (key: keyof typeof emptyForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))

  const disabled = submitting || !form.authorName.trim() || !form.quote.trim()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const rating = form.rating ? Number(form.rating) : undefined
      let res: Response

      if (isEdit && testimonial) {
        // PATCH — nullable optionals so cleared fields are removed.
        res = await fetch(`/api/testimonials/${testimonial.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            authorName: form.authorName.trim(),
            quote: form.quote.trim(),
            authorRole: form.authorRole.trim() || null,
            authorCompany: form.authorCompany.trim() || null,
            authorPhotoUrl: form.authorPhotoUrl.trim() || null,
            rating: rating ?? null,
            status: form.status,
          }),
        })
      } else {
        // POST — omit empty optionals (authorPhotoUrl must be a valid URL when present).
        const body: Record<string, unknown> = {
          authorName: form.authorName.trim(),
          quote: form.quote.trim(),
          status: form.status,
        }
        if (form.authorRole.trim()) body.authorRole = form.authorRole.trim()
        if (form.authorCompany.trim()) body.authorCompany = form.authorCompany.trim()
        if (form.authorPhotoUrl.trim()) body.authorPhotoUrl = form.authorPhotoUrl.trim()
        if (rating) body.rating = rating
        res = await fetch('/api/testimonials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        return
      }
      onSuccess()
      onOpenChange(false)
    } catch {
      setError("Couldn't reach the server. Try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit testimonial' : 'Add testimonial'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update this testimonial.' : 'Manually add a testimonial to your library.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="authorName">Name *</Label>
              <Input id="authorName" value={form.authorName} onChange={set('authorName')} placeholder="Jane Doe" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="authorRole">Role</Label>
              <Input id="authorRole" value={form.authorRole} onChange={set('authorRole')} placeholder="Head of Growth" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="authorCompany">Company</Label>
              <Input id="authorCompany" value={form.authorCompany} onChange={set('authorCompany')} placeholder="Acme Inc" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rating">Rating</Label>
              <select id="rating" value={form.rating} onChange={set('rating')} className={selectClass}>
                <option value="">No rating</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} ★
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="quote">Quote *</Label>
            <Textarea id="quote" value={form.quote} onChange={set('quote')} rows={4} placeholder="What did they say?" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="authorPhotoUrl">Photo URL</Label>
            <Input
              id="authorPhotoUrl"
              value={form.authorPhotoUrl}
              onChange={set('authorPhotoUrl')}
              placeholder="https://… (optional)"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <select id="status" value={form.status} onChange={set('status')} className={selectClass}>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              {isEdit && <option value="rejected">Rejected</option>}
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={disabled}>
              {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add testimonial'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
