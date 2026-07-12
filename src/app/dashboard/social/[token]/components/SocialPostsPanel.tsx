'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ACTIVE_PLATFORMS, PLATFORM_PRESETS } from '@/modules/social/presets'
import { ARCHETYPE_INSTRUCTIONS } from '@/modules/social/postEngine'
import type { Platform, Archetype, Mode } from '@/modules/social/types'

// Signal PostLibrary (a sibling client component) to refetch after a generate.
// Both live under a server-component page, so a window event is the simplest
// cross-component refresh without inventing a shared client parent.
export const SOCIAL_POST_CREATED_EVENT = 'social:post-created'

// Platform picker is derived ENTIRELY from data — ACTIVE_PLATFORMS + the preset
// labels. Phase 6 activates X/Facebook by editing ACTIVE_PLATFORMS alone; this
// file needs ZERO changes. Never hardcode a platform name here.
const PLATFORM_OPTIONS: { value: Platform; label: string }[] = ACTIVE_PLATFORMS.map((p) => ({
  value: p,
  label: PLATFORM_PRESETS[p].label,
}))

// Archetype list is derived from the engine's instruction map — not retyped.
function titleCase(key: string): string {
  return key
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
const ARCHETYPE_OPTIONS: { value: Archetype; label: string }[] = (
  Object.keys(ARCHETYPE_INSTRUCTIONS) as Archetype[]
).map((a) => ({ value: a, label: titleCase(a) }))

const MODE_OPTIONS: { value: Mode; label: string; hint: string }[] = [
  { value: 'archetype', label: 'From brand', hint: 'Generate purely from this project’s brand data.' },
  { value: 'archetype_context', label: 'With context', hint: 'Add your own fresh angle or news to steer the post.' },
  { value: 'polish', label: 'Polish draft', hint: 'Paste a rough draft; keep your brand voice, tighten it.' },
]

const ERROR_MESSAGES: Record<string, string> = {
  validation_error: 'Please fill in the required fields before generating.',
  platform_inactive: 'That platform isn’t available yet.',
  generation_failed: 'The generator had trouble. Please try again in a moment.',
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
  return 'Failed to generate. Please try again.'
}

interface GeneratedPost {
  platform: string
  archetype: string | null
  mode: string
  content: string
}

// Which tiers get a lifetime cap (blocking upgrade wall) vs a monthly soft cap
// (quiet inline note). FREE is the only lifetime tier — mirrors gating.getSocialPostWindow.
interface LimitState {
  tier: string
  window?: string
}

export default function SocialPostsPanel({ tokenId }: { tokenId: string }) {
  const router = useRouter()
  const [platform, setPlatform] = useState<Platform>(PLATFORM_OPTIONS[0]?.value ?? 'linkedin')
  const [mode, setMode] = useState<Mode>('archetype')
  const [archetype, setArchetype] = useState<Archetype>(ARCHETYPE_OPTIONS[0]?.value ?? 'inspirational')
  const [freshContext, setFreshContext] = useState('')
  const [draft, setDraft] = useState('')

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [limitHit, setLimitHit] = useState<LimitState | null>(null)
  const [result, setResult] = useState<GeneratedPost | null>(null)
  const [persisted, setPersisted] = useState(true)
  const [copied, setCopied] = useState(false)

  const generate = async () => {
    setBusy(true)
    setError(null)
    setLimitHit(null)
    setResult(null)
    setCopied(false)
    try {
      const payload: Record<string, unknown> = { platform, mode }
      if (mode !== 'polish') payload.archetype = archetype
      if (mode === 'archetype_context') payload.freshContext = freshContext.trim()
      if (mode === 'polish') payload.draft = draft.trim()

      const res = await fetch(`/api/social/${encodeURIComponent(tokenId)}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => null)
      if (data?.error === 'limit_reached') {
        // Upgrade wall (Free lifetime cap) or quiet soft-cap note (paid monthly cap).
        setLimitHit({ tier: String(data.tier ?? ''), window: data.window })
        return
      }
      if (!res.ok || !data?.success) {
        setError(readableError(res.status, data))
        return
      }
      setResult(data.post)
      setPersisted(data.persisted !== false)
      if (data.persisted !== false) {
        // Tell the library to refetch (server persisted a new row).
        window.dispatchEvent(new CustomEvent(SOCIAL_POST_CREATED_EVENT))
      }
    } catch {
      setError('Couldn’t reach the server. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const copy = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Copy failed — select the text and copy manually.')
    }
  }

  const activeMode = MODE_OPTIONS.find((m) => m.value === mode)

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate a post</h2>

      {/* Platform picker — derived from ACTIVE_PLATFORMS */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Platform</label>
        <div className="flex flex-wrap gap-2">
          {PLATFORM_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPlatform(opt.value)}
              className={`px-3 py-1.5 text-sm rounded-md border transition ${
                platform === opt.value
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mode tabs */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Mode</label>
        <div className="flex flex-wrap gap-2">
          {MODE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMode(opt.value)}
              className={`px-3 py-1.5 text-sm rounded-md border transition ${
                mode === opt.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {activeMode && <p className="mt-1.5 text-xs text-gray-500">{activeMode.hint}</p>}
      </div>

      {/* Archetype select — hidden in polish mode */}
      {mode !== 'polish' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Angle</label>
          <select
            value={archetype}
            onChange={(e) => setArchetype(e.target.value as Archetype)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {ARCHETYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Fresh-context box — only in archetype_context mode */}
      {mode === 'archetype_context' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Your context</label>
          <textarea
            value={freshContext}
            onChange={(e) => setFreshContext(e.target.value)}
            rows={3}
            placeholder="A recent win, announcement, or angle you want the post to reflect…"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Draft textarea — only in polish mode */}
      {mode === 'polish' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Your draft</label>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
            placeholder="Paste the rough draft you want polished…"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}

      <button
        onClick={generate}
        disabled={busy}
        className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
      >
        {busy ? 'Generating…' : 'Generate post'}
      </button>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {limitHit && (
        limitHit.window === 'monthly' ? (
          // Paid soft cap — quiet, informational; invisible until hit (per spec).
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            You’ve reached this month’s social-post limit. It resets at the start of next month.
          </div>
        ) : (
          // Free lifetime cap — blocking upgrade wall (local component; billing
          // components are NOT edited). Visual idiom follows OutOfCreditsModal.
          <div className="mt-4 rounded-lg border-2 border-blue-500 bg-blue-50 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-1">You’ve used all your free posts</h3>
            <p className="text-sm text-gray-600 mb-4">
              The free plan includes a limited number of social posts. Upgrade to Pro to keep
              generating on-brand posts for your projects.
            </p>
            <button
              type="button"
              onClick={() => router.push('/pricing')}
              className="w-full bg-blue-500 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-600 transition-colors"
            >
              Upgrade to Pro
            </button>
          </div>
        )
      )}

      {result && (
        <div className="mt-5 rounded-md border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">
              {PLATFORM_PRESETS[result.platform as Platform]?.label ?? result.platform}
              {result.archetype ? ` · ${titleCase(result.archetype)}` : ''}
            </span>
            <button
              onClick={copy}
              className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-700 hover:bg-white transition"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="whitespace-pre-wrap text-sm text-gray-900">{result.content}</p>
          {!persisted && (
            <p className="mt-2 text-xs text-gray-500">
              Demo preview — this post was not saved to your library.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
