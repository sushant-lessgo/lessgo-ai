'use client'

import { useUser } from '@clerk/nextjs'
import { AppIcon } from '@/components/ui/icon'
import { SegmentedControl } from '@/components/ui/segmented-control'
import NewSiteButton from './NewSiteButton'

/**
 * DashboardEmptyState — the zero-projects screen (handoff §E 1a).
 *
 * 🚨 R17b (RULED, supersedes R17) — READ BEFORE "FIXING" THIS.
 * The segmented toggle and the textarea render GREYED/DISABLED IN PLACE: the
 * design is fully visible (placeholder text and all), but the controls are dead.
 * Reason: nothing consumes the typed text yet — `/api/start` takes no input and
 * onboarding has no prefill param. An ENABLED textarea that silently discards a
 * paragraph the user just wrote is worse than an obviously-disabled one. A
 * sessionStorage stash with no reader is the same discard with extra steps —
 * explicitly ruled out. Do NOT enable these until the prefill slice lands
 * (`/api/start` input + an onboarding prefill param) — that is a clean follow-up.
 *
 * "Build my site" STAYS ENABLED and runs the existing `/api/start` CTA verbatim
 * (shared `NewSiteButton`) — it is the real, working entry point.
 */

const PLACEHOLDER =
  'A landing site for my Pilates studio with a class schedule, pricing, and a booking form…'

export default function DashboardEmptyState() {
  const { user, isLoaded } = useUser()
  const firstName = isLoaded ? user?.firstName : undefined

  return (
    <div
      className="flex flex-1 flex-col items-center px-10 py-14"
      style={{
        backgroundImage: 'radial-gradient(120% 90% at 50% -10%, #eef4ff 0%, #fcfcfd 55%)',
      }}
    >
      {/* Welcome chip */}
      <span className="inline-flex items-center gap-1.5 rounded-app-pill bg-app-tint px-3.5 py-[6px] font-app-sans text-[12.5px] font-semibold text-app-primary-deep">
        <AppIcon name="rocket_launch" size={17} />
        Welcome to Lessgo AI
      </span>

      {/* Graceful fallback: no first name → drop the comma clause, never "there". */}
      <h1 className="mt-6 max-w-[760px] text-center font-app-sans text-[46px] font-extrabold leading-[1.08] tracking-[-1.4px] text-app-ink">
        {firstName ? `Let's build your first site, ${firstName}` : "Let's build your first site"}
      </h1>

      <p className="mt-4 max-w-[600px] text-center font-app-sans text-[17px] leading-[1.55] text-app-muted">
        Describe what you&apos;re launching — or paste your current website — and Lessgo AI builds a
        high-converting site with copy, layout, and a lead form in seconds.
      </p>

      {/* Prompt card — visual only (R17b). */}
      <div className="mt-9 w-full max-w-[680px] rounded-app-card border border-[#e2e6ef] bg-app-surface px-4 pb-[13px] pt-4 shadow-[0_24px_50px_-24px_rgba(20,20,40,.3)]">
        {/* R17b — both segments disabled; controlled value stays put, no handler. */}
        <SegmentedControl
          aria-label="How would you like to start? (not yet available)"
          value="describe"
          onValueChange={() => {}}
          options={[
            { value: 'describe', label: 'Describe your site', icon: 'edit_note', disabled: true },
            { value: 'import', label: 'Use my current site', icon: 'link', disabled: true },
          ]}
          className="bg-[#f2f3f7]"
        />

        {/* R17b — disabled, placeholder visible. Not an <input> we read anywhere. */}
        <textarea
          disabled
          aria-disabled="true"
          aria-label="Describe your site (not yet available)"
          placeholder={PLACEHOLDER}
          className="mt-3 min-h-[58px] w-full cursor-not-allowed resize-none border-0 bg-transparent font-app-sans text-[15px] leading-[1.5] text-app-ink placeholder:text-app-placeholder focus:outline-none"
        />

        <div className="mt-2 flex items-center gap-3">
          <p className="font-app-sans text-[11.5px] text-app-faint">
            Already have a site? Switch to{' '}
            <span className="font-semibold text-app-primary">Use my current site</span> and paste its
            URL.
          </p>
          <div className="flex-1" />

          {/* ENABLED (R17b) — the shared /api/start CTA, verbatim. The design's
              trailing arrow_forward is a real child of the real button (label
              takes a ReactNode) — no overlay, so name/focus/hit-target are sound. */}
          <NewSiteButton
            icon={null}
            location="dashboard_empty_state"
            className="w-auto shrink-0 gap-1.5 px-[18px] py-2.5 text-[13px]"
            label={
              <>
                Build my site
                <AppIcon name="arrow_forward" size={17} />
              </>
            }
          />
        </div>
      </div>
    </div>
  )
}
