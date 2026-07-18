import { AppIcon } from '@/components/ui/icon'

/**
 * BlogStatsStrip — handoff 3c stats row.
 *
 * 🚨 PROMISES ONLY WHAT EXISTS (plan ruling #6). Every number here is DERIVED IN JS by the
 * server page from the posts array it already fetches (`status` + `publishedAt` are in that
 * select) plus the subscriber count it already queries — this component adds NO round trip,
 * and the page must not grow a `groupBy` to feed it.
 *
 * 🚨 NO PER-POST VIEW COUNTS, deliberately. `PageAnalytics` is keyed by SITE SLUG, not by
 * post — per-post views do not exist in the schema. Adding a "Views" tile here would mean
 * either a fabricated number or a migration; both are out of scope. Do not add one without
 * the schema work.
 *
 * Server component (pure props).
 */

export interface BlogStatsStripProps {
  total: number
  published: number
  drafts: number
  /** ISO string of the most recent `publishedAt`, or null when nothing is live yet. */
  lastPublishedAt: string | null
  subscribers: number
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: string
  label: string
  value: string
}) {
  return (
    <div className="rounded-app-card border border-app-border bg-app-surface px-4 py-3.5">
      <div className="mb-1.5 flex items-center gap-1.5 text-app-faint">
        <AppIcon name={icon} size={16} />
        <span className="font-app-sans text-[11.5px] font-medium">{label}</span>
      </div>
      <span className="font-app-sans text-[19px] font-bold leading-none text-app-ink">
        {value}
      </span>
    </div>
  )
}

export default function BlogStatsStrip({
  total,
  published,
  drafts,
  lastPublishedAt,
  subscribers,
}: BlogStatsStripProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      <Stat icon="article" label="Posts" value={String(total)} />
      <Stat icon="public" label="Published" value={String(published)} />
      <Stat icon="edit_note" label="Drafts" value={String(drafts)} />
      <Stat
        icon="schedule"
        label="Last published"
        // Em-dash, never a fabricated date: nothing live yet is a real state.
        value={lastPublishedAt ? new Date(lastPublishedAt).toLocaleDateString() : '—'}
      />
      <Stat icon="mail" label="Subscribers" value={String(subscribers)} />
    </div>
  )
}
