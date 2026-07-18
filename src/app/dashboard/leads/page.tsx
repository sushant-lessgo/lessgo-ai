import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getAccountScope } from '@/lib/dashboard/accountScope'
import { AppIcon } from '@/components/ui/icon'
import { stripHTMLTags } from '@/utils/htmlSanitization'
import LeadsInbox, { type InboxLead } from './LeadsInbox'

/**
 * All Leads (`/dashboard/leads`) — account-level, read-only inbox over every
 * FormSubmission belonging to the viewer's own PublishedPages.
 *
 * 🚨 AUTH: this page scopes its OWN query. `dashboard/layout.tsx` is NOT an auth
 * boundary (Next.js does not re-run layouts as a guard). Pattern copied from
 * `src/app/dashboard/page.tsx` — `auth()` → Clerk userId, unauthenticated → null.
 *
 * 🚨 R-B — NO admin god-view branch here (deliberate divergence from the dashboard
 * root's `isAdmin` all-projects widening): a merged everyone-leads blob is
 * semantically wrong for a personal inbox. `isAdmin` is intentionally NOT imported.
 *
 * 🚨 R-A — scoping is `publishedPageId: { in: pageIds }`, NEVER `userId`.
 * `/api/forms/submit` writes BOTH `FormSubmission.userId` and `.publishedPageId`
 * from the client-supplied request body, so `FormSubmission.userId` is
 * attacker-controllable. The page ids come from `getAccountScope`, which derives
 * them from the server-set `PublishedPage.userId` — trustworthy. Do NOT re-add a
 * `userId` filter: it adds no security (equally untrusted) and can hide legit rows.
 *   ⚠️ Known accepted limitation: `FormSubmission.publishedPageId` is nullable, so
 *   orphan submissions with a null `publishedPageId` are NOT shown in this inbox.
 *
 * ⚠️ `getAccountScope` takes the CLERK id from `auth()` — never the internal
 * `User.id` (wrong space compiles clean and silently returns ZERO rows).
 */

const TAKE = 200

export default async function AllLeadsPage() {
  const { userId } = await auth()
  if (!userId) return null

  const { pages, pageIds } = await getAccountScope(userId) // Clerk id space

  if (pageIds.length === 0) {
    return (
      <EmptyState
        title="No leads yet"
        body="Publish a site to start collecting leads."
      />
    )
  }

  // No compound [publishedPageId, createdAt] index exists → Postgres sorts these
  // in memory. Fine at beta volume with take:200; pagination is out of scope.
  const submissions = await prisma.formSubmission.findMany({
    where: { publishedPageId: { in: pageIds } },
    orderBy: { createdAt: 'desc' },
    take: TAKE,
  })

  if (submissions.length === 0) {
    return (
      <EmptyState
        title="No leads yet"
        body="When visitors submit forms on your sites, they appear here."
      />
    )
  }

  const pageById = new Map(pages.map((p) => [p.id, p]))

  // RSC serialization: plain objects + ISO strings only — no Date objects, no
  // Prisma models across the client boundary.
  const leads: InboxLead[] = submissions.map((s) => {
    const page = s.publishedPageId ? pageById.get(s.publishedPageId) : undefined
    return {
      id: s.id,
      formId: s.formId,
      formName: s.formName,
      createdAt: s.createdAt.toISOString(),
      siteTitle: page?.title ? stripHTMLTags(page.title) : 'Untitled site',
      siteSlug: page?.slug ?? '',
      data: toStringMap(s.data),
    }
  })

  return <LeadsInbox leads={leads} truncated={submissions.length === TAKE} />
}

/** Flattens the `data` Json into displayable key/value strings. */
function toStringMap(data: unknown): Record<string, string> {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {}
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (value === null || value === undefined) continue
    out[key] = typeof value === 'string' ? value : JSON.stringify(value)
  }
  return out
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="px-[26px] pb-[26px] pt-[22px]">
      <div className="flex flex-col items-center gap-2 rounded-[13px] border border-app-border bg-app-surface px-6 py-[52px] text-center">
        <span className="mb-1 flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-app-tint">
          <AppIcon name="move_to_inbox" size={20} className="text-app-primary" />
        </span>
        <p className="font-app-sans text-[13px] font-bold text-app-ink">{title}</p>
        <p className="font-app-sans text-[12px] text-app-faint">{body}</p>
      </div>
    </div>
  )
}
