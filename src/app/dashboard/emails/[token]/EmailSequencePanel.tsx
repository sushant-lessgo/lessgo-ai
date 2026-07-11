'use client'

import { useCallback, useEffect, useState } from 'react'

// SINGLE client component for the whole rail. Unlike the social-posts pattern
// (Generator + Library split coordinated by a `window` CustomEvent), a project has
// exactly ONE email sequence — generate/regenerate mutate that same object in place,
// so there is no cross-component refresh to coordinate. One component, one piece of
// state; no split, no window event.

interface EmailCard {
  position: number
  key: string
  subject: string
  body: string
  timingLabel: string
  purpose: string
}

interface Sequence {
  id: string
  intent: string
  archetype: string
  createdAt?: string
  updatedAt?: string
  emails: EmailCard[]
}

const ERROR_MESSAGES: Record<string, string> = {
  not_available: 'Email sequences aren’t available for this project’s goal.',
  generation_failed: 'The generator had trouble. Please try again in a moment.',
  internal_error: 'Something went wrong. Please try again.',
  not_found: 'This project could not be found.',
  invalid_position: 'That email could not be regenerated. Please try again.',
  Unauthorized: 'You need to sign in again.',
  'Project not found': 'This project could not be found.',
  'Sequence not found': 'No sequence to update — generate one first.',
}

function readableError(status: number, data: { error?: string; message?: string } | null): string {
  const code = data?.error
  if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code]
  if (status === 401 || status === 403) return 'You don’t have access to this project.'
  if (status === 404) return 'This project could not be found.'
  if (status === 429) return 'Too many requests — please wait a moment and try again.'
  if (data?.message) return data.message
  if (code) return code
  return 'Something went wrong. Please try again.'
}

export default function EmailSequencePanel({ token }: { token: string }) {
  const [sequence, setSequence] = useState<Sequence | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [regenPosition, setRegenPosition] = useState<number | null>(null)
  const [copiedPosition, setCopiedPosition] = useState<number | null>(null)

  // GET the current sequence on mount.
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/email-sequences/${encodeURIComponent(token)}`)
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.success) {
        setError(readableError(res.status, data))
        return
      }
      setSequence(data.sequence ?? null)
    } catch {
      setError('Couldn’t reach the server. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  // Generate the whole sequence (also used as "Regenerate all" once one exists).
  const generateAll = async () => {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch(`/api/email-sequences/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.success) {
        setError(readableError(res.status, data))
        return
      }
      setSequence(data.sequence ?? null)
    } catch {
      setError('Couldn’t reach the server. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  // Regenerate ONE email in place — splice the returned card back at its position.
  const regenerate = async (position: number) => {
    setRegenPosition(position)
    setError(null)
    try {
      const res = await fetch(`/api/email-sequences/${encodeURIComponent(token)}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.success) {
        setError(readableError(res.status, data))
        return
      }
      const next: EmailCard | undefined = data.sequence?.emails?.find(
        (e: EmailCard) => e.position === position,
      )
      if (next) {
        setSequence((prev) =>
          prev
            ? { ...prev, emails: prev.emails.map((e) => (e.position === position ? next : e)) }
            : prev,
        )
      }
    } catch {
      setError('Couldn’t reach the server. Please try again.')
    } finally {
      setRegenPosition(null)
    }
  }

  const remove = async () => {
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/email-sequences/${encodeURIComponent(token)}`, {
        method: 'DELETE',
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.success) {
        setError(readableError(res.status, data))
        return
      }
      setSequence(null)
    } catch {
      setError('Couldn’t reach the server. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  const copy = async (email: EmailCard) => {
    try {
      await navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}`)
      setCopiedPosition(email.position)
      setTimeout(() => setCopiedPosition((p) => (p === email.position ? null : p)), 2000)
    } catch {
      setError('Copy failed — select the text and copy manually.')
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Loading…</p>
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Top action bar: Generate (none yet) / Regenerate all + Delete (exists). */}
      <div className="mb-6 flex items-center gap-2">
        <button
          onClick={generateAll}
          disabled={generating || deleting}
          className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
        >
          {generating
            ? 'Generating…'
            : sequence
            ? 'Regenerate all'
            : 'Generate sequence'}
        </button>
        {sequence && (
          <button
            onClick={remove}
            disabled={generating || deleting}
            className="inline-flex items-center px-4 py-2 border border-red-200 text-red-600 text-sm rounded-lg hover:bg-red-50 transition disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete sequence'}
          </button>
        )}
      </div>

      {/* Clean empty state — no sequence generated yet. */}
      {!sequence && !generating && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-base font-medium text-gray-900 mb-1">No sequence yet</p>
          <p className="text-sm text-gray-500">
            Generate a goal-matched email sequence from this project&apos;s data. Each email is
            copy-only — paste it into Calendly Workflows or your ESP.
          </p>
        </div>
      )}

      {/* Per-email cards: position + static timing label + subject + body + actions. */}
      {sequence && (
        <ul className="space-y-4">
          {sequence.emails.map((email) => (
            <li key={email.position} className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                      Email {email.position + 1}
                    </span>
                    {email.timingLabel && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                        {email.timingLabel}
                      </span>
                    )}
                  </div>
                  {email.purpose && <p className="text-xs text-gray-400">{email.purpose}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => copy(email)}
                    className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                  >
                    {copiedPosition === email.position ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={() => regenerate(email.position)}
                    disabled={regenPosition !== null || generating || deleting}
                    className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    {regenPosition === email.position ? 'Regenerating…' : 'Regenerate'}
                  </button>
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-1">{email.subject}</p>
              <p className="whitespace-pre-wrap text-sm text-gray-800">{email.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
