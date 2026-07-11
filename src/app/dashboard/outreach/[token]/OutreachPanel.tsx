'use client'

import { useCallback, useEffect, useState } from 'react'
import { ALL_PLATFORMS, getPlatformDef } from '@/modules/outreach/platforms'

// SINGLE client component for the whole cold-outreach rail (clones EmailSequencePanel).
// Three stacked sections: intake (single upserted row) → prospect input + Generate →
// message library. Unlike the email rail's one-sequence model, generate APPENDS rows
// (a per-prospect library like social-posts) — but it's still one component, one state:
// generate/regenerate/delete mutate the `messages` array in place.

interface OutreachMessage {
  id: string
  platform: string
  kind: string
  groundingLevel: string
  prospectLabel: string | null
  subject: string | null
  body: string
  createdAt?: string
}

const ERROR_MESSAGES: Record<string, string> = {
  not_found: 'This project could not be found.',
  intake_required: 'Save your outreach intake first, then generate.',
  generation_failed: 'The generator had trouble. Please try again in a moment.',
  platform_not_available: 'That platform isn’t available yet.',
  insufficient_credits: 'You’re out of credits for scraping this prospect.',
  validation_error: 'Please check your inputs and try again.',
  internal_error: 'Something went wrong. Please try again.',
  Unauthorized: 'You need to sign in again.',
  'Project not found': 'This project could not be found.',
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

const GENERIC_NOTICE =
  'Generic — add prospect info (URL or pasted text) for a message that references their business.'

export default function OutreachPanel({ token }: { token: string }) {
  // Intake form state.
  const [targetDescriptor, setTargetDescriptor] = useState('')
  const [platforms, setPlatforms] = useState<string[]>(['cold_email', 'linkedin_note'])
  const [openerContext, setOpenerContext] = useState('')
  const [savingIntake, setSavingIntake] = useState(false)
  const [intakeSaved, setIntakeSaved] = useState(false)

  // Prospect input state.
  const [prospectMode, setProspectMode] = useState<'url' | 'text'>('url')
  const [prospectUrl, setProspectUrl] = useState('')
  const [prospectText, setProspectText] = useState('')
  const [includeBump, setIncludeBump] = useState(false)

  // Library + lifecycle state.
  const [messages, setMessages] = useState<OutreachMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [batchGeneric, setBatchGeneric] = useState(false)
  const [regenId, setRegenId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Load intake (prefill) + existing message library on mount.
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [intakeRes, libRes] = await Promise.all([
        fetch(`/api/outreach/${encodeURIComponent(token)}/intake`),
        fetch(`/api/outreach/${encodeURIComponent(token)}`),
      ])
      const intakeData = await intakeRes.json().catch(() => null)
      const libData = await libRes.json().catch(() => null)

      if (intakeRes.ok && intakeData?.success) {
        if (intakeData.intake) {
          setTargetDescriptor(intakeData.intake.targetDescriptor ?? '')
          if (Array.isArray(intakeData.intake.platforms) && intakeData.intake.platforms.length) {
            setPlatforms(intakeData.intake.platforms)
          }
          setOpenerContext(intakeData.intake.openerContext ?? '')
          setIntakeSaved(true)
        } else if (intakeData.prefill?.targetDescriptor) {
          setTargetDescriptor(intakeData.prefill.targetDescriptor)
        }
      }

      if (libRes.ok && libData?.success && Array.isArray(libData.messages)) {
        setMessages(libData.messages)
      }
    } catch {
      setError('Couldn’t reach the server. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  const togglePlatform = (id: string) => {
    setIntakeSaved(false)
    setPlatforms((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

  const saveIntake = async () => {
    setSavingIntake(true)
    setError(null)
    try {
      const res = await fetch(`/api/outreach/${encodeURIComponent(token)}/intake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetDescriptor,
          platforms,
          openerContext: openerContext.trim() || undefined,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.success) {
        setError(readableError(res.status, data))
        return
      }
      setIntakeSaved(true)
    } catch {
      setError('Couldn’t reach the server. Please try again.')
    } finally {
      setSavingIntake(false)
    }
  }

  const generate = async () => {
    setGenerating(true)
    setError(null)
    try {
      const body: { platforms: string[]; prospectUrl?: string; prospectText?: string; includeBump?: boolean } = { platforms }
      if (prospectMode === 'url' && prospectUrl.trim()) body.prospectUrl = prospectUrl.trim()
      if (prospectMode === 'text' && prospectText.trim()) body.prospectText = prospectText.trim()
      if (includeBump) body.includeBump = true

      const res = await fetch(`/api/outreach/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.success) {
        setError(readableError(res.status, data))
        return
      }
      const fresh: OutreachMessage[] = Array.isArray(data.messages) ? data.messages : []
      // Newest first — prepend the fresh batch to the library.
      setMessages((prev) => [...fresh, ...prev])
      setBatchGeneric(data.groundingLevel === 'generic' || Boolean(data.groundingWarning))
    } catch {
      setError('Couldn’t reach the server. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const regenerate = async (messageId: string) => {
    setRegenId(messageId)
    setError(null)
    try {
      const res = await fetch(`/api/outreach/${encodeURIComponent(token)}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.success) {
        setError(readableError(res.status, data))
        return
      }
      const next: OutreachMessage | undefined = data.message
      if (next) {
        setMessages((prev) => prev.map((m) => (m.id === messageId ? next : m)))
      }
    } catch {
      setError('Couldn’t reach the server. Please try again.')
    } finally {
      setRegenId(null)
    }
  }

  const remove = async (messageId: string) => {
    setDeleteId(messageId)
    setError(null)
    try {
      const res = await fetch(`/api/outreach/${encodeURIComponent(token)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.success) {
        setError(readableError(res.status, data))
        return
      }
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
    } catch {
      setError('Couldn’t reach the server. Please try again.')
    } finally {
      setDeleteId(null)
    }
  }

  const copy = async (message: OutreachMessage) => {
    const def = getPlatformDef(message.platform)
    const text =
      def?.hasSubject && message.subject
        ? `Subject: ${message.subject}\n\n${message.body}`
        : message.body
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(message.id)
      setTimeout(() => setCopiedId((c) => (c === message.id ? null : c)), 2000)
    } catch {
      setError('Copy failed — select the text and copy manually.')
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Loading…</p>
  }

  const busy = generating || savingIntake || regenId !== null || deleteId !== null

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ---- Intake ---- */}
      <section className="mb-6 rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Who you&apos;re reaching</h2>

        <label className="block text-xs font-medium text-gray-600 mb-1">Target audience</label>
        <input
          type="text"
          value={targetDescriptor}
          onChange={(e) => {
            setTargetDescriptor(e.target.value)
            setIntakeSaved(false)
          }}
          placeholder="e.g. B2B SaaS founders with 5–20 employees"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none mb-3"
        />

        <label className="block text-xs font-medium text-gray-600 mb-1">Channels</label>
        <div className="flex flex-wrap gap-3 mb-3">
          {ALL_PLATFORMS.map((def) => (
            <label key={def.id} className="flex items-center gap-2 text-sm text-gray-800">
              <input
                type="checkbox"
                checked={platforms.includes(def.id)}
                onChange={() => togglePlatform(def.id)}
                className="rounded border-gray-300"
              />
              {def.label}
            </label>
          ))}
        </div>

        <label className="block text-xs font-medium text-gray-600 mb-1">
          Opener context <span className="text-gray-400">(optional)</span>
        </label>
        <textarea
          value={openerContext}
          onChange={(e) => {
            setOpenerContext(e.target.value)
            setIntakeSaved(false)
          }}
          rows={2}
          placeholder="Anything to steer the opener — a shared connection, an angle, a recent event…"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none mb-3"
        />

        <div className="flex items-center gap-3">
          <button
            onClick={saveIntake}
            disabled={busy || !targetDescriptor.trim() || platforms.length === 0}
            className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
          >
            {savingIntake ? 'Saving…' : 'Save intake'}
          </button>
          {intakeSaved && <span className="text-xs text-green-600">Saved</span>}
        </div>
      </section>

      {/* ---- Prospect input + Generate ---- */}
      <section className="mb-6 rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">The prospect</h2>

        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setProspectMode('url')}
            className={`text-sm px-3 py-1 rounded-md border transition ${
              prospectMode === 'url'
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Website URL
          </button>
          <button
            onClick={() => setProspectMode('text')}
            className={`text-sm px-3 py-1 rounded-md border transition ${
              prospectMode === 'text'
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Paste text
          </button>
        </div>

        {prospectMode === 'url' ? (
          <>
            <input
              type="url"
              value={prospectUrl}
              onChange={(e) => setProspectUrl(e.target.value)}
              placeholder="https://prospect-company.com"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-400">
              We&apos;ll scrape this page to reference their business. Leave blank for a generic message.
            </p>
          </>
        ) : (
          <>
            <textarea
              value={prospectText}
              onChange={(e) => setProspectText(e.target.value)}
              rows={4}
              placeholder="Paste the prospect's About text, bio, or homepage copy here…"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-400">
              For LinkedIn, paste their About section — we never fetch LinkedIn.
            </p>
          </>
        )}

        <label className="mt-4 flex items-center gap-2 text-sm text-gray-800">
          <input
            type="checkbox"
            checked={includeBump}
            onChange={(e) => setIncludeBump(e.target.checked)}
            className="rounded border-gray-300"
          />
          Include follow-up bump
          <span className="text-xs text-gray-400">(one gentle follow-up per channel)</span>
        </label>

        <div className="mt-4">
          <button
            onClick={generate}
            disabled={busy || platforms.length === 0}
            className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
          >
            {generating ? 'Generating…' : 'Generate messages'}
          </button>
        </div>
      </section>

      {/* Batch-level generic notice (last generate produced generic copy). */}
      {batchGeneric && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {GENERIC_NOTICE}
        </div>
      )}

      {/* ---- Message library ---- */}
      {messages.length === 0 && !generating ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-base font-medium text-gray-900 mb-1">No messages yet</p>
          <p className="text-sm text-gray-500">
            Save your intake, add a prospect above, and generate platform-correct outreach copy.
            Each message is copy-only — paste it into your email tool or LinkedIn.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {messages.map((message) => {
            const def = getPlatformDef(message.platform)
            const label = def?.label ?? message.platform
            const showSubject = def?.hasSubject && message.subject
            const isGeneric = message.groundingLevel === 'generic'
            return (
              <li key={message.id} className="rounded-lg border border-gray-200 bg-white p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                        {label}
                      </span>
                      {message.kind === 'bump' && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-purple-50 text-purple-700">
                          Follow-up
                        </span>
                      )}
                      {message.prospectLabel && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                          {message.prospectLabel}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => copy(message)}
                      className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                    >
                      {copiedId === message.id ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={() => regenerate(message.id)}
                      disabled={busy}
                      className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                    >
                      {regenId === message.id ? 'Regenerating…' : 'Regenerate'}
                    </button>
                    <button
                      onClick={() => remove(message.id)}
                      disabled={busy}
                      className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                    >
                      {deleteId === message.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>

                {isGeneric && (
                  <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    {GENERIC_NOTICE}
                  </div>
                )}

                {showSubject && (
                  <p className="text-sm font-semibold text-gray-900 mb-1">{message.subject}</p>
                )}
                <p className="whitespace-pre-wrap text-sm text-gray-800">{message.body}</p>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
