'use client'

import { useEffect, useState } from 'react'
import { AppIcon } from '@/components/ui/icon'
import { hasReplyableMessage } from '@/lib/leadReply/messageExtraction'

/**
 * DraftReplyPanel — the "Draft reply" affordance in the leads-inbox detail pane
 * (Dashboard S4b). Self-contained: one gated AI call drafts an on-brand, editable
 * reply the founder tweaks and copies to clipboard. Draft + copy only — no send.
 *
 * Gate (renders nothing) when the submission has no replyable message
 * (`hasReplyableMessage` — the SAME shared helper the route enforces, so the UI
 * never offers a draft the server would refuse) or when the feature is killed via
 * `NEXT_PUBLIC_LEAD_REPLY_DISABLED`.
 *
 * `messageExtraction` is the ONLY `@/lib/leadReply/*` module a 'use client' file
 * may import (per that dir's README) — brandGrounding/prompt are server-only.
 */

const UPGRADE_HINT = 'Upgrade or top up to draft replies.'

type Status = 'idle' | 'loading' | 'draft' | 'error' | 'nocredits'

export default function DraftReplyPanel({
  submissionId,
  data,
}: {
  submissionId: string
  data: Record<string, string>
}) {
  const [status, setStatus] = useState<Status>('idle')
  const [reply, setReply] = useState('')
  const [grounding, setGrounding] = useState<'brief' | 'light'>('brief')
  const [errorMsg, setErrorMsg] = useState('')
  const [creditMsg, setCreditMsg] = useState('')
  const [copied, setCopied] = useState(false)

  // Reset to idle whenever a different lead is selected — a stale draft from the
  // previous submission must never leak into another lead's pane.
  useEffect(() => {
    setStatus('idle')
    setReply('')
    setGrounding('brief')
    setErrorMsg('')
    setCreditMsg('')
    setCopied(false)
  }, [submissionId])

  // Gate — no affordance without a real, replyable message, or when killed.
  const disabledEnv = process.env.NEXT_PUBLIC_LEAD_REPLY_DISABLED === 'true'
  if (disabledEnv || !hasReplyableMessage(data)) return null

  async function draft() {
    // Regenerate = drafting while a draft already exists; on failure we keep the
    // existing (possibly founder-edited) draft rather than dropping their edits.
    const hadDraft = status === 'draft'
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch(`/api/leads/${submissionId}/draft-reply`, {
        method: 'POST',
      })
      const body = await res.json().catch(() => ({} as Record<string, unknown>))

      if (res.ok && typeof body?.reply === 'string' && body.reply) {
        setReply(body.reply)
        setGrounding(body.grounding === 'light' ? 'light' : 'brief')
        setStatus('draft')
        return
      }

      if (res.status === 402) {
        const msg =
          (typeof body?.message === 'string' && body.message) ||
          'You are out of credits.'
        setCreditMsg(msg)
        if (hadDraft) {
          // Keep the existing draft; surface the wall inline instead of wiping it.
          setErrorMsg(`${msg} ${UPGRADE_HINT}`)
          setStatus('draft')
        } else {
          setStatus('nocredits')
        }
        return
      }

      // 400 / 404 / 500 / other — inline error, retry allowed. The server charges
      // nothing on a failed draft.
      const msg =
        (typeof body?.message === 'string' && body.message) ||
        'Could not draft a reply. Please try again.'
      setErrorMsg(msg)
      setStatus(hadDraft ? 'draft' : 'error')
    } catch {
      setErrorMsg('Network error — please try again.')
      setStatus(hadDraft ? 'draft' : 'error')
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(reply)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      // Clipboard unavailable (insecure context / denied) — silently ignore.
    }
  }

  return (
    <div className="mt-5 border-t border-app-border pt-4">
      <p className="mb-2 font-app-sans text-[11.5px] font-bold uppercase tracking-[0.4px] text-app-faint">
        Draft reply
      </p>

      {status === 'nocredits' ? (
        <div>
          <button
            type="button"
            disabled
            title={`${creditMsg} ${UPGRADE_HINT}`}
            className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-app-pill bg-app-canvas px-3 py-1.5 font-app-sans text-[11.5px] font-semibold text-app-faint"
          >
            <AppIcon name="auto_awesome" size={15} />
            Draft reply
          </button>
          <p className="mt-2 font-app-sans text-[11.5px] text-app-muted">
            {creditMsg} {UPGRADE_HINT}
          </p>
        </div>
      ) : status === 'draft' ? (
        <div>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={6}
            aria-label="Draft reply"
            className="w-full resize-y rounded-app-panel border border-app-border bg-app-canvas p-3 font-app-sans text-[13px] leading-relaxed text-app-ink focus:border-app-primary focus:outline-none"
          />

          {grounding === 'light' && (
            <p className="mt-1.5 font-app-sans text-[11px] text-app-faint">
              This draft is a little less on-brand — add brand facts to your Brief
              for sharper replies.
            </p>
          )}

          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-app-pill bg-app-primary px-3 py-1.5 font-app-sans text-[11.5px] font-semibold text-app-surface"
            >
              <AppIcon name={copied ? 'check' : 'content_copy'} size={15} />
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={draft}
              className="inline-flex items-center gap-1.5 rounded-app-pill border border-app-border px-3 py-1.5 font-app-sans text-[11.5px] font-semibold text-app-ink hover:bg-app-canvas"
            >
              <AppIcon name="refresh" size={15} />
              Regenerate (1 credit)
            </button>
          </div>

          {errorMsg && (
            <p className="mt-2 font-app-sans text-[11.5px] text-app-danger">
              {errorMsg}
            </p>
          )}
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={draft}
            disabled={status === 'loading'}
            className="inline-flex items-center gap-1.5 rounded-app-pill bg-app-primary px-3 py-1.5 font-app-sans text-[11.5px] font-semibold text-app-surface disabled:cursor-not-allowed disabled:opacity-60"
          >
            <AppIcon
              name={status === 'loading' ? 'progress_activity' : 'auto_awesome'}
              size={15}
              className={status === 'loading' ? 'animate-spin' : undefined}
            />
            {status === 'loading' ? 'Drafting…' : 'Draft reply'}
          </button>

          {status === 'error' && errorMsg && (
            <p className="mt-2 font-app-sans text-[11.5px] text-app-danger">
              {errorMsg} You were not charged.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
