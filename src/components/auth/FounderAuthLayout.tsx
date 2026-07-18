import Image from 'next/image'
import Link from 'next/link'

import { AppIcon } from '@/components/ui/icon'

/**
 * FounderAuthLayout — the shared two-column "founding cohort" auth shell.
 *
 * Recreates design handoff `1b`
 * (docs/Design/Lessgo AI UI redesign/design_handoff_lessgo_app/Lessgo Auth.dc.html):
 *   LEFT  — logo + the Clerk form widget (passed as `children`, restyled via
 *           `authAppearance`) + terms line.
 *   RIGHT — full-bleed founder photo, dark scrim, status chip, personal promise,
 *           founder attribution.
 *
 * Both /sign-up and /sign-in render this same shell; they differ ONLY by copy props
 * and which Clerk component they mount. The handoff's 1140x724 card is presentational
 * framing — per the handoff README the real screen is full-viewport, so this renders
 * edge-to-edge.
 *
 * `.app-chrome` is attached HERE (an app-shell wrapper we own) — never to <body> or
 * any wrapper containing the editor canvas. See src/components/ui/README.md.
 *
 * Desktop-first: below `lg` the founder panel is dropped and the form column goes
 * full-width (a no-break fallback, not a designed breakpoint — spec scope-out).
 */
export interface FounderAuthLayoutProps {
  /** Status chip copy in the photo panel's top-left, e.g. "invite-only · founding cohort". */
  chipLabel: string
  /** Promise headline over the photo. */
  promiseTitle: string
  /** Optional supporting promise paragraph (sign-up only). */
  promiseBody?: string
  /** The Clerk <SignUp/> or <SignIn/> widget. */
  children: React.ReactNode
}

export function FounderAuthLayout({
  chipLabel,
  promiseTitle,
  promiseBody,
  children,
}: FounderAuthLayoutProps) {
  return (
    <div className="app-chrome flex min-h-screen w-full overflow-x-hidden bg-app-surface">
      {/* ================= LEFT: form column ================= */}
      <div className="flex w-full flex-none flex-col px-8 py-11 lg:w-[570px] lg:px-[52px]">
        <Link href="/" className="mb-auto self-start">
          <img src="/logo.svg" alt="Lessgo AI" className="h-[30px] w-auto object-contain" />
        </Link>

        <div className="mt-[34px] w-full">{children}</div>

        <p className="mt-3.5 text-center font-app-sans text-[11px] font-normal leading-[1.5] text-app-faint">
          By continuing you agree to our{' '}
          <Link href="/terms" className="font-semibold text-app-muted hover:text-app-ink">
            Terms
          </Link>{' '}
          &amp;{' '}
          <Link href="/privacy" className="font-semibold text-app-muted hover:text-app-ink">
            Privacy Policy
          </Link>
          .
        </p>

        <div className="mt-auto" />
      </div>

      {/* ================= RIGHT: founder photo + promise ================= */}
      <div className="relative hidden flex-1 overflow-hidden bg-app-primary-deep lg:block">
        <Image
          src="/founder-image.png"
          alt="Sushant Jain, Founder & CEO of Lessgo AI"
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 0px"
          className="object-cover"
        />

        {/* scrim — keeps the chip/promise legible over the photo */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(8,16,38,.28) 0%, rgba(8,16,38,.15) 38%, rgba(8,16,38,.82) 100%)',
          }}
        />

        {/* status chip */}
        <div className="pointer-events-none absolute left-7 top-[26px] inline-flex items-center gap-[7px] rounded-app-pill border border-white/20 bg-[rgba(10,20,45,.55)] px-[13px] py-1.5 font-app-sans text-[11px] font-semibold text-white backdrop-blur-[4px]">
          <AppIcon name="key" size={15} className="text-app-cta-soft" />
          {chipLabel}
        </div>

        {/* promise + attribution */}
        <div className="pointer-events-none absolute inset-x-[30px] bottom-[30px]">
          <div
            className="max-w-[430px] font-app-sans text-[26px] font-extrabold leading-[1.2] tracking-[-0.6px] text-white"
            style={{ textShadow: '0 2px 14px rgba(0,0,0,.4)' }}
          >
            {promiseTitle}
          </div>

          {promiseBody ? (
            <div
              className="mt-2.5 max-w-[420px] font-app-sans text-sm font-normal leading-[1.55] text-[#dbe3f5]"
              style={{ textShadow: '0 1px 10px rgba(0,0,0,.4)' }}
            >
              {promiseBody}
            </div>
          ) : null}

          <div className="mt-[18px] flex items-center gap-3">
            <div className="leading-[1.35]">
              <div className="font-app-sans text-[15px] font-bold text-white">Sushant Jain</div>
              <div className="font-app-sans text-xs font-normal text-[#c6d2ee]">
                Founder &amp; CEO, Lessgo.ai
              </div>
            </div>
            <span className="h-[30px] w-px bg-white/25" />
            <div className="flex items-center gap-1.5 font-app-sans text-xs font-semibold text-white">
              <AppIcon name="bolt" size={17} className="text-app-cta-soft" />
              Founder on speed-dial
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
