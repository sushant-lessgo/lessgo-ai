'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useClerk } from '@clerk/nextjs'
import Logo from '@/components/shared/Logo'
import { AppIcon } from '@/components/ui/icon'
import { NavItem, navItemClasses } from '@/components/ui/nav-item'
import { Coming } from '@/components/ui/coming'
import {
  Popover,
  PopoverTrigger,
  AppPopoverMenu,
  AppPopoverItem,
  AppPopoverSeparator,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import NewSiteButton from './NewSiteButton'

/** Greyed popover row: AppPopoverItem's geometry, worn by <Coming>. Mirrors the
 *  COMING_ROW const in GlobalAppHeader.tsx (the first menu consumer). */
const COMING_ROW =
  'w-full gap-2.5 rounded-app-badge px-2.5 py-[7px] text-[13px] font-medium'

/**
 * AppSidebar — the 244px account-level nav rail of the dashboard shell.
 *
 * Handoff §E: byte-identical across all 12 screens; `usePathname()` drives the
 * active row. Styled with `app-*` tokens ONLY (never a stock Tailwind key —
 * those feed template rendering; see src/components/ui/README.md).
 *
 * GREYED CONTROLS (R12/R15): `NavItem` has NO `disabled` prop and the frozen
 * foundation primitive must not be edited. Un-built destinations therefore render
 * via `DisabledNavItem` below — a plain <button disabled> reusing the primitive's
 * exported `navItemClasses()`, so a greyed row is pixel-identical to an idle row
 * plus opacity. Greyed here: Domains (R15 —
 * no /dashboard/domains route exists). The plan widget's Upgrade was greyed for
 * the same reason until billing-beta phase 6 built /dashboard/billing's CTAs —
 * it is a live link now.
 */

export interface SidebarPlan {
  planName: string
  used: number
  /** Published-page limit; -1 = unlimited. */
  limit: number
}

export interface SidebarProfile {
  name: string
  email: string
  avatarUrl: string | null
}

export interface AppSidebarProps {
  profile: SidebarProfile
  /** Omitted when plan data isn't resolvable — the widget then greys out with
   *  em-dash placeholders. NEVER pass fabricated numbers (R6/R14). */
  plan?: SidebarPlan
}

/** Greyed nav row — see R12 note above. Not a link, not focusable-actionable. */
function DisabledNavItem({ icon, label }: { icon: string; label: string }) {
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      className={cn(
        navItemClasses(false),
        'cursor-not-allowed opacity-50 hover:bg-transparent hover:text-app-slate'
      )}
    >
      <AppIcon name={icon} size={20} />
      {label}
    </button>
  )
}

function SectionHeading({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        'px-2 pb-2 font-app-mono text-[10px] font-bold tracking-[0.12em] text-app-placeholder',
        className
      )}
    >
      {children}
    </p>
  )
}

