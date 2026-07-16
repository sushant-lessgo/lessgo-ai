'use client'

import { useState } from 'react'
import { AppIcon } from '@/components/ui/icon'

/**
 * LeadsInbox — master-detail client shell for `/dashboard/leads`.
 *
 * Built fresh on `app-*` tokens ONLY (R-D). `FormSubmissionsTable` and the per-site
 * `[token]/analytics/components/*` are stock-Tailwind and deliberately NOT reused —
 * stock color/font keys feed template rendering and must stay off app chrome.
 *
 * READ-ONLY: no reply UI, no status/assignment (S4b / scope OUT).
 *
 * Props are plain serialized objects from the server page (ISO date strings, never
 * Date objects or Prisma models).
 */

export interface InboxLead {
  id: string
  formId: string
  formName: string
  /** ISO 8601 — serialized on the server for RSC transport. */
  createdAt: string
  siteTitle: string
  siteSlug: string
  data: Record<string, string>
}

/** Priority order for the one-line lead preview in the master list. */
const PREVIEW_KEYS = ['email', 'name', 'phone']

function previewOf(lead: InboxLead): string {
  const entries = Object.entries(lead.data)
  for (const key of PREVIEW_KEYS) {
    const hit = entries.find(([k]) => k.toLowerCase().includes(key))
    if (hit && hit[1].trim()) return hit[1]
  }
  const first = entries.find(([, v]) => v.trim())
  return first ? first[1] : 'Submission'
}

function formatShort(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function formatFull(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function LeadsInbox({
  leads,
  truncated,
}: {
  leads: InboxLead[]
  truncated: boolean
}) {
  // First row selected by default.
  const [selectedId, setSelectedId] = useState<string>(leads[0]?.id ?? '')
  const selected = leads.find((l) => l.id === selectedId) ?? leads[0]

  return (
    <div className="px-[26px] pb-[26px] pt-[22px]">
      {truncated && (
        <p className="mb-3 font-app-sans text-[12px] text-app-faint">
          Showing the 200 most recent leads.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        {/* Master list */}
        <div className="overflow-hidden rounded-app-panel border border-app-border bg-app-surface">
          <ul className="max-h-[70vh] divide-y divide-app-divider overflow-y-auto">
            {leads.map((lead) => {
              const isSelected = selected?.id === lead.id
              return (
                <li key={lead.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(lead.id)}
                    aria-current={isSelected ? 'true' : undefined}
                    className={`flex w-full flex-col items-start gap-1 px-4 py-3 text-left ${
                      isSelected ? 'bg-app-tint' : 'hover:bg-app-canvas'
                    }`}
                  >
                    <span className="flex w-full items-center gap-2">
                      <span className="min-w-0 flex-1 truncate font-app-sans text-[13px] font-bold text-app-ink">
                        {previewOf(lead)}
                      </span>
                      <span className="shrink-0 font-app-sans text-[11.5px] text-app-faint">
                        {formatShort(lead.createdAt)}
                      </span>
                    </span>
                    <span className="w-full truncate font-app-sans text-[12px] text-app-muted">
                      {lead.formName}
                    </span>
                    <span className="w-full truncate font-app-sans text-[11.5px] text-app-faint">
                      {lead.siteTitle}
                      {lead.siteSlug ? ` · ${lead.siteSlug}` : ''}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Detail pane */}
        <div className="rounded-app-panel border border-app-border bg-app-surface p-5">
          {selected ? (
            <>
              <p className="font-app-sans text-[11.5px] text-app-faint">
                {formatFull(selected.createdAt)}
              </p>
              <h2 className="mt-0.5 font-app-sans text-[15px] font-extrabold tracking-[-0.2px] text-app-ink">
                {previewOf(selected)}
              </h2>
              <p className="mt-1 font-app-sans text-[12px] text-app-muted">
                {selected.formName} · {selected.siteTitle}
                {selected.siteSlug ? ` · ${selected.siteSlug}` : ''}
              </p>

              <div className="mt-4 divide-y divide-app-divider border-t border-app-border">
                {Object.entries(selected.data).length === 0 ? (
                  <p className="pt-3 font-app-sans text-[12px] text-app-faint">
                    This submission has no field data.
                  </p>
                ) : (
                  Object.entries(selected.data).map(([key, value]) => (
                    <FieldRow key={key} label={key} value={value} />
                  ))
                )}
              </div>

              <dl className="mt-5 space-y-1 border-t border-app-border pt-3">
                <MetaRow label="Submission ID" value={selected.id} />
                <MetaRow label="Form ID" value={selected.formId} />
              </dl>
            </>
          ) : (
            <p className="font-app-sans text-[12px] text-app-faint">
              Select a lead to see its details.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function FieldRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      // Clipboard unavailable (insecure context / denied) — silently ignore.
    }
  }

  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="w-32 shrink-0 break-words font-app-sans text-[12px] text-app-faint">
        {label}
      </span>
      <span className="min-w-0 flex-1 whitespace-pre-wrap break-words font-app-sans text-[13px] text-app-ink">
        {value}
      </span>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ${label}`}
        title={copied ? 'Copied' : 'Copy'}
        className="shrink-0 rounded-app-badge px-1 text-app-faint hover:text-app-primary"
      >
        <AppIcon name={copied ? 'check' : 'content_copy'} size={16} />
      </button>
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <dt className="w-32 shrink-0 font-app-sans text-[11.5px] text-app-faint">{label}</dt>
      <dd className="min-w-0 flex-1 truncate font-app-mono text-[11.5px] text-app-muted">
        {value}
      </dd>
    </div>
  )
}
