import Link from 'next/link'
import { getWorkspaceProject } from '@/lib/workspace'
import { AppIcon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'

/**
 * Project workspace — Overview tab (`/dashboard/[token]`).
 *
 * 🚨 This page calls `getWorkspaceProject` ITSELF. The `[token]/layout.tsx` call is
 * chrome data only and is NOT an auth boundary (Next.js does not re-run layouts as a
 * guard). Within one request the wrapper's React `cache()` dedupes the two calls.
 *
 * R3 — body = the "QUICK ACTIONS" eyebrow + 4-card row ONLY. The design's 4 KPI
 * cards, the "Recent leads" panel and the "Pages on this site" panel are explicitly
 * OUT of this slice (no rollups exist — that's S4; fabricating them is banned by R14).
 * Cards render GREYED in place where their route/track is absent or kill-switched —
 * never hidden (completeness principle).
 */

// Kill-switches — same flags the retired `ProjectCard.tsx:28-36` read. NEXT_PUBLIC_*
// so client and server agree; read at render time (server component).
const SOCIAL_DISABLED = () => process.env.NEXT_PUBLIC_SOCIAL_POSTS_DISABLED === 'true'
const EMAILS_DISABLED = () => process.env.NEXT_PUBLIC_EMAIL_SEQUENCES_DISABLED === 'true'

interface QuickAction {
  icon: string
  /** Tile tint — the design's orange for the AI action, blue for the rest. */
  accent: 'cta' | 'primary'
  title: string
  sub: string
  href?: string
  /** Absent route or a flipped kill-switch → greyed in place. */
  disabled?: boolean
}

const CARD_CLASS =
  'flex flex-1 items-center gap-3 rounded-[13px] border border-app-border bg-app-surface px-4 py-[15px]'

function QuickActionCard({ action }: { action: QuickAction }) {
  const body = (
    <>
      <span
        className={cn(
          'flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[10px]',
          action.accent === 'cta' ? 'bg-[#fff0eb]' : 'bg-app-tint'
        )}
      >
        <AppIcon
          name={action.icon}
          size={20}
          className={action.accent === 'cta' ? 'text-app-cta' : 'text-app-primary'}
        />
      </span>
      <span className="min-w-0 leading-[1.35]">
        <span className="block truncate font-app-sans text-[12.5px] font-bold text-app-ink">
          {action.title}
        </span>
        <span className="block truncate font-app-sans text-[10.5px] text-app-faint">
          {action.sub}
        </span>
      </span>
    </>
  )

  if (action.disabled || !action.href) {
    return (
      <div
        aria-disabled="true"
        className={cn(CARD_CLASS, 'cursor-not-allowed opacity-50')}
      >
        {body}
      </div>
    )
  }

  return (
    <Link href={action.href} className={cn(CARD_CLASS, 'transition-colors hover:border-[#cfe0ff]')}>
      {body}
    </Link>
  )
}

export default async function WorkspaceOverviewPage({ params }: { params: { token: string } }) {
  // Re-check — do NOT lean on the layout.
  const { project } = await getWorkspaceProject(params.token)
  const token = project.tokenId

  const actions: QuickAction[] = [
    {
      icon: 'auto_awesome',
      accent: 'cta',
      title: 'Write a blog post',
      sub: 'AI drafts it for you',
      href: `/dashboard/${token}/blog`,
    },
    {
      icon: 'campaign',
      accent: 'primary',
      title: 'Generate social posts',
      sub: 'Promote this site',
      href: `/dashboard/social/${token}`,
      disabled: SOCIAL_DISABLED(),
    },
    {
      icon: 'mail',
      accent: 'primary',
      title: 'Edit welcome sequence',
      // Design reads "3 emails active" — a fabricated count (R14). No sequence
      // rollup exists, so the sub-line states the action instead.
      sub: 'Goal-matched email copy',
      href: `/dashboard/emails/${token}`,
      disabled: EMAILS_DISABLED(),
    },
    {
      icon: 'ios_share',
      accent: 'primary',
      title: 'Request testimonials',
      sub: 'Share collection link',
      // No per-project collection route exists (the collect-links dialog lives on the
      // account-level testimonials page). Grey-by-existence — later slice.
      disabled: true,
    },
  ]

  return (
    <div className="px-[26px] pb-[26px] pt-[22px]">
      <p className="mb-[11px] font-app-mono text-[11px] font-bold tracking-[.08em] text-app-faint">
        QUICK ACTIONS
      </p>
      <div className="flex gap-3.5">
        {actions.map((action) => (
          <QuickActionCard key={action.title} action={action} />
        ))}
      </div>
    </div>
  )
}