export default function AppSidebar({ profile, plan }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut } = useClerk()
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  // Projects is the dashboard root only — nested screens must not light it up.
  const projectsActive = pathname === '/dashboard'
  const billingActive = pathname?.startsWith('/dashboard/billing') ?? false
  const leadsActive = pathname?.startsWith('/dashboard/leads') ?? false
  const analyticsActive = pathname?.startsWith('/dashboard/analytics') ?? false

  const pct =
    plan && plan.limit > 0 ? Math.min(100, Math.round((plan.used / plan.limit) * 100)) : 0

  return (
    <aside className="flex w-[244px] shrink-0 flex-col overflow-y-auto border-r border-[#f0f0f3] bg-[#fafafb] px-[14px] py-[18px]">
      {/* Logo — transparent wordmark (no background box), sits on the app surface. */}
      <div className="flex items-center px-2 pb-5 pt-1">
        <Link href="/dashboard" aria-label="Lessgo AI — Projects" className="inline-flex">
          <Logo size={30} className="h-[30px] w-auto" />
        </Link>
      </div>

      {/* CTA */}
      <div className="mb-[22px]">
        <NewSiteButton />
      </div>

      {/* WORKSPACE */}
      <SectionHeading>WORKSPACE</SectionHeading>
      <nav className="flex flex-col gap-[3px]">
        <NavItem
          asChild
          active={projectsActive}
          className={projectsActive ? 'font-semibold' : undefined}
        >
          <Link href="/dashboard">
            <AppIcon name="grid_view" filled={projectsActive} size={20} />
            Projects
          </Link>
        </NavItem>
        {/* S4 — live. No count pill (R-C): un-grey only. */}
        <NavItem
          asChild
          active={analyticsActive}
          className={analyticsActive ? 'font-semibold' : undefined}
        >
          <Link href="/dashboard/analytics">
            <AppIcon name="monitoring" filled={analyticsActive} size={20} />
            All Analytics
          </Link>
        </NavItem>
        {/* S4 — live. No count pill (R-C): un-grey only. */}
        <NavItem asChild active={leadsActive} className={leadsActive ? 'font-semibold' : undefined}>
          <Link href="/dashboard/leads">
            <AppIcon name="move_to_inbox" filled={leadsActive} size={20} />
            All Leads
          </Link>
        </NavItem>
      </nav>

      {/* ACCOUNT */}
      <SectionHeading className="pt-5">ACCOUNT</SectionHeading>
      <nav className="flex flex-col gap-[3px]">
        <NavItem
          asChild
          active={billingActive}
          className={billingActive ? 'font-semibold' : undefined}
        >
          <Link href="/dashboard/billing">
            <AppIcon name="credit_card" filled={billingActive} size={20} />
            Billing &amp; plan
          </Link>
        </NavItem>
        {/* R15 — no /dashboard/domains page exists; grey-by-existence. Do NOT build one here. */}
        <DisabledNavItem icon="language" label="Domains" />
      </nav>

      {/* Bottom: plan widget + profile row */}
      <div className="mt-auto flex flex-col gap-3 pt-5">
        <div className="rounded-app-input border border-app-border bg-app-surface px-[13px] py-3">
          <div className="mb-2 flex items-center gap-1.5">
            <AppIcon name="workspace_premium" size={15} className="text-app-cta" />
            <span className="font-app-sans text-[11px] font-bold text-app-ink">
              {plan ? plan.planName : '—'} plan
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-app-pill bg-[#eef0f4]">
            <div className="h-full rounded-app-pill bg-app-primary" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 font-app-sans text-[10.5px] text-app-faint">
            {plan ? `${plan.used} of ${plan.limit < 0 ? '∞' : plan.limit}` : '— of —'} sites used ·{' '}
            {/* billing-beta phase 6 — the destination exists now (lean Billing &
                plan view with the Upgrade / Top-up / portal CTAs), so this is a
                real link. Never grey something that works today. */}
            <Link
              href="/dashboard/billing"
              className="font-semibold text-app-primary hover:underline"
            >
              Upgrade
            </Link>
          </p>
        </div>

        {/* Account menu — the whole user-card is one trigger; the popover opens
            UPWARD (side="top"). The old standalone settings-gear folded in here as
            the `Settings` row. Sole sign-out path in the app (P0). */}
        <Popover open={accountMenuOpen} onOpenChange={setAccountMenuOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Account menu"
              className="flex w-full items-center gap-2.5 rounded-md px-2 py-1 text-left transition-colors hover:bg-app-hairline"
            >
              {profile.avatarUrl ? (
                // Clerk avatar host isn't in next.config images — plain <img> is correct here.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt=""
                  className="h-[30px] w-[30px] shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="h-[30px] w-[30px] shrink-0 rounded-full bg-app-tint" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-app-sans text-xs font-semibold text-app-ink">
                  {profile.name}
                </p>
                <p className="truncate font-app-sans text-[10px] text-app-faint">{profile.email}</p>
              </div>
              <AppIcon name="expand_more" size={18} className="shrink-0 text-app-faint" />
            </button>
          </PopoverTrigger>
          <AppPopoverMenu side="top" align="start" sideOffset={8} width={224}>
            <AppPopoverItem
              icon={<AppIcon name="settings" size={18} />}
              onClick={() => {
                setAccountMenuOpen(false)
                router.push('/dashboard/settings')
              }}
            >
              Settings
            </AppPopoverItem>
            <AppPopoverItem
              icon={<AppIcon name="credit_card" size={18} />}
              onClick={() => {
                setAccountMenuOpen(false)
                router.push('/dashboard/billing')
              }}
            >
              Billing
            </AppPopoverItem>
            <Coming what="appearance settings" side="right" className={COMING_ROW}>
              <AppIcon name="palette" size={18} />
              Appearance
            </Coming>
            <AppPopoverSeparator />
            <AppPopoverItem
              destructive
              icon={<AppIcon name="logout" size={18} />}
              onClick={() => {
                if (isSigningOut) return
                setIsSigningOut(true)
                setAccountMenuOpen(false)
                // Fire-and-forget — Clerk navigates away to /sign-in.
                void signOut({ redirectUrl: '/sign-in' })
              }}
            >
              Log out
            </AppPopoverItem>
          </AppPopoverMenu>
        </Popover>
      </div>
    </aside>
  )
}
