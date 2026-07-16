'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AppIcon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import { continueRouting } from './continueRouting'

/**
 * WorkspaceHeader — the project-workspace header (handoff §E 3a).
 *
 * Replaces the root 64px top bar on `/dashboard/[token]/*` (DashboardTopBar
 * self-suppresses on token paths — phase 1), so there is exactly one bar. No bell
 * on project screens (design).
 *
 * 🚨 B5 — "Open editor" routes through `continueRouting` UNCONDITIONALLY (published
 * and draft alike). Never hard-code `/edit/{token}`: a draft still mid-onboarding
 * 404s there. `continueRouting` is also the SINGLE call site of the PostHog
 * `project_edit_clicked` event — do NOT capture it here (double-fire).
 *
 * Chrome only — this component performs no authz. The page owns that.
 */

export interface WorkspaceHeaderProps {
  projectId: string
  tokenId: string
  name: string
  /** Published slug, or null for a draft. */
  slug: string | null
}

export default function WorkspaceHeader({ projectId, tokenId, name, slug }: WorkspaceHeaderProps) {
  const router = useRouter()
  const published = slug !== null

  const openEditor = () => {
    void continueRouting({ id: projectId, name, tokenId }, router)
  }

  return (
    <div className="flex-none border-b border-[#f0f0f3] bg-app-surface px-[26px] pt-4">
      <div className="mb-3.5 flex items-center gap-[11px]">
        <Link
          href="/dashboard"
          className="flex items-center gap-[5px] font-app-sans text-xs font-semibold text-app-muted transition-colors hover:text-app-primary"
        >
          <AppIcon name="arrow_back" size={18} className="text-[#9a9aa4]" />
          All Projects
        </Link>
        <span className="font-app-sans text-[13px] text-[#c8c8d0]">/</span>
        <span className="h-[30px] w-[30px] flex-none rounded-lg bg-app-stripes" />
        <span className="truncate font-app-sans text-lg font-extrabold tracking-[-.4px] text-app-ink">
          {name}
        </span>

        {/* Status chip — Live green (design 3a) / Draft amber (R9). */}
        <span
          className={cn(
            'flex flex-none items-center gap-1 rounded-app-pill px-[9px] py-[3px] font-app-sans text-[9.5px] font-semibold',
            published ? 'bg-app-success-bg text-app-success' : 'bg-[#fdf2dc] text-[#9a6a1e]'
          )}
        >
          <span
            className={cn(
              'h-[5px] w-[5px] rounded-full',
              published ? 'bg-app-success' : 'bg-[#9a6a1e]'
            )}
          />
          {published ? 'Live' : 'Draft'}
        </span>

        {/* Real domain or nothing — never a fabricated one (R14). */}
        {published && (
          <span className="truncate font-app-sans text-xs text-app-faint">
            lessgo.ai/p/{slug}
          </span>
        )}

        <span className="ml-auto flex flex-none gap-2">
          {published ? (
            <a
              href={`/p/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-[9px] border border-[#e6e6ec] bg-app-surface px-[13px] py-2 font-app-sans text-xs font-semibold text-[#3a3a44] transition-colors hover:border-app-primary"
            >
              <AppIcon name="open_in_new" size={16} className="text-[#6b6b76]" />
              Visit
            </a>
          ) : (
            // Nothing to visit until the project is published — greyed in place.
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="flex cursor-not-allowed items-center gap-1.5 rounded-[9px] border border-[#e6e6ec] bg-app-surface px-[13px] py-2 font-app-sans text-xs font-semibold text-[#3a3a44] opacity-50"
            >
              <AppIcon name="open_in_new" size={16} className="text-[#6b6b76]" />
              Visit
            </button>
          )}

          <button
            type="button"
            onClick={openEditor}
            className="flex items-center gap-1.5 rounded-[9px] bg-app-primary px-[14px] py-2 font-app-sans text-[12.5px] font-bold text-white transition-colors hover:bg-app-primary-hover"
          >
            <AppIcon name="edit" size={16} />
            Open editor
          </button>
        </span>
      </div>
    </div>
  )
}
