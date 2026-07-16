'use client'

import { useRef, useState } from 'react'
import { AppIcon } from '@/components/ui/icon'
import { useToast } from '@/components/ui/toast'

/**
 * HeroImageField — the post's hero image, behind a deliberately NARROW contract.
 *
 * ⚠️ KNOWN SPEC DEVIATION (plan ruling #7, goes to the founder at GATE A).
 * The spec's acceptance says "hero image via the media picker". That picker lives on the
 * `media-library-picker` branch, which is NOT merged — importing it here is impossible
 * today. So this phase KEEPS the pre-existing `/api/upload-image` flow (lifted verbatim
 * out of `BlogPostEditor`) and merely puts a seam around it. This box must be graded
 * "deviated — approved at Gate A", never silently ticked.
 *
 * 🚨 THE SEAM: the parent knows ONLY `{ value, onChange(url) }` — a URL in, a URL out.
 * Every upload detail (the FormData shape, the endpoint, the hidden file input, the busy
 * state, the error toast) is private to this file. When the picker branch lands, replace
 * this component's INTERNALS and leave `value`/`onChange` alone; `BlogPostEditor` should
 * not need a single line changed. Do not leak upload state back up to the parent — that
 * is exactly what would weld the picker out again.
 *
 * `tokenId` is upload plumbing (`/api/upload-image` scopes the blob to the project), not
 * part of the value contract; the picker will need the same scope, so it stays.
 */

export interface HeroImageFieldProps {
  /** Current hero image URL ('' = none). */
  value: string
  /** Called with the new URL — on manual edit AND after a successful upload. */
  onChange: (url: string) => void
  tokenId: string
  /** Parent-level busy (e.g. a save in flight) — disables the upload trigger. */
  disabled?: boolean
}

const INPUT_CLASS =
  'w-full rounded-app-input border border-app-border-input bg-app-surface px-3 py-2 font-app-sans text-[12.5px] text-app-ink placeholder:text-app-placeholder focus:border-app-primary focus:outline-none focus:ring-2 focus:ring-app-tint disabled:bg-app-hairline disabled:text-app-muted'

export default function HeroImageField({ value, onChange, tokenId, disabled }: HeroImageFieldProps) {
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  // Unchanged from the pre-reskin BlogPostEditor.uploadHero — same endpoint, same
  // FormData fields, same success condition (`res.ok && data.url`).
  const upload = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('tokenId', tokenId)
      const res = await fetch('/api/upload-image', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.url) throw new Error(data?.error || 'Upload failed')
      onChange(data.url)
      toast('Image uploaded.', { variant: 'success' })
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Upload failed', { variant: 'error' })
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div>
      <label className="mb-1.5 block font-app-sans text-[11.5px] font-semibold text-app-label">
        Hero image
      </label>

      {value ? (
        <div className="mb-2 overflow-hidden rounded-app-panel border border-app-border">
          {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary user/blob URL, not a known-remote next/image loader */}
          <img src={value} alt="" className="h-[104px] w-full object-cover" />
        </div>
      ) : null}

      <div className="flex gap-2">
        <input
          className={INPUT_CLASS}
          value={value}
          placeholder="https://…"
          aria-label="Hero image URL"
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={disabled || uploading}
          className="inline-flex shrink-0 items-center gap-1 rounded-app-ctl border border-app-border-input bg-app-surface px-2.5 py-2 font-app-sans text-[12px] font-medium text-app-slate transition-colors hover:bg-app-hairline disabled:opacity-50"
        >
          <AppIcon name="upload" size={15} />
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
      </div>
    </div>
  )
}
